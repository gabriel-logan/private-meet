import { FiX } from "react-icons/fi";

type ModalViewImageProps = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

export function ModalViewImage({
  open,
  src,
  alt,
  onClose,
}: Readonly<ModalViewImageProps>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Close image preview"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] max-w-[90vw]">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-100 shadow-lg transition hover:bg-zinc-800"
          aria-label="Close"
        >
          <FiX />
        </button>

        <img
          src={src}
          alt={alt}
          className="max-h-[90vh] max-w-[90vw] rounded-lg border border-zinc-800 bg-black object-contain"
        />
      </div>
    </div>
  );
}
