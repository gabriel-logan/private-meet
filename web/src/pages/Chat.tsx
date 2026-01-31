import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiImage,
  FiMenu,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiPaperclip,
  FiSend,
  FiSmile,
  FiUser,
  FiUsers,
  FiVideo,
  FiVolume2,
  FiVolumeX,
  FiX,
} from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";

import { maxMessageChars } from "../constants";
import useInitE2ee from "../hooks/useInitE2ee";
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
import { getTimeLabel, isString, normalizeRoomId } from "../utils";

type ChatMessage = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  isMe: boolean;
};

type OnlineUser = {
  id: string;
  name: string;
  status: "online" | "idle";
};

export default function ChatPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);

  const rawRoomId = (searchParams.get("room") ?? "").trim();
  const room = useMemo(
    () => (rawRoomId ? normalizeRoomId(rawRoomId) : ""),
    [rawRoomId],
  );
  const me = useMemo(() => parseJwt(accessToken), [accessToken]);

  const [message, setMessage] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);

  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const onlineUsersRef = useRef<OnlineUser[]>([]);

  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<number | null>(null);
  const typingSentRef = useRef(false);

  const e2eeKeyRef = useRef<CryptoKey | null>(null);

  const [e2eeReady, setE2eeReady] = useState(false);

  const messageCharCount = useMemo(() => Array.from(message).length, [message]);

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

  const typingLabel = useMemo(() => {
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
  }, [typingUsers]);

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
    } catch {
      toast.error("WebSocket not initialized.");
      navigate("/");
      return;
    }

    if (ws.readyState !== WebSocket.OPEN) {
      toast.error("Connecting… try again in a moment.");
      navigate("/");
      return;
    }

    const onMessage = (event: MessageEvent) => {
      let parsed: WSIncomingMessage;

      try {
        parsed = parseIncomingWSMessage(String(event.data));
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
  }, [accessToken, me.sub, me.username, navigate, room]);

  return (
    <main className="h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-3 py-4 text-zinc-100 sm:px-6">
      <div className="mx-auto flex h-full w-full flex-col gap-4">
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Meeting Room
            </h1>
            <p className="text-sm text-zinc-400">
              Text chat enabled. WebRTC tiles later.
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

        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,2fr)_420px] lg:grid-rows-1 xl:grid-cols-[320px_minmax(0,3fr)_460px]">
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

          <section className="order-1 row-start-1 min-h-0 md:order-0 md:row-span-2 lg:order-2 lg:row-span-1">
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
                <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                  <div className="absolute inset-0 mask-[radial-gradient(circle_at_center,black,transparent_70%)] opacity-50">
                    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(99,102,241,0.15),transparent),linear-gradient(to_top,rgba(0,0,0,0.35),transparent)]" />
                  </div>

                  <div className="relative flex max-w-md flex-col items-center gap-3 px-6 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                      <FiVideo />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Camera / Screen Share Area
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Placeholder for WebRTC tiles (design only)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpeakerMuted((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-950"
                    aria-pressed={speakerMuted}
                  >
                    {speakerMuted ? <FiVolumeX /> : <FiVolume2 />}
                    {speakerMuted ? "Unmute" : "Mute"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMicEnabled((v) => !v)}
                    className={
                      micEnabled
                        ? "inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                        : "inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-950"
                    }
                    aria-pressed={micEnabled}
                  >
                    {micEnabled ? <FiMic /> : <FiMicOff />}
                    {micEnabled ? "Mic on" : "Mic off"}
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-950"
                  >
                    <FiMonitor />
                    Share screen
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-zinc-800"
                    onClick={handleLeaveRoom}
                  >
                    <FiX />
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="order-2 row-start-2 min-h-0 md:order-0 md:col-start-2 md:row-start-1 lg:order-3 lg:col-start-auto lg:row-start-auto">
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
                  {messages.map((m) => (
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
                          {m.author}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {m.timestamp}
                        </p>
                      </div>
                      <p className="mt-1 text-sm wrap-break-word whitespace-pre-wrap text-zinc-100">
                        {m.text}
                      </p>
                    </div>
                  ))}
                  <div ref={listEndRef} />
                </div>
              </div>

              <div className="shrink-0 border-t border-zinc-800 p-3">
                {typingLabel ? (
                  <div className="mb-2 rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-300">
                    {typingLabel}
                  </div>
                ) : null}

                <input ref={fileInputRef} type="file" className="hidden" />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                />

                <div className="relative">
                  {emojiOpen ? (
                    <div className="absolute bottom-[calc(100%+10px)] left-0 z-10 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.75)]">
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
                          onClick={() => setEmojiOpen((v) => !v)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-200 transition hover:bg-zinc-950"
                          aria-label="Open emoji picker"
                          aria-expanded={emojiOpen}
                        >
                          <FiSmile />
                        </button>

                        <button
                          type="button"
                          onClick={() => trigger(fileInputRef)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-200 transition hover:bg-zinc-950"
                          aria-label="Attach file"
                          title="Attach file"
                        >
                          <FiPaperclip />
                        </button>

                        <button
                          type="button"
                          onClick={() => trigger(imageInputRef)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-200 transition hover:bg-zinc-950"
                          aria-label="Attach image"
                          title="Attach image"
                        >
                          <FiImage />
                        </button>

                        <button
                          type="button"
                          onClick={() => trigger(videoInputRef)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-200 transition hover:bg-zinc-950"
                          aria-label="Attach video"
                          title="Attach video"
                        >
                          <FiVideo />
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
