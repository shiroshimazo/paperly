import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./icons";
import { SORTS } from "../utils/noteUtils";

const OPTIONS = [
  { id: SORTS.UPDATED_DESC, label: "Last updated" },
  { id: SORTS.UPDATED_ASC, label: "Oldest update" },
  { id: SORTS.CREATED_DESC, label: "Newest first" },
  { id: SORTS.CREATED_ASC, label: "Oldest first" },
  { id: SORTS.TITLE_ASC, label: "Title (A → Z)" },
  { id: SORTS.TITLE_DESC, label: "Title (Z → A)" },
];

const LABEL_BY_ID = Object.fromEntries(OPTIONS.map((o) => [o.id, o.label]));

/**
 * SortMenu — accessible dropdown to pick a sort order.
 * Closes on outside click and on Escape.
 */
export default function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LABEL_BY_ID[value] ?? "Sort";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          "inline-flex h-9 items-center gap-1.5 rounded-md border border-border " +
          "bg-bg-soft px-app-sm text-[0.88rem] text-text-muted " +
          "hover:text-text hover:border-border-strong transition-colors duration-150"
        }
      >
        <span className="hidden sm:inline text-text-subtle">Sort</span>
        <span className="text-text">{current}</span>
        <ChevronDownIcon
          size={14}
          className={"text-text-subtle transition-transform " + (open ? "rotate-180" : "")}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Sort by"
          className={
            "absolute right-0 top-full mt-1.5 z-10 w-52 overflow-hidden rounded-md border border-border " +
            "bg-card shadow-lg shadow-black/5 dark:shadow-black/30 py-1 text-[0.88rem]"
          }
        >
          {OPTIONS.map((opt) => {
            const selected = opt.id === value;
            return (
              <li key={opt.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={
                    "flex w-full items-center justify-between px-app-sm py-1.5 text-left " +
                    "hover:bg-bg-soft " +
                    (selected ? "text-text font-medium" : "text-text-muted")
                  }
                >
                  <span>{opt.label}</span>
                  {selected ? (
                    <span aria-hidden="true" className="text-text">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
