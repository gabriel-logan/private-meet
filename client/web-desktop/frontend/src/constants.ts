import de from "./utils/locales/de.json";
import en from "./utils/locales/en.json";
import ja from "./utils/locales/ja.json";
import pt from "./utils/locales/pt.json";
import zh from "./utils/locales/zh.json";

// i18n resources
export const resources = {
  en: { translation: en },
  de: { translation: de },
  ja: { translation: ja },
  pt: { translation: pt },
  zh: { translation: zh },
} as const;

// Storage keys and prefixes
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

export const isDesktop = !!(window as unknown as { go: unknown }).go;
