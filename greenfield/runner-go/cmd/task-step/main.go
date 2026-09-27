package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"task-agent/runner/supervisor"
	"time"
)

func main() {
	dir := flag.String("cwd", "/workspace", "command workspace")
	grace := flag.Duration("grace", time.Second, "termination grace period")
	flag.Parse()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	result, err := supervisor.Run(ctx, supervisor.Config{Argv: flag.Args(), Dir: *dir, Env: os.Environ(), Stdin: os.Stdin, Stdout: os.Stdout, Stderr: os.Stderr, GracePeriod: *grace})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
	}
	if result.Interrupted {
		os.Exit(143)
	}
	os.Exit(result.ExitCode)
}
