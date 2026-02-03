import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import { motion } from "motion/react";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 text-zinc-100">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/90 p-8 text-center shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]"
      >
        <div className="mb-4 flex justify-center text-indigo-400">
          <FiAlertTriangle size={40} />
        </div>

        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          {t("NotFound.PageNotFoundTitle")}
        </h1>

        <p className="text-sm text-zinc-400">
          {t("NotFound.PageNotFoundMessage")}
        </p>
      </motion.div>
    </main>
  );
}
