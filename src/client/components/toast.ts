interface ShowToastOptions {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

enum COLORS {
  success = "bg-green-500",
  error = "bg-red-500",
  info = "bg-blue-500",
}

export default function showToast({
  message,
  type = "info",
  duration = 3000,
}: ShowToastOptions): void {
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 text-white px-4 py-2 rounded shadow-lg";
  notification.classList.add(COLORS[type]);
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    document.body.removeChild(notification);
  }, duration);
}
