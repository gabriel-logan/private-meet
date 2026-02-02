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
   - Note: the current key is derived from the room id (simple/dev approach).
- WebRTC mesh for voice, video, and screen sharing.
- Image sharing in chat via WebRTC data channel (images only).
   - Sending is enabled only after WebRTC is connected with all peers in the room.

Limitations (current)

- WebRTC mesh does not scale to large rooms (peer-to-peer connections per participant).
- The mesh is capped (see `MAX_PEER_CONNECTIONS` in the web client).
- Without TURN, some NATs will fail to connect.

## Folders

- `server/`: Go API + WebSocket server
- `web/`: React + TypeScript + Vite client
- `cert/`: local dev certificates (optional)

## Requirements

- Go 1.25+
- Node.js + pnpm

## Install

```bash
make install
```

## Running the Application

Run backend:

```bash
make run_server
```

Run frontend:

```bash
make run_web
```

## Building for Production

```bash
make build
```

## Testing

```bash
make test
```

## License

This project is licensed under the AGPL-3.0 License.
See the [LICENSE](LICENSE) file for details.
