import { Link } from "react-router";

export default function Header() {
  return (
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
          <Link
            to="/"
            className="transition-all duration-300 hover:from-indigo-300 hover:to-purple-300"
          >
            Private Meet
          </Link>
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
  );
}
