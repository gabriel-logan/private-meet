export type WSType =
  | "chat.join"
  | "chat.leave"
  | "chat.message"
  | "chat.typing"
  | "room.users"
  | "utils.generateRoomID";

export type RoomUser = {
  userID: string;
  username: string;
};

// Outgoing (web -> server)
export type WSOutgoingMessage =
  | { type: "chat.join"; room: string; data: Record<string, never> }
  | { type: "chat.leave"; room: string; data: Record<string, never> }
  | { type: "chat.message"; room: string; data: { message: string } }
  | { type: "chat.typing"; room: string; data: { typing: boolean } }
  | { type: "utils.generateRoomID"; data: Record<string, never> };

// Incoming (server -> web)
export type WSIncomingMessage =
  | {
      type: "chat.message";
      room: string;
      from?: string;
      data: { message: string };
    }
  | {
      type: "chat.typing";
      room: string;
      from?: string;
      data: { typing: boolean };
    }
  | { type: "room.users"; room: string; data: { users: RoomUser[] } }
  | { type: "utils.generateRoomID"; data: { roomID?: string } };

export type WSMessage = WSIncomingMessage | WSOutgoingMessage;

export function makeWSMessage(
  type: "chat.join",
  args: { room: string },
): string;
export function makeWSMessage(
  type: "chat.leave",
  args: { room: string },
): string;
export function makeWSMessage(
  type: "chat.message",
  args: { room: string; message: string },
): string;
export function makeWSMessage(
  type: "chat.typing",
  args: { room: string; typing: boolean },
): string;
export function makeWSMessage(type: "utils.generateRoomID"): string;
export function makeWSMessage(type: WSType, args?: unknown): string {
  switch (type) {
    case "chat.join":
    case "chat.leave": {
      return JSON.stringify({
        type,
        room: (args as { room: string }).room,
        data: {},
      } satisfies WSOutgoingMessage);
    }

    case "chat.message":
      return JSON.stringify({
        type,
        room: (args as { room: string; message: string }).room,
        data: { message: (args as { room: string; message: string }).message },
      } satisfies WSOutgoingMessage);

    case "chat.typing":
      return JSON.stringify({
        type,
        room: (args as { room: string; typing: boolean }).room,
        data: { typing: (args as { room: string; typing: boolean }).typing },
      } satisfies WSOutgoingMessage);

    case "utils.generateRoomID":
      return JSON.stringify({ type, data: {} } satisfies WSOutgoingMessage);

    default:
      throw new Error(`Unsupported WS message type: ${String(type)}`);
  }
}

export function parseIncomingWSMessage(raw: string): WSIncomingMessage | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const msg = parsed as { type?: unknown };

  if (typeof msg.type !== "string") {
    return null;
  }

  switch (msg.type) {
    case "chat.message":
    case "chat.typing":
    case "room.users":
    case "utils.generateRoomID":
      return parsed as WSIncomingMessage;
    default:
      return null;
  }
}
