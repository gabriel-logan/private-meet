import { useEffect, useState } from "react";
import { FiLogIn, FiShuffle, FiTrash2, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { motion } from "motion/react";

import apiInstance from "../lib/apiInstance";
import { getWSInstance } from "../lib/wsInstance";
import { makeWSMessage, parseIncomingWSMessage } from "../protocol/ws";
import { useAuthStore } from "../stores/authStore";
import getAxiosErrorMessage from "../utils";

function handleGenerateRoomIdClick() {
  try {
    const ws = getWSInstance();

    if (ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected.");
    }

    ws.send(makeWSMessage("utils.generateRoomID"));
  } catch (error) {
    console.error("Error generating Room ID:", error);
    toast.error("Not connected yet. Try again in a second.");
  }
}

export default function HomePage() {
  const { accessToken } = useAuthStore();

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

function CreateUser() {
  const { setAccessToken } = useAuthStore();

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

      toast.success("User created successfully!");
    } catch (error) {
      const errorMessage = getAxiosErrorMessage(
        error,
        "Failed to create user.",
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
        Username
      </label>

      <input
        required
        id="username"
        type="text"
        name="username"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 transition focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
      />

      <button
        type="submit"
        className="mt-2 flex items-center justify-center gap-2 rounded-md bg-indigo-600 py-2 text-sm font-medium transition hover:bg-indigo-500"
      >
        <FiUser />
        Create User
      </button>
    </motion.form>
  );
}

function JoinMeeting() {
  const navigate = useNavigate();

  const { revokeAccessToken } = useAuthStore();

  const [roomId, setRoomId] = useState("");

  function handleJoinRoom() {
    if (!roomId.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }

    const normalized = roomId.trim();

    navigate(`/chat?room=${encodeURIComponent(normalized)}`);
  }

  function handleDeleteUser() {
    revokeAccessToken();
    toast.info("User deleted. Please create a new user to continue.");
  }

  useEffect(() => {
    const ws = getWSInstance();

    ws.onmessage = (event) => {
      try {
        const { type, data } = parseIncomingWSMessage(String(event.data));

        if (type === "utils.generateRoomID") {
          setRoomId(data.roomID);
          toast.success("Generated a new Room ID!");
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        toast.error("Error processing server message.");
      }
    };

    return () => {
      ws.onmessage = null;
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
