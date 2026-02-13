import { toast } from "react-toastify";
import axios from "axios";

import { debugHandle, isString } from "../../../../shared/utils/general";
import { roomIDPrefix } from "../constants";

export default function getAxiosErrorMessage(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again.",
): string {
  debugHandle("Error occurred:", error);

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

export function normalizeRoomId(roomId: string) {
  return `${roomIDPrefix}${roomId}`;
}

export function hasVideo(stream: MediaStream | null | undefined): boolean {
  return Boolean(stream && stream.getVideoTracks().length > 0);
}

export async function handleCopyRoomId(rawRoomId: string) {
  if (!rawRoomId.trim()) {
    return;
  }

  try {
    await navigator.clipboard.writeText(rawRoomId);

    toast.success("Room ID copied!");
  } catch (error) {
    debugHandle("Failed to copy room id:", error);
    toast.error("Failed to copy room ID.");
  }
}
