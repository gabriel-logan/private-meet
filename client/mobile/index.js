import { AppRegistry } from "react-native";
import { registerGlobals } from "react-native-webrtc";

import App from "./App";
import { name as appName } from "./app.json";

registerGlobals();

AppRegistry.registerComponent(appName, () => App);
