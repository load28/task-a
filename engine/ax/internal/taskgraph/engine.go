package taskgraph

import (
	"context"
	"fmt"
)

type Launch struct {
	Name, Image string
	Command     []string
	Files       map[string]string
	Outputs     []string
}
type Backend interface {
	Ensure(context.Context, Launch) error
	Start(context.Context, string) error
	Result(context.Context, string) (*Result, error)
	Suspend(context.Context, string) (bool, error)
}
type Engine struct {
	Scope   string
	Backend Backend
	Save    func(context.Context, *State) error
}

func Apply(old *State, p Plan) (*State, error) {
	if e := Validate(p); e != nil {
		return nil, e
	}
	s := &State{Plan: p, Attempts: map[string]*Attempt{}, Previous: map[string]*Attempt{}}
	if old == nil {
		return s, nil
	}
	if Digest(p) == Digest(old.Plan) {
		return old, nil
	}
	if p.ID != old.Plan.ID || p.Revision != old.Plan.Revision+1 {
		return nil, fmt.Errorf("revision must advance by exactly one")
	}
	for id, a := range old.Attempts {
		if a.Phase != "succeeded" && a.Phase != "failed" && a.Phase != "suspended" {
			return nil, fmt.Errorf("suspend and confirm all actors before changing revision")
		}
		if a.Phase == "succeeded" {
			s.Previous[id] = a
		}
	}
	return s, nil
}

// Tick performs recoverable idempotent AX operations. Identity is persisted before
// external creation; a lost response is retried against the same immutable Task.
func (e Engine) Tick(ctx context.Context, s *State) error {
	if s.Paused {
		return e.Pause(ctx, s)
	}
	for _, n := range s.Plan.Tasks {
		files, ready := s.Files(n)
		if !ready {
			continue
		}
		fingerprint := Digest(struct {
			Node  Node
			Files map[string]string
		}{n, files})
		a := s.Attempts[n.ID]
		if a == nil {
			if old := s.Previous[n.ID]; old != nil && old.Fingerprint == fingerprint {
				copy := *old
				copy.Reused = true
				s.Attempts[n.ID] = &copy
				if err := e.Save(ctx, s); err != nil {
					return err
				}
				continue
			}
			a = &Attempt{Name: "ta-" + Digest([]any{e.Scope, s.Plan.ID, s.Plan.Revision, n.ID, fingerprint})[:40], Fingerprint: fingerprint, Phase: "starting"}
			s.Attempts[n.ID] = a
			if err := e.Save(ctx, s); err != nil {
				return err
			}
		}
		switch a.Phase {
		case "starting":
			if err := e.Backend.Ensure(ctx, Launch{a.Name, n.Image, n.Command, files, n.Outputs}); err != nil {
				return err
			}
			if err := e.Backend.Start(ctx, a.Name); err != nil {
				return err
			}
			a.Phase = "running"
		case "running":
			r, err := e.Backend.Result(ctx, a.Name)
			if err != nil {
				return err
			}
			if r == nil {
				continue
			}
			if r.Task != a.Name {
				return fmt.Errorf("candidate task identity mismatch")
			}
			a.Candidate = r
			a.Phase = "stopping"
		case "stopping":
			stopped, err := e.Backend.Suspend(ctx, a.Name)
			if err != nil {
				return err
			}
			if !stopped {
				continue
			}
			if a.Candidate.ExitCode != 0 || a.Candidate.Error != "" {
				a.Phase = "failed"
				break
			}
			if len(a.Candidate.Files) != len(n.Outputs) {
				return fmt.Errorf("candidate output set differs from contract")
			}
			for _, f := range n.Outputs {
				if _, ok := a.Candidate.Files[f]; !ok {
					return fmt.Errorf("missing candidate output %s", f)
				}
			}
			a.ValidatorName = a.Name + "-v"
			a.Phase = "validating"
		case "validating":
			vf := map[string]string{}
			for k, v := range files {
				vf[k] = v
			}
			for k, v := range a.Candidate.Files {
				vf[k] = v
			}
			for k, v := range n.Validator.Files {
				vf[k] = v
			}
			if err := e.Backend.Ensure(ctx, Launch{a.ValidatorName, n.Validator.Image, n.Validator.Command, vf, nil}); err != nil {
				return err
			}
			if err := e.Backend.Start(ctx, a.ValidatorName); err != nil {
				return err
			}
			r, err := e.Backend.Result(ctx, a.ValidatorName)
			if err != nil {
				return err
			}
			if r == nil {
				continue
			}
			if r.Task != a.ValidatorName {
				return fmt.Errorf("validator identity mismatch")
			}
			a.Validation = r
			a.Phase = "validation-stopping"
		case "validation-stopping":
			stopped, err := e.Backend.Suspend(ctx, a.ValidatorName)
			if err != nil {
				return err
			}
			if !stopped {
				continue
			}
			if a.Validation.ExitCode == 0 && a.Validation.Error == "" {
				a.Outputs = a.Candidate.Files
				a.Phase = "succeeded"
			} else {
				a.Phase = "failed"
			}
		}
		if err := e.Save(ctx, s); err != nil {
			return err
		}
	}
	return nil
}
func (e Engine) Pause(ctx context.Context, s *State) error {
	s.Paused = true
	if err := e.Save(ctx, s); err != nil {
		return err
	}
	for id, a := range s.Attempts {
		if a.Phase == "starting" {
			for _, n := range s.Plan.Tasks {
				if n.ID == id {
					files, ready := s.Files(n)
					if !ready {
						return fmt.Errorf("inputs unavailable during suspension")
					}
					if err := e.Backend.Ensure(ctx, Launch{a.Name, n.Image, n.Command, files, n.Outputs}); err != nil {
						return err
					}
				}
			}
		}
		if a.Phase == "succeeded" || a.Phase == "failed" || a.Phase == "suspended" {
			continue
		}
		name := a.Name
		if a.ValidatorName != "" {
			name = a.ValidatorName
		}
		ok, err := e.Backend.Suspend(ctx, name)
		if err != nil {
			return err
		}
		if ok {
			a.Phase = "suspended"
		}
		if err := e.Save(ctx, s); err != nil {
			return err
		}
	}
	return nil
}
func Resume(s *State) error {
	for _, a := range s.Attempts {
		if a.Phase != "succeeded" && a.Phase != "failed" && a.Phase != "suspended" {
			return fmt.Errorf("suspension has not completed")
		}
	}
	for _, a := range s.Attempts {
		if a.Phase == "suspended" {
			if a.ValidatorName != "" {
				a.Phase = "validating"
			} else {
				a.Phase = "starting"
			}
		}
	}
	s.Paused = false
	return nil
}
