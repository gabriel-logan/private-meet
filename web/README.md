# Private Meet (web)

This is the React + TypeScript + Vite client for Private Meet.

## Requirements

- Node.js + pnpm

## Install

```bash
pnpm install
```

## Run (dev)

```bash
pnpm dev
```

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
