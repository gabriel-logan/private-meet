import { useEffect, useRef } from "react";

import debugHandle from "../actions/debugHandle";

interface RemoteAudioProps {
  stream: MediaStream;
  muted: boolean;
}

export default function RemoteAudio({
  stream,
  muted,
}: Readonly<RemoteAudioProps>) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = ref.current;

    debugHandle("RemoteAudio: ", { stream, muted, el });

    if (!el) {
      return;
    }

    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }

    el.muted = muted;

    void el.play().catch((error) => {
      const name = (error as DOMException | null)?.name;

      if (name === "AbortError" || name === "NotAllowedError") {
        return;
      }

      console.error("Failed to play audio element:", error);
    });
  }, [muted, stream]);

  return (
    <audio ref={ref} autoPlay>
      <track kind="captions" />
    </audio>
  );
}
