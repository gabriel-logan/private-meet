import { Button, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function HomePage() {
  const navigation = useNavigation();

  return (
    <View>
      <Text>Home Page</Text>
      <Button
        title="Go to Chat"
        onPress={() => navigation.navigate("Chat", { roomId: "room123" })}
      />
    </View>
  );
}
