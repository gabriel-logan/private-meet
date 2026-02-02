import { useEffect, useRef } from "react";

export default function RemoteAudio({
  stream,
  muted,
}: Readonly<{ stream: MediaStream; muted: boolean }>) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = ref.current;

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

  return <audio ref={ref} autoPlay />;
}
