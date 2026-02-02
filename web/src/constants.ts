export const createPrefix = (length: number): string => {
  const n = Math.trunc(Math.random() * 10 ** length);
  return n.toString().padStart(length, "0");
};

export const userStorageKey = "private-meet-user-storage-key";
export const maxMessageChars = 1500;
export const roomIDPrefix = createPrefix(4) + ":";
export const maxRoomIDLength = 128 - roomIDPrefix.length;

// Chat / uploads
export const chatMaxImageBytes = 8 * 1024 * 1024; // 8MB

// WebRTC
export const webRTCMaxPeerConnections = 8;
export const webRTCFileChannelLabel = "pm-files";
export const webRTCImageChunkSizeBytes = 16 * 1024; // 16KB
export const webRTCFileChannelMaxBufferedAmountBytes = 2 * 1024 * 1024; // 2MB

// E2EE
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

  WIRE_PREFIX: createPrefix(7) + ":",
} as const;
