package taskgraph

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	ate "github.com/agent-substrate/substrate/pkg/proto/ateapipb"
	"github.com/google/ax/internal/guest"
	"github.com/google/ax/internal/substrate"
	ax "github.com/google/ax/pkg/apis/v1alpha1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"gopkg.in/yaml.v3"
	"strings"
)

var ErrPending = errors.New("AX provisioning pending")

const ResultPath = "/workspace/work/.task-agent/result.json"

type AXBackend struct {
	API                             ax.AXClient
	Substrate                       *substrate.Client
	Atespace, Router, CredentialURI string
}

func (b AXBackend) Ensure(ctx context.Context, l Launch) error {
	name := l.Name
	wsName := name + "-ws"
	ws := &ax.Workspace{ApiVersion: ax.APIVersion, Kind: ax.KindWorkspace, Metadata: &ax.ObjectMeta{Name: wsName, Atespace: b.Atespace}, Spec: &ax.WorkspaceSpec{}}
	for k, v := range l.Files {
		ws.Spec.Files = append(ws.Spec.Files, &ax.File{Path: k, Content: v})
	}
	// Stable ordering makes retries compare equal after transport encoding.
	sortFiles(ws.Spec.Files)
	old, err := b.API.GetWorkspace(ctx, &ax.GetWorkspaceRequest{Atespace: b.Atespace, Name: wsName})
	if status.Code(err) == codes.NotFound {
		_, err = b.API.UpdateWorkspace(ctx, &ax.UpdateWorkspaceRequest{Workspace: ws})
	} else if err == nil && !proto.Equal(old.Spec, ws.Spec) {
		return fmt.Errorf("immutable workspace collision: %s", wsName)
	}
	if err != nil {
		return err
	}
	encoded, marshalErr := yaml.Marshal(ws)
	if marshalErr != nil {
		return marshalErr
	}
	if len(encoded) > 32<<10 {
		return fmt.Errorf("workspace exceeds AX environment transport limit of 32 KiB")
	}
	outputs, _ := json.Marshal(l.Outputs)
	task := &ax.Task{ApiVersion: ax.APIVersion, Kind: ax.KindTask, Metadata: &ax.ObjectMeta{Name: name, Atespace: b.Atespace}, Spec: &ax.TaskSpec{Image: l.Image, Command: append([]string{"/usr/local/bin/task-agent-exec"}, l.Command...), Debug: true, Workspaces: []*ax.WorkspaceRef{{Name: wsName, Path: "/workspace/work"}}, Env: []*ax.EnvVar{{Name: "TASK_AGENT_OUTPUTS", Value: string(outputs)}, {Name: "TASK_AGENT_EXECUTION_ID", Value: name}}}}
	if len(l.Command) > 0 && l.Command[0] == "/usr/local/bin/task-agent-codex" {
		task.Spec.Env = append(task.Spec.Env, &ax.EnvVar{Name: "TASK_AGENT_NATIVE_EGRESS", Value: "true"}, &ax.EnvVar{Name: "CODEX_CA_CERTIFICATE", Value: "/run/ate/trust-bundle.pem"})
	}
	existing, err := b.API.GetTask(ctx, &ax.GetTaskRequest{Atespace: b.Atespace, Name: name})
	if status.Code(err) == codes.NotFound {
		_, err = b.API.CreateTask(ctx, &ax.CreateTaskRequest{Task: task})
		return err
	}
	if err != nil {
		return err
	}
	if !proto.Equal(existing.Spec, task.Spec) {
		return fmt.Errorf("immutable task collision: %s", name)
	}
	return nil
}
func (b AXBackend) Start(ctx context.Context, name string) error {
	actor, err := b.Substrate.ObserveActor(ctx, b.Atespace, name)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return fmt.Errorf("%w: actor", ErrPending)
		}
		return err
	}
	if actor.GetStatus().GetState() == ate.ActorState_ACTOR_STATE_RUNNING {
		return b.activate(ctx, name)
	}
	if actor.GetStatus().GetState() == ate.ActorState_ACTOR_STATE_RESUMING || actor.GetStatus().GetState() == ate.ActorState_ACTOR_STATE_SUSPENDING {
		return fmt.Errorf("%w: actor transition", ErrPending)
	}
	if actor.GetStatus().GetState() == ate.ActorState_ACTOR_STATE_CRASHED {
		return fmt.Errorf("actor crashed; automatic replacement is forbidden")
	}
	ref := actor.GetActorTemplate()
	tmpl, err := b.Substrate.GetActorTemplate(ctx, ref.GetAtespace(), ref.GetName())
	if err != nil {
		return err
	}
	golden := tmpl.GetStatus().GetGoldenSnapshotStatus()
	if golden.GetErrorMessage() != "" {
		return fmt.Errorf("golden snapshot failed: %s", golden.GetErrorMessage())
	}
	if golden.GetGoldenTag() == nil {
		return fmt.Errorf("%w: golden DATA snapshot", ErrPending)
	}

	task, err := b.API.GetTask(ctx, &ax.GetTaskRequest{Atespace: b.Atespace, Name: name})
	if err != nil {
		return err
	}
	policy := &ate.EgressPolicy{Metadata: &ate.ResourceMetadata{Atespace: b.Atespace, Name: "default"}}
	if isCodex(task.Spec.Command) {
		if b.CredentialURI == "" {
			return fmt.Errorf("native Substrate credential injection must be configured for Codex")
		}
		policy.Rules = []*ate.EgressRule{{Hostnames: &ate.HostnameRule{Patterns: []string{"chatgpt.com"}, Effects: &ate.EgressRuleEffects{InjectStaticHeaders: []*ate.CredentialHeaderInjection{{Header: "Authorization", Prefix: "Bearer ", CredentialUri: b.CredentialURI + "/access-token"}, {Header: "ChatGPT-Account-Id", CredentialUri: b.CredentialURI + "/account-id"}}}}}}
	}
	if err := b.Substrate.SetActorEgress(ctx, b.Atespace, name, policy); err != nil {
		return err
	}
	_, err = b.API.ResumeTask(ctx, &ax.ResumeTaskRequest{Atespace: b.Atespace, Name: name})
	return err
}
func (b AXBackend) Result(ctx context.Context, name string) (*Result, error) {
	task, err := b.API.GetTask(ctx, &ax.GetTaskRequest{Atespace: b.Atespace, Name: name})
	if err != nil {
		return nil, err
	}
	if task.GetStatus().GetPhase() == "Failed" {
		retryable := false
		for _, condition := range task.GetStatus().GetConditions() {
			retryable = retryable || condition.GetReason() == "ActorResumeFailed"
		}
		if !retryable {
			return nil, fmt.Errorf("AX task %s failed; inspect AX conditions", name)
		}
		observed, observeErr := b.Substrate.ObserveActor(ctx, b.Atespace, name)
		if observeErr != nil {
			return nil, observeErr
		}
		if observed.GetStatus().GetState() != ate.ActorState_ACTOR_STATE_RUNNING {
			return nil, b.Start(ctx, name)
		}
	}

	if err := b.activate(ctx, name); err != nil {
		return nil, err
	}
	target, actor := b.Router, b.Atespace+"/"+name
	if target == "" {
		target = task.GetStatus().GetWorkerIp()
		actor = ""
		if target == "" {
			return nil, nil
		}
		if !strings.Contains(target, ":") {
			target += ":80"
		}
	}
	c, err := guest.DialTarget(target, actor)
	if err != nil {
		return nil, err
	}
	defer c.Close()
	raw, err := c.ReadBounded(ctx, ResultPath, 8<<20)
	if status.Code(err) == codes.NotFound || status.Code(err) == codes.Unavailable {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var r Result
	if err = json.Unmarshal(raw, &r); err != nil {
		return nil, err
	}
	return &r, nil
}
func (b AXBackend) Suspend(ctx context.Context, name string) (bool, error) {
	_, err := b.API.SuspendTask(ctx, &ax.SuspendTaskRequest{Atespace: b.Atespace, Name: name})
	if err != nil {
		return false, err
	}
	actor, err := b.Substrate.ObserveActor(ctx, b.Atespace, name)
	if err != nil {
		return false, err
	}
	return actor.GetStatus().GetState() == ate.ActorState_ACTOR_STATE_SUSPENDED && actor.GetStatus().GetWorkerAssignment() == nil, nil
}

// Golden-template warmup also starts the AX command. Activation keeps Codex idle
// there; only an actual task actor with its egress policy installed gets a permit.
func (b AXBackend) activate(ctx context.Context, name string) error {
	actual, err := b.Substrate.ObserveActor(ctx, b.Atespace, name)
	if err != nil {
		return err
	}
	if actual.GetStatus().GetState() != ate.ActorState_ACTOR_STATE_RUNNING {
		return ErrPending
	}
	target, actor := b.Router, b.Atespace+"/"+name
	if target == "" {
		target = actual.GetStatus().GetWorkerAssignment().GetWorkerPodIp() + ":80"
		actor = ""
	}
	c, err := guest.DialTarget(target, actor)
	if err != nil {
		return err
	}
	defer c.Close()
	return c.WriteActivation(ctx, "/workspace/work/.task-agent/activation", []byte(name))
}

func isCodex(command []string) bool {
	return len(command) > 0 && (command[0] == "/usr/local/bin/task-agent-codex" || (command[0] == "/usr/local/bin/task-agent-exec" && len(command) > 1 && command[1] == "/usr/local/bin/task-agent-codex"))
}
