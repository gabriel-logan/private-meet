import type { Socket } from "socket.io-client";

type Io = (opts?: unknown) => Socket;

declare const io: Io;

const socket = io();

socket.on("connect", () => {
  // eslint-disable-next-line no-console
  console.log("Connected to server - TESTE");
});
