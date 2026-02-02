const isTurnServerEnabled = import.meta.env.VITE_HAS_TURN_SERVER === "true";

const turnServerURL = import.meta.env.VITE_TURN_SERVER_URL;
const turnServerUsername = import.meta.env.VITE_TURN_SERVER_USERNAME;
const turnServerCredential = import.meta.env.VITE_TURN_SERVER_CREDENTIAL;

const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

if (isTurnServerEnabled) {
  iceServers.push({
    urls: turnServerURL,
    username: turnServerUsername,
    credential: turnServerCredential,
  });
}

export const webRTCConfig: RTCConfiguration = {
  iceServers,
};

export type OnTrackCallback = (stream: MediaStream) => void;

export type OnIceCandidateCallback = (candidate: RTCIceCandidate) => void;

export interface CreatePeerConnectionOptions {
  localStream: MediaStream;
  onTrackCB: OnTrackCallback;
  onIceCandidateCB: OnIceCandidateCallback;
}

export function createPeerConnection({
  localStream,
  onTrackCB,
  onIceCandidateCB,
}: CreatePeerConnectionOptions): RTCPeerConnection {
  const pc = new RTCPeerConnection(webRTCConfig);

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = (event: RTCTrackEvent) => {
    const [remoteStream] = event.streams;

    if (remoteStream) {
      onTrackCB(remoteStream);
    }
  };

  pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      onIceCandidateCB(event.candidate);
    }
  };

  return pc;
}

export async function createOffer(
  pc: RTCPeerConnection,
): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer();

  await pc.setLocalDescription(offer);

  return offer;
}

export async function createAnswer(
  pc: RTCPeerConnection,
): Promise<RTCSessionDescriptionInit> {
  const answer = await pc.createAnswer();

  await pc.setLocalDescription(answer);

  return answer;
}

export async function setRemoteDescription(
  pc: RTCPeerConnection,
  sdp: RTCSessionDescriptionInit,
): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
}

export async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit,
): Promise<void> {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}
