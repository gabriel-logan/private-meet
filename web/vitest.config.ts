import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __ROOM_ID_PREFIX__: JSON.stringify("test:"),
    __E2EE_WIRE_PREFIX__: JSON.stringify("test:"),
    __WEBRTC_FILE_CHANNEL_LABEL__: JSON.stringify("test:"),
    __USER_STORAGE_KEY__: JSON.stringify("test:"),
  },

  test: {
    globals: true,
    environment: "jsdom",
  },
});
