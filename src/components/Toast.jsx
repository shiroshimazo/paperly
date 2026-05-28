import { useEffect } from "react";
import { CloseIcon } from "./icons";

/**
 * Toast — minimal status banner. Auto-dismisses after `duration` ms.
 *
 * Tone "danger" tints the side rule red-ish via the rose color label so it
 * still reads as on-brand monochrome with a single semantic accent.
 */
export default function Toast({
  open,
  message,
  tone = "info",
  duration = 4000,
  onDismiss,
}) {
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => onDismiss?.(), duration);
    return () => clearTimeout(id);
  }, [open, duration, onDismiss]);

  if (!open) return null;

  const accent =
    tone === "danger"
      ? "var(--color-label-rose)"
      : tone === "success"
        ? "var(--color-label-emerald)"
        : "var(--color-text)";

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "fixed bottom-app-md left-1/2 z-50 -translate-x-1/2 " +
        "min-w-[260px] max-w-[420px] " +
        "rounded-md border border-border bg-card " +
        "shadow-lg shadow-black/10 dark:shadow-black/40 " +
        "animate-[scaleIn_140ms_var(--ease-out-soft,cubic-bezier(0.22,1,0.36,1))] " +
        "flex items-center gap-app-sm py-2 pl-3 pr-2"
      }
    >
      <span
        aria-hidden="true"
        className="h-5 w-[3px] shrink-0 rounded-sm"
        style={{ backgroundColor: accent }}
      />
      <p className="flex-1 text-[0.9rem] leading-snug text-text">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-subtle hover:text-text hover:bg-bg-soft"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
