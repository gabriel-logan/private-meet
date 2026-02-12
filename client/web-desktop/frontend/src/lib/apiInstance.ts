import axios, { type AxiosAdapter } from "axios";

import { HttpGet, HttpPost } from "../../wailsjs/go/main/App";
import { main } from "../../wailsjs/go/models";
import { isDesktop } from "../constants";

const baseURL = import.meta.env.VITE_HTTP_API_URL as string;

function safeParse(data: string) {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

const desktopAdapter: AxiosAdapter = async (config) => {
  const method = config.method?.toLowerCase();

  const fullUrl = (config.baseURL || "") + (config.url || "");

  const headers: Record<string, string> = {};

  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers[key] = value;
      }
    });
  }

  let rawResponse: main.HttpResponse;

  switch (method) {
    case "get": {
      rawResponse = await HttpGet(fullUrl, headers);

      break;
    }

    case "post": {
      const body =
        typeof config.data === "string"
          ? config.data
          : JSON.stringify(config.data ?? {});

      rawResponse = await HttpPost(fullUrl, body, headers);

      break;
    }

    default: {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  return {
    data: safeParse(rawResponse.body),
    status: rawResponse.status,
    statusText: rawResponse.statusText,
    headers: headers,
    config,
  };
};

const apiInstance = axios.create({
  baseURL,
  adapter: isDesktop ? desktopAdapter : undefined,
});

export default apiInstance;
