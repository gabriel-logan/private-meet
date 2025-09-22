import type { Socket } from "socket.io-client";
import type { RoomsUserMapValue } from "src/chat/dto/get-user.dto";
import { ONLINE_USERS } from "src/shared/constants/socket-events";

interface HandleWebrtcParams {
  socket: Socket;
  roomId: string;
  localVideo: HTMLVideoElement;
  remoteVideosContainer: HTMLDivElement;
  buttonToggleMic: HTMLButtonElement;
  buttonToggleVideo: HTMLButtonElement;
  buttonShareScreen: HTMLButtonElement;
  getUser: () => { userId?: string; username?: string };
  getOnlineUsers: () => { userId: string; username: string }[];
}

const rtcConfig: RTCConfiguration = {
  iceServers: [
    // Google
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },

    // Mozilla
    { urls: "stun:stun.services.mozilla.com" },

    // Twilio
    { urls: "stun:global.stun.twilio.com:3478" },

    // Open relay
    {
      urls: [
        "stun:stun.stunprotocol.org:3478",
        "stun:stun.sipnet.net:3478",
        "stun:stun.ideasip.com:3478",
        "stun:stun.iptel.org:3478",
        "stun:stun.voipstunt.com:3478",
        "stun:stun.voipbuster.com:3478",
        "stun:stun.counterpath.net:3478",
        "stun:stun.xten.com:3478",
      ],
    },
  ],
};

interface PeerContext {
  pc: RTCPeerConnection;
  remoteUserId: string;
  remoteVideoEl?: HTMLVideoElement;
}

export default async function handleWebrtc({
  socket,
  roomId,
  localVideo,
  remoteVideosContainer,
  buttonToggleMic,
  buttonToggleVideo,
  buttonShareScreen,
  getUser,
  getOnlineUsers,
}: HandleWebrtcParams): Promise<void> {
  const { userId } = getUser();

  if (!userId) {
    // eslint-disable-next-line no-console
    console.warn("[WebRTC] userId unavailable");
    return;
  }

  // eslint-disable-next-line no-console
  console.debug("[WebRTC] Init userId:", userId);

  // ---------- Local Media ----------
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  localVideo.srcObject = localStream;

  const audioTrack = localStream.getAudioTracks()[0];
  const videoTrack = localStream.getVideoTracks()[0];

  // ---------- State ----------
  const peers = new Map<string, PeerContext>();
  let isScreenSharing = false;

  const originalCameraTrack: MediaStreamTrack | null = videoTrack;
  let latestOnlineUsers: { userId: string; username: string }[] = [];

  // ---------- UI Handlers ----------
  function updateMicButton(): void {
    const img = buttonToggleMic.querySelector("img");

    if (!img) {
      return;
    }

    img.src = audioTrack.enabled
      ? "/icons/microphone-on-outline.svg"
      : "/icons/microphone-off-outline.svg";
  }

  function updateVideoButton(): void {
    const img = buttonToggleVideo.querySelector("img");

    if (!img) {
      return;
    }

    img.src = videoTrack.enabled
      ? "/icons/video-on-outline.svg"
      : "/icons/video-off-outline.svg";
  }

  function updateScreenShareButton(): void {
    const img = buttonShareScreen.querySelector("img");

    if (!img) {
      return;
    }

    img.src = isScreenSharing
      ? "/icons/share-screen-on-outline.svg"
      : "/icons/share-screen-off-outline.svg";
  }

  updateMicButton();
  updateVideoButton();
  updateScreenShareButton();

  buttonToggleMic.addEventListener("click", () => {
    audioTrack.enabled = !audioTrack.enabled;
    updateMicButton();
  });

  buttonToggleVideo.addEventListener("click", () => {
    videoTrack.enabled = !videoTrack.enabled;
    updateVideoButton();
  });

  async function toggleScreenShare(): Promise<void> {
    try {
      if (!isScreenSharing) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = displayStream.getVideoTracks()[0];

        isScreenSharing = true;
        updateScreenShareButton();
        replaceVideoTrack(screenTrack);

        screenTrack.onended = (): void => {
          isScreenSharing = false;
          updateScreenShareButton();

          if (originalCameraTrack) {
            replaceVideoTrack(originalCameraTrack);
          }
        };
      } else {
        isScreenSharing = false;
        updateScreenShareButton();

        if (originalCameraTrack) {
          replaceVideoTrack(originalCameraTrack);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[WebRTC] Failed to share screen", e);
    }
  }

  buttonShareScreen.addEventListener("click", () => {
    void toggleScreenShare();
  });

  function replaceVideoTrack(newTrack: MediaStreamTrack): void {
    peers.forEach(({ pc }) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video") {
          sender.replaceTrack(newTrack).catch(() => {});
        }
      });
    });

    const ls = localVideo.srcObject as MediaStream | null;

    if (ls) {
      ls.getVideoTracks().forEach((t) => ls.removeTrack(t));
      ls.addTrack(newTrack);
    }
  }

  // ---------- Peer Connection Helpers ----------
  function ensureRemoteVideo(remoteUserId: string): HTMLVideoElement {
    const existing = document.getElementById(
      `remote-video-${remoteUserId}`,
    ) as HTMLVideoElement | null;

    if (existing) {
      return existing;
    }

    const video = document.createElement("video");
    video.id = `remote-video-${remoteUserId}`;
    video.autoplay = true;
    video.playsInline = true;
    video.classList.add(
      "rounded-lg",
      "shadow-lg",
      "w-full",
      "h-full",
      "object-cover",
      "aspect-video",
    );
    video.playsInline = true;

    video.title = remoteUserId;

    remoteVideosContainer.appendChild(video);

    return video;
  }

  function createPeer(remoteUserId: string): PeerContext {
    // eslint-disable-next-line no-console
    console.debug("[WebRTC] createPeer", remoteUserId);

    const pc = new RTCPeerConnection(rtcConfig);

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (ev): void => {
      // eslint-disable-next-line no-console
      console.debug("[WebRTC] ontrack from", remoteUserId);

      const [stream] = ev.streams;
      const videoEl = ensureRemoteVideo(remoteUserId);

      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    };

    pc.onicecandidate = (ev): void => {
      if (ev.candidate) {
        socket.emit("webrtc-ice-candidate", {
          roomId,
          to: remoteUserId,
          candidate: ev.candidate,
        });
      }
    };

    pc.onconnectionstatechange = (): void => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        peers.delete(remoteUserId);
      }
    };

    const ctx: PeerContext = { pc, remoteUserId };

    peers.set(remoteUserId, ctx);

    return ctx;
  }

  async function createAndSendOffer(remoteUserId: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.debug("[WebRTC] offer ->", remoteUserId);

    const ctx = peers.get(remoteUserId) ?? createPeer(remoteUserId);
    const { pc } = ctx;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("webrtc-offer", {
      roomId,
      to: remoteUserId,
      offer,
    });
  }

  async function handleIncomingOffer(
    from: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.debug("[WebRTC] recv offer from", from);

    const ctx = peers.get(from) ?? createPeer(from);
    const { pc } = ctx;

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("webrtc-answer", {
      roomId,
      to: from,
      answer,
    });
  }

  async function handleIncomingAnswer(
    from: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.debug("[WebRTC] recv answer from", from);

    const ctx = peers.get(from);

    if (!ctx) {
      return;
    }

    await ctx.pc.setRemoteDescription(answer);
  }

  async function handleIncomingCandidate(
    from: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const ctx = peers.get(from);

    if (!ctx) {
      return;
    }

    try {
      await ctx.pc.addIceCandidate(candidate);
    } catch {
      // ignore
    }
  }

  // ---------- Connection Strategy ----------
  function initiateConnections(): void {
    const me = getUser().userId;

    if (!me) {
      return;
    }

    latestOnlineUsers.forEach((u) => {
      if (u.userId === me) {
        return;
      }

      if (me < u.userId && !peers.has(u.userId)) {
        void createAndSendOffer(u.userId);
      }
    });
  }

  // ---------- Online Users ----------
  function onOnlineUsers(users: RoomsUserMapValue[]): void {
    if (!Array.isArray(users)) {
      return;
    }

    latestOnlineUsers = users;
    initiateConnections();
  }

  socket.on(ONLINE_USERS, onOnlineUsers);

  // ---------- Signaling ----------
  function onWebrtcOffer(data: {
    from: string;
    to?: string;
    offer: RTCSessionDescriptionInit;
  }): void {
    const me = getUser().userId;

    if (!me) {
      return;
    }

    const { from, to, offer } = data;

    if (from === me) {
      return;
    }

    if (to && to !== me) {
      return;
    }

    void handleIncomingOffer(from, offer);
  }

  function onWebrtcAnswer(data: {
    from: string;
    to?: string;
    answer: RTCSessionDescriptionInit;
  }): void {
    const me = getUser().userId;

    if (!me) {
      return;
    }

    const { from, to, answer } = data;

    if (from === me) {
      return;
    }

    if (to && to !== me) {
      return;
    }

    void handleIncomingAnswer(from, answer);
  }

  function onWebrtcIce(data: {
    from: string;
    to?: string;
    candidate: RTCIceCandidateInit;
  }): void {
    const me = getUser().userId;

    if (!me) {
      return;
    }

    const { from, to, candidate } = data;

    if (from === me) {
      return;
    }

    if (to && to !== me) {
      return;
    }

    void handleIncomingCandidate(from, candidate);
  }

  socket.on("webrtc-offer", onWebrtcOffer);
  socket.on("webrtc-answer", onWebrtcAnswer);
  socket.on("webrtc-ice-candidate", onWebrtcIce);

  // ---------- User Left ----------
  function onUserLeft(data: { userId: string }): void {
    const ctx = peers.get(data.userId);

    if (ctx) {
      ctx.pc.close();
      peers.delete(data.userId);

      const el = document.getElementById(`remote-video-${data.userId}`);

      if (el) {
        el.remove();
      }
    }
  }

  socket.on("left_room", onUserLeft);

  // ---------- Initial Fallback ----------
  try {
    latestOnlineUsers = getOnlineUsers().filter((u) => !!u.userId);
    initiateConnections();
  } catch {
    // ignore
  }
}
