import { FiAlertCircle } from "react-icons/fi";
import { motion } from "motion/react";

export default function ErrorPage({ message }: Readonly<{ message: string }>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/90 p-8 text-center shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]"
      >
        <div className="mb-4 flex justify-center text-indigo-400">
          <FiAlertCircle size={42} />
        </div>

        <h2 className="mb-1 text-lg font-semibold text-zinc-100">
          Something went wrong
        </h2>

        <p className="text-sm text-zinc-400">{message}</p>
      </motion.div>
    </main>
  );
}
