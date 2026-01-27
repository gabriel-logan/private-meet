export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="loader mb-4 h-32 w-32 rounded-full border-8 border-t-8 border-gray-200 ease-linear"></div>
      <h2 className="text-center text-xl font-semibold text-gray-700">
        Loading...
      </h2>
    </main>
  );
}
