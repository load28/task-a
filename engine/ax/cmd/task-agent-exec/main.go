// Activation gate for AX template warmup. AX runner still owns supervision.
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"syscall"
	"time"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run() error {
	id := os.Getenv("TASK_AGENT_EXECUTION_ID")
	if id == "" || len(os.Args) < 2 {
		return fmt.Errorf("execution identity and argv required")
	}
	for {
		data, err := os.ReadFile("/workspace/work/.task-agent/activation")
		if err == nil && string(data) == id {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}
	if data, err := os.ReadFile("/workspace/work/.task-agent/result.json"); err == nil {
		var result struct {
			Task string `json:"task"`
		}
		if json.Unmarshal(data, &result) == nil && result.Task == id {
			for {
				time.Sleep(time.Second)
			}
		}
	}
	executable, err := exec.LookPath(os.Args[1])
	if err != nil {
		return err
	}
	return syscall.Exec(executable, os.Args[1:], os.Environ())
}
