# Learning Resources for Private Meet

This document provides a curated list of resources to help you learn and understand the technologies used in Private Meet.

Current stack (high level): Go + WebSocket/WebRTC signaling (server), React + TypeScript + Vite (web).

## Go

- [The Go Programming Language (Tour)](https://go.dev/tour/)
- [Effective Go](https://go.dev/doc/effective_go)
- [net/http package](https://pkg.go.dev/net/http)

## WebSockets

- [MDN: WebSockets API](https://developer.mozilla.org/docs/Web/API/WebSockets_API)
- [gorilla/websocket](https://github.com/gorilla/websocket)

## WebRTC

- [WebRTC (webrtc.org)](https://webrtc.org/)
- [MDN: WebRTC API](https://developer.mozilla.org/docs/Web/API/WebRTC_API)
- [MDN: RTCPeerConnection](https://developer.mozilla.org/docs/Web/API/RTCPeerConnection)
- [MDN: RTCDataChannel](https://developer.mozilla.org/docs/Web/API/RTCDataChannel)
- [MDN: ICE (candidates, STUN, TURN)](https://developer.mozilla.org/docs/Web/API/WebRTC_API/Connectivity)

## Client-side crypto (E2EE)

- [MDN: Web Crypto API](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API)
- [AES-GCM (MDN)](https://developer.mozilla.org/docs/Web/API/SubtleCrypto/encrypt)
- [PBKDF2 (MDN)](https://developer.mozilla.org/docs/Web/API/SubtleCrypto/deriveKey)

Notes (Private Meet):

- Chat E2EE is **passphrase-based**: participants enter the same passphrase when joining a room.
- The passphrase is never sent to the server; a key is derived locally in the browser.
- The passphrase is stored in-memory (not persisted across refresh by default).
- If a user joins with the wrong passphrase, they can still connect, but they won't be able to decrypt protected messages.

## React + TypeScript + Vite

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Vite Guide](https://vite.dev/guide/)

## Routing

- [React Router docs](https://reactrouter.com/)

## Styling

- [Tailwind CSS docs](https://tailwindcss.com/docs)

## State management

- [Zustand docs](https://zustand-demo.pmnd.rs/)

## i18n

- [i18next](https://www.i18next.com/)
- [react-i18next](https://react.i18next.com/)

## Testing

- [Vitest](https://vitest.dev/)
- [Testing Library (React)](https://testing-library.com/docs/react-testing-library/intro/)

## Deployment (current)

- [Render docs](https://render.com/docs)

## Architecture notes

- Private Meet uses WebSocket for room events (presence/typing/chat) and WebRTC signaling.
- Media (voice/video/screen share) flows peer-to-peer via WebRTC.
- Images in chat are transferred peer-to-peer via an RTCDataChannel (images only).
- Chat text is end-to-end encrypted when participants use the same passphrase.

## Presentation

Most communication apps today require accounts, collect metadata, or limit user control. Whether you are an individual, a small group, or a large community, there is a clear need for a **secure and frictionless way to connect**.

The goal was to design a platform that anyone can use — without registration — while ensuring **end-to-end confidentiality, structured access control, and transparent technology** that users can fully trust.

That’s why we built **Private Meet**, a real-time communication platform powered by **Go + WebSockets + WebRTC**, with a **React** web client. With Private Meet you get:

- **No accounts required** — create or join a room instantly.
- **Flexible room identifiers** — define IDs with **1 to 128 characters**, or generate unguessable ones via **UUID v4**.
- **Client-side encrypted chat** (E2EE) for private messaging.
- **WebRTC-based voice, video, and screen sharing**, with low latency and peer-to-peer security.
- **Image sharing** via WebRTC data channels (images only).
- **Open source freedom** — anyone can clone, self-host, and redeploy Private Meet on their own infrastructure.

**Private Meet** makes private communication available to everyone. It is **simple, secure, and transparent by design** — giving users complete control over how and where they connect, whether it’s one-on-one, in a group, or at scale.
