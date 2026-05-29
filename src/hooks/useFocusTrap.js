import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * useFocusTrap — while `active`, confine Tab / Shift+Tab focus within the
 * container, and restore focus to the previously focused element on release.
 *
 * The keydown listener is attached to the container (not `document`) on
 * purpose: stacked modals rendered as DOM siblings (e.g. a confirm dialog
 * opened from inside the note editor) don't fight, because a child dialog's
 * Tab events never bubble to a sibling dialog's container.
 *
 * Escape handling stays with the caller — this hook owns focus only.
 *
 * @param {React.RefObject} containerRef  ref to the dialog element
 * @param {boolean} active                whether the trap is engaged
 * @param {object} [options]
 * @param {React.RefObject} [options.initialFocus]  element to focus first;
 *   falls back to the first focusable element, then the container itself.
 */
export function useFocusTrap(containerRef, active, { initialFocus } = {}) {
  const previousActive = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    previousActive.current = document.activeElement;

    const getFocusable = () =>
      Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        // Skip explicitly removed (tabindex="-1", e.g. a scrim button) and
        // visually hidden elements — getClientRects is reliable for the
        // fixed-position dialogs here, unlike offsetParent.
        (el) => el.tabIndex >= 0 && el.getClientRects().length > 0,
      );

    // Defer until the dialog has mounted/painted before moving focus.
    const raf = requestAnimationFrame(() => {
      const wanted = initialFocus?.current;
      const target =
        wanted && !wanted.disabled ? wanted : getFocusable()[0] || container;
      target?.focus?.();
    });

    function onKeyDown(e) {
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey) {
        if (current === first || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !container.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("keydown", onKeyDown);
      const prev = previousActive.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [active, containerRef, initialFocus]);
}
