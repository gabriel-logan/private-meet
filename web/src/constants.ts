export const userStorageKey = __USER_STORAGE_KEY__;
export const maxMessageChars = 1500;
export const roomIDPrefix = __ROOM_ID_PREFIX__;
export const maxRoomIDLength = 128 - roomIDPrefix.length;

// Chat / uploads
export const chatMaxImageBytes = 12 * 1024 * 1024; // 12MB

// WebRTC
export const webRTCMaxPeerConnections = 8;
export const webRTCFileChannelLabel = __WEBRTC_FILE_CHANNEL_LABEL__;
export const webRTCImageChunkSizeBytes = 16 * 1024; // 16KB
export const webRTCFileChannelMaxBufferedAmountBytes = 2 * 1024 * 1024; // 2MB
