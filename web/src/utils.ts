import axios from "axios";

import { roomIDPrefix } from "./constants";

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export default function getAxiosErrorMessage(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again.",
): string {
  console.error("Error occurred:", error);

  if (axios.isAxiosError<string>(error)) {
    const axiosError = error;

    if (axiosError.response && isString(axiosError.response.data)) {
      return axiosError.response.data;
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  return fallbackMessage;
}

export function base64UrlDecode(input: string): string {
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/");

  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  return atob(padded);
}

export function normalizeRoomId(roomId: string) {
  return `${roomIDPrefix}${roomId}`;
}

export function getTimeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isSafeUrl(url: string) {
  try {
    const u = new URL(url);

    return u.protocol === "blob:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
