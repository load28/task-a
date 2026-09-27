package substrate

import (
	"testing"
)

func TestNativeEgressTrustProjectionOnlyForRequestedTask(t *testing.T) {
	plain := BuildActorTemplate("space", "plain", "image", nil, nil, "gs://local/path")
	if len(plain.Volumes) != 1 {
		t.Fatal("changed upstream default")
	}
	native := BuildActorTemplate("space", "codex", "image", map[string]string{"TASK_AGENT_NATIVE_EGRESS": "true"}, nil, "gs://local/path")
	if len(native.Volumes) != 2 || native.Volumes[1].GetSystemInfo().GetDataSources()[0].GetTrustBundle().GetName() != "egress-mitm.ate.dev" {
		t.Fatal("missing native CA projection")
	}
	if native.Containers[0].VolumeMounts[1].MountPath != "/run/ate" {
		t.Fatal("wrong mount")
	}
}
