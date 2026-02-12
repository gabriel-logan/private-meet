# Private Meet (web)

This is the React + TypeScript + Vite client for Private Meet.

## Requirements

- Node.js + pnpm

## Install

```bash
pnpm install
```

## Environment (.env)

The frontend reads environment variables from the repo root `.env` (see `vite.config.ts` → `envDir: "../../"`).

If you don't have it yet:

```bash
cp ../../.env.example ../../.env
```

On Windows PowerShell:

```powershell
Copy-Item ../../.env.example ../../.env
```

Required:

- `VITE_HTTP_API_URL` (e.g. `http://localhost:3000`)
- `VITE_WS_API_URL` (e.g. `ws://localhost:3000`)

Optional (TURN):

- `VITE_HAS_TURN_SERVER` (`true`/`false`)
- `VITE_TURN_SERVER_URL`, `VITE_TURN_SERVER_USERNAME`, `VITE_TURN_SERVER_CREDENTIAL`

## Run (dev)

Start backend first (separate terminal):

```bash
cd ../../server
go run ./cmd/api/main.go
```

Then run frontend:

```bash
pnpm dev
```

Note: the Vite dev server is configured to run with HTTPS using the local certs in `cert/`. Browsers may warn about the certificate unless you trust it.

## Lint / format

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
```

## Build

```bash
pnpm build
pnpm preview
```

## Notes

- WebRTC connectivity depends on STUN/TURN and network conditions.
- Image sharing in chat uses a WebRTC `RTCDataChannel` (images only).
- Chat messages support E2EE via a shared passphrase (optional).
  - Participants must enter the same passphrase to decrypt messages.
  - The passphrase is kept client-side (not sent to the server).
  - The passphrase is stored in-memory (not persisted). Refreshing the page may require re-entering it.
