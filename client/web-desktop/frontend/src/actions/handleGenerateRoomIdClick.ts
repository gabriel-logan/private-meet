import { toast } from "react-toastify";

import { getWSInstance } from "../lib/wsInstance";
import { makeWSMessage } from "../protocol/ws";

export default function handleGenerateRoomIdClick() {
  try {
    const ws = getWSInstance();

    ws.send(makeWSMessage("utils.generateRoomID"));
  } catch (error) {
    console.error("Error generating Room ID:", error);
    toast.error("Not connected yet. Try again in a second.");
  }
}
