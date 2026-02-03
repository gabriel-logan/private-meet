# WebRTC Connection Flow — Step by Step Documentation

## Overview

WebRTC establishes a **direct, secure, peer-to-peer connection** between two endpoints.
Signaling is required only to exchange metadata (SDP and ICE candidates).
Media and data flow directly between peers.

## Private Meet specifics (source-of-truth)

In Private Meet, signaling is done over **WebSocket** (`GET /ws?token=<jwt>`), and the signaling payloads are JSON messages with the shape:

```ts
{ type: string; room?: string; data: unknown; from?: string }
```

WebRTC signaling message types used by the app:

- `webrtc.offer` → `data: { sdp: string, to: string }`
- `webrtc.answer` → `data: { sdp: string, to: string }`
- `webrtc.iceCandidate` → `data: { candidate: string, to: string }`

Notes:

- Private Meet uses a **mesh** topology (peer-to-peer connections between participants). This does not scale to large rooms.
- TURN support is optional and configured in the web client via `VITE_HAS_TURN_SERVER` + `VITE_TURN_SERVER_*`.
- The server currently relays signaling and room events; media flows peer-to-peer.

1. The application starts
2. A peer decides to initiate a connection
3. An `RTCPeerConnection` is created
4. Local media (audio/video or data channel) is obtained
5. The media is associated with the `RTCPeerConnection`
6. The peer creates an **offer** (`createOffer`)
7. The offer is set as `localDescription`
8. The offer is sent via signaling
9. The remote peer receives the offer
10. The received offer is set as `remoteDescription`
11. The remote peer creates an **answer** (`createAnswer`)
12. The answer is set as `localDescription`
13. The answer is sent via signaling
14. The initiating peer receives the answer
15. The received answer is set as `remoteDescription`
16. The ICE candidate gathering process begins
17. An ICE candidate is found
18. The ICE candidate is sent via signaling
19. The remote peer receives the ICE candidate
20. The ICE candidate is added to the `RTCPeerConnection`
21. Steps 17–20 repeat until no more candidates are found
22. ICE finds a valid transport pair
23. The transport channel is established
24. The DTLS handshake occurs
25. SRTP keys are negotiated
26. The connection changes to **connected** state
27. Media or data flow begins
28. The connection remains active
29. A peer decides to terminate
30. The tracks are stopped
31. The `RTCPeerConnection` is closed
32. The connection is terminated

---

## 1. Application starts

The application initializes and prepares the environment.

**Example**

```ts
window.onload = () => {
  start()
}
```

---

## 2. A peer decides to initiate a connection

One peer explicitly starts the WebRTC negotiation.

**Example**

```ts
startCall()
```

---

## 3. RTCPeerConnection is created

The peer creates a connection instance with ICE configuration.

**Example**

```ts
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
})
```

---

## 4. Local media or data is obtained

Audio, video, or a data channel is created.

**Example (media)**

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
})
```

**Example (data channel)**

```ts
const dataChannel = peerConnection.createDataChannel('chat')
```

---

## 5. Local tracks are attached to the connection

Media tracks are added to the peer connection.

**Example**

```ts
stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream)
})
```

---

## 6. An SDP offer is created

The initiating peer generates an offer describing its capabilities.

**Example**

```ts
const offer = await peerConnection.createOffer()
```

---

## 7. The offer is set as localDescription

This commits the offer locally and starts ICE gathering.

**Example**

```ts
await peerConnection.setLocalDescription(offer)
```

---

## 8. The offer is sent via signaling

The offer is transmitted using a signaling channel (WebSocket, HTTP, etc).

**Example**

```ts
ws.send(
  JSON.stringify({
    type: 'webrtc.offer',
    room,
    data: { sdp: offer.sdp, to: remoteUserId }
  })
)
```

---

## 9. The remote peer receives the offer

The remote peer gets the SDP offer.

**Example**

```ts
onSignalingMessage(message)
```

---

## 10. The offer is set as remoteDescription

The remote peer applies the received offer.

**Example**

```ts
await peerConnection.setRemoteDescription({ type: 'offer', sdp: message.data.sdp })
```

---

## 11. An SDP answer is created

The remote peer generates an answer.

**Example**

```ts
const answer = await peerConnection.createAnswer()
```

---

## 12. The answer is set as localDescription

The answer is committed locally.

**Example**

```ts
await peerConnection.setLocalDescription(answer)
```

---

## 13. The answer is sent via signaling

The answer is returned to the initiating peer.

**Example**

```ts
ws.send(
  JSON.stringify({
    type: 'webrtc.answer',
    room,
    data: { sdp: answer.sdp, to: remoteUserId }
  })
)
```

---

## 14. The initiating peer receives the answer

The initiator gets the SDP answer.

**Example**

```ts
onSignalingMessage(message)
```

---

## 15. The answer is set as remoteDescription

The negotiation phase completes.

**Example**

```ts
await peerConnection.setRemoteDescription(message.sdp)
```

---

## 16. ICE candidate gathering begins

The browser starts discovering network paths.

**Example**

```ts
peerConnection.onicecandidate = event => {
  if (event.candidate) {
    ws.send(
      JSON.stringify({
        type: 'webrtc.iceCandidate',
        room,
        data: { candidate: event.candidate.candidate, to: remoteUserId }
      })
    )
  }
}
```

---

## 17. ICE candidates are exchanged

Each discovered candidate is sent to the remote peer.

**Example**

```ts
await peerConnection.addIceCandidate({ candidate: message.data.candidate })
```

---

## 18. ICE connectivity checks run

ICE tests candidate pairs to find a working route.

**No manual code required**

This happens internally in the browser.

---

## 19. A valid transport pair is selected

The best network path (host / STUN / TURN) is chosen.

**Observable via state**

```ts
peerConnection.iceConnectionState
```

---

## 20. DTLS handshake occurs

A secure transport channel is established.

**No manual code required**

---

## 21. SRTP keys are negotiated

Media encryption is enabled.

**No manual code required**

---

## 22. Connection reaches `connected` state

The peer-to-peer link is fully established.

**Example**

```ts
peerConnection.onconnectionstatechange = () => {
  if (peerConnection.connectionState === 'connected') {
    console.log('Connected')
  }
}
```

---

## 23. Media or data starts flowing

Audio, video, or data is transmitted directly.

**Example (remote media)**

```ts
peerConnection.ontrack = event => {
  remoteVideo.srcObject = event.streams[0]
}
```

---

## 24. Connection remains active

The connection stays open while peers are active.

**Optional monitoring**

```ts
peerConnection.getStats()
```

---

## 25. A peer initiates termination

One side decides to end the session.

**Example**

```ts
endCall()
```

---

## 26. Media tracks are stopped

Local devices are released.

**Example**

```ts
stream.getTracks().forEach(track => track.stop())
```

---

## 27. RTCPeerConnection is closed

The connection is fully terminated.

**Example**

```ts
peerConnection.close()
```

---

## 28. WebRTC session ends

All resources are cleaned up.

**End of flow**
