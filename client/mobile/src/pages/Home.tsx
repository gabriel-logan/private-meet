import { useTranslation } from "react-i18next";
import { Button, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function HomePage() {
  const { t } = useTranslation();

  const navigation = useNavigation();

  return (
    <View>
      <Text>{t("Hello, world!")}</Text>
      <Button
        title="Go to Chat"
        onPress={() => navigation.navigate("Chat", { roomId: "room123" })}
      />
    </View>
  );
}
