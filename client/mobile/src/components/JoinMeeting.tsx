import React from "react";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import Feather from "@react-native-vector-icons/feather";
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

  return (
    <KeyboardAvoidingView
      // eslint-disable-next-line react-native/no-inline-styles
      style={{ width: "100%" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>{t("JoinMeeting.RoomID")}</Text>

          <TextInput
            value={roomId}
            onChangeText={setRoomId}
            placeholder={t("JoinMeeting.EnterRoomID")}
            placeholderTextColor="#71717a"
            maxLength={128}
            style={styles.input}
          />

          <Text style={styles.label}>{t("JoinMeeting.Passphrase")}</Text>

          <TextInput
            value={passphrase ?? ""}
            onChangeText={setPassphrase}
            placeholder={t("JoinMeeting.EnterPassphrase")}
            placeholderTextColor="#71717a"
            secureTextEntry
            maxLength={128}
            style={styles.input}
          />

          <Text style={styles.helper}>
            {t("JoinMeeting.PText1", { maxRoomIDLength })}
          </Text>

          <Text style={styles.helper}>{t("JoinMeeting.PText2")}</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              handleJoinRoom({
                roomId,
                passphrase,
                clearPassphrase,
                navigation,
              })
            }
            style={[styles.button, styles.primaryButton]}
          >
            <Feather name="log-in" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>
              {t("JoinMeeting.JoinRoomButton")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGenerateRoomIdClick}
            style={[styles.button, styles.secondaryButton]}
          >
            <Feather name="shuffle" size={18} color="#fff" />
            <Text style={styles.secondaryButtonText}>
              {t("JoinMeeting.GenerateNewRoomIDButton")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleDeleteUser({ revokeAccessToken })}
            style={[styles.button, styles.dangerButton]}
          >
            <Feather name="trash-2" size={18} color="#f87171" />
            <Text style={styles.dangerButtonText}>
              {t("JoinMeeting.DeleteUserButton")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingBottom: 32,
    gap: 8,
  },

  label: {
    fontSize: 14,
    color: "#d4d4d8",
    marginTop: 6,
  },

  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#09090b",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#f4f4f5",
  },

  helper: {
    fontSize: 12,
    color: "#71717a",
  },

  button: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 10,
  },

  primaryButton: {
    backgroundColor: "#4f46e5",
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  secondaryButton: {
    backgroundColor: "#27272a",
  },

  secondaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  dangerButton: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },

  dangerButtonText: {
    color: "#f87171",
    fontSize: 14,
    fontWeight: "500",
  },
});
