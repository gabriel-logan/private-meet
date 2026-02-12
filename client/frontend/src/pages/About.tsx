import { Trans, useTranslation } from "react-i18next";
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

type AboutCardItem = Readonly<{
  title: string;
  description: string;
  icon: React.ComponentType;
}>;

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
  const { t } = useTranslation();

  const roadmapCards: readonly AboutCardItem[] = [
    {
      title: t("About.Roadmap.Cards.E2EE.Title"),
      description: t("About.Roadmap.Cards.E2EE.Description"),
      icon: FiLock,
    },
    {
      title: t("About.Roadmap.Cards.Ephemeral.Title"),
      description: t("About.Roadmap.Cards.Ephemeral.Description"),
      icon: FiClock,
    },
    {
      title: t("About.Roadmap.Cards.Files.Title"),
      description: t("About.Roadmap.Cards.Files.Description"),
      icon: FiFile,
    },
    {
      title: t("About.Roadmap.Cards.Turn.Title"),
      description: t("About.Roadmap.Cards.Turn.Description"),
      icon: FiVideo,
    },
  ];

  const currentCards: readonly AboutCardItem[] = [
    {
      title: t("About.CurrentCards.Rooms.Title"),
      description: t("About.CurrentCards.Rooms.Description"),
      icon: FiMessageCircle,
    },
    {
      title: t("About.CurrentCards.Presence.Title"),
      description: t("About.CurrentCards.Presence.Description"),
      icon: FiShield,
    },
    {
      title: t("About.CurrentCards.E2EE.Title"),
      description: t("About.CurrentCards.E2EE.Description"),
      icon: FiLock,
    },
    {
      title: t("About.CurrentCards.WebRTC.Title"),
      description: t("About.CurrentCards.WebRTC.Description"),
      icon: FiVideo,
    },
    {
      title: t("About.CurrentCards.Images.Title"),
      description: t("About.CurrentCards.Images.Description"),
      icon: FiFile,
    },
  ];

  const howItWorksCards: readonly AboutCardItem[] = [
    {
      title: t("About.HowItWorksCards.Auth.Title"),
      description: t("About.HowItWorksCards.Auth.Description"),
      icon: FiKey,
    },
    {
      title: t("About.HowItWorksCards.RoomState.Title"),
      description: t("About.HowItWorksCards.RoomState.Description"),
      icon: FiUsers,
    },
    {
      title: t("About.HowItWorksCards.Media.Title"),
      description: t("About.HowItWorksCards.Media.Description"),
      icon: FiVideo,
    },
    {
      title: t("About.HowItWorksCards.Images.Title"),
      description: t("About.HowItWorksCards.Images.Description"),
      icon: FiFile,
    },
  ];

  const securityCards: readonly AboutCardItem[] = [
    {
      title: t("About.SecurityCards.E2EE.Title"),
      description: t("About.SecurityCards.E2EE.Description"),
      icon: FiLock,
    },
    {
      title: t("About.SecurityCards.KeyModel.Title"),
      description: t("About.SecurityCards.KeyModel.Description"),
      icon: FiShield,
    },
    {
      title: t("About.SecurityCards.Auth.Title"),
      description: t("About.SecurityCards.Auth.Description"),
      icon: FiKey,
    },
  ];

  const tradeoffsCards: readonly AboutCardItem[] = [
    {
      title: t("About.TradeoffsCards.Mesh.Title"),
      description: t("About.TradeoffsCards.Mesh.Description"),
      icon: FiCpu,
    },
    {
      title: t("About.TradeoffsCards.Nat.Title"),
      description: t("About.TradeoffsCards.Nat.Description"),
      icon: FiGlobe,
    },
    {
      title: t("About.TradeoffsCards.Backpressure.Title"),
      description: t("About.TradeoffsCards.Backpressure.Description"),
      icon: FiZap,
    },
  ];

  const faqItems = [
    {
      q: t("About.FaqItems.Q1.Q"),
      a: t("About.FaqItems.Q1.A"),
    },
    {
      q: t("About.FaqItems.Q2.Q"),
      a: t("About.FaqItems.Q2.A"),
    },
    {
      q: t("About.FaqItems.Q3.Q"),
      a: t("About.FaqItems.Q3.A"),
    },
    {
      q: t("About.FaqItems.Q4.Q"),
      a: t("About.FaqItems.Q4.A"),
    },
  ];

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
                {t("About.HeroTitle")}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                {t("About.HeroDescription")}
              </p>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                <p className="text-xs font-medium text-zinc-200">
                  {t("About.OnThisPage")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    {
                      id: "today",
                      label: t("About.OnThisPageLinks.Today"),
                    },
                    { id: "how", label: t("About.OnThisPageLinks.How") },
                    {
                      id: "protocol",
                      label: t("About.OnThisPageLinks.Protocol"),
                    },
                    {
                      id: "security",
                      label: t("About.OnThisPageLinks.Security"),
                    },
                    { id: "limits", label: t("About.OnThisPageLinks.Limits") },
                    { id: "config", label: t("About.OnThisPageLinks.Config") },
                    { id: "deploy", label: t("About.OnThisPageLinks.Deploy") },
                    { id: "faq", label: t("About.OnThisPageLinks.Faq") },
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
                  {t("About.CtaGetStarted")} <FiArrowRight />
                </Link>

                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-4 py-2 text-sm text-zinc-100 transition hover:bg-zinc-950"
                >
                  {t("About.CtaOpenChat")}
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-500">
                    {t("About.Meta.StackLabel")}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {t("About.Meta.StackValue")}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-500">
                    {t("About.Meta.GoalLabel")}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {t("About.Meta.GoalValue")}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-500">
                    {t("About.Meta.RoadmapLabel")}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {t("About.Meta.RoadmapValue")}
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
            title={t("About.Sections.Today.Title")}
            subtitle={t("About.Sections.Today.Subtitle")}
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
            title={t("About.Sections.How.Title")}
            subtitle={t("About.Sections.How.Subtitle")}
          />

          <CardGrid items={howItWorksCards} />

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-emerald-300">
                <FiZap />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {t("About.HighLevelFlow.Title")}
                </h3>
                <ol className="mt-2 space-y-1 text-sm text-zinc-400">
                  <li>{t("About.HighLevelFlow.Steps.Step1")}</li>
                  <li>{t("About.HighLevelFlow.Steps.Step2")}</li>
                  <li>{t("About.HighLevelFlow.Steps.Step3")}</li>
                  <li>{t("About.HighLevelFlow.Steps.Step4")}</li>
                  <li>{t("About.HighLevelFlow.Steps.Step5")}</li>
                  <li>{t("About.HighLevelFlow.Steps.Step6")}</li>
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
            {t("About.Roadmap.Title")}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {t("About.Roadmap.Subtitle")}
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
            title={t("About.Sections.Protocol.Title")}
            subtitle={t("About.Sections.Protocol.Subtitle")}
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                  <FiServer />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {t("About.ProtocolCards.Rest.Title")}
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    <li>
                      <Trans
                        i18nKey="About.ProtocolCards.Rest.GetHealth"
                        t={t}
                        components={[
                          <span
                            className="text-zinc-200"
                            key="rest-get-health"
                          />,
                        ]}
                        key="rest-get-health"
                      />
                    </li>
                    <li>
                      <Trans
                        i18nKey="About.ProtocolCards.Rest.PostSignIn"
                        t={t}
                        components={[
                          <span
                            className="text-zinc-200"
                            key="rest-post-signin"
                          />,
                        ]}
                        key="rest-post-signin"
                      />
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    {t("About.ProtocolCards.Rest.Note")}
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
                    {t("About.ProtocolCards.WebSocket.Title")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    <Trans
                      i18nKey="About.ProtocolCards.WebSocket.Description"
                      t={t}
                      components={[
                        <span className="text-zinc-200" key="ws-desc-1" />,
                        <span className="text-zinc-200" key="ws-desc-2" />,
                        <span className="text-zinc-200" key="ws-desc-3" />,
                        <span className="text-zinc-200" key="ws-desc-4" />,
                      ]}
                    />
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {t("About.ProtocolCards.WebSocket.Note")}
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
                    {t("About.ProtocolCards.MessageTypes.Title")}
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    <li>{t("About.ProtocolCards.MessageTypes.Types.T1")}</li>
                    <li>{t("About.ProtocolCards.MessageTypes.Types.T2")}</li>
                    <li>{t("About.ProtocolCards.MessageTypes.Types.T3")}</li>
                    <li>{t("About.ProtocolCards.MessageTypes.Types.T4")}</li>
                    <li>{t("About.ProtocolCards.MessageTypes.Types.T5")}</li>
                    <li>{t("About.ProtocolCards.MessageTypes.Types.T6")}</li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    {t("About.ProtocolCards.MessageTypes.Note")}
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
            title={t("About.Sections.Security.Title")}
            subtitle={t("About.Sections.Security.Subtitle")}
          />

          <CardGrid items={securityCards} />

          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-500/20 bg-zinc-950 text-amber-300">
                <FiShield />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {t("About.ImportantNote.Title")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                  {t("About.ImportantNote.Body")}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            {t("About.ImportantNote.Footer")}
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
            title={t("About.Sections.Limits.Title")}
            subtitle={t("About.Sections.Limits.Subtitle")}
          />

          <CardGrid items={tradeoffsCards} />

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                {t("About.Caps.Client.Title")}
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                <li>{t("About.Caps.Client.MsgCap")}</li>
                <li>{t("About.Caps.Client.WebRtcPeers")}</li>
                <li>{t("About.Caps.Client.ImageSize")}</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                {t("About.Caps.Server.Title")}
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                <li>{t("About.Caps.Server.RoomId")}</li>
                <li>{t("About.Caps.Server.ChatPayload")}</li>
                <li>{t("About.Caps.Server.WsRead")}</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                {t("About.Caps.Expect.Title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {t("About.Caps.Expect.Body")}
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
            title={t("About.Sections.Config.Title")}
            subtitle={t("About.Sections.Config.Subtitle")}
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-800 bg-zinc-950 text-indigo-300">
                  <FiTool />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {t("About.ConfigCards.Backend.Title")}
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    <li>{t("About.ConfigCards.Backend.Vars.V1")}</li>
                    <li>{t("About.ConfigCards.Backend.Vars.V2")}</li>
                    <li>{t("About.ConfigCards.Backend.Vars.V3")}</li>
                    <li>{t("About.ConfigCards.Backend.Vars.V4")}</li>
                    <li>{t("About.ConfigCards.Backend.Vars.V5")}</li>
                    <li>{t("About.ConfigCards.Backend.Vars.V6")}</li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    <Trans
                      i18nKey="About.ConfigCards.Backend.Note"
                      t={t}
                      components={[
                        <span className="text-zinc-200" key="backend-note-1" />,
                        <span className="text-zinc-200" key="backend-note-2" />,
                      ]}
                    />
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
                    {t("About.ConfigCards.Web.Title")}
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    <li>{t("About.ConfigCards.Web.Vars.V1")}</li>
                    <li>{t("About.ConfigCards.Web.Vars.V2")}</li>
                    <li>{t("About.ConfigCards.Web.Vars.V3")}</li>
                    <li>{t("About.ConfigCards.Web.Vars.V4")}</li>
                    <li>{t("About.ConfigCards.Web.Vars.V5")}</li>
                    <li>{t("About.ConfigCards.Web.Vars.V6")}</li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    {t("About.ConfigCards.Web.Note")}
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
                  {t("About.ConfigCards.SecureContext.Title")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  {t("About.ConfigCards.SecureContext.Body")}
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
            title={t("About.Sections.Deploy.Title")}
            subtitle={t("About.Sections.Deploy.Subtitle")}
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                {t("About.DeployCards.Build.Title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {t("About.DeployCards.Build.Body")}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                <li>{t("About.DeployCards.Build.ServerBinary")}</li>
                <li>{t("About.DeployCards.Build.WebAssets")}</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                {t("About.DeployCards.Spa.Title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {t("About.DeployCards.Spa.Body")}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">
                {t("About.DeployCards.Health.Title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {t("About.DeployCards.Health.Body")}
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
            title={t("About.Sections.Faq.Title")}
            subtitle={t("About.Sections.Faq.Subtitle")}
          />

          <div className="mt-4 grid gap-4">
            {faqItems.map((item) => (
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
              {t("About.Footer.Title")}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {t("About.Footer.Subtitle")}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://github.com/gabriel-logan/private-meet"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-950"
              >
                <FiGithub /> {t("About.Footer.Repo")}
              </a>

              <a
                href="https://github.com/gabriel-logan/private-meet/blob/main/webRTC.md"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-950"
              >
                <FiCode /> {t("About.Footer.WebRTCNotes")}
              </a>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-4 py-2 text-sm text-zinc-100 transition hover:bg-zinc-950"
          >
            {t("About.Footer.BackToHome")} <FiArrowRight />
          </Link>
        </div>
      </div>
    </main>
  );
}
