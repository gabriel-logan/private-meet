import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc";
import {
  VITE_HAS_TURN_SERVER,
  VITE_TURN_SERVER_CREDENTIAL,
  VITE_TURN_SERVER_URL,
  VITE_TURN_SERVER_USERNAME,
} from "@env";

import { iceServers } from "../../../shared/constants";

const isTurnServerEnabled = VITE_HAS_TURN_SERVER === "true";

const turnServerURL = VITE_TURN_SERVER_URL;
const turnServerUsername = VITE_TURN_SERVER_USERNAME;
const turnServerCredential = VITE_TURN_SERVER_CREDENTIAL;

if (isTurnServerEnabled) {
  iceServers.push({
    urls: turnServerURL,
    username: turnServerUsername,
    credential: turnServerCredential,
  });
}

type WebRTCConfig = ConstructorParameters<typeof RTCPeerConnection>[0];
type SessionDescriptionInit = NonNullable<
  ConstructorParameters<typeof RTCSessionDescription>[0]
>;
type IceCandidateInit = ConstructorParameters<typeof RTCIceCandidate>[0];

export const webRTCConfig: WebRTCConfig = {
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

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  (pc as any).ontrack = (event: any) => {
    const [remoteStream] = event.streams;

    if (remoteStream) {
      onTrackCB(remoteStream);
    }
  };

  (pc as any).onicecandidate = (event: any) => {
    if (event.candidate) {
      onIceCandidateCB(event.candidate);
    }
  };

  return pc;
}

export async function createOffer(
  pc: RTCPeerConnection,
): Promise<SessionDescriptionInit> {
  const offer = await pc.createOffer();

  await pc.setLocalDescription(offer);

  return offer;
}

export async function createAnswer(
  pc: RTCPeerConnection,
): Promise<SessionDescriptionInit> {
  const answer = await pc.createAnswer();

  await pc.setLocalDescription(answer);

  return answer;
}

export async function setRemoteDescription(
  pc: RTCPeerConnection,
  sdp: SessionDescriptionInit,
): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
}

export async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: IceCandidateInit,
): Promise<void> {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}
