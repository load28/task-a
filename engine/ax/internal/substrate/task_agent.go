package substrate

import (
	"context"
	"github.com/agent-substrate/substrate/pkg/proto/ateapipb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

// ObserveActor retains Substrate as the authority for suspension evidence.
func (c *Client) ObserveActor(ctx context.Context, space, name string) (*ateapipb.Actor, error) {
	return c.control.GetActor(ctx, &ateapipb.GetActorRequest{Actor: &ateapipb.ObjectRef{Atespace: space, Name: name}})
}
func (c *Client) SetActorEgress(ctx context.Context, space, name string, p *ateapipb.EgressPolicy) error {
	ref := &ateapipb.ObjectRef{Atespace: space, Name: name}
	_, err := c.control.CreateActorEgressPolicy(ctx, &ateapipb.CreateActorEgressPolicyRequest{Actor: ref, EgressPolicy: p})
	if status.Code(err) == codes.AlreadyExists {
		current, getErr := c.control.GetActorEgressPolicy(ctx, &ateapipb.GetActorEgressPolicyRequest{Actor: ref})
		if getErr != nil {
			return getErr
		}
		if proto.Equal(&ateapipb.EgressPolicy{Rules: current.Rules}, &ateapipb.EgressPolicy{Rules: p.Rules}) {
			return nil
		}
		p.Metadata = current.Metadata
		_, err = c.control.UpdateActorEgressPolicy(ctx, &ateapipb.UpdateActorEgressPolicyRequest{Actor: ref, EgressPolicy: p})
	}
	return err
}
