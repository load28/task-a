package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"github.com/google/ax/internal/substrate"
	"github.com/google/ax/internal/taskgraph"
	ax "github.com/google/ax/pkg/apis/v1alpha1"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"os"
	"path/filepath"
	"time"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run() error {
	project := flag.String("project", ".", "Project root")
	endpoint := flag.String("ax", env("TASK_AGENT_AX_ENDPOINT", "127.0.0.1:8080"), "AX gRPC endpoint (trusted local/forwarded connection)")
	redisAddr := flag.String("redis", env("TASK_AGENT_REDIS_ADDR", "127.0.0.1:6379"), "AX Redis endpoint")
	space := flag.String("atespace", env("TASK_AGENT_ATESPACE", "task-agent"), "Substrate atespace")
	target := flag.String("substrate", os.Getenv("TASK_AGENT_SUBSTRATE_ENDPOINT"), "Substrate control endpoint")
	router := flag.String("router", os.Getenv("TASK_AGENT_ROUTER"), "AX guest router")
	timeout := flag.Duration("timeout", 30*time.Second, "Bounded operation duration")
	flag.Parse()
	args := flag.Args()
	if len(args) != 2 {
		return fmt.Errorf("commands: validate PLAN | impact PLAN | apply PLAN | status ID | run ID | suspend ID | resume ID | result ID")
	}
	abs, err := filepath.Abs(*project)
	if err != nil {
		return err
	}
	abs, err = filepath.EvalSymlinks(abs)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), *timeout)
	defer cancel()
	command, id := args[0], args[1]
	var plan taskgraph.Plan
	if command == "validate" || command == "apply" || command == "impact" {
		f, err := os.Open(id)
		if err != nil {
			return err
		}
		defer f.Close()
		dec := json.NewDecoder(f)
		dec.DisallowUnknownFields()
		if err = dec.Decode(&plan); err != nil {
			return err
		}
		if err = taskgraph.Validate(plan); err != nil {
			return err
		}
		id = plan.ID
		if command == "validate" {
			return printJSON(map[string]any{"valid": true, "id": id, "revision": plan.Revision})
		}
	}
	client := redis.NewClient(&redis.Options{Addr: *redisAddr})
	defer client.Close()
	store := taskgraph.Store{Client: client, Project: taskgraph.Digest(abs)[:24]}
	if command == "status" || command == "result" {
		s, e := store.Load(ctx, id)
		if e != nil {
			return e
		}
		if command == "result" {
			if !s.Complete() {
				return fmt.Errorf("graph is not complete")
			}
			out := map[string]any{}
			for k, a := range s.Attempts {
				out[k] = a.Outputs
			}
			return printJSON(out)
		}
		return printJSON(map[string]any{"complete": s.Complete(), "state": s})
	}
	return store.Locked(ctx, id, func() error {
		s, err := store.Load(ctx, id)
		if err != nil && !errors.Is(err, redis.Nil) {
			return err
		}
		if command == "apply" {
			next, err := taskgraph.Apply(s, plan)
			if err != nil {
				return err
			}
			if err = store.Save(ctx, next); err != nil {
				return err
			}
			return printJSON(next)
		}
		if s == nil {
			return fmt.Errorf("graph not found")
		}
		if command == "impact" {
			return printJSON(taskgraph.Impact(s.Plan, plan))
		}
		if command == "resume" {
			if err = taskgraph.Resume(s); err != nil {
				return err
			}
			return store.Save(ctx, s)
		}
		if command != "run" && command != "suspend" {
			return fmt.Errorf("unknown command %s", command)
		}
		conn, err := grpc.NewClient(*endpoint, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			return err
		}
		defer conn.Close()
		sub, err := substrate.NewClientWithOptions(substrate.ClientOptions{Target: *target, Authority: os.Getenv("TASK_AGENT_SUBSTRATE_AUTHORITY")})
		if err != nil {
			return err
		}
		defer sub.Close()
		backend := taskgraph.AXBackend{API: ax.NewAXClient(conn), Substrate: sub, Atespace: *space, Router: *router, CredentialURI: os.Getenv("TASK_AGENT_CODEX_CREDENTIAL_URI")}
		engine := taskgraph.Engine{Scope: store.Project, Backend: backend, Save: store.Save}
		if command == "suspend" {
			err = engine.Pause(ctx, s)
		} else {
			err = engine.Tick(ctx, s)
		}
		if errors.Is(err, taskgraph.ErrPending) {
			return printJSON(map[string]any{"complete": false, "pending": err.Error(), "state": s})
		}
		if err != nil {
			return err
		}
		return printJSON(map[string]any{"complete": s.Complete(), "state": s})
	})
}
func env(k, f string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return f
}
func printJSON(v any) error { return json.NewEncoder(os.Stdout).Encode(v) }
