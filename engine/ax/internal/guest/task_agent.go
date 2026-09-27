package guest

import (
	"context"
	"fmt"
	ate "github.com/agent-substrate/env/proto/ateenv/v1alpha"
	"io"
)

// ReadBounded uses AX's existing guest transport, not a second execution channel.
func (c *Client) ReadBounded(ctx context.Context, path string, limit int) ([]byte, error) {
	s, e := c.filesystem.ReadFile(ctx, &ate.ReadFileRequest{Path: path})
	if e != nil {
		return nil, e
	}
	var b []byte
	for {
		v, e := s.Recv()
		if e == io.EOF {
			return b, nil
		}
		if e != nil {
			return nil, e
		}
		if len(b)+len(v.Chunk) > limit {
			return nil, fmt.Errorf("result exceeds %d bytes", limit)
		}
		b = append(b, v.Chunk...)
	}
}

func (c *Client) WriteActivation(ctx context.Context, path string, data []byte) error {
	if len(data) > 1024 {
		return fmt.Errorf("activation is too large")
	}
	s, e := c.filesystem.WriteFile(ctx)
	if e != nil {
		return e
	}
	if e = s.Send(&ate.WriteFileRequest{Path: path, Mode: 0600, Chunk: data}); e != nil {
		return e
	}
	_, e = s.CloseAndRecv()
	return e
}
