import {
  FiArrowRight,
  FiClock,
  FiFile,
  FiLock,
  FiMessageCircle,
  FiShield,
  FiVideo,
} from "react-icons/fi";
import { Link } from "react-router";
import { motion } from "motion/react";

const roadmapCards = [
  {
    title: "Better E2EE key exchange (next)",
    description:
      "Today E2EE uses a simple room-based secret. Next step is a safer key exchange and UX for shared secrets.",
    icon: FiLock,
  },
  {
    title: "Temporary messages (next)",
    description:
      "Ephemeral messages with expiration policies so chats don't live forever by default.",
    icon: FiClock,
  },
  {
    title: "More file types (next)",
    description:
      "Generalize file sharing beyond images, with clear limits, previews, and privacy-first defaults.",
    icon: FiFile,
  },
  {
    title: "TURN + reliability (next)",
    description:
      "Improve NAT traversal and connection reliability by adding TURN support and better diagnostics.",
    icon: FiVideo,
  },
] as const;

const currentCards = [
  {
    title: "Rooms + real-time text chat",
    description:
      "Join a room and exchange messages in real time over WebSocket with a responsive UI.",
    icon: FiMessageCircle,
  },
  {
    title: "Presence + typing",
    description: "See who's online in the room and when someone is typing.",
    icon: FiShield,
  },
  {
    title: "Client-side encrypted chat (E2EE)",
    description:
      "Chat messages can be encrypted client-side using the Web Crypto API (current key setup is simple and will be improved).",
    icon: FiLock,
  },
  {
    title: "WebRTC voice/video/screen share",
    description:
      "Peer-to-peer media with WebRTC (mesh). Signaling is handled over WebSocket.",
    icon: FiVideo,
  },
  {
    title: "Image sharing (WebRTC data channel)",
    description:
      "Send images directly peer-to-peer in chat. Sending is enabled only when WebRTC is connected with all peers in the room.",
    icon: FiFile,
  },
] as const;

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-zinc-100 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]"
        >
          <div className="relative px-6 py-10 sm:px-10">
            <div className="absolute inset-0 opacity-60">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.10),transparent_55%)]" />
            </div>

            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Private Meet
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Private meetings, minimal friction.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                Private Meet is a lightweight real-time chat + meeting
                experience. It already supports client-side encrypted chat,
                WebRTC media, and image sharing over WebRTC data channels. Next,
                the focus is improving reliability and polishing the privacy
                model.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                  Get started <FiArrowRight />
                </Link>

                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-4 py-2 text-sm text-zinc-100 transition hover:bg-zinc-950"
                >
                  Open chat
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-500">Stack</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    React + WebSocket + WebRTC + Go
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-500">Goal</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    Privacy-first defaults
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-500">Roadmap</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    Better E2EE, ephemeral, files, reliability
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            What exists today
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            These features are already available in the current version.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {currentCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                      <Icon />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {card.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
          className="mt-10"
        >
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            Where this is going
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            The next milestones to turn this into a fully private meeting
            experience.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {roadmapCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)] transition hover:border-indigo-500/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                        <Icon />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">
                          {card.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
          className="mt-10"
        >
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            Privacy model (high-level)
          </h2>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                Client-side encryption
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Clients can encrypt chat messages locally. The server acts as a
                relay for encrypted payloads (current key setup is intentionally
                simple and will be improved).
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                Minimal retention
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                The direction is to keep retention minimal. A future milestone
                is ephemeral messages and expiration policies.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                WebRTC for media
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Voice, video, and screen share flow peer-to-peer via WebRTC when
                possible, with the server used mainly for signaling.
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Note: Private Meet is still evolving. Some privacy and reliability
            improvements are planned.
          </p>
        </motion.section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-zinc-100">
              Want to help shape the roadmap?
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Iterate on UX, encryption, and WebRTC features.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-4 py-2 text-sm text-zinc-100 transition hover:bg-zinc-950"
          >
            Back to Home <FiArrowRight />
          </Link>
        </div>
      </div>
    </main>
  );
}
