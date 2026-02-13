import { Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { RootNativeStackScreenProps } from "../types/Navigation";

export default function ChatPage() {
  const { params } = useRoute<RootNativeStackScreenProps<"Chat">["route"]>();

  const { roomId } = params;

  return (
    <View>
      <Text>Chat Page for Room: {roomId}</Text>
    </View>
  );
}
