// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Adapted from google/ax runner/runner.go at d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9.
// Changes: standalone command API, explicit streams/env, configurable bounded grace,
// and return command outcome instead of keeping the AX metadata server alive.
package supervisor

import (
	"context"
	"fmt"
	"io"
	"os/exec"
	"syscall"
	"time"
)

type Config struct {
	Argv        []string
	Dir         string
	Env         []string
	Stdin       io.Reader
	Stdout      io.Writer
	Stderr      io.Writer
	GracePeriod time.Duration
}

type Result struct {
	PID         int
	ExitCode    int
	Interrupted bool
}

// Run borrows AX's dedicated process group and bounded SIGTERM/SIGKILL supervision.
// The enclosing runtime still proves whole-container termination before snapshotting.
func Run(ctx context.Context, cfg Config) (Result, error) {
	if len(cfg.Argv) == 0 || cfg.Argv[0] == "" {
		return Result{ExitCode: 125}, fmt.Errorf("command argv is required")
	}
	if cfg.GracePeriod <= 0 || cfg.GracePeriod > time.Minute {
		return Result{ExitCode: 125}, fmt.Errorf("grace period must be positive and at most one minute")
	}
	if err := ctx.Err(); err != nil {
		return Result{ExitCode: 143, Interrupted: true}, err
	}
	cmd := exec.Command(cfg.Argv[0], cfg.Argv[1:]...)
	cmd.Dir = cfg.Dir
	cmd.Stdin = cfg.Stdin
	cmd.Stdout = cfg.Stdout
	cmd.Stderr = cfg.Stderr
	cmd.Env = cfg.Env
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	if err := cmd.Start(); err != nil {
		return Result{ExitCode: 125}, fmt.Errorf("starting task command: %w", err)
	}
	exited := make(chan error, 1)
	go func() { exited <- cmd.Wait() }()
	result := Result{PID: cmd.Process.Pid, ExitCode: -1}
	var err error
	select {
	case err = <-exited:
	case <-ctx.Done():
		result.Interrupted = true
		err = stopCommand(cmd, exited, cfg.GracePeriod)
	}
	if cmd.ProcessState != nil {
		result.ExitCode = cmd.ProcessState.ExitCode()
	}
	if result.ExitCode < 0 {
		result.ExitCode = 143
	}
	return result, err
}

// stopCommand comes from AX; grace is per invocation instead of a package constant.
func stopCommand(cmd *exec.Cmd, exited <-chan error, grace time.Duration) error {
	pid := cmd.Process.Pid
	_ = syscall.Kill(-pid, syscall.SIGTERM)
	timer := time.NewTimer(grace)
	defer timer.Stop()
	select {
	case err := <-exited:
		// The process group may still contain descendants after its leader exits.
		// They cannot carry on mutating a later step's workspace.
		_ = syscall.Kill(-pid, syscall.SIGKILL)
		return err
	case <-timer.C:
		_ = syscall.Kill(-pid, syscall.SIGKILL)
		return <-exited
	}
}
