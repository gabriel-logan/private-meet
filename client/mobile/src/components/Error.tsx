import { useEffect } from "react";
import { Text, View } from "react-native";

import { debugHandle } from "../../../shared/utils/general";

interface ErrorPageProps {
  message: string;
}

export default function ErrorPage({ message }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    debugHandle("ErrorPage: ", message);
  }, [message]);

  return (
    <View>
      <Text>{message}</Text>
    </View>
  );
}
