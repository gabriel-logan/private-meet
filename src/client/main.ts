import type { Socket } from "socket.io-client";

type Io = (opts?: unknown) => Socket;

declare const io: Io;

const socket = io();

socket.on("connect", () => {
  console.log("Connected to server");
});
