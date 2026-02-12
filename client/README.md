# Private Meet Desktop (Wails)

This directory contains the desktop app for Private Meet, built with Wails + React (frontend in `client/frontend`).

## Development

From this folder:

```bash
wails dev
```

## Build

From this folder:

```bash
wails build
```

Build Windows installer (`.exe`):

```bash
wails build -nsis -clean -race
```

Distribution files are generated under `../distribution/windows/`.

## Configuration

- Wails app settings: `wails.json`
- Frontend env variables are read from the repo root `.env` via `client/frontend/vite.config.ts`.
- Make sure the backend is running and reachable by `VITE_HTTP_API_URL` and `VITE_WS_API_URL`.

For Wails configuration details:
https://wails.io/docs/reference/project-config
