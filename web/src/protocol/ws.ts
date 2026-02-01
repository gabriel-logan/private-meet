export type RoomUser = {
  userID: string;
  username: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Outgoing (web -> server)
export type WSOutgoingMessage = {
  [K in keyof WSOutgoingArgsByType]: WSOutgoingArgsByType[K] extends undefined
    ? {
        type: K;
        data: Record<string, never>;
      }
    : WSOutgoingArgsByType[K] extends { room: string }
      ? {
          type: K;
          room: WSOutgoingArgsByType[K]["room"];
          data: Omit<WSOutgoingArgsByType[K], "room">;
        }
      : never;
}[keyof WSOutgoingArgsByType];

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
  | { type: "utils.generateRoomID"; data: { roomID: string } };

type WSOutgoingArgsByType = {
  "chat.join": { room: string };
  "chat.leave": { room: string };
  "chat.message": { room: string; message: string };
  "chat.typing": { room: string; typing: boolean };
  "utils.generateRoomID": undefined;
};

export function makeWSMessage<T extends WSOutgoingMessage["type"]>(
  type: T,
  ...args: WSOutgoingArgsByType[T] extends undefined
    ? []
    : [args: WSOutgoingArgsByType[T]]
): Uint8Array {
  const arg = args[0];

  switch (type) {
    case "chat.join":
    case "chat.leave": {
      const room = (arg as { room: string }).room;

      return encoder.encode(
        JSON.stringify({
          type,
          room,
          data: {},
        } satisfies WSOutgoingMessage),
      );
    }

    case "chat.message": {
      const { room, message } = arg as { room: string; message: string };

      return encoder.encode(
        JSON.stringify({
          type,
          room,
          data: {
            message,
          },
        } satisfies WSOutgoingMessage),
      );
    }

    case "chat.typing": {
      const { room, typing } = arg as { room: string; typing: boolean };

      return encoder.encode(
        JSON.stringify({
          type,
          room,
          data: { typing },
        } satisfies WSOutgoingMessage),
      );
    }
    case "utils.generateRoomID":
      return encoder.encode(
        JSON.stringify({ type, data: {} } satisfies WSOutgoingMessage),
      );

    default:
      throw new Error(`Unsupported WS message type: ${String(type)}`);
  }
}

export async function parseIncomingWSMessage(
  raw: ArrayBuffer | Blob | string,
): Promise<WSIncomingMessage> {
  let jsonString: string;

  if (raw instanceof ArrayBuffer) {
    jsonString = decoder.decode(raw);
  } else if (raw instanceof Blob) {
    const arrayBuffer = await raw.arrayBuffer();

    jsonString = decoder.decode(arrayBuffer);
  } else if (typeof raw === "string") {
    jsonString = raw;
  } else {
    throw new TypeError("Unsupported WS message format");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Failed to parse incoming WS message as JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Parsed WS message is not an object.");
  }

  const msg = parsed as { type?: unknown };

  if (typeof msg.type !== "string") {
    throw new TypeError("WS message type is not a string.");
  }

  switch (msg.type) {
    case "general.error":
    case "chat.message":
    case "chat.typing":
    case "room.users":
    case "utils.generateRoomID":
      return parsed as WSIncomingMessage;
    default:
      throw new Error(`Unsupported WS message type: ${String(msg.type)}`);
  }
}
