export default function ChatPage() {
  return (
    <main className="flex h-screen flex-1 flex-col overflow-hidden bg-gray-900 text-white lg:grid lg:min-h-0 lg:grid-cols-12">
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
  );
}
