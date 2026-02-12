# Private Meet

Status: in progress.

Private Meet is a lightweight, self-hostable real-time chat + WebRTC meeting app.

- Backend: Go (WebSocket + REST)
- Frontend: React + TypeScript + Vite

## Purpose

Private Meet is designed to provide a secure and frictionless way to connect with others without accounts. The focus is privacy-first defaults and a simple, hackable architecture you can self-host.

## Public Demo

You can try out a live demo of Private Meet at [https://private-meet-76by.onrender.com](https://private-meet-76by.onrender.com).
This demo is hosted on Render.com and may have limitations on usage.
We are not using TURN servers in the demo, so connectivity may vary based on your network conditions.
We are using free instances, so performance may vary.

## Features

- No accounts required — create or join a room instantly.
- Real-time text chat + typing indicators + presence.
- Client-side encrypted chat messages (E2EE) using the Web Crypto API.
   - **E2EE is enabled by choosing a shared passphrase** when joining a room.
   - All participants must use the same passphrase to read each other's messages.
   - The passphrase is never sent to the server (it stays in the browser).
   - If you leave it blank, the app falls back to using the Room ID as the passphrase (convenient, but **not recommended** for security).
- WebRTC mesh for voice, video, and screen sharing.
- Image sharing in chat via WebRTC data channel (images only).
   - Sending is enabled only after WebRTC is connected with all peers in the room.

### Using E2EE (Passphrase)

1. Choose a strong passphrase and share it out-of-band with participants.
2. Join the same Room ID and enter the same passphrase.
3. If the passphrase doesn't match, messages will show as protected and won't decrypt.

Important:

- The passphrase is stored in-memory in the browser. If you refresh the page, open a new tab, or lose state, you may need to re-enter it before joining again.

Limitations (current)

- WebRTC mesh does not scale to large rooms (peer-to-peer connections per participant).
- The mesh is capped (see `webRTCMaxPeerConnections` in `web/src/constants.ts`).
- Without TURN, some NATs will fail to connect.

## Folders

- `server/`: Go API + WebSocket server
- `web/`: React + TypeScript + Vite client
- `cert/`: local dev certificates (optional)

## Requirements

- Go 1.25+
- Node.js + pnpm

## Configuration (.env)

This repo uses a single `.env` at the project root (used by both `server/` and `web/`).

Start from the example:

```bash
cp .env.example .env
```

### Backend variables

- `GO_ENV`: `development` enables permissive WS origin + CORS middleware.
- `USE_LOCAL_TLS`: when `true`, the Go server serves HTTPS using `cert/`.
- `APP_NAME`: used as JWT issuer.
- `SERVER_PORT`: HTTP(S) port the Go server listens on.
- `JWT_SECRET`: HS256 secret for access tokens.
- `JWT_EXPIRATION`: duration string (e.g. `1h`, `30m`).
- `CONTEXT_TIMEOUT`: duration string (e.g. `15s`).
- `ALLOWED_ORIGIN`: used for WS origin checks in non-dev environments.

### Frontend variables (Vite)

- `VITE_HTTP_API_URL`: base URL for REST calls (e.g. `http://localhost:3000`).
- `VITE_WS_API_URL`: base URL for WS calls (e.g. `ws://localhost:3000`).
- `VITE_HAS_TURN_SERVER`: `true`/`false` (enables TURN in the WebRTC ICE config).
- `VITE_TURN_SERVER_URL`, `VITE_TURN_SERVER_USERNAME`, `VITE_TURN_SERVER_CREDENTIAL`: TURN config (used only if `VITE_HAS_TURN_SERVER=true`).

## Install

```bash
make install
```

Make sure you have a root `.env` configured (see the section above) before running the app.

## Running the Application

Run backend:

```bash
make run_server
```

Run frontend:

```bash
make run_web
```

### Local dev TLS / secure context note

- When you're testing from another device on your LAN (not `localhost`), browsers require a **secure context** for things like WebRTC media capture.
- The Vite dev server is configured to use HTTPS with the local certs in `cert/`.
- The Go server can also serve HTTPS when `USE_LOCAL_TLS=true`.

Expect a browser warning for the fake certificate unless you install/trust it.

## Building for Production

```bash
make build
```

Production build output:

- `web/dist/` (static assets)
- `server/bin/server` (Go binary)

The Go server serves the SPA from `web/dist/` at `/`.

## Testing

```bash
make test
```

## API / Protocol (current)

### REST

- `GET /health` → `OK`
- `POST /auth/sign-in` → returns `{ accessToken, tokenType, userId, username }`

### WebSocket

- Endpoint: `GET /ws?token=<jwt>`
- The WS connection requires a valid JWT (issued by `/auth/sign-in`).
- Payloads are JSON messages with shape `{ type, room?, data, from? }`.

#### Chat encryption (E2EE)

- Chat messages (`chat.message`) are sent as an **opaque encrypted envelope** (clients encrypt/decrypt).
- The server does not decrypt messages; it only relays them.
- If a participant joins with a different passphrase, they'll see protected messages that fail to decrypt.

Security note:

- E2EE confidentiality depends on the passphrase being secret and shared out-of-band.
- Using the Room ID as a passphrase makes it possible for anyone who knows/guesses the Room ID to decrypt messages.

Current message types include:

- `chat.join`, `chat.leave`, `chat.message`, `chat.typing`
- `room.users` (server snapshot)
- `utils.generateRoomID`
- `webrtc.offer`, `webrtc.answer`, `webrtc.iceCandidate` (signaling)

See the source-of-truth types in `web/src/protocol/ws.ts`.

## Disable global auto-conversion

```bash
git config --global core.autocrlf false
```

## Current limits (selected)

- Room ID length: up to 128 chars
- Server-side chat limit: 5000 runes
- Client-side UI cap: 1500 chars per message
- WebRTC mesh cap: 8 peer connections per client
- Image sharing limit (client): 12MB per image, sent P2P via RTCDataChannel

## License

This project is licensed under the AGPL-3.0 License.
See the [LICENSE](LICENSE) file for details.
