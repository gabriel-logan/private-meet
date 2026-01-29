export type WSType =
  | "general.error"
  | "chat.join"
  | "chat.leave"
  | "chat.message"
  | "chat.typing"
  | "room.users"
  | "utils.generateRoomID";

export type WSOutgoingType =
  | "chat.join"
  | "chat.leave"
  | "chat.message"
  | "chat.typing"
  | "utils.generateRoomID";

export type WSIncomingType =
  | "general.error"
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
  | { type: "general.error"; data: { error: string } }
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

type WSOutgoingArgsByType = {
  "chat.join": { room: string };
  "chat.leave": { room: string };
  "chat.message": { room: string; message: string };
  "chat.typing": { room: string; typing: boolean };
  "utils.generateRoomID": undefined;
};

export function makeWSMessage<T extends WSOutgoingType>(
  type: T,
  ...args: WSOutgoingArgsByType[T] extends undefined
    ? []
    : [args: WSOutgoingArgsByType[T]]
): string {
  const arg = args[0];

  switch (type) {
    case "chat.join":
    case "chat.leave": {
      return JSON.stringify({
        type,
        room: (arg as { room: string }).room,
        data: {},
      } satisfies WSOutgoingMessage);
    }

    case "chat.message":
      return JSON.stringify({
        type,
        room: (arg as { room: string; message: string }).room,
        data: {
          message: (arg as { room: string; message: string }).message,
        },
      } satisfies WSOutgoingMessage);

    case "chat.typing":
      return JSON.stringify({
        type,
        room: (arg as { room: string; typing: boolean }).room,
        data: { typing: (arg as { room: string; typing: boolean }).typing },
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
    case "general.error":
    case "chat.message":
    case "chat.typing":
    case "room.users":
    case "utils.generateRoomID":
      return parsed as WSIncomingMessage;
    default:
      return null;
  }
}
