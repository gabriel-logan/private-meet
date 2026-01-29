import { maxMessageChars } from "../constants";

export type AesGcmAlg = "AES-GCM";

export type E2EEEnvelopeV1 = {
  v: 1;
  alg: AesGcmAlg;
  iv: string;
  content: string;
};

export const E2EE_DEFAULTS = {
  // AES-GCM standard IV length
  ivBytes: 12,
  // PBKDF2 work factor (tune based on target devices)
  pbkdf2Iterations: 200000,
  // Salt derived from room id hash
  saltBytes: 16,
  // Keep aligned with UI/server limits (server currently limits chat message size)
  maxPlaintextChars: maxMessageChars,
  // Helps avoid sending messages that will exceed server limits after encoding.
  // (Rough guard; final size depends on base64 and envelope overhead.)
  maxWireChars: 5000,
} as const;

export async function initE2EE(
  passphrase: string,
  saltString: string,
): Promise<CryptoKey> {
  const salt = await saltFromRoom(saltString);

  const key = await deriveKey(passphrase, salt, E2EE_DEFAULTS.pbkdf2Iterations);

  return key;
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);

  return ab;
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = E2EE_DEFAULTS.pbkdf2Iterations,
): Promise<CryptoKey> {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptString(
  plaintext: string,
  key: CryptoKey,
  aad?: Uint8Array,
): Promise<{ iv: string; content: string; alg: AesGcmAlg; v?: 1 }> {
  const ivU8 = crypto.getRandomValues(new Uint8Array(E2EE_DEFAULTS.ivBytes));
  const dataU8 = new TextEncoder().encode(plaintext);

  const cipher = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(ivU8),
      additionalData: aad ? toArrayBuffer(aad) : undefined,
    },
    key,
    toArrayBuffer(dataU8),
  );

  return {
    iv: toB64(ivU8),
    content: toB64(new Uint8Array(cipher)),
    alg: "AES-GCM",
    v: 1,
  };
}

export async function decryptString(
  cipherB64: string,
  ivB64: string,
  key: CryptoKey,
  aad?: Uint8Array,
): Promise<string> {
  const cipherU8 = fromB64(cipherB64);
  const ivU8 = fromB64(ivB64);

  const plain = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(ivU8),
      additionalData: aad ? toArrayBuffer(aad) : undefined,
    },
    key,
    toArrayBuffer(cipherU8),
  );

  return new TextDecoder().decode(plain);
}

const WIRE_PREFIX = "pm:e2ee:";

export function isEncryptedWireMessage(text: string): boolean {
  return text.startsWith(WIRE_PREFIX);
}

export function packEnvelope(envelope: E2EEEnvelopeV1): string {
  return `${WIRE_PREFIX}${JSON.stringify(envelope)}`;
}

export function unpackEnvelope(text: string): E2EEEnvelopeV1 | null {
  if (!isEncryptedWireMessage(text)) return null;

  try {
    const json = text.slice(WIRE_PREFIX.length);
    const parsed = JSON.parse(json) as Partial<E2EEEnvelopeV1>;

    if (parsed.v !== 1) return null;
    if (parsed.alg !== "AES-GCM") return null;
    if (typeof parsed.iv !== "string") return null;
    if (typeof parsed.content !== "string") return null;

    return parsed as E2EEEnvelopeV1;
  } catch {
    return null;
  }
}

export async function encryptTextToWire(
  plaintext: string,
  key: CryptoKey,
  opts: {
    roomId: string;
    userId?: string;
    maxWireChars?: number;
    maxPlaintextChars?: number;
  },
): Promise<string> {
  const maxPlaintextChars =
    opts.maxPlaintextChars ?? E2EE_DEFAULTS.maxPlaintextChars;

  if (Array.from(plaintext).length > maxPlaintextChars) {
    throw new Error("Plaintext message is too long.");
  }

  const aad = aadFrom(opts.roomId, opts.userId);
  const encrypted = await encryptString(plaintext, key, aad);

  const envelope: E2EEEnvelopeV1 = {
    v: 1,
    alg: "AES-GCM",
    iv: encrypted.iv,
    content: encrypted.content,
  };

  const wire = packEnvelope(envelope);
  const maxWireChars = opts.maxWireChars ?? E2EE_DEFAULTS.maxWireChars;
  if (wire.length > maxWireChars) {
    throw new Error("Encrypted message is too large for the wire format.");
  }

  return wire;
}

export async function decryptWireToText(
  wireText: string,
  key: CryptoKey,
  opts: { roomId: string; userId?: string },
): Promise<string | null> {
  const envelope = unpackEnvelope(wireText);
  if (!envelope) return null;

  const aad = aadFrom(opts.roomId, opts.userId);
  return decryptString(envelope.content, envelope.iv, key, aad);
}

export function toB64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;

  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk); // nosonar
  }

  return btoa(binary);
}

export function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);

  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i); // nosonar
  }

  return out;
}

export async function saltFromRoom(roomId: string): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`salt:${roomId}`),
  );

  return new Uint8Array(hash).slice(0, E2EE_DEFAULTS.saltBytes);
}

export function aadFrom(roomId: string, userId?: string): Uint8Array {
  return new TextEncoder().encode(`${roomId}|${userId ?? ""}`);
}
