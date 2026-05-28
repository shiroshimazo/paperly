import { Tag, X } from "lucide-react";

/**
 * TagFilter — horizontal chip strip of all distinct tags. Clicking a chip
 * toggles it in the parent's `selected` set. Supports "Clear all" when any
 * are active. Hidden entirely when there are no tags to filter.
 */
export default function TagFilter({ tags, selected = [], onToggle, onClear }) {
  if (!tags || tags.length === 0) return null;
  const active = (t) => selected.includes(t);

  return (
    <div className="flex items-start gap-app-sm">
      <span
        className="hidden sm:inline-flex shrink-0 items-center gap-1.5 pt-1.5 text-label uppercase tracking-wider text-text-subtle"
        aria-hidden="true"
      >
        <Tag size={13} strokeWidth={1.75} />
        Tags
      </span>

      <ul className="flex flex-1 flex-wrap items-center gap-1.5">
        {tags.map((t) => {
          const isActive = active(t);
          return (
            <li key={t}>
              <button
                type="button"
                onClick={() => onToggle?.(t)}
                aria-pressed={isActive}
                className={
                  "inline-flex items-center gap-1 rounded-sm border px-2 py-1 " +
                  "text-[12px] font-medium transition-colors duration-150 " +
                  (isActive
                    ? "bg-text text-bg border-text"
                    : "bg-bg-soft text-text-muted border-border hover:text-text hover:border-border-strong")
                }
              >
                <span className="opacity-60">#</span>
                {t}
              </button>
            </li>
          );
        })}

        {selected.length > 0 ? (
          <li>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-medium text-text-subtle hover:text-text"
            >
              <X size={12} strokeWidth={1.75} />
              Clear
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
