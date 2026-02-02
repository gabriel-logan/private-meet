import { motion } from "motion/react";

import CreateUser from "../components/CreateUser";
import JoinMeeting from "../components/JoinMeeting";
import { useAuthStore } from "../stores/authStore";

export default function HomePage() {
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
          Welcome to <span className="text-indigo-400">Private Meet</span>
        </motion.h1>

        <p className="mb-8 text-center text-sm leading-relaxed text-zinc-400">
          Private Meet is a lightweight, secure space for instant private
          meetings. Create a user, generate a room, and connect — no friction,
          no noise.
        </p>

        {accessToken ? <JoinMeeting /> : <CreateUser />}
      </motion.div>
    </main>
  );
}
