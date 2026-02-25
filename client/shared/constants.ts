export const iceServers: RTCIceServer[] = [
  // STUN servers
  { urls: "stun:stun.relay.metered.ca:80" },

  // TURN servers (Metered)
  {
    urls: "turn:global.relay.metered.ca:443",
    username: "a825f81251e9557ec367f987",
    credential: "6d80v/4l1epqr3dJ",
  },
  {
    urls: "turns:global.relay.metered.ca:443?transport=tcp",
    username: "a825f81251e9557ec367f987",
    credential: "6d80v/4l1epqr3dJ",
  },
];
