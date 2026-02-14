declare module "@env" {
  export const ROOM_ID_PREFIX: string;
  export const E2EE_WIRE_PREFIX: string;
  export const WEBRTC_FILE_CHANNEL_LABEL: string;
  export const VITE_HTTP_API_URL: string;
  export const VITE_WS_API_URL: string;
  export const VITE_HAS_TURN_SERVER: string;
  export const VITE_TURN_SERVER_URL: string;
  export const VITE_TURN_SERVER_USERNAME: string;
  export const VITE_TURN_SERVER_CREDENTIAL: string;
}

declare class TextEncoder {
  encode(input?: string): Uint8Array;
}

declare class TextDecoder {
  decode(input: ArrayBuffer): string;
}

declare interface Blob {
  arrayBuffer(): Promise<ArrayBuffer>;
}

declare const atob: (input: string) => string;
declare const btoa: (input: string) => string;

declare const queueMicrotask: (callback: () => void) => void;

declare type CryptoKey = any;
declare type MessageEvent = any;
