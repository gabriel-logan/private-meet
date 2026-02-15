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

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  (pc as any).ontrack = (event: RTCTrackEvent) => {
    const [remoteStream] = event.streams;

    if (remoteStream) {
      onTrackCB(remoteStream);
    }
  };

  (pc as any).onicecandidate = (event: RTCPeerConnectionIceEvent) => {
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
