package taskgraph

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/redis/go-redis/v9"
	"os"
	"time"
)

// Store uses the same Redis installation as AX, in a separate key namespace.
// The non-expiring operation lock deliberately fails closed after a crashed
// operator: no expired lease may allow a stale operator to resume an actor.
type Store struct {
	Client  *redis.Client
	Project string
}

func (s Store) key(id string) string { return "task-agent:" + s.Project + ":" + id }
func (s Store) Load(ctx context.Context, id string) (*State, error) {
	b, e := s.Client.Get(ctx, s.key(id)).Bytes()
	if e != nil {
		return nil, e
	}
	var st State
	e = json.Unmarshal(b, &st)
	return &st, e
}
func (s Store) Save(ctx context.Context, st *State) error {
	b, e := json.Marshal(st)
	if e != nil {
		return e
	}
	_, e = s.Client.TxPipelined(ctx, func(p redis.Pipeliner) error {
		p.Set(ctx, s.key(st.Plan.ID), b, 0)
		p.XAdd(ctx, &redis.XAddArgs{Stream: s.key(st.Plan.ID) + ":events", Values: map[string]interface{}{"revision": st.Plan.Revision, "state": string(b)}})
		return nil
	})
	return e
}
func (s Store) Locked(ctx context.Context, id string, fn func() error) error {
	host, _ := os.Hostname()
	owner := fmt.Sprintf("%s:%d:%d", host, os.Getpid(), time.Now().UnixNano())
	key := s.key(id) + ":lock"
	ok, e := s.Client.SetNX(ctx, key, owner, 0).Result()
	if e != nil {
		return e
	}
	if !ok {
		return fmt.Errorf("graph operation locked; inspect %s and confirm its owner stopped before recovery", key)
	}
	defer s.Client.Eval(context.Background(), `if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0`, []string{key}, owner)
	return fn()
}
