package taskgraph

import (
	ax "github.com/google/ax/pkg/apis/v1alpha1"
	"sort"
)

func sortFiles(f []*ax.File) { sort.Slice(f, func(i, j int) bool { return f[i].Path < f[j].Path }) }
