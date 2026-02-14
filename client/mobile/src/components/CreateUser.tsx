import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@react-native-vector-icons/feather";

import handleCreateUser from "../actions/handleCreateUser";
import { useAuthStore } from "../stores/authStore";

export default function CreateUser() {
  const { t } = useTranslation();

  const setAccessToken = useAuthStore(s => s.setAccessToken);

  const [username, setUsername] = useState("");

  function handleSubmit() {
    if (!username.trim()) {
      return;
    }

    handleCreateUser({
      username,
      setUsername,
      setAccessToken,
    });
  }

  return (
    <View style={styles.form}>
      <Text style={styles.label}>{t("Username")}</Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder={t("EnterYourUsername")}
        placeholderTextColor="#71717a"
        style={styles.input}
      />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSubmit}
        style={styles.button}
      >
        <Feather name="user" size={18} color="#fff" />
        <Text style={styles.buttonText}>{t("CreateUser")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    gap: 16,
  },

  label: {
    fontSize: 14,
    color: "#d4d4d8",
  },

  input: {
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#09090b",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#f4f4f5",
  },

  button: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
});
