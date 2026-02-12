import { useTranslation } from "react-i18next";
import { FiLogIn, FiShuffle, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

import handleDeleteUser from "../actions/handleDeleteUser";
import handleGenerateRoomIdClick from "../actions/handleGenerateRoomIdClick";
import handleJoinRoom from "../actions/handleJoinRoom";
import { maxRoomIDLength } from "../constants";
import useGenerateRoomID from "../hooks/useGenerateRoomID";
import { useAuthStore } from "../stores/authStore";
import { useSecretStore } from "../stores/secretStore";

export default function JoinMeeting() {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const revokeAccessToken = useAuthStore((s) => s.revokeAccessToken);

  const { passphrase, setPassphrase, clearPassphrase } = useSecretStore();

  const { roomId, setRoomId } = useGenerateRoomID();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="roomId" className="text-sm text-zinc-300">
          {t("JoinMeeting.RoomID")}
        </label>

        <input
          required
          id="roomId"
          type="text"
          name="roomId"
          placeholder={t("JoinMeeting.EnterRoomID")}
          maxLength={128}
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 transition focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="passphrase" className="text-sm text-zinc-300">
          {t("JoinMeeting.Passphrase")}
        </label>

        <input
          id="passphrase"
          type="password"
          name="passphrase"
          maxLength={128}
          placeholder={t("JoinMeeting.EnterPassphrase")}
          value={passphrase ?? ""}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 transition focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
        />

        <p className="mb-1 text-xs text-zinc-500">
          {t("JoinMeeting.PText1", { maxRoomIDLength })}
        </p>

        <p className="mb-1 text-xs text-zinc-500">{t("JoinMeeting.PText2")}</p>
      </div>

      <button
        type="button"
        onClick={() =>
          handleJoinRoom({ roomId, passphrase, clearPassphrase, navigate })
        }
        className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 py-2 text-sm font-medium transition hover:bg-indigo-500"
      >
        <FiLogIn />
        {t("JoinMeeting.JoinRoomButton")}
      </button>

      <button
        type="button"
        onClick={handleGenerateRoomIdClick}
        className="flex items-center justify-center gap-2 rounded-md bg-zinc-800 py-2 text-sm font-medium transition hover:bg-zinc-700"
      >
        <FiShuffle />
        {t("JoinMeeting.GenerateNewRoomIDButton")}
      </button>

      <button
        type="button"
        onClick={() => handleDeleteUser({ revokeAccessToken })}
        className="flex items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 py-2 text-sm font-medium text-red-400 transition hover:bg-zinc-800"
      >
        <FiTrash2 />
        {t("JoinMeeting.DeleteUserButton")}
      </button>
    </motion.div>
  );
}
