import { io, Socket } from "socket.io-client";

const baseURL = import.meta.env.VITE_SOCKET_API_URL as string;

let socket: Socket | null = null;

export function initSocket(token?: string): Socket {
  if (socket) {
    return socket;
  }

  socket = io(baseURL, {
    auth: { token },
  });

  return socket;
}

export function updateSocketToken(token: string) {
  if (!socket) {
    return initSocket(token);
  }

  socket.auth = { token };
  socket.disconnect().connect();
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
