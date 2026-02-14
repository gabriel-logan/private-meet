import { VITE_WS_API_URL } from "@env";

let ws: WebSocket | null = null;
let connectionVersion = 0;

function buildURL(token?: string) {
  const url = new URL(VITE_WS_API_URL + "/ws");

  if (token) {
    url.searchParams.append("token", token);
  }

  return url.toString();
}

export function initWSInstance(
  token?: string,
  maxRetries = 10,
  retryDelay = 1000,
): Promise<WebSocket> {
  const myVersion = ++connectionVersion;
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const connect = () => {
      if (myVersion !== connectionVersion) {
        return;
      }

      attempts++;

      const url = buildURL(token);

      const socket = new WebSocket(url);

      ws = socket;

      socket.onopen = () => {
        // eslint-disable-next-line no-console
        console.log("WebSocket connection established");

        if (myVersion !== connectionVersion) {
          socket.close();
          return;
        }

        resolve(socket);
      };

      socket.onerror = () => {
        // eslint-disable-next-line no-console
        console.error("WebSocket connection error");

        if (myVersion !== connectionVersion) {
          return;
        }

        socket.close();
      };

      socket.onclose = () => {
        // eslint-disable-next-line no-console
        console.log("WebSocket connection closed");

        if (myVersion !== connectionVersion) {
          return;
        }

        if (attempts >= maxRetries) {
          if (ws === socket) {
            ws = null;
          }

          reject(new Error("WebSocket connection failed"));

          return;
        }

        setTimeout(() => {
          if (myVersion !== connectionVersion) {
            return;
          }

          connect();
        }, retryDelay);
      };
    };

    connect();
  });
}

export function updateWSInstanceToken(token: string): Promise<WebSocket> {
  closeWSInstance();
  return initWSInstance(token);
}

export function getWSInstance(): WebSocket {
  if (!ws) {
    throw new Error("WebSocket instance is not initialized.");
  }

  return ws;
}

export function closeWSInstance() {
  connectionVersion++;

  if (!ws) return;

  const socket = ws;
  ws = null;

  socket.onopen = null;
  socket.onclose = null;
  socket.onerror = null;
  socket.onmessage = null;

  if (
    socket.readyState === WebSocket.OPEN ||
    socket.readyState === WebSocket.CONNECTING
  ) {
    socket.close();
  }
}
