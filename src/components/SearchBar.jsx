import { CloseIcon, SearchIcon } from "./icons";

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
      <SearchIcon
        size={16}
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
          "w-full h-9 pl-9 pr-9 rounded-md border border-border " +
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
          <CloseIcon size={14} />
        </button>
      ) : null}
    </div>
  );
}
