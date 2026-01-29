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
)

func (t MessageType) IsValid() bool {
	switch t {
	case MessageError,
		MessageChatJoin,
		MessageChatLeave,
		MessageChatMessage,
		MessageChatTyping,
		MessageRoomUsers,
		MessageUtilsGenerateRoomID:
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

type ChatPayload struct {
	Message string `json:"message"`
}

type ChatTypingPayload struct {
	Typing bool `json:"typing"`
}

type RoomUser struct {
	UserID   string `json:"userID"`
	Username string `json:"username"`
}

type RoomUsersPayload struct {
	Users []RoomUser `json:"users"`
}
