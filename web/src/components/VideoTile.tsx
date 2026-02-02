import { useEffect, useRef } from "react";
import { FiMaximize } from "react-icons/fi";

export default function VideoTile({
  stream,
  muted,
  label,
}: Readonly<{ stream: MediaStream; muted: boolean; label: string }>) {
  const ref = useRef<HTMLVideoElement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }

    let cancelled = false;

    const tryPlay = async () => {
      if (cancelled) {
        return;
      }

      try {
        await el.play();
      } catch (error) {
        const name = (error as DOMException | null)?.name;

        if (name === "AbortError" || name === "NotAllowedError") {
          return;
        }

        console.error("Failed to play video element:", error);
      }
    };

    const onLoadedMetadata = () => {
      void tryPlay();
    };

    el.addEventListener("loadedmetadata", onLoadedMetadata);

    void tryPlay();

    return () => {
      cancelled = true;
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [stream]);

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video min-h-40 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/40"
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <track kind="captions" />
      </video>
      <button
        type="button"
        onClick={() => {
          const el = containerRef.current;
          if (!el) {
            return;
          }

          if (document.fullscreenElement) {
            void document.exitFullscreen?.();
            return;
          }

          void el.requestFullscreen?.();
        }}
        className="absolute right-2 bottom-2 z-30 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-black/70 text-zinc-100 shadow-lg backdrop-blur-sm transition hover:bg-black/80"
        aria-label="Toggle fullscreen"
      >
        <FiMaximize className="text-sm" />
      </button>
      <div className="absolute bottom-2 left-2 z-20 rounded-md bg-black/60 px-2 py-1 text-xs text-zinc-100">
        {label}
      </div>
    </div>
  );
}
