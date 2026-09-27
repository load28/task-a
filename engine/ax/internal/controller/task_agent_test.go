package controller_test

import (
	"context"
	"github.com/agent-substrate/substrate/pkg/proto/ateapipb"
	"github.com/google/ax/internal/controller"
	"github.com/google/ax/internal/substrate"
	ax "github.com/google/ax/pkg/apis/v1alpha1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
	"net"
	"testing"
)

type faultControl struct {
	mockControlServer
	templateFailure, suspendFailure bool
}

func (m *faultControl) CreateActorTemplate(c context.Context, r *ateapipb.CreateActorTemplateRequest) (*ateapipb.ActorTemplate, error) {
	if m.templateFailure {
		return nil, status.Error(codes.Unavailable, "template unavailable")
	}
	return m.mockControlServer.CreateActorTemplate(c, r)
}
func (m *faultControl) SuspendActor(c context.Context, r *ateapipb.SuspendActorRequest) (*ateapipb.SuspendActorResponse, error) {
	if m.suspendFailure {
		return nil, status.Error(codes.Unavailable, "suspend unavailable")
	}
	return m.mockControlServer.SuspendActor(c, r)
}
func TestTaskAgentFailsClosedOnRequiredTemplateAndSuspend(t *testing.T) {
	for _, phase := range []string{"template", "suspend"} {
		t.Run(phase, func(t *testing.T) {
			lis := bufconn.Listen(1 << 20)
			server := grpc.NewServer()
			m := &faultControl{templateFailure: phase == "template", suspendFailure: phase == "suspend"}
			ateapipb.RegisterControlServer(server, m)
			go server.Serve(lis)
			defer server.Stop()
			client, e := substrate.NewClient("passthrough:///test", grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) { return lis.Dial() }), grpc.WithTransportCredentials(insecure.NewCredentials()))
			if e != nil {
				t.Fatal(e)
			}
			defer client.Close()
			r := controller.NewTaskReconciler(client, "default", "system")
			r.SecretResolver = noSecrets
			task, e := r.Reconcile(context.Background(), &ax.Task{Metadata: &ax.ObjectMeta{Name: "task", Atespace: "test"}, Spec: &ax.TaskSpec{Image: "required"}, Status: &ax.TaskStatus{Phase: "Suspended"}})
			if e == nil {
				t.Fatal("failure was reported as success")
			}
			if phase == "template" && len(m.createdActors) > 0 {
				t.Fatal("created fallback actor")
			}
			for _, c := range task.Status.Conditions {
				if c.Reason == "TaskSuspended" {
					t.Fatal("false suspension evidence")
				}
			}
		})
	}
}
