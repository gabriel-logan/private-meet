import { makeWSMessage } from "../../../shared/protocol/ws";
import { getWSInstance } from "../lib/wsInstance";

export default function handleGenerateRoomIdClick() {
  try {
    const ws = getWSInstance();

    ws.send(makeWSMessage("utils.generateRoomID"));
  } catch (error) {
    console.error("Error generating Room ID:", error);
  }
}
