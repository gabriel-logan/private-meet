export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      <p className="text-sm font-medium text-white">Connecting...</p>
    </div>
  );
}
