import { useEffect, useRef } from "react";
import { CloseIcon } from "./icons";

/**
 * ConfirmModal — accessible confirmation dialog for destructive actions.
 *
 * - Centered overlay with scrim + focus trap on the primary action.
 * - Esc dismisses, Enter triggers confirm (when primary is focused).
 * - Restores focus to the previously focused element on close.
 * - `tone="danger"` colors the primary button to signal a destructive outcome.
 */
export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}) {
  const primaryRef = useRef(null);
  const previousActive = useRef(null);

  useEffect(() => {
    if (!open) return;
    previousActive.current = document.activeElement;
    // Defer to next frame so the dialog is mounted and focusable.
    const id = requestAnimationFrame(() => primaryRef.current?.focus());

    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel?.();
      } else if (e.key === "Tab") {
        // Tiny focus trap: keep focus on the primary action.
        e.preventDefault();
        primaryRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);

    // Lock background scroll while open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      const target = previousActive.current;
      if (target && typeof target.focus === "function") {
        target.focus();
      }
    };
  }, [open, onCancel]);

  if (!open) return null;

  const primaryCls =
    tone === "danger"
      ? "bg-text text-bg hover:opacity-90"
      : "bg-text text-bg hover:opacity-90";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby={description ? "confirm-desc" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center px-app-md"
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-overlay backdrop-blur-[2px] animate-[fadeIn_120ms_ease-out]"
      />

      <div
        className={
          "relative w-full max-w-md rounded-lg border border-border bg-card " +
          "shadow-2xl shadow-black/10 dark:shadow-black/40 " +
          "animate-[scaleIn_140ms_var(--ease-out-soft,cubic-bezier(0.22,1,0.36,1))]"
        }
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-subtle hover:text-text hover:bg-bg-soft"
        >
          <CloseIcon size={16} />
        </button>

        <div className="px-app-lg pt-app-lg pb-app-md">
          <h2
            id="confirm-title"
            className="text-[1.15rem] font-semibold tracking-tight text-text"
          >
            {title}
          </h2>
          {description ? (
            <p
              id="confirm-desc"
              className="mt-app-sm text-[0.92rem] leading-relaxed text-text-muted"
            >
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-app-sm border-t border-border px-app-lg py-app-md">
          <button
            type="button"
            onClick={onCancel}
            className={
              "inline-flex h-9 items-center rounded-md border border-border " +
              "bg-bg-soft px-app-md text-[0.88rem] font-medium text-text-muted " +
              "hover:text-text hover:border-border-strong transition-colors"
            }
          >
            {cancelLabel}
          </button>
          <button
            ref={primaryRef}
            type="button"
            onClick={onConfirm}
            className={
              "inline-flex h-9 items-center rounded-md px-app-md text-[0.88rem] " +
              "font-medium uppercase tracking-wide transition-opacity " +
              primaryCls
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
