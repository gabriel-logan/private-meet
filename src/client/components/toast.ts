interface ShowToastOptions {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

export default function showToast({
  message,
  type = "info",
  duration = 3000,
}: ShowToastOptions): void {
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg";
  notification.textContent = message;
  document.body.appendChild(notification);

  // TEMPORARY NOT IMPLEMENTED: different styles for different types
  // eslint-disable-next-line no-console
  console.log(type);

  setTimeout(() => {
    document.body.removeChild(notification);
  }, duration);
}
