package ws

import (
	"encoding/json"
	"strings"
)

type inboundMessage struct {
	client *Client
	msg    *Message
}

type Hub struct {
	clients map[*Client]bool
	rooms   map[string]map[*Client]bool

	inbound chan *inboundMessage
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*Client]bool),
		rooms:   make(map[string]map[*Client]bool),

		inbound: make(chan *inboundMessage, 4096),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case in := <-h.inbound:
			c := in.client
			msg := in.msg

			// Ensure From is always server-controlled.
			msg.From = c.UserID

			switch msg.Type {
			case MessageChatJoin:

			case MessageChatLeave:

			case MessageChatMessage:

			case MessageChatTyping:

			case MessageWebRTCOffer, MessageWebRTCAnswer, MessageWebRTCIceCandidate:
				to := ""

				switch msg.Type {
				case MessageWebRTCOffer:
					var payload WebRTCOfferData
					if err := json.Unmarshal(msg.Data, &payload); err != nil {
						c.sendError("Invalid WebRTC offer payload")
						return
					}

					to = strings.TrimSpace(payload.To)

				case MessageWebRTCAnswer:
					var payload WebRTCAnswerData
					if err := json.Unmarshal(msg.Data, &payload); err != nil {
						c.sendError("Invalid WebRTC answer payload")
						return
					}

					to = strings.TrimSpace(payload.To)

				case MessageWebRTCIceCandidate:
					var payload WebRTCIceCandidateData
					if err := json.Unmarshal(msg.Data, &payload); err != nil {
						c.sendError("Invalid WebRTC ICE candidate payload")
						return
					}

					to = strings.TrimSpace(payload.To)
				}

				if to == "" {
					c.sendError("Missing WebRTC recipient")
					return
				}

			default:
				c.sendError("Invalid message type")
			}
		}
	}
}

func (h *Hub) isClientInRoom(room string, c *Client) bool {}

func (h *Hub) clientJoinRoom(room string, c *Client) {}

func (h *Hub) clientLeaveRoom(room string, c *Client) {}

func (h *Hub) clientLeaveAllRooms(c *Client) []string {}

func (h *Hub) clientBroadcastToRoom(room string, msg *Message) {}

func (h *Hub) clientBroadcastRoomUsersSnapshot(room string) {}
