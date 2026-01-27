let ws: WebSocket | null = null;

const baseURL = import.meta.env.VITE_WS_API_URL as string;

function buildURL(token?: string) {
  const url = new URL(baseURL);

  url.protocol = url.protocol.replace("http", "ws");

  url.pathname = "/ws";

  if (token) {
    url.searchParams.append("token", token);
  }

  return url.toString();
}

export function initWSInstance(token?: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    if (ws) {
      return resolve(ws);
    }

    const url = buildURL(token);

    ws = new WebSocket(url);

    ws.onopen = () => {
      resolve(ws as WebSocket);
    };

    ws.onerror = (event) => {
      reject(new Error(event.type));
    };
  });
}

export function updateWSInstanceToken(token: string): Promise<WebSocket> {
  if (!ws) {
    return initWSInstance(token);
  }

  if (
    ws.readyState === WebSocket.OPEN ||
    ws.readyState === WebSocket.CONNECTING
  ) {
    ws.close();
  }

  ws = null;

  return initWSInstance(token);
}

export function getWSInstance(): WebSocket {
  if (!ws) {
    throw new Error("WebSocket instance is not initialized.");
  }

  return ws;
}

export function closeWSInstance() {
  if (ws) {
    ws.close();
    ws = null;
  }
}
