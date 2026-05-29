import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

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
  duration,
  action,
  onDismiss,
}) {
  // Actionable toasts (e.g. Undo) need a longer reach window than plain ones.
  const dwell = duration ?? (action ? 7000 : 4000);
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => onDismiss?.(), dwell);
    return () => clearTimeout(id);
  }, [open, dwell, onDismiss]);

  const accent =
    tone === "danger"
      ? "var(--color-label-rose)"
      : tone === "success"
        ? "var(--color-label-emerald)"
        : "var(--color-text)";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={
            "fixed bottom-app-md left-1/2 z-50 -translate-x-1/2 " +
            "min-w-[260px] max-w-[420px] " +
            "rounded-md border border-border bg-card " +
            "shadow-lg shadow-black/10 dark:shadow-black/40 " +
            "flex items-center gap-app-sm py-2 pl-3 pr-2"
          }
        >
          <span
            aria-hidden="true"
            className="h-5 w-[3px] shrink-0 rounded-sm"
            style={{ backgroundColor: accent }}
          />
          <p className="flex-1 text-[0.9rem] leading-snug text-text">{message}</p>
          {action ? (
            <button
              type="button"
              onClick={() => {
                action.onAction?.();
                onDismiss?.();
              }}
              className="shrink-0 rounded-sm px-2 py-1 text-label font-medium uppercase tracking-wide text-text hover:bg-bg-soft transition-colors"
            >
              {action.label}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-subtle hover:text-text hover:bg-bg-soft"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
