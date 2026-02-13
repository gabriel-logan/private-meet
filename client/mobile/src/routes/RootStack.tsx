import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomePage from "../pages/Home";
import type { RootNativeStackParamList } from "../types/Navigation";

const Stack = createNativeStackNavigator<RootNativeStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomePage} />
    </Stack.Navigator>
  );
}
