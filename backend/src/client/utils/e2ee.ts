export type AesGcmAlg = "AES-GCM";

let cachedKey: CryptoKey | undefined;

export async function initE2EE(
  passphrase: string,
  saltString: string,
): Promise<CryptoKey> {
  const salt = await saltFromRoom(saltString);
  const key = await deriveKey(passphrase, salt);

  setCachedKey(key);

  return key;
}

export function clearCachedKey(): void {
  cachedKey = undefined;
}

export function setCachedKey(key: CryptoKey): void {
  cachedKey = key;
}

export function getCachedKey(): CryptoKey | undefined {
  return cachedKey;
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);

  return ab;
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = 200000,
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
): Promise<{ iv: string; content: string; alg: AesGcmAlg }> {
  const ivU8 = crypto.getRandomValues(new Uint8Array(12));
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

export function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);

  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }

  return out;
}

export async function saltFromRoom(roomId: string): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`salt:${roomId}`),
  );

  return new Uint8Array(hash).slice(0, 16);
}

export function aadFrom(roomId: string, userId?: string): Uint8Array {
  return new TextEncoder().encode(`${roomId}|${userId ?? ""}`);
}
