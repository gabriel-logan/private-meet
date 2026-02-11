package ws

import "testing"

func TestManagerDisconnectClientNilAndEdgeHubs(t *testing.T) {
	m := &Manager{hubs: []*Hub{nil, {disconnect: nil}}}

	// Should not panic.
	m.DisconnectClient(nil)
	m.DisconnectClient(&Client{})
}

func TestUseDefaultHubShardsBe1(t *testing.T) {
	m1 := NewManager(-1)
	m2 := NewManager(0)

	if len(m1.hubs) != 1 {
		t.Fatalf("expected 1 hub shard, got %d", len(m1.hubs))
	}

	if len(m2.hubs) != 1 {
		t.Fatalf("expected 1 hub shard, got %d", len(m2.hubs))
	}
}

func TestUseCustomShards(t *testing.T) {
	m := NewManager(5)

	if len(m.hubs) != 5 {
		t.Fatalf("expected 5 hub shards, got %d", len(m.hubs))
	}
}
