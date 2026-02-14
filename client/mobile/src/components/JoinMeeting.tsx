import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

import handleDeleteUser from "../actions/handleDeleteUser";
import handleGenerateRoomIdClick from "../actions/handleGenerateRoomIdClick";
import handleJoinRoom from "../actions/handleJoinRoom";
import { maxRoomIDLength } from "../constants";
import useGenerateRoomID from "../hooks/useGenerateRoomID";
import { useAuthStore } from "../stores/authStore";
import { useSecretStore } from "../stores/secretStore";
import { RootNativeStackScreenProps } from "../types/Navigation";

type Navigation = RootNativeStackScreenProps<"Home">;

export default function JoinMeeting() {
  const { t } = useTranslation();

  const navigation = useNavigation<Navigation["navigation"]>();

  const revokeAccessToken = useAuthStore(s => s.revokeAccessToken);

  const { passphrase, setPassphrase, clearPassphrase } = useSecretStore();

  const { roomId, setRoomId } = useGenerateRoomID();

  return null;
}
