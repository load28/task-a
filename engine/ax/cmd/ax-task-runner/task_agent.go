package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/google/ax/internal/taskgraph"
	"github.com/google/ax/internal/workspace"
	"github.com/google/ax/runner"
	"os"
	"path/filepath"
	"unicode/utf8"
)

// attachTaskAgentResult uses AX's existing completion hook. The supervisor and
// metadata server remain upstream. Only declared UTF-8 regular files are exported.
func attachTaskAgentResult(ctx context.Context, cfg *runner.Config) error {
	raw := os.Getenv("TASK_AGENT_OUTPUTS")
	if raw == "" {
		return nil
	}
	workspace.AXDir = "/workspace/.task-agent/ax"
	var outputs []string
	if err := json.Unmarshal([]byte(raw), &outputs); err != nil {
		return err
	}
	dir := filepath.Dir(taskgraph.ResultPath)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	// A completed command is not launched a second time when the actor resumes.
	// Partial Codex sessions are resumed by the command adapter instead.
	if data, err := os.ReadFile(taskgraph.ResultPath); err == nil {
		var r taskgraph.Result
		if json.Unmarshal(data, &r) == nil && r.Task == cfg.Task.GetMetadata().GetName() {
			cfg.Task.Spec.Command = nil
			return nil
		}
	}
	cfg.OnCommandExit = func(exit runner.CommandExit) {
		if ctx.Err() != nil || exit.ExitCode < 0 {
			return
		} // interrupted commands have no completion evidence
		r := taskgraph.Result{Task: cfg.Task.GetMetadata().GetName(), ExitCode: exit.ExitCode, Files: map[string]string{}}
		total := 0
		for _, p := range outputs {
			full := filepath.Join("/workspace/work", p)
			real, err := filepath.EvalSymlinks(full)
			if err != nil || real != full {
				r.Error = "output must be a regular file without symlinks"
				break
			}
			info, err := os.Stat(full)
			if err != nil || !info.Mode().IsRegular() || info.Size() > 1<<20 {
				r.Error = "output is missing or exceeds 1 MiB"
				break
			}
			data, err := os.ReadFile(full)
			if err != nil || !utf8.Valid(data) {
				r.Error = "output is unreadable or not UTF-8"
				break
			}
			total += len(data)
			if total > 4<<20 {
				r.Error = "outputs exceed 4 MiB"
				break
			}
			r.Files[p] = string(data)
		}
		data, err := json.Marshal(r)
		if err != nil {
			return
		}
		temp := taskgraph.ResultPath + ".tmp"
		if err = os.WriteFile(temp, data, 0600); err == nil {
			err = os.Rename(temp, taskgraph.ResultPath)
		}
		if err != nil {
			fmt.Fprintln(os.Stderr, "failed to persist task result")
		}
	}
	return nil
}
