import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiUser } from "react-icons/fi";
import { toast } from "react-toastify";
import { motion } from "motion/react";

import apiInstance from "../lib/apiInstance";
import { useAuthStore } from "../stores/authStore";
import getAxiosErrorMessage from "../utils/general";

export default function CreateUser() {
  const { t } = useTranslation();

  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  const [username, setUsername] = useState("");

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await apiInstance.post("/auth/sign-in", {
        username: username.trim(),
      });

      const accessToken = response.data.accessToken;

      setAccessToken(accessToken);

      setUsername("");

      toast.success(t("Success.UserCreated"), { autoClose: 1000 });
    } catch (error) {
      const errorMessage = getAxiosErrorMessage(
        error,
        t("Errors.FailedToCreateUser"),
      );

      console.error("Error creating user:", error);
      toast.error(errorMessage);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4"
    >
      <label htmlFor="username" className="text-sm text-zinc-300">
        {t("Username")}
      </label>

      <input
        required
        id="username"
        type="text"
        name="username"
        placeholder={t("EnterYourUsername")}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 transition focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
      />

      <button
        type="submit"
        className="mt-2 flex items-center justify-center gap-2 rounded-md bg-indigo-600 py-2 text-sm font-medium transition hover:bg-indigo-500"
      >
        <FiUser />
        {t("CreateUser")}
      </button>
    </motion.form>
  );
}
