import type { IncomingFileTransferProgress } from "../types";

interface FileTransferProgressBarProps {
  incomingFileTransfers: IncomingFileTransferProgress[];
}

export default function FileTransferProgressBar({
  incomingFileTransfers,
}: Readonly<FileTransferProgressBarProps>) {
  if (incomingFileTransfers.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-30 w-[min(320px,90%)]">
      {(() => {
        const total = incomingFileTransfers.length;
        const tr = incomingFileTransfers[0];

        const pct =
          tr && tr.size > 0
            ? Math.max(0, Math.min(1, tr.receivedBytes / tr.size))
            : 0;

        const pctLabel = `${Math.round(pct * 100)}%`;

        return (
          <div className="rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[11px] text-zinc-200 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                Recebendo arquivo{total > 1 ? "s" : ""}…
                {tr ? ` ${tr.name}` : ""}
                {total > 1 ? ` +${total - 1}` : ""}
              </span>
              <span className="shrink-0 text-zinc-100 tabular-nums">
                {pctLabel}
              </span>
            </div>

            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-400/80"
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
