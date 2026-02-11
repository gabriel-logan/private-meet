package ws

import "testing"

func TestManagerDisconnectClientNilAndEdgeHubs(t *testing.T) {
	m := &Manager{hubs: []*Hub{nil, {disconnect: nil}}}

	// Should not panic.
	m.DisconnectClient(nil)
	m.DisconnectClient(&Client{})
}
