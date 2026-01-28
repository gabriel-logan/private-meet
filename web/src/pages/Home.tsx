import { useState } from "react";

import { getWSInstance } from "../lib/wsInstance";
import { useAuthStore } from "../stores/authStore";

export default function HomePage() {
  const { accessToken } = useAuthStore();

  return (
    <main>
      <h1>Welcome to Private Meet!</h1>
      <p>Loren ipsum dolor sit amet, consectetur adipiscing elit.</p>
      {accessToken ? <JoinMeeting /> : <CreateUser />}
    </main>
  );
}

function CreateUser() {
  const [username, setUsername] = useState("");

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const ws = getWSInstance();

    ws.send(
      JSON.stringify({
        type: "create_user",
        data: {
          username,
        },
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="username">Username:</label>
      <input
        required
        id="username"
        type="text"
        name="username"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button type="submit">✅ Create User</button>
    </form>
  );
}

function JoinMeeting() {
  const [roomId, setRoomId] = useState("");

  function handleJoinRoom() {}
  function handleGenerateRoomId() {}
  function handleDeleteUser() {}

  return (
    <div>
      <div>
        <label htmlFor="roomId">Room ID:</label>
        <input
          required
          id="roomId"
          type="text"
          name="roomId"
          placeholder="Enter the room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
      </div>
      <button type="button" onClick={handleJoinRoom}>
        🚀 Join Room
      </button>
      <button type="button" onClick={handleGenerateRoomId}>
        🎲 Generate Random Secure Room ID
      </button>
      <button type="button" onClick={handleDeleteUser}>
        🗑️ Delete User
      </button>
    </div>
  );
}
