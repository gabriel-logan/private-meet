import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  addIceCandidate,
  createAnswer,
  createOffer,
  setRemoteDescription,
  webRTCConfig,
} from "../lib/webRTC";
import { getWSInstance } from "../lib/wsInstance";
import {
  makeWSMessage,
  type RoomUser,
  type WSIncomingMessage,
} from "../protocol/ws";

type PeerEntry = {
  peerID: string;
  pc: RTCPeerConnection;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  pendingIce: RTCIceCandidateInit[];
  senders: {
    audio?: RTCRtpSender;
    camera?: RTCRtpSender;
    screen?: RTCRtpSender;
  };
  remoteCameraStream: MediaStream;
  remoteScreenStream: MediaStream;
};

export type RemotePeerMedia = {
  peerID: string;
  stream: MediaStream;
  kind: "camera" | "screen";
};

type UseWebRTCMeshOptions = {
  room: string;
  myID: string;
};

function wsSend(payload: Uint8Array) {
  let ws: WebSocket;

  try {
    ws = getWSInstance();
  } catch (error) {
    console.error("[useWebRTCMesh] WebSocket not connected:", error);
    return;
  }

  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(payload);
}

function parseCandidateString(candidate: string): RTCIceCandidateInit {
  try {
    const parsed = JSON.parse(candidate) as RTCIceCandidateInit;

    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (error) {
    console.error("[useWebRTCMesh] Failed to parse ICE candidate JSON", error);
  }

  return { candidate };
}

function looksLikeScreenTrack(track: MediaStreamTrack): boolean {
  const label = track.label.toLowerCase();

  return (
    label.includes("screen") ||
    label.includes("display") ||
    label.includes("window") ||
    label.includes("monitor")
  );
}

export default function useWebRTCMesh({ room, myID }: UseWebRTCMeshOptions) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);

  const peersRef = useRef<Map<string, PeerEntry>>(new Map());

  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const localCameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const localScreenTrackRef = useRef<MediaStreamTrack | null>(null);

  const localCameraStreamRef = useRef<MediaStream>(new MediaStream());
  const localScreenStreamRef = useRef<MediaStream>(new MediaStream());

  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, { camera: MediaStream; screen: MediaStream }>
  >({});

  const localCameraStream = localCameraStreamRef.current;
  const localScreenStream = localScreenStreamRef.current;

  const remotePeers: RemotePeerMedia[] = useMemo(() => {
    return Object.entries(remoteStreams).flatMap(([peerID, streams]) => [
      { peerID, kind: "camera", stream: streams.camera },
      { peerID, kind: "screen", stream: streams.screen },
    ]);
  }, [remoteStreams]);

  const syncLocalPreviewStreams = useCallback(() => {
    const cameraStream = localCameraStreamRef.current;
    const screenStream = localScreenStreamRef.current;

    const desiredCameraTracks = new Set<MediaStreamTrack>();

    if (localAudioTrackRef.current) {
      desiredCameraTracks.add(localAudioTrackRef.current);
    }

    if (localCameraTrackRef.current) {
      desiredCameraTracks.add(localCameraTrackRef.current);
    }

    for (const existing of cameraStream.getTracks()) {
      if (!desiredCameraTracks.has(existing)) {
        cameraStream.removeTrack(existing);
      }
    }
    for (const t of desiredCameraTracks) {
      if (!cameraStream.getTracks().includes(t)) {
        cameraStream.addTrack(t);
      }
    }

    const desiredScreenTracks = new Set<MediaStreamTrack>();

    if (localScreenTrackRef.current) {
      desiredScreenTracks.add(localScreenTrackRef.current);
    }

    for (const existing of screenStream.getTracks()) {
      if (!desiredScreenTracks.has(existing)) {
        screenStream.removeTrack(existing);
      }
    }
    for (const t of desiredScreenTracks) {
      if (!screenStream.getTracks().includes(t)) {
        screenStream.addTrack(t);
      }
    }
  }, []);

  const negotiate = useCallback(
    async (entry: PeerEntry) => {
      const pc = entry.pc;

      if (!room || !myID) {
        return;
      }

      if (entry.makingOffer || pc.signalingState !== "stable") {
        return;
      }

      entry.makingOffer = true;

      try {
        const offer = await createOffer(pc);
        const sdp = pc.localDescription?.sdp ?? offer.sdp;
        if (!sdp) {
          return;
        }

        wsSend(
          makeWSMessage("webrtc.offer", {
            room,
            to: entry.peerID,
            sdp,
          }),
        );
      } catch (error) {
        console.error("[useWebRTCMesh] Failed to negotiate", error);
      } finally {
        entry.makingOffer = false;
      }
    },
    [myID, room],
  );

  const updatePeerSenders = useCallback(
    async (entry: PeerEntry) => {
      const pc = entry.pc;

      const audioTrack = localAudioTrackRef.current;
      const cameraTrack = localCameraTrackRef.current;
      const screenTrack = localScreenTrackRef.current;

      if (audioTrack) {
        if (entry.senders.audio) {
          await entry.senders.audio.replaceTrack(audioTrack);
        } else {
          entry.senders.audio = pc.addTrack(audioTrack, localCameraStream);
        }
      } else if (entry.senders.audio) {
        await entry.senders.audio.replaceTrack(null);
      }

      if (cameraTrack) {
        if (entry.senders.camera) {
          await entry.senders.camera.replaceTrack(cameraTrack);
        } else {
          entry.senders.camera = pc.addTrack(cameraTrack, localCameraStream);
        }
      } else if (entry.senders.camera) {
        await entry.senders.camera.replaceTrack(null);
      }

      if (screenTrack) {
        if (entry.senders.screen) {
          await entry.senders.screen.replaceTrack(screenTrack);
        } else {
          entry.senders.screen = pc.addTrack(screenTrack, localScreenStream);
        }
      } else if (entry.senders.screen) {
        await entry.senders.screen.replaceTrack(null);
      }
    },
    [localCameraStream, localScreenStream],
  );

  const ensureAudioTrack = useCallback(async () => {
    if (localAudioTrackRef.current) {
      return localAudioTrackRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    const [track] = stream.getAudioTracks();

    if (!track) {
      throw new Error("No audio track");
    }

    track.enabled = micEnabled;
    localAudioTrackRef.current = track;

    syncLocalPreviewStreams();

    for (const [, entry] of peersRef.current) {
      await updatePeerSenders(entry);

      void negotiate(entry);
    }

    return track;
  }, [micEnabled, negotiate, syncLocalPreviewStreams, updatePeerSenders]);

  const setMicEnabledAsync = useCallback(
    async (enabled: boolean) => {
      setMicEnabled(enabled);

      if (!enabled && !localAudioTrackRef.current) {
        return;
      }

      try {
        const t = localAudioTrackRef.current ?? (await ensureAudioTrack());

        t.enabled = enabled;
      } catch (error) {
        console.error("[useWebRTCMesh] Failed to toggle mic", error);
      }
    },
    [ensureAudioTrack],
  );

  const startCamera = useCallback(async () => {
    if (localCameraTrackRef.current) {
      localCameraTrackRef.current.enabled = true;

      setCameraEnabled(true);

      syncLocalPreviewStreams();

      for (const [, entry] of peersRef.current) {
        await updatePeerSenders(entry);

        void negotiate(entry);
      }

      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });

    const [track] = stream.getVideoTracks();

    if (!track) {
      throw new Error("No camera track");
    }

    localCameraTrackRef.current = track;
    track.enabled = true;

    setCameraEnabled(true);
    syncLocalPreviewStreams();

    for (const [, entry] of peersRef.current) {
      await updatePeerSenders(entry);

      void negotiate(entry);
    }
  }, [negotiate, syncLocalPreviewStreams, updatePeerSenders]);

  const stopCamera = useCallback(async () => {
    if (localCameraTrackRef.current) {
      localCameraTrackRef.current.enabled = false;
    }

    setCameraEnabled(false);
    syncLocalPreviewStreams();

    for (const [, entry] of peersRef.current) {
      await updatePeerSenders(entry);

      void negotiate(entry);
    }
  }, [negotiate, syncLocalPreviewStreams, updatePeerSenders]);

  const stopScreenShare = useCallback(async () => {
    if (localScreenTrackRef.current) {
      try {
        localScreenTrackRef.current.stop();
      } catch (error) {
        console.error("[useWebRTCMesh] Failed to stop screen track", error);
      }
    }

    localScreenTrackRef.current = null;
    setScreenShareEnabled(false);
    syncLocalPreviewStreams();

    for (const [, entry] of peersRef.current) {
      await updatePeerSenders(entry);

      void negotiate(entry);
    }
  }, [negotiate, syncLocalPreviewStreams, updatePeerSenders]);

  const startScreenShare = useCallback(async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    const [track] = stream.getVideoTracks();

    if (!track) {
      throw new Error("No screen track");
    }

    track.addEventListener(
      "ended",
      () => {
        void stopScreenShare();
      },
      { once: true },
    );

    localScreenTrackRef.current = track;
    setScreenShareEnabled(true);
    syncLocalPreviewStreams();

    for (const [, entry] of peersRef.current) {
      await updatePeerSenders(entry);
      void negotiate(entry);
    }
  }, [negotiate, stopScreenShare, syncLocalPreviewStreams, updatePeerSenders]);

  const closePeer = useCallback((peerID: string) => {
    const entry = peersRef.current.get(peerID);
    if (!entry) {
      return;
    }

    try {
      entry.pc.onicecandidate = null;
      entry.pc.ontrack = null;
      entry.pc.onnegotiationneeded = null;
      entry.pc.close();
    } catch (error) {
      console.error("[useWebRTCMesh] Failed to close peer connection", error);
    }

    peersRef.current.delete(peerID);
    setRemoteStreams((prev) => {
      if (!(peerID in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[peerID];
      return next;
    });
  }, []);

  const createPeer = useCallback(
    async (peerID: string) => {
      const existing = peersRef.current.get(peerID);

      if (existing) {
        return existing;
      }

      if (!room || !myID) {
        throw new Error("Missing room/myID");
      }

      if (peerID === myID) {
        throw new Error("Refusing to create peer connection to self");
      }

      await ensureAudioTrack().catch((error) => {
        console.error(
          "[useWebRTCMesh] Failed to getUserMedia(audio) while creating peer",
          error,
        );
      });

      const pc = new RTCPeerConnection(webRTCConfig);

      const entry: PeerEntry = {
        peerID,
        pc,
        polite: myID.localeCompare(peerID) > 0,
        makingOffer: false,
        ignoreOffer: false,
        pendingIce: [],
        senders: {},
        remoteCameraStream: new MediaStream(),
        remoteScreenStream: new MediaStream(),
      };

      peersRef.current.set(peerID, entry);

      pc.ontrack = (event) => {
        const track = event.track;

        if (track.kind === "audio") {
          for (const t of entry.remoteCameraStream.getAudioTracks()) {
            entry.remoteCameraStream.removeTrack(t);
          }

          entry.remoteCameraStream.addTrack(track);
        } else if (track.kind === "video") {
          const isScreen = looksLikeScreenTrack(track);

          if (isScreen) {
            for (const t of entry.remoteScreenStream.getVideoTracks()) {
              entry.remoteScreenStream.removeTrack(t);
            }

            entry.remoteScreenStream.addTrack(track);
          } else {
            for (const t of entry.remoteCameraStream.getVideoTracks()) {
              entry.remoteCameraStream.removeTrack(t);
            }

            entry.remoteCameraStream.addTrack(track);
          }
        }

        setRemoteStreams((prev) => ({
          ...prev,
          [peerID]: {
            camera: entry.remoteCameraStream,
            screen: entry.remoteScreenStream,
          },
        }));

        track.addEventListener("ended", () => {
          if (track.kind === "audio") {
            entry.remoteCameraStream.removeTrack(track);
          } else {
            entry.remoteCameraStream.removeTrack(track);
            entry.remoteScreenStream.removeTrack(track);
          }

          setRemoteStreams((prev) => ({
            ...prev,
            [peerID]: {
              camera: entry.remoteCameraStream,
              screen: entry.remoteScreenStream,
            },
          }));
        });
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }

        wsSend(
          makeWSMessage("webrtc.iceCandidate", {
            room,
            to: peerID,
            candidate: JSON.stringify(event.candidate.toJSON()),
          }),
        );
      };

      pc.onnegotiationneeded = () => {
        void negotiate(entry);
      };

      await updatePeerSenders(entry);

      void negotiate(entry);

      return entry;
    },
    [ensureAudioTrack, myID, negotiate, room, updatePeerSenders],
  );

  const syncPeersFromRoomUsers = useCallback(
    async (users: RoomUser[]) => {
      if (!room || !myID) {
        return;
      }

      const ids = new Set(users.map((u) => u.userID).filter(Boolean));

      ids.delete(myID);

      for (const existingID of Array.from(peersRef.current.keys())) {
        if (!ids.has(existingID)) {
          closePeer(existingID);
        }
      }

      for (const peerID of ids) {
        void createPeer(peerID).catch((error) => {
          console.error("[useWebRTCMesh] Failed to create peer", error);
        });
      }
    },
    [closePeer, createPeer, myID, room],
  );

  const flushPendingIce = useCallback(async (entry: PeerEntry) => {
    if (entry.pendingIce.length === 0) {
      return;
    }

    const pending = entry.pendingIce;
    entry.pendingIce = [];

    for (const c of pending) {
      try {
        await addIceCandidate(entry.pc, c);
      } catch (error) {
        console.error("[useWebRTCMesh] Failed to add pending ICE", error);
      }
    }
  }, []);

  const handleSignal = useCallback(
    async (msg: WSIncomingMessage) => {
      try {
        if (!room || !myID) {
          return;
        }

        if (!("room" in msg) || msg.room !== room) {
          return;
        }

        if (
          msg.type !== "webrtc.offer" &&
          msg.type !== "webrtc.answer" &&
          msg.type !== "webrtc.iceCandidate"
        ) {
          return;
        }

        const from = typeof msg.from === "string" ? msg.from : "";

        if (!from || from === myID) {
          return;
        }

        if (msg.data.to !== myID) {
          return;
        }

        const entry = await createPeer(from);
        const pc = entry.pc;

        if (msg.type === "webrtc.iceCandidate") {
          const cand = parseCandidateString(msg.data.candidate);

          if (!pc.remoteDescription) {
            entry.pendingIce.push(cand);
            return;
          }

          await addIceCandidate(pc, cand);

          return;
        }

        if (msg.type === "webrtc.offer") {
          const offerCollision =
            pc.signalingState !== "stable" || entry.makingOffer;
          entry.ignoreOffer = !entry.polite && offerCollision;

          if (entry.ignoreOffer) {
            return;
          }

          if (offerCollision && pc.signalingState === "have-local-offer") {
            await pc.setLocalDescription({ type: "rollback" });
          }

          await setRemoteDescription(pc, { type: "offer", sdp: msg.data.sdp });
          await flushPendingIce(entry);

          const answer = await createAnswer(pc);

          const sdp = pc.localDescription?.sdp ?? answer.sdp;

          if (!sdp) {
            return;
          }

          wsSend(
            makeWSMessage("webrtc.answer", {
              room,
              to: from,
              sdp,
            }),
          );
          return;
        }

        if (msg.type === "webrtc.answer") {
          await setRemoteDescription(pc, { type: "answer", sdp: msg.data.sdp });
          await flushPendingIce(entry);
        }
      } catch (error) {
        console.error("[useWebRTCMesh] Failed to handle signaling", error);
      }
    },
    [createPeer, flushPendingIce, myID, room],
  );

  useEffect(() => {
    if (!room || !myID) {
      return;
    }

    if (!micEnabled) {
      return;
    }

    void ensureAudioTrack().catch((error) => {
      console.error(
        "[useWebRTCMesh] Failed to getUserMedia(audio) on room enter",
        error,
      );
    });
  }, [ensureAudioTrack, micEnabled, myID, room]);

  useEffect(() => {
    const peers = peersRef.current;

    return () => {
      for (const peerID of Array.from(peers.keys())) {
        closePeer(peerID);
      }

      if (localAudioTrackRef.current) {
        try {
          localAudioTrackRef.current.stop();
        } catch (error) {
          console.error("[useWebRTCMesh] Failed to stop audio track", error);
        }
      }

      if (localCameraTrackRef.current) {
        try {
          localCameraTrackRef.current.stop();
        } catch (error) {
          console.error("[useWebRTCMesh] Failed to stop camera track", error);
        }
      }

      if (localScreenTrackRef.current) {
        try {
          localScreenTrackRef.current.stop();
        } catch (error) {
          console.error("[useWebRTCMesh] Failed to stop screen track", error);
        }
      }

      localAudioTrackRef.current = null;
      localCameraTrackRef.current = null;
      localScreenTrackRef.current = null;

      setRemoteStreams({});
    };
  }, [closePeer]);

  return {
    localCameraStream,
    localScreenStream,
    remotePeers,

    micEnabled,
    setMicEnabled: setMicEnabledAsync,

    cameraEnabled,
    startCamera,
    stopCamera,

    screenShareEnabled,
    startScreenShare,
    stopScreenShare,

    handleSignal,
    syncPeersFromRoomUsers,
  };
}
