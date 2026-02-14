import { maxRoomIDLength } from "../constants";
import { RootNativeStackScreenProps } from "../types/Navigation";

interface HandleJoinRoomParams {
  roomId: string;
  passphrase: string | null;
  clearPassphrase: () => void;
  navigation: RootNativeStackScreenProps<"Home">["navigation"];
}

export default function handleJoinRoom({
  roomId,
  passphrase,
  clearPassphrase,
  navigation,
}: HandleJoinRoomParams) {
  const normalized = roomId.trim();

  if (!normalized) {
    return;
  }

  if (normalized.length > maxRoomIDLength) {
    return;
  }

  if (!passphrase) {
    clearPassphrase();
  }

  navigation.navigate("Chat", { roomId: normalized });
}
