export type Locale = "en" | "de" | "ja" | "pt" | "zh";

export type IncomingFileTransferProgress = {
  peerID: string;
  id: string;
  name: string;
  mime: string;
  size: number;
  receivedBytes: number;
};
