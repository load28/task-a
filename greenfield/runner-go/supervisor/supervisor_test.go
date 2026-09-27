package supervisor

import (
	"bytes"
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestOutcomeAndLiteralArguments(t *testing.T) {
	var out bytes.Buffer
	result, err := Run(context.Background(), Config{Argv: []string{"/bin/sh", "-c", "printf '%s' \"$1\"; exit 7", "sh", "$(not-a-command) 한글"}, Dir: t.TempDir(), Env: os.Environ(), Stdout: &out, Stderr: &out, GracePeriod: time.Second})
	if err == nil || result.ExitCode != 7 || out.String() != "$(not-a-command) 한글" {
		t.Fatalf("unexpected outcome: %+v %v %q", result, err, out.String())
	}
}
func TestCancellationReachesProcessGroupAndIsBounded(t *testing.T) {
	dir := t.TempDir()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan Result, 1)
	go func() {
		result, _ := Run(ctx, Config{Argv: []string{"/bin/sh", "-c", "trap '' TERM; printf ready > ready; sleep 30 & wait"}, Dir: dir, Env: os.Environ(), GracePeriod: 100 * time.Millisecond})
		done <- result
	}()
	deadline := time.Now().Add(3 * time.Second)
	for {
		if _, err := os.Stat(filepath.Join(dir, "ready")); err == nil {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("command never became ready")
		}
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	select {
	case result := <-done:
		if !result.Interrupted || result.ExitCode == 0 {
			t.Fatalf("unexpected stop: %+v", result)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("process group did not terminate")
	}
}
func TestCanceledContextDoesNotStartCommand(t *testing.T) {
	dir := t.TempDir()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	result, err := Run(ctx, Config{Argv: []string{"/bin/sh", "-c", "touch started"}, Dir: dir, GracePeriod: time.Second})
	if err == nil || !result.Interrupted {
		t.Fatal("canceled start was accepted")
	}
	if _, err := os.Stat(filepath.Join(dir, "started")); err == nil {
		t.Fatal("command was started")
	}
}
