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
  | { type: "utils.generateRoomID"; data: { roomID: string } }
  | {
      type: "webrtc.offer";
      room: string;
      from?: string;
      data: { sdp: string; to: string };
    }
  | {
      type: "webrtc.answer";
      room: string;
      from?: string;
      data: { sdp: string; to: string };
    }
  | {
      type: "webrtc.iceCandidate";
      room: string;
      from?: string;
      data: { candidate: string; to: string };
    };

type WSOutgoingArgsByType = {
  "chat.join": { room: string };
  "chat.leave": { room: string };
  "chat.message": { room: string; message: string };
  "chat.typing": { room: string; typing: boolean };
  "utils.generateRoomID": undefined;
  "webrtc.offer": { room: string; sdp: string; to: string };
  "webrtc.answer": { room: string; sdp: string; to: string };
  "webrtc.iceCandidate": { room: string; candidate: string; to: string };
};

export function mountWSPayload(msg: WSOutgoingMessage): Uint8Array {
  return encoder.encode(JSON.stringify(msg satisfies WSOutgoingMessage));
}

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

      return mountWSPayload({
        type,
        room,
        data: {},
      });
    }

    case "chat.message": {
      const { room, message } = arg as { room: string; message: string };

      return mountWSPayload({
        type,
        room,
        data: { message },
      });
    }

    case "chat.typing": {
      const { room, typing } = arg as { room: string; typing: boolean };

      return mountWSPayload({
        type,
        room,
        data: { typing },
      });
    }
    case "utils.generateRoomID":
      return mountWSPayload({
        type,
        data: {},
      });

    case "webrtc.offer":
    case "webrtc.answer": {
      const { room, sdp, to } = arg as {
        room: string;
        sdp: string;
        to: string;
      };

      return mountWSPayload({
        type,
        room,
        data: { sdp, to },
      });
    }

    case "webrtc.iceCandidate": {
      const { room, candidate, to } = arg as {
        room: string;
        candidate: string;
        to: string;
      };

      return mountWSPayload({
        type,
        room,
        data: { candidate, to },
      });
    }

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

  const { type } = parsed as { type?: unknown };

  if (typeof type !== "string") {
    throw new TypeError("WS message type is not a string.");
  }

  const correctType = type as WSIncomingMessage["type"];

  switch (correctType) {
    case "general.error":
    case "chat.message":
    case "chat.typing":
    case "room.users":
    case "utils.generateRoomID":
    case "webrtc.offer":
    case "webrtc.answer":
    case "webrtc.iceCandidate":
      return parsed as WSIncomingMessage;
    default:
      throw new Error(`Unsupported WS message type: ${String(type)}`);
  }
}
