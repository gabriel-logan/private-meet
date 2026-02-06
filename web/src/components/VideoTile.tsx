import { type JSX, useEffect, useRef, useState } from "react";
import {
  FiColumns,
  FiMaximize,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";

import { debugHandle } from "../utils/general";

type VideoResizeMode = "contain" | "cover" | "fill";

interface VideoTileProps {
  stream: MediaStream;
  muted: boolean;
  label: string;
}

const ResizeModeConfig: Record<
  VideoResizeMode,
  {
    next: VideoResizeMode;
    icon: JSX.Element;
    label: string;
  }
> = {
  contain: {
    next: "cover",
    icon: <FiMinimize2 className="h-4 w-4" />,
    label: "Adjust video (contain)",
  },
  cover: {
    next: "fill",
    icon: <FiMaximize2 className="h-4 w-4" />,
    label: "Adjust video (fill)",
  },
  fill: {
    next: "contain",
    icon: <FiColumns className="h-4 w-4" />,
    label: "Adjust video (cover)",
  },
};

export default function VideoTile({
  stream,
  muted,
  label,
}: Readonly<VideoTileProps>) {
  const ref = useRef<HTMLVideoElement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [resizeMode, setResizeMode] = useState<VideoResizeMode>("contain");

  const resizeConfig = ResizeModeConfig[resizeMode];

  useEffect(() => {
    const el = ref.current;

    debugHandle("VideoTile: ", { stream, el });

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

        debugHandle("Failed to play video element:", error);
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
      className="group relative aspect-video min-h-40 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950/40 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)]"
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`absolute inset-0 z-0 h-full w-full object-${resizeMode}`}
      >
        <track kind="captions" />
      </video>

      <button
        type="button"
        onClick={() => setResizeMode(resizeConfig.next)}
        className="absolute top-3 right-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-black/55 text-zinc-100 opacity-0 shadow-lg backdrop-blur-sm transition group-hover:opacity-100 hover:bg-black/70"
        aria-label={resizeConfig.label}
        title={resizeConfig.label}
      >
        {resizeConfig.icon}
      </button>

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
        className="absolute right-3 bottom-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-black/55 text-zinc-100 opacity-0 shadow-lg backdrop-blur-sm transition group-hover:opacity-100 hover:bg-black/70"
        aria-label="Toggle fullscreen"
      >
        <FiMaximize className="text-sm" />
      </button>

      <div className="absolute bottom-3 left-3 z-20 rounded-md border border-white/10 bg-black/45 px-2 py-1 text-xs text-zinc-100 backdrop-blur-sm">
        {label}
      </div>
    </div>
  );
}
