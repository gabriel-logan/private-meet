import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  makeWSMessage,
  type RoomUser,
  type WSIncomingMessage,
} from "../../../../shared/protocol/ws";
import {
  webRTCFileChannelLabel,
  webRTCFileChannelMaxBufferedAmountBytes,
  webRTCImageChunkSizeBytes,
  webRTCMaxPeerConnections,
} from "../constants";
import {
  addIceCandidate,
  createAnswer,
  createOffer,
  setRemoteDescription,
  webRTCConfig,
} from "../lib/webRTC";
import { getWSInstance } from "../lib/wsInstance";
import type { IncomingFileTransferProgress } from "../types";
import { debugHandle } from "../utils/general";

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
    screenAudio?: RTCRtpSender;
  };
  fileChannel?: RTCDataChannel;
  fileChannelOpen: boolean;
  connectionState: RTCPeerConnectionState;
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
  onImageReceived?: (payload: {
    peerID: string;
    url: string;
    mime: string;
    name: string;
    size: number;
  }) => void;
};

type IncomingImageTransfer = {
  id: string;
  name: string;
  mime: string;
  size: number;
  chunkSize: number;
  totalChunks: number;
  receivedChunks: number;
  receivedBytes: number;
  chunks: ArrayBuffer[];
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

export default function useWebRTCMesh({
  room,
  myID,
  onImageReceived,
}: UseWebRTCMeshOptions) {
  const { t } = useTranslation();

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);

  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const creatingPeersRef = useRef<Map<string, Promise<PeerEntry>>>(new Map());
  const roomUserIdsRef = useRef<Set<string>>(new Set());
  const syncTimeoutRef = useRef<number | undefined>(undefined);
  const lastSyncUsersRef = useRef<string>("");

  const onImageReceivedRef =
    useRef<UseWebRTCMeshOptions["onImageReceived"]>(onImageReceived);
  onImageReceivedRef.current = onImageReceived;

  const incomingTransfersRef = useRef<
    Map<string, Map<string, IncomingImageTransfer>>
  >(new Map());

  const [incomingFileTransfers, setIncomingFileTransfers] = useState<
    IncomingFileTransferProgress[]
  >([]);

  // Trigger re-render when needed.
  const [, bumpRender] = useState(0); // nosonar

  const [canSendImages, setCanSendImages] = useState(false);
  const [expectedPeersCount, setExpectedPeersCount] = useState(0);
  const [connectedPeersCount, setConnectedPeersCount] = useState(0);

  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const localCameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const localScreenTrackRef = useRef<MediaStreamTrack | null>(null);
  const localScreenAudioTrackRef = useRef<MediaStreamTrack | null>(null);

  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const cameraDevicesRef = useRef<MediaDeviceInfo[]>([]);
  const cameraDeviceIdRef = useRef<string | null>(null);

  const localCameraStreamRef = useRef<MediaStream>(new MediaStream());
  const localScreenStreamRef = useRef<MediaStream>(new MediaStream());
  const ensureAudioTrackRef = useRef<() => Promise<MediaStreamTrack>>(
    async () => {
      throw new Error(t("Errors.AudioTrackNotReady"));
    },
  );

  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, { camera: MediaStream; screen: MediaStream }>
  >({});

  const localCameraStream = localCameraStreamRef.current;
  const localScreenStream = localScreenStreamRef.current;

  const remotePeers: RemotePeerMedia[] = Object.entries(remoteStreams).flatMap(
    ([peerID, streams]) => [
      { peerID, kind: "camera", stream: streams.camera },
      { peerID, kind: "screen", stream: streams.screen },
    ],
  );

  const refreshCameraDevices = useCallback(async () => {
    const media = navigator.mediaDevices;

    if (!media?.enumerateDevices) {
      return;
    }

    try {
      const devices = await media.enumerateDevices();

      const videos = devices.filter((d) => d.kind === "videoinput");

      cameraDevicesRef.current = videos;

      setCameraDevices(videos);

      const fromTrack =
        localCameraTrackRef.current?.getSettings().deviceId ?? null;

      const preferred = cameraDeviceIdRef.current ?? fromTrack;

      if (preferred && videos.some((d) => d.deviceId === preferred)) {
        cameraDeviceIdRef.current = preferred;
      } else if (!cameraDeviceIdRef.current && videos[0]?.deviceId) {
        cameraDeviceIdRef.current = videos[0].deviceId;
      }
    } catch (error) {
      console.error(
        "[useWebRTCMesh] Failed to enumerate camera devices",
        error,
      );
    }
  }, []);

  useEffect(() => {
    debugHandle("[useWebRTCMesh] Setting up device change listener");

    const media = navigator.mediaDevices;

    if (!media?.addEventListener) {
      return;
    }

    const onChange = () => {
      void refreshCameraDevices();
    };

    media.addEventListener("devicechange", onChange);

    void refreshCameraDevices();

    return () => {
      media.removeEventListener("devicechange", onChange);
    };
  }, [refreshCameraDevices]);

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

    if (localScreenAudioTrackRef.current) {
      desiredScreenTracks.add(localScreenAudioTrackRef.current);
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
    [room, myID],
  );

  const recomputeCanSendImages = useCallback(() => {
    const expected = roomUserIdsRef.current;

    setExpectedPeersCount(expected.size);

    if (expected.size === 0) {
      setConnectedPeersCount(0);
      setCanSendImages(false);
      return;
    }

    let connected = 0;

    for (const peerID of expected) {
      const entry = peersRef.current.get(peerID);

      if (!entry) {
        continue;
      }

      const pcConnected = entry.connectionState === "connected";
      const dcOpen = entry.fileChannel?.readyState === "open";

      if (pcConnected && dcOpen) {
        connected += 1;
      }
    }

    setConnectedPeersCount(connected);
    setCanSendImages(connected === expected.size);
  }, []);

  const installFileChannelHandlers = useCallback(
    (peerID: string, ch: RTCDataChannel) => {
      const entry = peersRef.current.get(peerID);

      if (!entry) {
        return;
      }

      entry.fileChannel = ch;

      ch.binaryType = "arraybuffer";

      const updateState = () => {
        const dcState = ch.readyState;

        bumpRender((v) => v + 1);

        entry.fileChannelOpen = dcState === "open";

        recomputeCanSendImages();
      };

      ch.onopen = updateState;
      ch.onclose = updateState;
      ch.onerror = () => updateState();

      ch.onmessage = (event: MessageEvent) => {
        try {
          const data = event.data as unknown;

          if (typeof data === "string") {
            const parsed = JSON.parse(data) as
              | {
                  t: "img-start";
                  id: string;
                  name: string;
                  mime: string;
                  size: number;
                  chunkSize: number;
                  totalChunks: number;
                }
              | { t: "img-end"; id: string };

            if (parsed?.t === "img-start") {
              if (!incomingTransfersRef.current.has(peerID)) {
                incomingTransfersRef.current.set(peerID, new Map());
              }

              const byId = incomingTransfersRef.current.get(peerID)!;

              byId.set(parsed.id, {
                id: parsed.id,
                name: parsed.name,
                mime: parsed.mime,
                size: parsed.size,
                chunkSize: parsed.chunkSize,
                totalChunks: parsed.totalChunks,
                receivedChunks: 0,
                receivedBytes: 0,
                chunks: [],
              });

              setIncomingFileTransfers((prev) => {
                const next = prev.filter(
                  (t) => !(t.peerID === peerID && t.id === parsed.id),
                );

                next.push({
                  peerID,
                  id: parsed.id,
                  name: parsed.name,
                  mime: parsed.mime,
                  size: parsed.size,
                  receivedBytes: 0,
                });

                return next;
              });

              return;
            }

            if (parsed?.t === "img-end") {
              const byId = incomingTransfersRef.current.get(peerID);

              const transfer = byId?.get(parsed.id);

              if (!transfer) {
                return;
              }

              const blob = new Blob(transfer.chunks, { type: transfer.mime });

              const url = URL.createObjectURL(blob);

              onImageReceivedRef.current?.({
                peerID,
                url,
                mime: transfer.mime,
                name: transfer.name,
                size: transfer.size,
              });

              setIncomingFileTransfers((prev) =>
                prev.filter(
                  (t) => !(t.peerID === peerID && t.id === parsed.id),
                ),
              );

              byId?.delete(parsed.id);
              return;
            }

            return;
          }

          if (data instanceof ArrayBuffer) {
            const byId = incomingTransfersRef.current.get(peerID);

            if (!byId || byId.size === 0) {
              return;
            }

            const [transfer] = byId.values();

            if (!transfer) {
              return;
            }

            transfer.chunks.push(data);
            transfer.receivedChunks += 1;
            transfer.receivedBytes += data.byteLength;

            setIncomingFileTransfers((prev) =>
              prev.map((t) => {
                if (t.peerID !== peerID || t.id !== transfer.id) {
                  return t;
                }

                return {
                  ...t,
                  receivedBytes: transfer.receivedBytes,
                };
              }),
            );

            if (
              transfer.receivedChunks >= transfer.totalChunks ||
              transfer.receivedBytes >= transfer.size
            ) {
              const blob = new Blob(transfer.chunks, { type: transfer.mime });
              const url = URL.createObjectURL(blob);

              onImageReceivedRef.current?.({
                peerID,
                url,
                mime: transfer.mime,
                name: transfer.name,
                size: transfer.size,
              });

              setIncomingFileTransfers((prev) =>
                prev.filter(
                  (t) => !(t.peerID === peerID && t.id === transfer.id),
                ),
              );

              byId.clear();
            }

            return;
          }
        } catch (error) {
          console.error(
            "[useWebRTCMesh] Failed to handle file channel message",
            error,
          );
        }
      };

      updateState();
    },
    [recomputeCanSendImages],
  );

  const waitForBufferedLow = useCallback((ch: RTCDataChannel) => {
    if (ch.bufferedAmount <= webRTCFileChannelMaxBufferedAmountBytes) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const onLow = () => {
        ch.removeEventListener("bufferedamountlow", onLow);
        resolve();
      };

      try {
        ch.bufferedAmountLowThreshold = 256 * 1024;
      } catch (error) {
        console.error("Failed to set bufferedAmountLowThreshold:", error);
      }

      ch.addEventListener("bufferedamountlow", onLow);

      // Fallback in case bufferedamountlow doesn't fire.
      globalThis.setTimeout(() => {
        ch.removeEventListener("bufferedamountlow", onLow);
        resolve();
      }, 2000);
    });
  }, []);

  const sendImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        throw new Error(t("Errors.OnlyImagesAreSupportedForNow"));
      }

      const expected = roomUserIdsRef.current;

      if (expected.size === 0) {
        throw new Error(t("Errors.NoPeersInRoom"));
      }

      recomputeCanSendImages();

      for (const peerID of expected) {
        const entry = peersRef.current.get(peerID);

        const ch = entry?.fileChannel;

        if (
          entry?.connectionState !== "connected" ||
          ch?.readyState !== "open"
        ) {
          throw new Error(t("Errors.WebRTCNotFullyConnectedWithAllPeers"));
        }
      }

      const transferId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const totalChunks = Math.max(
        1,
        Math.ceil(file.size / webRTCImageChunkSizeBytes),
      );

      const startMsg = JSON.stringify({
        t: "img-start",
        id: transferId,
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        chunkSize: webRTCImageChunkSizeBytes,
        totalChunks,
      });

      for (const peerID of expected) {
        peersRef.current.get(peerID)!.fileChannel!.send(startMsg);
      }

      let offset = 0;

      while (offset < file.size) {
        const slice = file.slice(offset, offset + webRTCImageChunkSizeBytes);

        const buf = await slice.arrayBuffer();

        for (const peerID of expected) {
          const ch = peersRef.current.get(peerID)!.fileChannel!;

          await waitForBufferedLow(ch);

          ch.send(buf);
        }

        offset += buf.byteLength;
      }

      const endMsg = JSON.stringify({ t: "img-end", id: transferId });

      for (const peerID of expected) {
        peersRef.current.get(peerID)!.fileChannel!.send(endMsg);
      }
    },
    [recomputeCanSendImages, t, waitForBufferedLow],
  );

  const updatePeerSenders = useCallback(
    async (entry: PeerEntry) => {
      const pc = entry.pc;

      const audioTrack = localAudioTrackRef.current;
      const cameraTrack = localCameraTrackRef.current;
      const screenTrack = localScreenTrackRef.current;
      const screenAudioTrack = localScreenAudioTrackRef.current;

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

      if (screenAudioTrack) {
        if (entry.senders.screenAudio) {
          await entry.senders.screenAudio.replaceTrack(screenAudioTrack);
        } else {
          entry.senders.screenAudio = pc.addTrack(
            screenAudioTrack,
            localScreenStream,
          );
        }
      } else if (entry.senders.screenAudio) {
        await entry.senders.screenAudio.replaceTrack(null);
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
      throw new Error(t("Errors.AudioTrackNotReady"));
    }

    track.enabled = micEnabled;
    localAudioTrackRef.current = track;

    syncLocalPreviewStreams();

    for (const [, entry] of peersRef.current) {
      await updatePeerSenders(entry);
    }

    return track;
  }, [micEnabled, syncLocalPreviewStreams, t, updatePeerSenders]);

  useEffect(() => {
    debugHandle("[useWebRTCMesh] Updating ensureAudioTrackRef");

    ensureAudioTrackRef.current = ensureAudioTrack;
  }, [ensureAudioTrack]);

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

  const startCamera = useCallback(
    async (deviceId?: string) => {
      const wantsDevice = Boolean(deviceId);

      if (localCameraTrackRef.current && !wantsDevice) {
        localCameraTrackRef.current.enabled = true;

        setCameraEnabled(true);

        syncLocalPreviewStreams();

        for (const [, entry] of peersRef.current) {
          await updatePeerSenders(entry);
        }

        void refreshCameraDevices();

        return;
      }

      const currentDeviceId =
        localCameraTrackRef.current?.getSettings().deviceId ??
        cameraDeviceIdRef.current;

      if (localCameraTrackRef.current && wantsDevice) {
        if (currentDeviceId && currentDeviceId === deviceId) {
          localCameraTrackRef.current.enabled = true;
          setCameraEnabled(true);
          syncLocalPreviewStreams();

          for (const [, entry] of peersRef.current) {
            await updatePeerSenders(entry);
          }

          void refreshCameraDevices();

          return;
        }

        try {
          localCameraTrackRef.current.stop();
        } catch (error) {
          console.error("[useWebRTCMesh] Failed to stop camera track", error);
        }

        localCameraTrackRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: wantsDevice
          ? {
              deviceId: {
                exact: deviceId,
              },
            }
          : true,
      });

      const [track] = stream.getVideoTracks();

      if (!track) {
        throw new Error(t("Errors.NoCameraTrackAvailable"));
      }

      localCameraTrackRef.current = track;
      track.enabled = true;

      cameraDeviceIdRef.current =
        track.getSettings().deviceId ?? deviceId ?? null;

      setCameraEnabled(true);
      syncLocalPreviewStreams();

      for (const [, entry] of peersRef.current) {
        await updatePeerSenders(entry);
      }

      void refreshCameraDevices();
    },
    [refreshCameraDevices, syncLocalPreviewStreams, t, updatePeerSenders],
  );

  const canSwitchCamera = cameraDevices.length > 1;

  const switchCamera = useCallback(async () => {
    const media = navigator.mediaDevices;

    if (!media?.enumerateDevices) {
      return;
    }

    const devices = await media.enumerateDevices();
    const videos = devices.filter((d) => d.kind === "videoinput");

    if (videos.length < 2) {
      return;
    }

    const current =
      cameraDeviceIdRef.current ??
      localCameraTrackRef.current?.getSettings().deviceId ??
      videos[0]?.deviceId;

    if (!current) {
      return;
    }

    const idx = videos.findIndex((d) => d.deviceId === current);
    const next = videos[(idx >= 0 ? idx + 1 : 0) % videos.length]?.deviceId;

    if (!next || next === current) {
      return;
    }

    await startCamera(next);
  }, [startCamera]);

  const stopCamera = useCallback(async () => {
    if (localCameraTrackRef.current) {
      localCameraTrackRef.current.enabled = false;
    }

    setCameraEnabled(false);
    syncLocalPreviewStreams();

    for (const [, entry] of peersRef.current) {
      await updatePeerSenders(entry);
    }
  }, [syncLocalPreviewStreams, updatePeerSenders]);

  const stopScreenShare = useCallback(async () => {
    if (localScreenTrackRef.current) {
      try {
        localScreenTrackRef.current.stop();
      } catch (error) {
        console.error("[useWebRTCMesh] Failed to stop screen track", error);
      }
    }

    if (localScreenAudioTrackRef.current) {
      try {
        localScreenAudioTrackRef.current.stop();
      } catch (error) {
        console.error(
          "[useWebRTCMesh] Failed to stop screen audio track",
          error,
        );
      }
    }

    localScreenTrackRef.current = null;
    localScreenAudioTrackRef.current = null;
    setScreenShareEnabled(false);
    syncLocalPreviewStreams();

    for (const [, entry] of peersRef.current) {
      await updatePeerSenders(entry);

      void negotiate(entry);
    }
  }, [syncLocalPreviewStreams, updatePeerSenders, negotiate]);

  const startScreenShare = useCallback(async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const [track] = stream.getVideoTracks();
    const [audioTrack] = stream.getAudioTracks();

    if (!track) {
      throw new Error(t("Errors.NoScreenShareTrackAvailable"));
    }

    track.addEventListener(
      "ended",
      () => {
        void stopScreenShare();
      },
      { once: true },
    );

    localScreenTrackRef.current = track;
    localScreenAudioTrackRef.current = audioTrack ?? null;

    if (audioTrack) {
      audioTrack.enabled = true;
    }

    setScreenShareEnabled(true);
    syncLocalPreviewStreams();

    for (const [, entry] of peersRef.current) {
      await updatePeerSenders(entry);

      void negotiate(entry);
    }
  }, [
    negotiate,
    stopScreenShare,
    syncLocalPreviewStreams,
    t,
    updatePeerSenders,
  ]);

  const closePeer = useCallback(
    (peerID: string) => {
      const entry = peersRef.current.get(peerID);
      if (!entry) {
        return;
      }

      try {
        if (entry.fileChannel) {
          entry.fileChannel.onopen = null;
          entry.fileChannel.onclose = null;
          entry.fileChannel.onmessage = null;
          entry.fileChannel.onerror = null;
          try {
            entry.fileChannel.close();
          } catch (error) {
            console.error("Failed to close file channel:", error);
          }
        }

        entry.pc.onicecandidate = null;
        entry.pc.ontrack = null;
        entry.pc.onnegotiationneeded = null;
        entry.pc.onconnectionstatechange = null;
        entry.pc.ondatachannel = null;
        entry.pc.close();
      } catch (error) {
        console.error("[useWebRTCMesh] Failed to close peer connection", error);
      }

      peersRef.current.delete(peerID);

      incomingTransfersRef.current.delete(peerID);

      setIncomingFileTransfers((prev) =>
        prev.filter((t) => t.peerID !== peerID),
      );

      bumpRender((v) => v + 1);

      recomputeCanSendImages();

      setRemoteStreams((prev) => {
        if (!(peerID in prev)) {
          return prev;
        }

        const next = { ...prev };

        delete next[peerID];

        return next;
      });
    },
    [recomputeCanSendImages],
  );

  const createPeer = useCallback(
    async (peerID: string) => {
      const existing = peersRef.current.get(peerID);

      if (existing) {
        console.log(`[useWebRTCMesh] Peer ${peerID} already exists, reusing`);
        return existing;
      }

      const pending = creatingPeersRef.current.get(peerID);

      if (pending) {
        console.log(
          `[useWebRTCMesh] Peer ${peerID} already being created, waiting`,
        );

        return pending;
      }

      if (!room || !myID) {
        throw new Error(t("Errors.MissingRoomID"));
      }

      if (peerID === myID) {
        throw new Error(t("Errors.RefusingToCreatePeerConnToSelf"));
      }

      const totalPeers = peersRef.current.size + creatingPeersRef.current.size;

      if (totalPeers >= webRTCMaxPeerConnections) {
        throw new Error(
          t("Errors.MaxPeerConnectionsReached", {
            maxPeerConnections: `${totalPeers}/${webRTCMaxPeerConnections}`,
          }),
        );
      }

      console.log(
        `[useWebRTCMesh] Creating peer ${peerID} (total: ${totalPeers + 1}/${webRTCMaxPeerConnections})`,
      );

      const createPromise = (async () => {
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
          fileChannel: undefined,
          fileChannelOpen: false,
          connectionState: pc.connectionState,
          remoteCameraStream: new MediaStream(),
          remoteScreenStream: new MediaStream(),
        };

        peersRef.current.set(peerID, entry);

        pc.onconnectionstatechange = () => {
          entry.connectionState = pc.connectionState;

          bumpRender((v) => v + 1);

          recomputeCanSendImages();
        };

        pc.ondatachannel = (event) => {
          const ch = event.channel;

          if (ch?.label !== webRTCFileChannelLabel) {
            return;
          }

          installFileChannelHandlers(peerID, ch);
        };

        if (myID.localeCompare(peerID) < 0) {
          const ch = pc.createDataChannel(webRTCFileChannelLabel);

          installFileChannelHandlers(peerID, ch);
        }

        pc.ontrack = (event) => {
          const track = event.track;

          if (track.kind === "audio") {
            if (!entry.remoteCameraStream.getAudioTracks().includes(track)) {
              entry.remoteCameraStream.addTrack(track);
            }
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

        bumpRender((v) => v + 1);

        recomputeCanSendImages();

        return entry;
      })();

      creatingPeersRef.current.set(peerID, createPromise);

      try {
        return await createPromise;
      } finally {
        creatingPeersRef.current.delete(peerID);
      }
    },
    [
      room,
      myID,
      t,
      ensureAudioTrack,
      updatePeerSenders,
      recomputeCanSendImages,
      installFileChannelHandlers,
      negotiate,
    ],
  );

  const syncPeersFromRoomUsers = useCallback(
    async (users: RoomUser[]) => {
      if (!room || !myID) {
        return;
      }

      const ids = new Set(users.map((u) => u.userID).filter(Boolean));

      ids.delete(myID);

      const userListKey = Array.from(ids)
        .sort((a, b) => a.localeCompare(b))
        .join(",");

      if (userListKey === lastSyncUsersRef.current) {
        console.log(
          "[useWebRTCMesh] Ignoring duplicate syncPeersFromRoomUsers call",
        );

        return;
      }

      lastSyncUsersRef.current = userListKey;
      roomUserIdsRef.current = ids;
      setExpectedPeersCount(ids.size);
      recomputeCanSendImages();

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = globalThis.setTimeout(() => {
        console.log(`[useWebRTCMesh] Syncing peers: ${ids.size} users in room`);

        for (const existingID of Array.from(peersRef.current.keys())) {
          if (!ids.has(existingID)) {
            console.log(
              `[useWebRTCMesh] Closing peer ${existingID} (left room)`,
            );

            closePeer(existingID);
          }
        }

        for (const peerID of ids) {
          if (
            !peersRef.current.has(peerID) &&
            !creatingPeersRef.current.has(peerID)
          ) {
            void createPeer(peerID).catch((error) => {
              console.error("[useWebRTCMesh] Failed to create peer", error);
            });
          }
        }
      }, 300);
    },
    [room, myID, closePeer, createPeer, recomputeCanSendImages],
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

        if (!roomUserIdsRef.current.has(from)) {
          console.log(
            `[useWebRTCMesh] Ignoring signal from ${from} (not in room users)`,
          );
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
    [room, myID, createPeer, flushPendingIce],
  );

  useEffect(() => {
    debugHandle("[useWebRTCMesh] Ensuring audio track on room enter");

    if (!room || !myID) {
      return;
    }

    if (!micEnabled) {
      return;
    }

    void ensureAudioTrackRef.current().catch((error) => {
      console.error(
        "[useWebRTCMesh] Failed to getUserMedia(audio) on room enter",
        error,
      );
    });
  }, [micEnabled, myID, room]);

  useEffect(() => {
    debugHandle("[useWebRTCMesh] Cleanup on unmount");

    const peers = peersRef.current;
    const transfers = incomingTransfersRef.current;

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      for (const entry of peers.values()) {
        try {
          entry.pc.onicecandidate = null;
          entry.pc.ontrack = null;
          entry.pc.onnegotiationneeded = null;
          entry.pc.onconnectionstatechange = null;
          entry.pc.ondatachannel = null;
          entry.pc.close();
        } catch (error) {
          console.error(
            "[useWebRTCMesh] Failed to close peer connection",
            error,
          );
        }
      }

      peers.clear();

      transfers.clear();

      setIncomingFileTransfers([]);

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

      if (localScreenAudioTrackRef.current) {
        try {
          localScreenAudioTrackRef.current.stop();
        } catch (error) {
          console.error(
            "[useWebRTCMesh] Failed to stop screen audio track",
            error,
          );
        }
      }

      localAudioTrackRef.current = null;
      localCameraTrackRef.current = null;
      localScreenTrackRef.current = null;
      localScreenAudioTrackRef.current = null;

      setRemoteStreams({});
    };
  }, []);

  return {
    localCameraStream,
    localScreenStream,
    remotePeers,

    incomingFileTransfers,

    micEnabled,
    setMicEnabled: setMicEnabledAsync,

    cameraEnabled,
    startCamera,
    stopCamera,

    canSwitchCamera,
    switchCamera,

    screenShareEnabled,
    startScreenShare,
    stopScreenShare,

    handleSignal,
    syncPeersFromRoomUsers,

    canSendImages,
    expectedPeersCount,
    connectedPeersCount,
    sendImage,
  };
}
