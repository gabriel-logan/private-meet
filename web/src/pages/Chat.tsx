import { useEffect, useRef, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import {
  FiImage,
  FiMaximize,
  FiMenu,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiSend,
  FiSmile,
  FiUser,
  FiUsers,
  FiVideo,
  FiVideoOff,
  FiVolume2,
  FiVolumeX,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";

import { chatMaxImageBytes, maxMessageChars } from "../constants";
import useEmoji from "../hooks/useEmoji";
import useInitE2ee from "../hooks/useInitE2ee";
import useWebRTCMesh from "../hooks/useWebRTCMesh";
import {
  decryptWireToText,
  encryptTextToWire,
  isEncryptedWireMessage,
} from "../lib/e2ee";
import { parseJwt } from "../lib/jwt";
import { getWSInstance } from "../lib/wsInstance";
import {
  makeWSMessage,
  parseIncomingWSMessage,
  type WSIncomingMessage,
} from "../protocol/ws";
import { useAuthStore } from "../stores/authStore";
import {
  getTimeLabel,
  isSafeUrl,
  isString,
  normalizeRoomId,
  safeText,
} from "../utils/general";

type ChatMessage =
  | {
      id: string;
      author: string;
      timestamp: string;
      isMe: boolean;
      kind: "text";
      text: string;
    }
  | {
      id: string;
      author: string;
      timestamp: string;
      isMe: boolean;
      kind: "image";
      url: string;
      name: string;
      mime: string;
    };

type OnlineUser = {
  id: string;
  name: string;
  status: "online" | "idle";
};

function VideoTile({
  stream,
  muted,
  label,
}: Readonly<{ stream: MediaStream; muted: boolean; label: string }>) {
  const ref = useRef<HTMLVideoElement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }

    let cancelled = false;

    const tryPlay = async () => {
      if (cancelled) {
        return;
      }

      try {
        await el.play();
      } catch (error) {
        const name = (error as DOMException | null)?.name;

        if (name === "AbortError" || name === "NotAllowedError") {
          return;
        }

        console.error("Failed to play video element:", error);
      }
    };

    const onLoadedMetadata = () => {
      void tryPlay();
    };

    el.addEventListener("loadedmetadata", onLoadedMetadata);

    void tryPlay();

    return () => {
      cancelled = true;
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [stream]);

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video min-h-40 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/40"
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <track kind="captions" />
      </video>
      <button
        type="button"
        onClick={() => {
          const el = containerRef.current;
          if (!el) {
            return;
          }

          if (document.fullscreenElement) {
            void document.exitFullscreen?.();
            return;
          }

          void el.requestFullscreen?.();
        }}
        className="absolute right-2 bottom-2 z-30 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-black/70 text-zinc-100 shadow-lg backdrop-blur-sm transition hover:bg-black/80"
        aria-label="Toggle fullscreen"
      >
        <FiMaximize className="text-sm" />
      </button>
      <div className="absolute bottom-2 left-2 z-20 rounded-md bg-black/60 px-2 py-1 text-xs text-zinc-100">
        {label}
      </div>
    </div>
  );
}

function RemoteAudio({
  stream,
  muted,
}: Readonly<{ stream: MediaStream; muted: boolean }>) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }

    el.muted = muted;

    void el.play().catch((error) => {
      const name = (error as DOMException | null)?.name;

      if (name === "AbortError" || name === "NotAllowedError") {
        return;
      }

      console.error("Failed to play audio element:", error);
    });
  }, [muted, stream]);

  return <audio ref={ref} autoPlay />;
}

function hasVideo(stream: MediaStream | null | undefined): boolean {
  return Boolean(stream && stream.getVideoTracks().length > 0);
}

export default function ChatPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);

  const rawRoomId = (searchParams.get("room") ?? "").trim();
  const room = rawRoomId ? normalizeRoomId(rawRoomId) : "";
  const me = parseJwt(accessToken);

  const { emojiOpen, setEmojiOpen, emojiButtonRef, emojiMenuRef } = useEmoji();

  const [message, setMessage] = useState("");
  const [usersOpen, setUsersOpen] = useState(false);

  const [speakerMuted, setSpeakerMuted] = useState(true);

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const onlineUsersRef = useRef<OnlineUser[]>([]);

  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Failed to revoke object URL:", error);
        }
      }
      objectUrlsRef.current = [];
    };
  }, []);

  const handleIncomingImage = (payload: {
    peerID: string;
    url: string;
    mime: string;
    name: string;
    size: number;
  }) => {
    objectUrlsRef.current.push(payload.url);

    const author =
      onlineUsersRef.current.find((u) => u.id === payload.peerID)?.name ||
      payload.peerID.slice(0, 8);

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        author,
        timestamp: getTimeLabel(),
        isMe: false,
        kind: "image",
        url: payload.url,
        name: payload.name,
        mime: payload.mime,
      },
    ]);
  };

  const {
    localCameraStream,
    localScreenStream,
    remotePeers,
    micEnabled,
    setMicEnabled,
    cameraEnabled,
    startCamera,
    stopCamera,
    screenShareEnabled,
    startScreenShare,
    stopScreenShare,
    handleSignal,
    syncPeersFromRoomUsers,
    canSendImages,
    expectedPeersCount,
    connectedPeersCount,
    sendImage,
  } = useWebRTCMesh({
    room,
    myID: me.sub || "",
    onImageReceived: handleIncomingImage,
  });

  const syncPeersRef = useRef(syncPeersFromRoomUsers);
  useEffect(() => {
    syncPeersRef.current = syncPeersFromRoomUsers;
  }, [syncPeersFromRoomUsers]);

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<number | null>(null);
  const typingSentRef = useRef(false);

  const e2eeKeyRef = useRef<CryptoKey | null>(null);

  const [e2eeReady, setE2eeReady] = useState(false);

  const messageCharCount = Array.from(message).length;

  const canSendImagesToRoom = expectedPeersCount > 0 && canSendImages;

  const tiles = (() => {
    const all: Array<{ key: string; stream: MediaStream; label: string }> = [];

    if (hasVideo(localCameraStream)) {
      all.push({
        key: "local:camera",
        stream: localCameraStream,
        label: cameraEnabled ? "You" : "You (audio)",
      });
    }

    if (hasVideo(localScreenStream)) {
      all.push({
        key: "local:screen",
        stream: localScreenStream,
        label: screenShareEnabled ? "You (screen)" : "You",
      });
    }

    for (const p of remotePeers) {
      if (!hasVideo(p.stream)) {
        continue;
      }

      const label =
        p.kind === "screen"
          ? `${p.peerID.slice(0, 8)} (screen)`
          : p.peerID.slice(0, 8);

      all.push({
        key: `remote:${p.peerID}:${p.kind}`,
        stream: p.stream,
        label,
      });
    }

    return all;
  })();

  const remoteAudioStreams = (() => {
    const byPeer = new Map<string, MediaStream>();

    for (const p of remotePeers) {
      if (p.kind !== "camera") {
        continue;
      }

      if (p.stream.getAudioTracks().length === 0) {
        continue;
      }

      byPeer.set(p.peerID, p.stream);
    }

    return Array.from(byPeer.entries());
  })();

  function trigger(ref: React.RefObject<HTMLInputElement | null>) {
    ref.current?.click();
  }

  async function handleCopyRoomId() {
    if (!rawRoomId.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(rawRoomId);

      toast.success("Room ID copied!");
    } catch (error) {
      console.error("Failed to copy room id:", error);
      toast.error("Failed to copy room ID.");
    }
  }

  function handleLeaveRoom() {
    if (room) {
      try {
        const ws = getWSInstance();

        if (ws.readyState === WebSocket.OPEN) {
          // stop typing before leaving
          ws.send(makeWSMessage("chat.typing", { room, typing: false }));
          ws.send(makeWSMessage("chat.leave", { room }));
        }
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    }

    navigate("/");
  }

  const toggleCamera = async () => {
    try {
      if (cameraEnabled) {
        await stopCamera();
      } else {
        await startCamera();
      }
    } catch (error) {
      console.error("Failed to toggle camera:", error);
      toast.error("Failed to access camera.");
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (screenShareEnabled) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      console.error("Failed to toggle screen share:", error);
      toast.error("Failed to start screen share.");
    }
  };

  async function handleSend() {
    if (onlineUsers.length <= 1) {
      toast.error("No one else is in the room to receive your message.");
      return;
    }

    const text = message.trim();

    if (!text) {
      toast.error("Please enter a message.");
      return;
    }

    if (!room) {
      toast.error("Missing room id.");
      return;
    }

    if (!e2eeKeyRef.current) {
      toast.error("Encryption not ready yet.");
      return;
    }

    try {
      const ws = getWSInstance();

      if (ws.readyState !== WebSocket.OPEN) {
        toast.error("Not connected yet.");
        return;
      }

      // clear typing when sending
      if (typingTimeoutRef.current) {
        globalThis.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      typingSentRef.current = false;

      ws.send(makeWSMessage("chat.typing", { room, typing: false }));

      const encryptedWire = await encryptTextToWire(text, e2eeKeyRef.current, {
        roomId: room,
        userId: me.sub,
        maxPlaintextChars: maxMessageChars,
      });

      ws.send(makeWSMessage("chat.message", { room, message: encryptedWire }));

      setMessage("");
      setEmojiOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send encrypted message.");
    }
  }

  async function handleSendImage(file: File) {
    if (onlineUsers.length <= 1) {
      toast.error("No one else is in the room to receive your image.");
      return;
    }

    if (!canSendImagesToRoom) {
      toast.error(
        "Image sending is only available after WebRTC is connected with everyone in the room.",
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only images are supported for now.");
      return;
    }

    if (file.size > chatMaxImageBytes) {
      toast.error(
        `Image too large (max ${chatMaxImageBytes / (1024 * 1024)}MB for now).`,
      );
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setMessages((prev) => [
      ...prev,
      {
        id,
        author: me.username || "You",
        timestamp: getTimeLabel(),
        isMe: true,
        kind: "image",
        url,
        name: file.name,
        mime: file.type,
      },
    ]);

    try {
      await sendImage(file);
    } catch (error) {
      console.error("Failed to send image over WebRTC:", error);
      toast.error("Failed to send image over WebRTC.");

      setMessages((prev) => prev.filter((m) => m.id !== id));
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
  }

  const typingLabel = (() => {
    const names = Object.values(typingUsers);

    if (names.length === 0) {
      return "";
    }

    if (names.length === 1) {
      return `${names[0]} is typing…`;
    }

    if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing…`;
    }

    return `${names[0]} and ${names.length - 1} others are typing…`;
  })();

  // Initialize E2EE - Should be the first useEffect
  useInitE2ee({ rawRoomId, e2eeKeyRef, setE2eeReady });

  // Scroll to bottom on new message
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Keep online users ref updated
  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  // WebSocket message handling
  useEffect(() => {
    if (!accessToken) {
      toast.error("Please create a user first.");
      navigate("/");
      return;
    }

    if (!room) {
      toast.error("Invalid room.");
      navigate("/");
      return;
    }

    let ws: WebSocket;

    try {
      ws = getWSInstance();
    } catch (error) {
      console.error("WebSocket not initialized.", error);
      toast.error("WebSocket not initialized.");
      navigate("/");
      return;
    }

    if (ws.readyState !== WebSocket.OPEN) {
      toast.error("Connecting… try again in a moment.");
      navigate("/");
      return;
    }

    const onMessage = async (event: MessageEvent) => {
      let parsed: WSIncomingMessage;

      try {
        parsed = await parseIncomingWSMessage(event.data);
      } catch (error) {
        console.error("Error parsing incoming WS message:", error);
        toast.error("Error processing server message.");
        return;
      }

      if (parsed.type === "room.users" && parsed.room === room) {
        const mapped = parsed.data.users
          .map((u) => {
            const id = u.userID;
            const username = u.username;

            const isMe = Boolean(me.sub && id === me.sub);

            return {
              id,
              name: isMe ? me.username || username || "You" : username,
              status: "online",
            } satisfies OnlineUser;
          })
          .filter((u) => isString(u.id) && isString(u.name));

        const unique = new Map<string, OnlineUser>();

        for (const u of mapped) {
          unique.set(u.id, u);
        }

        const users = Array.from(unique.values());

        users.sort((a, b) => {
          const aIsMe = Boolean(me.sub && a.id === me.sub);
          const bIsMe = Boolean(me.sub && b.id === me.sub);

          if (aIsMe && !bIsMe) {
            return -1;
          }

          if (!aIsMe && bIsMe) {
            return 1;
          }

          return a.name.localeCompare(b.name);
        });

        setOnlineUsers(users);

        void syncPeersRef.current(parsed.data.users);

        return;
      }

      if (
        parsed.type === "webrtc.offer" ||
        parsed.type === "webrtc.answer" ||
        parsed.type === "webrtc.iceCandidate"
      ) {
        void handleSignal(parsed);
        return;
      }

      if (parsed.type === "chat.typing" && parsed.room === room) {
        const from = typeof parsed.from === "string" ? parsed.from : "";

        if (!from) {
          return;
        }

        if (me.sub && from === me.sub) {
          return;
        }

        setTypingUsers((prev) => {
          const next = { ...prev };

          if (!parsed.data.typing) {
            delete next[from];

            return next;
          }

          const knownName = onlineUsersRef.current.find(
            (u) => u.id === from,
          )?.name;

          next[from] = knownName || from.slice(0, 8);

          return next;
        });

        return;
      }

      if (parsed.type === "chat.message" && parsed.room === room) {
        const wireText = parsed.data.message;

        if (!wireText) {
          return;
        }

        const from = typeof parsed.from === "string" ? parsed.from : "";

        const isMe = Boolean(me.sub && from && from === me.sub);

        let author = "Unknown";
        if (isMe) {
          author = me.username || "You";
        } else if (from) {
          author =
            onlineUsersRef.current.find((u) => u.id === from)?.name ||
            from.slice(0, 8);
        }

        if (from) {
          setTypingUsers((prev) => {
            if (!(from in prev)) {
              return prev;
            }

            const next = { ...prev };

            delete next[from];

            return next;
          });
        }

        const append = (text: string) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              author,
              kind: "text",
              text,
              timestamp: getTimeLabel(),
              isMe,
            },
          ]);
        };

        const key = e2eeKeyRef.current;

        if (!key) {
          append(
            isEncryptedWireMessage(wireText)
              ? "[Protected message: E2EE not configured]"
              : wireText,
          );

          return;
        }

        if (!isEncryptedWireMessage(wireText)) {
          append(wireText);

          return;
        }

        void decryptWireToText(wireText, key, {
          roomId: room,
          userId: from || undefined,
        })
          .then((plain) => {
            append(plain ?? "[Protected message: failed to decrypt]");
          })
          .catch((error) => {
            console.error("Failed to decrypt message:", error);
            append("[Protected message: failed to decrypt]");
          });

        return;
      }

      if (parsed.type === "general.error") {
        const errorMsg = parsed.data.error || "Unknown error from server.";
        toast.error(`Error: ${errorMsg}`);
      }
    };

    ws.addEventListener("message", onMessage);

    // Join only after listener is attached so we don't miss the initial room.users.
    ws.send(makeWSMessage("chat.join", { room }));

    return () => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(makeWSMessage("chat.typing", { room, typing: false }));
          ws.send(makeWSMessage("chat.leave", { room }));
        }
      } catch (error) {
        console.error("Error leaving room:", error);
      }

      ws.removeEventListener("message", onMessage);
    };
  }, [accessToken, handleSignal, me.sub, me.username, navigate, room]);

  return (
    <main className="h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-3 py-4 text-zinc-100 max-sm:h-auto max-sm:min-h-dvh max-sm:pb-6 sm:px-6">
      {remoteAudioStreams.map(([peerID, stream]) => (
        <RemoteAudio key={peerID} stream={stream} muted={speakerMuted} />
      ))}
      <div className="mx-auto flex h-full w-full flex-col gap-4">
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Meeting Room
            </h1>
            <p className="text-sm text-zinc-400">
              Audio starts on. Enable camera or share screen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUsersOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-950 md:hidden"
              aria-label="Open users"
            >
              <FiMenu />
              Users
            </button>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Connected
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300">
              <FiUsers /> {onlineUsers.length} online
            </span>
          </div>
        </div>

        <div
          className={
            usersOpen
              ? "fixed inset-0 z-50 md:hidden"
              : "pointer-events-none fixed inset-0 z-50 md:hidden"
          }
          aria-hidden={!usersOpen}
        >
          <button
            type="button"
            className={
              usersOpen
                ? "absolute inset-0 bg-black/60 opacity-100 transition-opacity duration-200 ease-out"
                : "absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-200 ease-out"
            }
            aria-label="Close users"
            onClick={() => setUsersOpen(false)}
            tabIndex={usersOpen ? 0 : -1}
          />

          <div
            className={
              usersOpen
                ? "absolute inset-y-0 left-0 w-[86%] max-w-xs translate-x-0 transition-transform duration-200 ease-out will-change-transform"
                : "absolute inset-y-0 left-0 w-[86%] max-w-xs -translate-x-full transition-transform duration-200 ease-out will-change-transform"
            }
          >
            <div className="flex h-full min-h-0 flex-col rounded-r-xl border border-zinc-800 bg-zinc-900/95 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.75)]">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FiUsers className="text-zinc-300" />
                  Users
                  <span className="rounded-full bg-zinc-950 px-2 py-1 text-xs text-zinc-400">
                    {onlineUsers.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUsersOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-200 transition hover:bg-zinc-950"
                  aria-label="Close"
                  tabIndex={usersOpen ? 0 : -1}
                >
                  <FiX />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto p-2">
                <ul className="space-y-1">
                  {onlineUsers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 transition hover:border-zinc-800 hover:bg-zinc-950/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-200">
                          <FiUser />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-100">
                            {u.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {u.status === "idle" ? "Idle" : "Online"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={
                          u.status === "idle"
                            ? "h-2 w-2 rounded-full bg-amber-500"
                            : "h-2 w-2 rounded-full bg-emerald-500"
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 max-sm:grid-rows-none md:grid-cols-2 md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,2fr)_420px] lg:grid-rows-1 xl:grid-cols-[320px_minmax(0,3fr)_460px]">
          <aside className="order-3 hidden min-h-0 md:order-0 md:col-start-2 md:row-start-2 md:block lg:order-1 lg:col-start-auto lg:row-start-auto">
            <section className="flex h-full min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FiUsers className="text-zinc-300" />
                  Users
                </div>
                <span className="rounded-full bg-zinc-950 px-2 py-1 text-xs text-zinc-400">
                  {onlineUsers.length}
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-auto p-2">
                <ul className="space-y-1">
                  {onlineUsers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 transition hover:border-zinc-800 hover:bg-zinc-950/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-200">
                          <FiUser />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-100">
                            {u.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {u.status === "idle" ? "Idle" : "Online"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={
                          u.status === "idle"
                            ? "h-2 w-2 rounded-full bg-amber-500"
                            : "h-2 w-2 rounded-full bg-emerald-500"
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </aside>

          <section className="order-1 row-start-1 min-h-0 max-sm:min-h-[30vh] md:order-0 md:row-span-2 lg:order-2 lg:row-span-1">
            <div className="flex h-full min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FiVideo className="text-zinc-300" />
                  Stage
                </div>

                <span className="flex max-w-[60%] items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-400">
                  Room:
                  <button
                    type="button"
                    onClick={handleCopyRoomId}
                    disabled={!rawRoomId}
                    className={`min-w-0 truncate ${
                      rawRoomId
                        ? "cursor-pointer text-zinc-200 underline decoration-zinc-700 decoration-dotted underline-offset-4 hover:text-white"
                        : "cursor-not-allowed text-zinc-200"
                    }`}
                    title={rawRoomId || "No room"}
                    aria-label="Copy room id"
                  >
                    {rawRoomId || "—"}
                  </button>
                </span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-800 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                  <div className="absolute inset-0 mask-[radial-gradient(circle_at_center,black,transparent_70%)] opacity-50">
                    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(99,102,241,0.15),transparent),linear-gradient(to_top,rgba(0,0,0,0.35),transparent)]" />
                  </div>

                  <div className="relative z-10 h-full p-3">
                    {tiles.length === 0 ? (
                      <div className="grid h-full place-items-center rounded-lg border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className="grid h-12 w-12 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                            <FiVideo />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-100">
                              No video yet
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">
                              Turn on camera or share screen
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid h-full auto-rows-max grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {tiles.map((tile) => (
                          <VideoTile
                            key={tile.key}
                            stream={tile.stream}
                            muted
                            label={tile.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpeakerMuted((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-950"
                    aria-pressed={speakerMuted}
                  >
                    {speakerMuted ? (
                      <FiVolumeX size={28} />
                    ) : (
                      <FiVolume2 size={28} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void setMicEnabled(!micEnabled)}
                    className={
                      micEnabled
                        ? "inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                        : "inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-950"
                    }
                    aria-pressed={micEnabled}
                  >
                    {micEnabled ? <FiMic size={28} /> : <FiMicOff size={28} />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={
                      cameraEnabled
                        ? "inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                        : "inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-950"
                    }
                    aria-pressed={cameraEnabled}
                  >
                    {cameraEnabled ? (
                      <FiVideo size={28} />
                    ) : (
                      <FiVideoOff size={28} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleScreenShare}
                    className={
                      screenShareEnabled
                        ? "hidden items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 sm:inline-flex"
                        : "hidden items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-950 sm:inline-flex"
                    }
                    aria-pressed={screenShareEnabled}
                  >
                    <FiMonitor size={28} />
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-zinc-800"
                    onClick={handleLeaveRoom}
                  >
                    <FaSignOutAlt size={28} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="order-2 row-start-2 min-h-0 max-sm:min-h-[65vh] md:order-0 md:col-start-2 md:row-start-1 lg:order-3 lg:col-start-auto lg:row-start-auto">
            <section className="flex h-full min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FiSend className="text-zinc-300" />
                  Chat
                </div>

                <span className="text-xs text-zinc-500">
                  Enter to send • Shift+Enter for newline
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-auto p-3">
                <div className="space-y-3">
                  {messages.map((m) => {
                    const safeAuthor = String(m.author ?? "");
                    const safeTimestamp = String(m.timestamp ?? "");

                    return (
                      <div
                        key={m.id}
                        className={
                          m.isMe
                            ? "ml-10 rounded-xl border border-indigo-500/20 bg-indigo-600/10 px-3 py-2"
                            : "mr-10 rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2"
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-zinc-300">
                            {safeAuthor}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {safeTimestamp}
                          </p>
                        </div>

                        {m.kind === "text" && (
                          <p className="mt-1 text-sm wrap-break-word whitespace-pre-wrap text-zinc-100">
                            {safeText(m.text ?? "Invalid text")}
                          </p>
                        )}

                        {m.kind === "image" && (
                          <div className="mt-2">
                            {isSafeUrl(m.url) ? (
                              <Link
                                to={safeText(m.url)}
                                download={safeText(m.name ?? "Invalid name")}
                                className="block"
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={safeText(m.url)}
                                  alt={safeText(m.name ?? "Invalid name")}
                                  className="max-h-80 w-full rounded-lg border border-zinc-800 object-contain"
                                  loading="lazy"
                                />
                              </Link>
                            ) : (
                              <p className="text-sm text-red-500">
                                Invalid image URL
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-zinc-400">
                              {safeText(m.name ?? "Invalid name")}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={listEndRef} />
                </div>
              </div>

              <div className="shrink-0 border-t border-zinc-800 p-3">
                {typingLabel ? (
                  <div className="mb-2 rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-300">
                    {typingLabel}
                  </div>
                ) : null}

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    e.target.value = "";

                    if (!file) {
                      return;
                    }

                    void handleSendImage(file);
                  }}
                />

                <div className="relative">
                  {emojiOpen ? (
                    <div
                      ref={emojiMenuRef}
                      className="absolute bottom-[calc(100%+10px)] left-0 z-10 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.75)]"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
                        <p className="text-xs font-medium text-zinc-200">
                          Emojis
                        </p>
                        <button
                          type="button"
                          onClick={() => setEmojiOpen(false)}
                          className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 transition hover:bg-zinc-800"
                        >
                          Close
                        </button>
                      </div>
                      <div className="h-85">
                        <EmojiPicker
                          theme={Theme.DARK}
                          width="100%"
                          height="100%"
                          onEmojiClick={(emojiData: EmojiClickData) => {
                            setMessage((m) => `${m}${emojiData.emoji}`);
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          ref={emojiButtonRef}
                          onClick={() => setEmojiOpen((v) => !v)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-200 transition hover:bg-zinc-950"
                          aria-label="Open emoji picker"
                          aria-expanded={emojiOpen}
                        >
                          <FiSmile />
                        </button>

                        <button
                          type="button"
                          onClick={() => trigger(imageInputRef)}
                          disabled={!canSendImagesToRoom}
                          className={
                            canSendImagesToRoom
                              ? "inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-200 transition hover:bg-zinc-950"
                              : "inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/40 text-zinc-500"
                          }
                          aria-label="Attach image"
                          title={
                            canSendImagesToRoom
                              ? "Attach image"
                              : `Waiting for WebRTC connections (${connectedPeersCount}/${expectedPeersCount})`
                          }
                        >
                          <FiImage />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={!e2eeReady}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500"
                        aria-label="Send message"
                      >
                        <FiSend />
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </div>

                    <div>
                      <label htmlFor="message" className="sr-only">
                        Message
                      </label>
                      <textarea
                        className="max-h-48 min-h-16 w-full resize-none overflow-auto rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-relaxed wrap-break-word text-zinc-100 placeholder-zinc-500 transition focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                        id="message"
                        required
                        maxLength={maxMessageChars}
                        value={message}
                        disabled={!e2eeReady}
                        onChange={(e) => {
                          const next = e.target.value;

                          setMessage(next);

                          if (!room) {
                            return;
                          }

                          try {
                            const ws = getWSInstance();

                            if (ws.readyState !== WebSocket.OPEN) {
                              return;
                            }

                            if (!typingSentRef.current && next.trim() !== "") {
                              typingSentRef.current = true;

                              ws.send(
                                makeWSMessage("chat.typing", {
                                  room,
                                  typing: true,
                                }),
                              );
                            }

                            if (typingTimeoutRef.current) {
                              globalThis.clearTimeout(typingTimeoutRef.current);
                            }

                            typingTimeoutRef.current = globalThis.setTimeout(
                              () => {
                                try {
                                  const ws2 = getWSInstance();

                                  if (ws2.readyState !== WebSocket.OPEN) {
                                    return;
                                  }

                                  typingSentRef.current = false;

                                  ws2.send(
                                    makeWSMessage("chat.typing", {
                                      room,
                                      typing: false,
                                    }),
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error sending typing stop:",
                                    error,
                                  );
                                }
                              },
                              900,
                            );
                          } catch (error) {
                            console.error("Error sending typing start:", error);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleSend();
                          }
                        }}
                        placeholder={
                          e2eeReady
                            ? "Write a message…"
                            : "Initializing encryption…"
                        }
                        rows={3}
                      />

                      <div className="mt-1 flex items-center justify-end text-xs text-zinc-500">
                        {messageCharCount}/{maxMessageChars}
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500">
                    Messages are sent via WebSocket. End-to-end encrypted.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
