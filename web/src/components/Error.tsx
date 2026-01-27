export default function ErrorPage({ message }: Readonly<{ message: string }>) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-red-100">
      <div className="mb-4 rounded-full bg-red-500 p-4">
        <svg
          className="h-16 w-16 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414 1.414M21 12h-3M6 12H3m15.364 6.364l-1.414-1.414M6.343 6.343L4.929 4.929M16.95 19.071l-1.414-1.414M8.464 7.879L7.05 6.464"
          ></path>
        </svg>
      </div>
      <h2 className="text-center text-xl font-semibold text-red-700">
        {message}
      </h2>
    </main>
  );
}
