import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ChatPage from "../pages/Chat";
import HomePage from "../pages/Home";
import type { RootNativeStackParamList } from "../types/Navigation";

const Stack = createNativeStackNavigator<RootNativeStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomePage} />
      <Stack.Screen name="Chat" component={ChatPage} />
    </Stack.Navigator>
  );
}
