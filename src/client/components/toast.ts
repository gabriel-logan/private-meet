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

function getOrCreateContainer(): HTMLElement {
  const id = "toast-container-top-right";

  let el = document.getElementById(id);

  if (el) {
    return el;
  }

  el = document.createElement("div");

  el.id = id;
  el.style.pointerEvents = "none";
  el.className =
    "fixed z-[9999] flex flex-col gap-2 p-4 w-full sm:w-auto top-0 right-0 items-end";

  document.body.appendChild(el);

  return el;
}

function typeIcon(type: keyof typeof COLORS): string {
  const base = 'class="w-5 h-5"';

  switch (type) {
    case "success": {
      return `<svg ${base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
    }
    case "error": {
      return `<svg ${base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
    }
    case "warn": {
      return `<svg ${base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`;
    }
    default: {
      return `<svg ${base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>`;
    }
  }
}

function accentClasses(type: keyof typeof COLORS): string {
  switch (type) {
    case "success": {
      return "text-green-400 ring-green-500/30";
    }
    case "error": {
      return "text-red-400 ring-red-500/30";
    }
    case "warn": {
      return "text-yellow-300 ring-yellow-500/30";
    }
    default: {
      return "text-blue-400 ring-blue-500/30";
    }
  }
}

export default function showToast({
  message,
  type = "info",
  duration = 1500,
}: ShowToastOptions): void {
  const container = getOrCreateContainer();

  // Wrapper to allow pointer events only on the toast
  const wrapper = document.createElement("div");
  wrapper.style.pointerEvents = "auto";

  // Toast
  const toast = document.createElement("div");
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  toast.className = [
    "relative flex items-start gap-3",
    "max-w-[92vw] sm:max-w-md w-[92vw] sm:w-auto",
    "rounded-xl border border-white/10 shadow-2xl",
    "bg-gray-900/85 backdrop-blur-md",
    "px-4 py-3",
    "ring-1",
    accentClasses(type),
    // start hidden for animation
    "opacity-0 translate-x-3",
    "transition-all duration-300 ease-out",
  ]
    .filter(Boolean)
    .join(" ");

  // Accent bar
  const accent = document.createElement("div");
  accent.className = `absolute left-0 top-0 h-full w-1 ${COLORS[type]}`;
  accent.style.borderTopLeftRadius = "12px";
  accent.style.borderBottomLeftRadius = "12px";

  // Icon
  const iconWrap = document.createElement("div");
  iconWrap.className = `flex-shrink-0 mt-0.5 ${accentClasses(type)}`;
  iconWrap.innerHTML = typeIcon(type);

  // Content
  const content = document.createElement("div");
  content.className = "text-sm leading-snug text-gray-100";
  content.textContent = message;

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.className =
    "ml-auto text-gray-400 hover:text-white transition-colors p-1 rounded";
  closeBtn.innerHTML =
    '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';

  // Progress bar
  const progressTrack = document.createElement("div");
  progressTrack.className =
    "absolute left-2 right-2 bottom-1.5 h-1 rounded-full bg-white/10 overflow-hidden";

  const progressBar = document.createElement("div");
  progressBar.className = "h-full rounded-full bg-white/70";
  progressBar.style.width = "100%";

  progressTrack.appendChild(progressBar);

  toast.appendChild(accent);
  toast.appendChild(iconWrap);
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  toast.appendChild(progressTrack);

  wrapper.appendChild(toast);
  container.appendChild(wrapper);

  // Entry animation
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-x-3");
    toast.classList.add("opacity-100", "translate-x-0");
  });

  // Timing control with pause/resume
  let remaining = Math.max(800, duration); // minimum to see animations
  let startedAt = performance.now();

  let hideTimeout: number;

  function startProgress(ms: number): void {
    progressBar.style.transition = "none";

    // Force reflow to apply the transition reset
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    progressBar.offsetHeight;

    progressBar.style.width = "100%";

    // Next frame, animate to 0
    requestAnimationFrame(() => {
      progressBar.style.transition = `width ${ms}ms linear`;
      progressBar.style.width = "0%";
    });
  }

  function pauseProgress(): void {
    const elapsed = performance.now() - startedAt;

    remaining = Math.max(0, remaining - elapsed);

    clearTimeout(hideTimeout);

    // Freeze progress
    const total = Math.max(1, duration);
    const pctLeft = (remaining / total) * 100;

    progressBar.style.transition = "none";
    progressBar.style.width = `${pctLeft}%`;
  }

  function resumeProgress(): void {
    startedAt = performance.now();

    hideTimeout = window.setTimeout(hide, remaining);

    startProgress(remaining);
  }

  function hide(): void {
    // Exit animation
    toast.classList.add("opacity-0", "translate-x-3");

    const done = (): void => {
      wrapper.remove();
    };

    toast.addEventListener("transitionend", done, { once: true });

    // Fallback
    window.setTimeout(done, 400);
  }

  // Start timers
  startProgress(remaining);

  hideTimeout = window.setTimeout(hide, remaining);

  // Interactions
  const pauseEvents = ["mouseenter", "touchstart"];
  const resumeEvents = ["mouseleave", "touchend", "touchcancel"];

  pauseEvents.forEach((ev) => {
    toast.addEventListener(ev, pauseProgress, { passive: true });
  });

  resumeEvents.forEach((ev) => {
    toast.addEventListener(ev, resumeProgress, { passive: true });
  });

  closeBtn.addEventListener("click", () => {
    pauseProgress();

    hide();
  });
}
