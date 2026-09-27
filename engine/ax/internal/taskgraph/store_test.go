package taskgraph

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
	"os"
	"testing"
	"time"
)

func TestRealRedisPersistenceEventsAndExclusiveOperation(t *testing.T) {
	addr := os.Getenv("TASK_AGENT_TEST_REDIS")
	if addr == "" {
		t.Skip("set TASK_AGENT_TEST_REDIS for real Redis integration")
	}
	c := redis.NewClient(&redis.Options{Addr: addr})
	defer c.Close()
	ctx := context.Background()
	s := Store{Client: c, Project: fmt.Sprint("test-", time.Now().UnixNano())}
	defer func() {
		keys, _ := c.Keys(ctx, s.key("*")).Result()
		if len(keys) > 0 {
			c.Del(ctx, keys...)
		}
	}()
	st, _ := Apply(nil, plan())
	if e := s.Save(ctx, st); e != nil {
		t.Fatal(e)
	}
	reopened := Store{Client: redis.NewClient(&redis.Options{Addr: addr}), Project: s.Project}
	defer reopened.Client.Close()
	got, e := reopened.Load(ctx, "demo")
	if e != nil || got.Plan.Revision != 1 {
		t.Fatalf("reopen: %v", e)
	}
	if n, e := c.XLen(ctx, s.key("demo")+":events").Result(); e != nil || n != 1 {
		t.Fatal("event not committed")
	}
	if e = s.Locked(ctx, "demo", func() error {
		if err := reopened.Locked(ctx, "demo", func() error { t.Fatal("overlapping effect"); return nil }); err == nil {
			t.Fatal("lock not exclusive")
		}
		return nil
	}); e != nil {
		t.Fatal(e)
	}
	if e = reopened.Locked(ctx, "demo", func() error { return nil }); e != nil {
		t.Fatal("lock not released")
	}
}
