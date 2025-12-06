export default function ChatPage() {
  return (
    <main className="flex h-screen flex-col bg-gray-900 text-white">
      <div
        id="client-loading"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-white">Connecting...</p>
        </div>
      </div>

      <header className="flex items-center justify-between border-b border-gray-600/50 bg-linear-to-r from-gray-800 via-gray-900 to-gray-800 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center lg:hidden">
          <img
            src="/icons/menu.svg"
            alt="Menu"
            id="menu-icon"
            className="h-6 w-6 cursor-pointer filter transition-all duration-200 hover:scale-110 hover:rotate-180 hover:brightness-125"
          />
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg lg:h-8 lg:w-8">
            <svg
              className="h-4 w-4 text-white lg:h-5 lg:w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
          <h1 className="bg-linear-to-r from-white to-gray-300 bg-clip-text text-lg font-bold text-transparent lg:text-xl">
            <a
              href="/"
              className="transition-all duration-300 hover:from-indigo-300 hover:to-purple-300"
            >
              Private Meet
            </a>
          </h1>
        </div>

        <div className="flex items-center">
          <button
            id="copy-room-id"
            className="group flex cursor-pointer items-center gap-1 rounded-lg bg-linear-to-r from-indigo-600 to-indigo-700 px-2 py-1 text-xs font-medium shadow-md transition-all duration-200 hover:scale-105 hover:from-indigo-500 hover:to-indigo-600 hover:shadow-lg active:scale-95 lg:gap-2 lg:px-4 lg:py-2 lg:text-sm"
          >
            <svg
              className="h-3 w-3 transition-transform group-hover:scale-110 lg:h-4 lg:w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            <span className="hidden sm:inline">Copy Room ID</span>
            <span className="sm:hidden">Copy</span>
          </button>
          <div className="ml-3 hidden items-center gap-2 border-l border-gray-600 pl-3 text-sm text-gray-400 lg:flex">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span>Connected</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden lg:grid lg:min-h-0 lg:grid-cols-12">
        <aside
          id="participants"
          className="fixed top-0 left-0 z-50 h-full w-64 -translate-x-full transform overflow-y-auto border-r border-gray-700 bg-gray-800 p-4 transition-transform duration-300 lg:relative lg:col-span-2 lg:translate-x-0"
        >
          <h2 className="mb-4 text-lg font-semibold">
            Participants <span id="participant-count">0</span>
          </h2>
          <ul id="participant-list" className="space-y-2 text-gray-300"></ul>
        </aside>

        <section
          id="video-container"
          className="relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden bg-black p-4 lg:col-span-7 lg:min-h-0"
        >
          <div
            id="remote-videos"
            className="grid h-full w-full place-items-center gap-4"
          >
            <video
              id="local-video"
              className="aspect-video h-full w-full rounded-lg border border-gray-700 object-cover shadow-lg"
              autoPlay
              playsInline
              controls
            ></video>
          </div>
          <div
            id="controls"
            className="mt-6 flex gap-4 rounded-xl bg-gray-800/80 px-6 py-3 shadow-lg backdrop-blur-md"
          >
            <button
              id="mute-button"
              className="cursor-pointer transition hover:scale-110 active:scale-90"
            >
              <img
                src="/icons/microphone-off-outline.svg"
                alt="Mute"
                className="h-6 w-6 sm:h-12 sm:w-12"
              />
            </button>
            <button
              id="video-button"
              className="cursor-pointer transition hover:scale-110 active:scale-90"
            >
              <img
                src="/icons/video-off-outline.svg"
                alt="Stop Video"
                className="h-6 w-6 sm:h-12 sm:w-12"
              />
            </button>
            <button
              id="share-screen-button"
              className="cursor-pointer transition hover:scale-110 active:scale-90"
            >
              <img
                src="/icons/share-screen-off-outline.svg"
                alt="Share Screen"
                className="h-6 w-6 sm:h-12 sm:w-12"
              />
            </button>
            <button
              id="leave-button"
              className="cursor-pointer transition hover:scale-110 active:scale-90"
            >
              <img
                src="/icons/exit-outline.svg"
                alt="Leave Room"
                className="h-6 w-6 sm:h-12 sm:w-12"
              />
            </button>
          </div>
        </section>

        <section
          id="chat-container"
          className="flex h-[45vh] max-h-[45vh] flex-col border-t border-gray-700 bg-gray-800 lg:col-span-3 lg:h-full lg:max-h-full lg:min-h-0 lg:border-t-0 lg:border-l"
        >
          <div
            id="messages"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 whitespace-pre-wrap"
          ></div>
          <div
            id="typing-indicator"
            className="mt-2 ml-2 hidden text-gray-400"
          ></div>
          <div className="relative flex items-center gap-3 border-t border-gray-700 p-3">
            <button
              id="emoji-toggle"
              className="cursor-pointer rounded-lg p-2 hover:bg-gray-700"
            >
              <img src="/icons/emoji.svg" alt="Emoji" className="h-6 w-6" />
            </button>
            <div
              id="emoji-picker"
              className="absolute bottom-14 left-0 z-50 hidden w-64 rounded-xl border border-gray-700 bg-gray-900 shadow-xl sm:w-72"
            >
              <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
                <span className="text-xs tracking-wide text-gray-400 uppercase">
                  Emojis
                </span>
                <button
                  id="emoji-close"
                  className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto p-2">
                <div className="grid grid-cols-8 gap-2 text-xl leading-none select-none"></div>
              </div>
            </div>
            <textarea
              id="message-input"
              placeholder="Type your message here..."
              maxLength={500}
              rows={1}
              enterKeyHint="next"
              autoComplete="off"
              autoCapitalize="sentences"
              spellCheck="true"
              className="max-h-40 flex-1 resize-none overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            ></textarea>
            <button
              id="send-button"
              className="cursor-pointer rounded-lg p-2 hover:bg-gray-700"
            >
              <img src="/icons/send.svg" alt="Send" className="h-6 w-6" />
            </button>
          </div>
        </section>
      </main>

      <input type="hidden" name="roomId" id="roomId" value="{{ roomId }}" />
      <script src="/chat-bundle.js"></script>
    </main>
  );
}
