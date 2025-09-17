enum COLORS {
  success = "bg-green-500",
  error = "bg-red-500",
  info = "bg-blue-500",
  warn = "bg-yellow-500",
}

interface ShowToastOptions {
  message: string;
  type?: keyof typeof COLORS;
  duration?: number;
}

export default function showToast({
  message,
  type = "info",
  duration = 1500,
}: ShowToastOptions): void {
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 text-white px-4 py-2 rounded shadow-lg";
  notification.classList.add(COLORS[type]);
  notification.textContent = message;
  document.body.appendChild(notification);

  const notificationTimeout = setTimeout(() => {
    document.body.removeChild(notification);
  }, duration);

  notification.addEventListener("mouseover", () => {
    // Pause the timeout on hover
    clearTimeout(notificationTimeout);
  });

  notification.addEventListener("mouseout", () => {
    // Resume the timeout when not hovering
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, duration);
  });

  notification.addEventListener("click", () => {
    clearTimeout(notificationTimeout);
    document.body.removeChild(notification);
  });
}
