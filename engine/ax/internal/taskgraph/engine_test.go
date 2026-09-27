package taskgraph

import (
	"context"
	"fmt"
	"strings"
	"testing"
)

const pinned = "example.test/runner@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

func plan() Plan {
	return Plan{ID: "demo", Revision: 1, Tasks: []Node{{ID: "a", Goal: "create", Contract: "value", Image: pinned, Command: []string{"create"}, Files: map[string]string{"seed": "one"}, Outputs: []string{"out"}, Validator: Validator{Image: pinned, Command: []string{"check"}}}, {ID: "b", Goal: "consume", Contract: "value", Image: pinned, Command: []string{"create"}, Inputs: map[string]Input{"in": {Task: "a", Output: "out"}}, Outputs: []string{"out"}, Validator: Validator{Image: pinned, Command: []string{"check"}}}}}
}

type fake struct {
	launches map[string]Launch
	results  map[string]*Result
	stops    map[string]bool
	start    []string
	failStop bool
}

func newFake() *fake {
	return &fake{launches: map[string]Launch{}, results: map[string]*Result{}, stops: map[string]bool{}}
}
func (f *fake) Ensure(_ context.Context, l Launch) error {
	if old, ok := f.launches[l.Name]; ok && Digest(old) != Digest(l) {
		return fmt.Errorf("collision")
	}
	f.launches[l.Name] = l
	return nil
}
func (f *fake) Start(_ context.Context, n string) error             { f.start = append(f.start, n); return nil }
func (f *fake) Result(_ context.Context, n string) (*Result, error) { return f.results[n], nil }
func (f *fake) Suspend(_ context.Context, n string) (bool, error) {
	if f.failStop {
		return false, fmt.Errorf("not stopped")
	}
	f.stops[n] = true
	return true, nil
}
func engine(f *fake) Engine {
	return Engine{Scope: "project", Backend: f, Save: func(context.Context, *State) error { return nil }}
}
func advance(t *testing.T, e Engine, s *State, f *fake) {
	t.Helper()
	for i := 0; i < 30 && !s.Complete(); i++ {
		if err := e.Tick(context.Background(), s); err != nil {
			t.Fatal(err)
		}
		for name, l := range f.launches {
			if f.results[name] == nil {
				files := map[string]string{}
				for _, o := range l.Outputs {
					files[o] = "unchanged"
				}
				f.results[name] = &Result{Task: name, Files: files}
			}
		}
	}
}
func TestDAGValidatesBeforeSideEffects(t *testing.T) {
	p := plan()
	p.Tasks[0].Inputs = map[string]Input{"x": {Task: "b", Output: "out"}}
	if Validate(p) == nil {
		t.Fatal("cycle accepted")
	}
	p = plan()
	p.Tasks[0].Files = map[string]string{"../escape": "bad"}
	if Validate(p) == nil {
		t.Fatal("traversal accepted")
	}
	p = plan()
	p.Tasks[0].Validator.Files = map[string]string{"out": "forged"}
	if Validate(p) == nil {
		t.Fatal("validator overwrite accepted")
	}
}
func TestSeparateValidationAndSelectiveReuse(t *testing.T) {
	p := plan()
	s, err := Apply(nil, p)
	if err != nil {
		t.Fatal(err)
	}
	f := newFake()
	e := engine(f)
	advance(t, e, s, f)
	if !s.Complete() || len(f.launches) != 4 {
		t.Fatalf("not complete with separate validators: %+v", s)
	}
	for n := range f.launches {
		if !f.stops[n] {
			t.Fatal("adopted before actor stopped")
		}
	}
	p.Revision++
	p.Tasks[0].Goal = "changed implementation, equivalent output"
	next, err := Apply(s, p)
	if err != nil {
		t.Fatal(err)
	}
	advance(t, e, next, f)
	if !next.Complete() || next.Attempts["a"].Reused || !next.Attempts["b"].Reused {
		t.Fatal("equal dependency output must reuse downstream")
	}
	if len(f.launches) != 6 {
		t.Fatal("unexpected reruns")
	}
}
func TestSuspendFailureCannotResumeOrActivateRevision(t *testing.T) {
	s, _ := Apply(nil, plan())
	f := newFake()
	e := engine(f)
	if err := e.Tick(context.Background(), s); err != nil {
		t.Fatal(err)
	}
	f.failStop = true
	if e.Pause(context.Background(), s) == nil {
		t.Fatal("expected failure")
	}
	if Resume(s) == nil {
		t.Fatal("resumed without evidence")
	}
	p := plan()
	p.Revision = 2
	if _, err := Apply(s, p); err == nil {
		t.Fatal("changed without stopping")
	}
	f.failStop = false
	if err := e.Pause(context.Background(), s); err != nil {
		t.Fatal(err)
	}
	name := s.Attempts["a"].Name
	if err := Resume(s); err != nil {
		t.Fatal(err)
	}
	if err := e.Tick(context.Background(), s); err != nil {
		t.Fatal(err)
	}
	if s.Attempts["a"].Name != name {
		t.Fatal("resume changed durable actor")
	}
}
func TestLostStartResponseUsesPersistedIdentity(t *testing.T) {
	s, _ := Apply(nil, plan())
	f := newFake()
	e := engine(f)
	if err := e.Tick(context.Background(), s); err != nil {
		t.Fatal(err)
	}
	name := s.Attempts["a"].Name
	s.Attempts["a"].Phase = "starting"
	if err := e.Tick(context.Background(), s); err != nil {
		t.Fatal(err)
	}
	if len(f.launches) != 1 || f.start[1] != name {
		t.Fatal("duplicated attempt")
	}
}
func TestFailedValidatorNeverAdopts(t *testing.T) {
	s, _ := Apply(nil, plan())
	f := newFake()
	e := engine(f)
	for i := 0; i < 12; i++ {
		if err := e.Tick(context.Background(), s); err != nil {
			t.Fatal(err)
		}
		for name := range f.launches {
			code := 0
			if strings.HasSuffix(name, "-v") {
				code = 1
			}
			f.results[name] = &Result{Task: name, ExitCode: code, Files: map[string]string{"out": "bad"}}
		}
	}
	if s.Complete() || s.Attempts["a"].Phase != "failed" || s.Attempts["b"] != nil {
		t.Fatal("invalid result propagated")
	}
}
func TestProjectsHaveDifferentActorIdentities(t *testing.T) {
	a, _ := Apply(nil, plan())
	b, _ := Apply(nil, plan())
	f := newFake()
	e := engine(f)
	e.Scope = "a"
	if err := e.Tick(context.Background(), a); err != nil {
		t.Fatal(err)
	}
	e.Scope = "b"
	if err := e.Tick(context.Background(), b); err != nil {
		t.Fatal(err)
	}
	if a.Attempts["a"].Name == b.Attempts["a"].Name {
		t.Fatal("projects share actor")
	}
}
