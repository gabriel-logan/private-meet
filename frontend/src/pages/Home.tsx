export default function HomePage() {
  const title = "Welcome to the Collaborative App";

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="w-full max-w-md rounded-2xl border border-gray-700/50 bg-gray-800/70 p-8 shadow-2xl backdrop-blur-lg">
        {/** Title */}
        <h1 className="mb-8 animate-pulse bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-center text-3xl font-extrabold text-transparent">
          {title}
        </h1>

        {/** User Creation */}
        <div id="user-creation-form" className="hidden space-y-6">
          <div className="flex flex-col">
            <label
              htmlFor="username-input"
              className="mb-2 text-sm font-medium text-gray-300"
            >
              Username:
            </label>
            <input
              type="text"
              id="username-input"
              placeholder="Enter Your Name"
              className="rounded-xl border border-gray-700 bg-gray-900/70 px-4 py-3 text-white placeholder-gray-500 shadow-inner transition duration-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            id="create-user-button"
            className="w-full transform cursor-pointer rounded-xl bg-green-600 py-3 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:bg-green-500 hover:shadow-green-500/40"
          >
            ✅ Create User
          </button>
        </div>

        {/** Join Room */}
        <div id="join-room-form" className="space-y-6">
          <div className="flex flex-col">
            <label
              htmlFor="room-id-input"
              className="mb-2 text-sm font-medium text-gray-300"
            >
              Room ID:
            </label>
            <input
              type="text"
              id="room-id-input"
              placeholder="Enter Room ID"
              autoComplete="off"
              autoCapitalize="none"
              className="rounded-xl border border-gray-700 bg-gray-900/70 px-4 py-3 text-white placeholder-gray-500 shadow-inner transition duration-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            id="join-room-button"
            className="w-full transform cursor-pointer rounded-xl bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 py-3 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-pink-500/40"
          >
            🚀 Join Room
          </button>

          <button
            id="generate-room-button"
            className="w-full transform cursor-pointer rounded-xl bg-gray-700 py-3 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-600 hover:shadow-gray-500/40"
          >
            🎲 Generate Random Secure Room ID
          </button>

          <button
            id="delete-user-button"
            className="w-full transform cursor-pointer rounded-xl bg-red-600 py-3 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:bg-red-500 hover:shadow-red-500/40"
          >
            🗑️ Delete User
          </button>
        </div>
      </div>
    </main>
  );
}
