package substrate

import (
	"context"
	ate "github.com/agent-substrate/substrate/pkg/proto/ateapipb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
	"net"
	"testing"
)

type policyServer struct {
	ate.UnimplementedControlServer
	current *ate.EgressPolicy
	updates int
}

func (s *policyServer) CreateActorEgressPolicy(context.Context, *ate.CreateActorEgressPolicyRequest) (*ate.EgressPolicy, error) {
	return nil, status.Error(codes.AlreadyExists, "exists")
}
func (s *policyServer) GetActorEgressPolicy(context.Context, *ate.GetActorEgressPolicyRequest) (*ate.EgressPolicy, error) {
	return s.current, nil
}
func (s *policyServer) UpdateActorEgressPolicy(_ context.Context, r *ate.UpdateActorEgressPolicyRequest) (*ate.EgressPolicy, error) {
	if r.EgressPolicy.Metadata.Uid != "uid" || r.EgressPolicy.Metadata.Version != 7 {
		return nil, status.Error(codes.InvalidArgument, "metadata lost")
	}
	s.updates++
	s.current = r.EgressPolicy
	return s.current, nil
}
func TestEgressRetryPreservesNativeVersionAndIsIdempotent(t *testing.T) {
	lis := bufconn.Listen(1 << 20)
	srv := grpc.NewServer()
	fake := &policyServer{current: &ate.EgressPolicy{Metadata: &ate.ResourceMetadata{Atespace: "space", Name: "default", Uid: "uid", Version: 7}}}
	ate.RegisterControlServer(srv, fake)
	go srv.Serve(lis)
	defer srv.Stop()
	client, e := NewClient("passthrough:///policy", grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) { return lis.Dial() }), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if e != nil {
		t.Fatal(e)
	}
	defer client.Close()
	policy := &ate.EgressPolicy{Metadata: &ate.ResourceMetadata{Atespace: "space", Name: "default"}, Rules: []*ate.EgressRule{{Hostnames: &ate.HostnameRule{Patterns: []string{"chatgpt.com"}}}}}
	for i := 0; i < 2; i++ {
		if e = client.SetActorEgress(context.Background(), "space", "actor", policy); e != nil {
			t.Fatal(e)
		}
	}
	if fake.updates != 1 {
		t.Fatal("idempotent retry mutated policy")
	}
}
