import { Trans, useTranslation } from "react-i18next";
import { motion } from "motion/react";

import CreateUser from "../components/CreateUser";
import JoinMeeting from "../components/JoinMeeting";
import { useAuthStore } from "../stores/authStore";

export default function HomePage() {
  const { t } = useTranslation();

  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 text-zinc-100">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]"
      >
        <motion.h1
          animate={{
            opacity: [1, 0.3, 1],
            textShadow: [
              "0 0 0px rgba(99,102,241,0)",
              "0 0 16px rgba(99,102,241,0.6)",
              "0 0 0px rgba(99,102,241,0)",
            ],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-3 text-center text-2xl font-semibold tracking-tight"
        >
          <Trans i18nKey="WelcomeMessage">
            Welcome to <span className="text-indigo-500">Private Meet</span>
          </Trans>
        </motion.h1>

        <p className="mb-8 text-center text-sm leading-relaxed text-zinc-400">
          {t("IntroductionText")}
        </p>

        {accessToken ? <JoinMeeting /> : <CreateUser />}
      </motion.div>
    </main>
  );
}
