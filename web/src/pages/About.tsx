import {
  FiArrowRight,
  FiClock,
  FiCode,
  FiCpu,
  FiFile,
  FiGithub,
  FiGlobe,
  FiHelpCircle,
  FiKey,
  FiLock,
  FiMessageCircle,
  FiServer,
  FiShield,
  FiTool,
  FiUsers,
  FiVideo,
  FiZap,
} from "react-icons/fi";
import { Link } from "react-router";
import { motion } from "motion/react";

const roadmapCards = [
  {
    title: "Better E2EE key exchange (next)",
    description:
      "Today E2EE is passphrase-based (shared secret). Next step is a safer key agreement / exchange + better UX so users don't have to manually coordinate secrets.",
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
      "TURN can be enabled in the web client via env config, but the next step is production-grade TURN setup + better diagnostics and UX for unreliable networks.",
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
      "Chat messages are end-to-end encrypted in the browser when participants choose the same passphrase (Web Crypto API). The server only relays encrypted payloads.",
    icon: FiLock,
  },
  {
    title: "WebRTC voice/video/screen share",
    description:
      "Peer-to-peer media with WebRTC (mesh). Signaling is handled over WebSocket (currently capped at ~8 peer connections per client).",
    icon: FiVideo,
  },
  {
    title: "Image sharing (WebRTC data channel)",
    description:
      "Send images directly peer-to-peer in chat. Sending is enabled only when WebRTC is connected with all peers in the room.",
    icon: FiFile,
  },
] as const;

const howItWorksCards = [
  {
    title: "Sign-in → JWT → WebSocket",
    description:
      "Clients get an access token from /auth/sign-in and use it to connect to /ws?token=<jwt>. Room events and WebRTC signaling travel over this socket.",
    icon: FiKey,
  },
  {
    title: "Room state is server-owned",
    description:
      "The server is the single source of truth for room membership. Clients join/leave rooms and the server broadcasts a room.users snapshot.",
    icon: FiUsers,
  },
  {
    title: "Media is peer-to-peer",
    description:
      "Voice/video/screen share flow directly between peers via WebRTC. The server relays signaling only (SDP + ICE).",
    icon: FiVideo,
  },
  {
    title: "Images via RTCDataChannel",
    description:
      "Images are shared peer-to-peer using a WebRTC data channel (images only). The UI gates sending until peers are connected.",
    icon: FiFile,
  },
] as const;

const securityCards = [
  {
    title: "E2EE for chat (client-side)",
    description:
      "Messages can be encrypted in the browser using the Web Crypto API (AES-GCM). The server relays encrypted payloads without needing to decrypt.",
    icon: FiLock,
  },
  {
    title: "Current key model (passphrase-based)",
    description:
      "A key is derived locally from the passphrase using PBKDF2 (salted with the room id). Everyone in the room must use the same passphrase to decrypt messages.",
    icon: FiShield,
  },
  {
    title: "Auth boundary",
    description:
      "WebSocket connections require a valid JWT. In production, the server validates the WS Origin against ALLOWED_ORIGIN.",
    icon: FiKey,
  },
] as const;

const tradeoffsCards = [
  {
    title: "Mesh scalability",
    description:
      "WebRTC mesh means each participant connects to every other participant. This is capped in the client (~8 peers) to keep CPU/bandwidth manageable.",
    icon: FiCpu,
  },
  {
    title: "NAT traversal",
    description:
      "Without TURN, some networks/NATs won't connect reliably. TURN can be configured in env variables; production-grade TURN is a roadmap item.",
    icon: FiGlobe,
  },
  {
    title: "Backpressure + robustness",
    description:
      "The server applies backpressure and may drop messages if overloaded to keep connections responsive. Clients can retry WS connection.",
    icon: FiZap,
  },
] as const;

function SectionHeader({
  id,
  title,
  subtitle,
}: Readonly<{
  id?: string;
  title: string;
  subtitle?: string;
}>) {
  return (
    <div id={id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      ) : null}
    </div>
  );
}

function CardGrid<
  T extends { title: string; description: string; icon: React.ComponentType },
>({
  items,
}: Readonly<{
  items: readonly T[];
}>) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {items.map((card) => {
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
  );
}

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

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                <p className="text-xs font-medium text-zinc-200">
                  On this page
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { id: "today", label: "What exists today" },
                    { id: "how", label: "How it works" },
                    { id: "protocol", label: "API & WS protocol" },
                    { id: "security", label: "Security & privacy" },
                    { id: "limits", label: "Limits & tradeoffs" },
                    { id: "config", label: "Config cheatsheet" },
                    { id: "deploy", label: "Deploy notes" },
                    { id: "faq", label: "FAQ" },
                  ].map((x) => (
                    <a
                      key={x.id}
                      href={`#${x.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-200 transition hover:bg-zinc-950"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400/80" />
                      {x.label}
                    </a>
                  ))}
                </div>
              </div>

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
          <SectionHeader
            id="today"
            title="What exists today"
            subtitle="These features are already available in the current version."
          />
          <CardGrid items={currentCards} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.07 }}
          className="mt-10"
        >
          <SectionHeader
            id="how"
            title="How it works"
            subtitle="A practical view of the moving parts and where data flows."
          />

          <CardGrid items={howItWorksCards} />

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-emerald-300">
                <FiZap />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  High-level flow
                </h3>
                <ol className="mt-2 space-y-1 text-sm text-zinc-400">
                  <li>1) Sign-in → receive JWT</li>
                  <li>2) Connect to WebSocket with the JWT</li>
                  <li>3) Join a room → receive a room.users snapshot</li>
                  <li>4) Chat/typing events flow via WS</li>
                  <li>5) WebRTC offer/answer/ICE exchanged via WS</li>
                  <li>6) Media + image transfer happens peer-to-peer</li>
                </ol>
              </div>
            </div>
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
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.12 }}
          className="mt-10"
        >
          <SectionHeader
            id="protocol"
            title="API & WS protocol"
            subtitle="Endpoints, message types, and what to expect over the wire."
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                  <FiServer />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">REST</h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    <li>
                      <span className="text-zinc-200">GET</span> /health → OK
                    </li>
                    <li>
                      <span className="text-zinc-200">POST</span> /auth/sign-in
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    /auth/sign-in returns an access token used for WS auth.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                  <FiMessageCircle />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    WebSocket
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Connect to <span className="text-zinc-200">/ws</span> with a
                    query token. Messages are JSON with
                    <span className="text-zinc-200"> type</span>, optional
                    <span className="text-zinc-200"> room</span>, and
                    <span className="text-zinc-200"> data</span>.
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    In dev, origin checks are permissive; in prod, Origin must
                    match ALLOWED_ORIGIN.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                  <FiCode />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Message types
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    <li>chat.join / chat.leave</li>
                    <li>chat.message / chat.typing</li>
                    <li>room.users (server snapshot)</li>
                    <li>utils.generateRoomID</li>
                    <li>webrtc.offer / webrtc.answer</li>
                    <li>webrtc.iceCandidate</li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    The frontend type definitions are the best place to explore
                    the schema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
          className="mt-10"
        >
          <SectionHeader
            id="security"
            title="Security & privacy (high-level)"
            subtitle="What the project does today, and what it explicitly does not promise yet."
          />

          <CardGrid items={securityCards} />

          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-500/20 bg-zinc-950 text-amber-300">
                <FiShield />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Important note
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                  Private Meet is privacy-first, but it is still evolving.
                  Today&apos;s E2EE setup is intentionally simple (shared
                  passphrase + local key derivation) and is not positioned as a
                  mature, audited secure messaging protocol.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Note: Private Meet is still evolving. Some privacy and reliability
            improvements are planned.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.17 }}
          className="mt-10"
        >
          <SectionHeader
            id="limits"
            title="Limits & tradeoffs"
            subtitle="Practical constraints that matter in real usage."
          />

          <CardGrid items={tradeoffsCards} />

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                Current caps (client)
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                <li>Message UI cap: 1500 chars</li>
                <li>WebRTC peers: ~8</li>
                <li>Image size: 12MB</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                Current caps (server)
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                <li>Room ID length: up to 128 chars</li>
                <li>Chat payload: up to 5000 runes</li>
                <li>WS read limit: 64KB per message</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                What to expect
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Small rooms work best. For bigger rooms or hostile networks,
                TURN and/or an SFU architecture are the typical next steps.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.19 }}
          className="mt-10"
        >
          <SectionHeader
            id="config"
            title="Config cheatsheet"
            subtitle="Quick mental model for the root .env used by server + web."
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                  <FiTool />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Backend (.env)
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    <li>GO_ENV (development / production)</li>
                    <li>USE_LOCAL_TLS (true / false)</li>
                    <li>SERVER_PORT</li>
                    <li>ALLOWED_ORIGIN</li>
                    <li>JWT_SECRET + JWT_EXPIRATION</li>
                    <li>CONTEXT_TIMEOUT</li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    The server loads{" "}
                    <span className="text-zinc-200">../.env</span>
                    relative to <span className="text-zinc-200">server/</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                  <FiGlobe />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Web (Vite)
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    <li>VITE_HTTP_API_URL</li>
                    <li>VITE_WS_API_URL</li>
                    <li>VITE_HAS_TURN_SERVER</li>
                    <li>VITE_TURN_SERVER_URL</li>
                    <li>VITE_TURN_SERVER_USERNAME</li>
                    <li>VITE_TURN_SERVER_CREDENTIAL</li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    TURN is optional. If disabled, the app uses STUN only.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                <FiLock />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Secure context for WebRTC
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  Browsers require HTTPS for certain WebRTC/media capabilities
                  when not on localhost. The Vite dev server is set up with
                  HTTPS using local cert files.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.21 }}
          className="mt-10"
        >
          <SectionHeader
            id="deploy"
            title="Deploy notes"
            subtitle="What a production deployment looks like for this repo today."
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">Build</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                The repo builds a Go binary and a static web bundle.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                <li>Server binary: server/bin/server</li>
                <li>Web assets: web/dist</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                Serving the SPA
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                The Go server serves the SPA from web/dist and falls back to
                index.html for client-side routes.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                Health checks
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                /health returns OK and is used by platforms like Render.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.23 }}
          className="mt-10"
        >
          <SectionHeader
            id="faq"
            title="FAQ"
            subtitle="Quick answers to the most common questions."
          />

          <div className="mt-4 grid gap-4">
            {[
              {
                q: "Do I need an account?",
                a: "No. The current model issues a short-lived token on sign-in and lets you join rooms without user registration.",
              },
              {
                q: "Is this end-to-end encrypted?",
                a: "Chat messages can be client-side encrypted. The current key derivation is room-id based (simple/dev approach) and will evolve toward a safer key exchange.",
              },
              {
                q: "Why do calls fail on some networks?",
                a: "Some NAT/firewall setups require TURN. You can enable TURN in env, but a robust production TURN setup is still part of the roadmap.",
              },
              {
                q: "Why cap the room size / peer connections?",
                a: "Mesh WebRTC grows quadratically with participants. The cap avoids melting CPUs and uplinks.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                    <FiHelpCircle />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {item.q}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-zinc-100">
              Want to help shape the roadmap?
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Iterate on UX, encryption, and WebRTC features.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://github.com/gabriel-logan/private-meet"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-950"
              >
                <FiGithub /> Repo
              </a>

              <a
                href="https://github.com/gabriel-logan/private-meet/blob/main/webRTC.md"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-950"
              >
                <FiCode /> WebRTC notes
              </a>
            </div>
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
