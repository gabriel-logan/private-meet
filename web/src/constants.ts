export const userStorageKey = "private-meet-user-storage-key";
export const maxMessageChars = 1500;
export const roomIDPrefix = __ROOM_ID_PREFIX__;
export const maxRoomIDLength = 128 - roomIDPrefix.length;

// Chat / uploads
export const chatMaxImageBytes = 8 * 1024 * 1024; // 8MB

// WebRTC
export const webRTCMaxPeerConnections = 8;
export const webRTCFileChannelLabel = "pm-files";
export const webRTCImageChunkSizeBytes = 16 * 1024; // 16KB
export const webRTCFileChannelMaxBufferedAmountBytes = 2 * 1024 * 1024; // 2MB
