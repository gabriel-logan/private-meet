import { useEffect, useState } from "react";
import { FiLogIn, FiShuffle, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { motion } from "motion/react";

import handleGenerateRoomIdClick from "../actions/handleGenerateRoomIdClick";
import { maxRoomIDLength } from "../constants";
import { getWSInstance } from "../lib/wsInstance";
import { parseIncomingWSMessage } from "../protocol/ws";
import { useAuthStore } from "../stores/authStore";

export default function JoinMeeting() {
  const navigate = useNavigate();

  const revokeAccessToken = useAuthStore((s) => s.revokeAccessToken);

  const [roomId, setRoomId] = useState("");

  function handleJoinRoom() {
    const normalized = roomId.trim();

    if (!normalized) {
      toast.error("Please enter a Room ID.");
      return;
    }

    if (normalized.length > maxRoomIDLength) {
      toast.error(
        `Room ID is too long (maximum is ${maxRoomIDLength} characters).`,
      );
      return;
    }

    navigate(`/chat?room=${encodeURIComponent(normalized)}`);
  }

  function handleDeleteUser() {
    revokeAccessToken();
    toast.info("User deleted. Please create a new user to continue.");
  }

  useEffect(() => {
    const ws = getWSInstance();

    const onMessage = async (event: MessageEvent) => {
      try {
        const { type, data } = await parseIncomingWSMessage(event.data);

        if (type === "utils.generateRoomID") {
          setRoomId(data.roomID);
          toast.success("Generated a new Room ID!", { autoClose: 1000 });
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        toast.error("Error processing server message.");
      }
    };

    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="roomId" className="text-sm text-zinc-300">
          Room ID
        </label>

        <input
          required
          id="roomId"
          type="text"
          name="roomId"
          placeholder="Enter the room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 transition focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={handleJoinRoom}
        className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 py-2 text-sm font-medium transition hover:bg-indigo-500"
      >
        <FiLogIn />
        Join Room
      </button>

      <button
        type="button"
        onClick={handleGenerateRoomIdClick}
        className="flex items-center justify-center gap-2 rounded-md bg-zinc-800 py-2 text-sm font-medium transition hover:bg-zinc-700"
      >
        <FiShuffle />
        Generate Random Secure Room ID
      </button>

      <button
        type="button"
        onClick={handleDeleteUser}
        className="flex items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 py-2 text-sm font-medium text-red-400 transition hover:bg-zinc-800"
      >
        <FiTrash2 />
        Delete User
      </button>
    </motion.div>
  );
}
