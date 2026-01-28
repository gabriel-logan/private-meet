import { useMemo, useRef, useState } from "react";
import {
  FiImage,
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
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";

type ChatMessage = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  isMe?: boolean;
};

type OnlineUser = {
  id: string;
  name: string;
  status?: "online" | "idle";
};

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const onlineUsers: OnlineUser[] = useMemo(
    () => [
      { id: "u1", name: "You", status: "online" },
      { id: "u2", name: "Aline", status: "online" },
      { id: "u3", name: "Bruno", status: "online" },
      { id: "u4", name: "Camila", status: "idle" },
      { id: "u5", name: "Diego", status: "online" },
    ],
    [],
  );

  const messages: ChatMessage[] = useMemo(
    () => [
      {
        id: "m1",
        author: "Aline",
        text: "Oi! Bora testar câmera e áudio?",
        timestamp: "09:14",
      },
      {
        id: "m2",
        author: "You",
        text: "Fechado — já tô aqui.",
        timestamp: "09:14",
        isMe: true,
      },
      {
        id: "m3",
        author: "Bruno",
        text: "Se travar, tenta compartilhar tela só pra ver.",
        timestamp: "09:15",
      },
    ],
    [],
  );

  function trigger(ref: React.RefObject<HTMLInputElement | null>) {
    ref.current?.click();
  }

  return (
    <main className="h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-3 py-4 text-zinc-100 sm:px-6">
      <div className="mx-auto flex h-full w-full flex-col gap-4">
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Meeting Room
            </h1>
            <p className="text-sm text-zinc-400">
              Design-only layout — you will plug real-time logic later.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Connected
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300">
              <FiUsers /> {onlineUsers.length} online
            </span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,2fr)_420px] xl:grid-cols-[320px_minmax(0,3fr)_460px]">
          {/* Users */}
          <aside className="order-3 min-h-0 lg:order-1">
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

          {/* Stage */}
          <section className="order-1 min-h-0 lg:order-2">
            <div className="flex h-full min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FiVideo className="text-zinc-300" />
                  Stage
                </div>

                <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-400">
                  Room: <span className="text-zinc-200">ABCD-1234</span>
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
                  >
                    <FiX />
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Chat */}
          <aside className="order-2 min-h-0 lg:order-3">
            <section className="flex h-full min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FiSend className="text-zinc-300" />
                  Chat
                </div>

                <span className="text-xs text-zinc-500">
                  Press Enter to send (later)
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
                      <p className="mt-1 text-sm text-zinc-100">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 border-t border-zinc-800 p-3">
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
                            setEmojiOpen(false);
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEmojiOpen((v) => !v)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-200 transition hover:bg-zinc-950"
                      aria-label="Open emoji picker"
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

                    <div className="flex-1">
                      <label htmlFor="message" className="sr-only">
                        Message
                      </label>
                      <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write a message…"
                        rows={2}
                        className="min-h-12 w-full resize-none rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500"
                      aria-label="Send message"
                    >
                      <FiSend />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500">
                    Attachments and sending are UI-only here.
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
