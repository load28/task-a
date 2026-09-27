// Task Agent extensions to the vendored AX engine. AX resources remain the execution model.
package taskgraph

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"path"
	"regexp"
	"sort"
	"strings"
)

type Plan struct {
	ID       string `json:"id"`
	Revision int    `json:"revision"`
	Tasks    []Node `json:"tasks"`
}
type Node struct {
	ID        string            `json:"id"`
	Goal      string            `json:"goal"`
	Contract  string            `json:"contract"`
	Image     string            `json:"image"`
	Command   []string          `json:"command"`
	Files     map[string]string `json:"files"`
	Inputs    map[string]Input  `json:"inputs,omitempty"`
	Outputs   []string          `json:"outputs"`
	Validator Validator         `json:"validator"`
}
type Input struct {
	Task   string `json:"task"`
	Output string `json:"output"`
}
type Validator struct {
	Image   string            `json:"image"`
	Command []string          `json:"command"`
	Files   map[string]string `json:"files,omitempty"`
}
type Result struct {
	Task     string            `json:"task"`
	ExitCode int               `json:"exitCode"`
	Files    map[string]string `json:"files"`
	Error    string            `json:"error,omitempty"`
}
type Attempt struct {
	Name          string            `json:"name"`
	Fingerprint   string            `json:"fingerprint"`
	Phase         string            `json:"phase"`
	Candidate     *Result           `json:"candidate,omitempty"`
	ValidatorName string            `json:"validatorName,omitempty"`
	Validation    *Result           `json:"validation,omitempty"`
	Outputs       map[string]string `json:"outputs,omitempty"`
	Reused        bool              `json:"reused,omitempty"`
}
type State struct {
	Plan     Plan                `json:"plan"`
	Paused   bool                `json:"paused"`
	Attempts map[string]*Attempt `json:"attempts"`
	Previous map[string]*Attempt `json:"previous,omitempty"`
}

var namePattern = regexp.MustCompile(`^[a-z][a-z0-9-]{0,39}$`)
var imagePattern = regexp.MustCompile(`^.+@sha256:[a-f0-9]{64}$`)

func Digest(v any) string {
	b, _ := json.Marshal(v)
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}
func validPath(p string) bool {
	return p != "" && !strings.ContainsAny(p, "\x00\\") && !strings.HasPrefix(p, "/") && path.Clean(p) == p && p != "." && p != ".." && !strings.HasPrefix(p, "../") && p != ".task-agent" && !strings.HasPrefix(p, ".task-agent/")
}
func Validate(p Plan) error {
	if !namePattern.MatchString(p.ID) || p.Revision < 1 || len(p.Tasks) == 0 {
		return fmt.Errorf("id, positive revision and tasks required")
	}
	nodes := map[string]Node{}
	for _, n := range p.Tasks {
		if !namePattern.MatchString(n.ID) || nodes[n.ID].ID != "" {
			return fmt.Errorf("invalid or duplicate task %q", n.ID)
		}
		if n.Goal == "" || n.Contract == "" || !imagePattern.MatchString(n.Image) || len(n.Command) == 0 || len(n.Outputs) == 0 || !imagePattern.MatchString(n.Validator.Image) || len(n.Validator.Command) == 0 {
			return fmt.Errorf("task %s requires goal, contract, pinned images, argv, outputs and validator", n.ID)
		}
		seen := map[string]bool{}
		for f := range n.Files {
			if !validPath(f) {
				return fmt.Errorf("invalid file %q", f)
			}
			seen[f] = true
		}
		for f := range n.Inputs {
			if !validPath(f) || seen[f] {
				return fmt.Errorf("invalid or overlapping input %q", f)
			}
			seen[f] = true
		}
		for f := range n.Validator.Files {
			if !validPath(f) || seen[f] {
				return fmt.Errorf("validator file overlaps input: %q", f)
			}
		}
		outs := map[string]bool{}
		for _, f := range n.Outputs {
			if !validPath(f) || outs[f] {
				return fmt.Errorf("invalid output %q", f)
			}
			if _, ok := n.Validator.Files[f]; ok {
				return fmt.Errorf("validator file overlaps output %q", f)
			}
			outs[f] = true
		}
		for _, argv := range [][]string{n.Command, n.Validator.Command} {
			for _, arg := range argv {
				if strings.ContainsRune(arg, 0) {
					return fmt.Errorf("NUL in argv")
				}
			}
		}
		nodes[n.ID] = n
	}
	for _, n := range p.Tasks {
		for _, i := range n.Inputs {
			dep, ok := nodes[i.Task]
			if !ok {
				return fmt.Errorf("missing dependency %s", i.Task)
			}
			found := false
			for _, f := range dep.Outputs {
				found = found || f == i.Output
			}
			if !found {
				return fmt.Errorf("missing output %s:%s", i.Task, i.Output)
			}
		}
	}
	visiting, done := map[string]bool{}, map[string]bool{}
	var visit func(string) error
	visit = func(id string) error {
		if visiting[id] {
			return fmt.Errorf("dependency cycle at %s", id)
		}
		if done[id] {
			return nil
		}
		visiting[id] = true
		for _, i := range nodes[id].Inputs {
			if err := visit(i.Task); err != nil {
				return err
			}
		}
		visiting[id] = false
		done[id] = true
		return nil
	}
	for id := range nodes {
		if err := visit(id); err != nil {
			return err
		}
	}
	return nil
}
func (s *State) Complete() bool {
	if s.Paused {
		return false
	}
	for _, n := range s.Plan.Tasks {
		a := s.Attempts[n.ID]
		if a == nil || a.Phase != "succeeded" {
			return false
		}
	}
	return true
}
func (s *State) Files(n Node) (map[string]string, bool) {
	f := map[string]string{}
	for k, v := range n.Files {
		f[k] = v
	}
	for k, i := range n.Inputs {
		a := s.Attempts[i.Task]
		if a == nil || a.Phase != "succeeded" {
			return nil, false
		}
		v, ok := a.Outputs[i.Output]
		if !ok {
			return nil, false
		}
		f[k] = v
	}
	return f, true
}
func Impact(old, next Plan) []string {
	prior := map[string]string{}
	for _, n := range old.Tasks {
		prior[n.ID] = Digest(n)
	}
	affected := map[string]bool{}
	for _, n := range next.Tasks {
		if prior[n.ID] != Digest(n) {
			affected[n.ID] = true
		}
	}
	for changed := true; changed; {
		changed = false
		for _, n := range next.Tasks {
			for _, i := range n.Inputs {
				if affected[i.Task] && !affected[n.ID] {
					affected[n.ID] = true
					changed = true
				}
			}
		}
	}
	out := []string{}
	for id := range affected {
		out = append(out, id)
	}
	sort.Strings(out)
	return out
}
