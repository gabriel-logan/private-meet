import "./src/utils/i18n";

import { NavigationContainer } from "@react-navigation/native";

import RootStack from "./src/routes/RootStack";

function App() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}

export default App;
