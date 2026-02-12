import type { NavigateFunction } from "react-router";
import { toast } from "react-toastify";
import { t } from "i18next";

import { maxRoomIDLength } from "../constants";

interface HandleJoinRoomParams {
  roomId: string;
  passphrase: string | null;
  clearPassphrase: () => void;
  navigate: NavigateFunction;
}

export default function handleJoinRoom({
  roomId,
  passphrase,
  clearPassphrase,
  navigate,
}: HandleJoinRoomParams) {
  const normalized = roomId.trim();

  if (!normalized) {
    toast.error(t("Errors.PleaseEnterRoomID"));
    return;
  }

  if (normalized.length > maxRoomIDLength) {
    toast.error(t("Errors.RoomIDIsTooLong", { maxRoomIDLength }));
    return;
  }

  if (!passphrase) {
    clearPassphrase();
  }

  navigate(`/chat?room=${encodeURIComponent(normalized)}`);
}
