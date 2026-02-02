package ws

import "encoding/json"

type MessageType string

const (
	MessageError MessageType = "general.error"

	MessageChatJoin    MessageType = "chat.join"
	MessageChatLeave   MessageType = "chat.leave"
	MessageChatMessage MessageType = "chat.message"
	MessageChatTyping  MessageType = "chat.typing"

	MessageRoomUsers MessageType = "room.users"

	MessageUtilsGenerateRoomID MessageType = "utils.generateRoomID"

	MessageWebRTCOffer        MessageType = "webrtc.offer"
	MessageWebRTCAnswer       MessageType = "webrtc.answer"
	MessageWebRTCIceCandidate MessageType = "webrtc.iceCandidate"
)

func (t MessageType) IsValid() bool {
	switch t {
	case MessageError,
		MessageChatJoin,
		MessageChatLeave,
		MessageChatMessage,
		MessageChatTyping,
		MessageRoomUsers,
		MessageUtilsGenerateRoomID,
		MessageWebRTCOffer,
		MessageWebRTCAnswer,
		MessageWebRTCIceCandidate:
		return true
	default:
		return false
	}
}

type Message struct {
	Type MessageType     `json:"type"`
	Room string          `json:"room,omitempty"`
	Data json.RawMessage `json:"data"`
	From string          `json:"from,omitempty"`
}

type ChatData struct {
	Message string `json:"message"`
}

type ChatTypingData struct {
	Typing bool `json:"typing"`
}

type RoomUser struct {
	UserID   string `json:"userID"`
	Username string `json:"username"`
}

type RoomUsersData struct {
	Users []RoomUser `json:"users"`
}

type WebRTCOfferData struct {
	SDP string `json:"sdp"`
	To  string `json:"to"`
}

type WebRTCAnswerData struct {
	SDP string `json:"sdp"`
	To  string `json:"to"`
}

type WebRTCIceCandidateData struct {
	Candidate string `json:"candidate"`
	To        string `json:"to"`
}
