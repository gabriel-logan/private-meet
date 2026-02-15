import { AppRegistry } from "react-native";
import { install } from "react-native-quick-crypto";
import { registerGlobals } from "react-native-webrtc";

import App from "./App";
import { name as appName } from "./app.json";

import "react-native-get-random-values";

install();

registerGlobals();

AppRegistry.registerComponent(appName, () => App);
