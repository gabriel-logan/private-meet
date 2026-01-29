export type locale = "en";

export type WSMessageType =
  | "chat.message"
  | "chat.join"
  | "chat.leave"
  | "utils.generateRoomID";

export type WSMessage = {
  type: WSMessageType;
  room?: string;
  data: unknown;
  from?: string;
};
