/* eslint-disable @typescript-eslint/no-unused-vars */

import { Alert } from "react-native";

const toast = {
  success: (message: string, options?: { autoClose?: number }) => {
    Alert.alert("Success", message, [{ text: "OK" }], { cancelable: true });
  },

  error: (message: string, options?: { autoClose?: number }) => {
    Alert.alert("Error", message, [{ text: "OK" }], { cancelable: true });
  },

  info: (message: string, options?: { autoClose?: number }) => {
    Alert.alert("Info", message, [{ text: "OK" }], { cancelable: true });
  },

  warning: (message: string, options?: { autoClose?: number }) => {
    Alert.alert("Warning", message, [{ text: "OK" }], { cancelable: true });
  },

  warn: (message: string, options?: { autoClose?: number }) => {
    Alert.alert("Warn", message, [{ text: "OK" }], { cancelable: true });
  },
};

export default toast;
