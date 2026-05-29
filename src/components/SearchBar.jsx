import { Search, X } from "lucide-react";

/**
 * SearchBar — reusable controlled input with an icon and a clear button.
 * Sized to slot into the topbar, but works standalone too.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search by title, content, or tag…",
  id = "search",
  className = "",
}) {
  return (
    <div className={"relative " + className}>
      <label htmlFor={id} className="sr-only">
        Search
      </label>
      <Search
        size={16}
        strokeWidth={1.75}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={
          "peer w-full h-9 pl-9 pr-9 rounded-md border border-border " +
          "bg-bg-soft text-[0.92rem] placeholder:text-text-subtle " +
          "focus:bg-bg focus:border-border-strong focus:outline-none " +
          "transition-colors duration-150"
        }
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-sm text-text-subtle hover:text-text hover:bg-neutral"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      ) : (
        <kbd
          aria-hidden="true"
          className={
            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 " +
            "hidden sm:inline-flex h-5 min-w-[1.25rem] items-center justify-center " +
            "rounded border border-border bg-bg px-1 text-[11px] font-medium " +
            "text-text-subtle peer-focus:opacity-0"
          }
        >
          /
        </kbd>
      )}
    </div>
  );
}
