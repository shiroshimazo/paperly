import {
  GridIcon,
  ListIcon,
  SearchIcon,
  SidebarIcon,
  CloseIcon,
} from "./icons";
import ThemeToggle from "./ThemeToggle";

const SECTION_TITLES = {
  all: "All Notes",
  pinned: "Pinned",
  favorites: "Favorites",
  archived: "Archived",
  trash: "Trash",
};

const SECTION_DESCRIPTIONS = {
  all: "Everything you're keeping.",
  pinned: "Always at the top.",
  favorites: "The ones you come back to.",
  archived: "Set aside, not forgotten.",
  trash: "Notes pending permanent removal.",
};

/**
 * Topbar — sticky search + section title + view toggles + theme.
 * Stays presentational; receives state and handlers from App.
 */
export default function Topbar({
  section,
  query,
  onQueryChange,
  view,
  onViewChange,
  theme,
  onThemeToggle,
  onOpenSidebar,
  count,
}) {
  return (
    <header
      className={
        "sticky top-0 z-20 border-b border-border " +
        "bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70"
      }
    >
      <div className="flex h-14 items-center gap-app-sm px-app-md">
        {/* Mobile sidebar trigger */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-bg-soft"
        >
          <SidebarIcon size={18} />
        </button>

        {/* Section title (hidden on small to give search room) */}
        <div className="hidden md:flex min-w-0 flex-col">
          <h1 className="text-[1.05rem] font-semibold leading-tight text-text truncate">
            {SECTION_TITLES[section] || "Notes"}
          </h1>
          <p className="text-label text-text-subtle truncate">
            {count} {count === 1 ? "note" : "notes"}
            <span className="mx-1.5 text-border-strong">•</span>
            {SECTION_DESCRIPTIONS[section] || ""}
          </p>
        </div>

        {/* Search — flex-grow, label visually hidden */}
        <div className="ml-auto flex-1 max-w-xl">
          <label htmlFor="topbar-search" className="sr-only">
            Search notes
          </label>
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
            />
            <input
              id="topbar-search"
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search by title, content, or tag…"
              className={
                "w-full h-9 pl-9 pr-9 rounded-md border border-border " +
                "bg-bg-soft text-[0.92rem] placeholder:text-text-subtle " +
                "focus:bg-bg focus:border-border-strong focus:outline-none " +
                "transition-colors duration-150"
              }
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-sm text-text-subtle hover:text-text hover:bg-neutral"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        </div>

        {/* View toggle */}
        <div
          role="group"
          aria-label="View mode"
          className="hidden sm:inline-flex h-9 items-center rounded-md border border-border p-0.5"
        >
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            aria-pressed={view === "grid"}
            aria-label="Grid view"
            title="Grid view"
            className={
              "inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors duration-150 " +
              (view === "grid"
                ? "bg-text text-bg"
                : "text-text-muted hover:text-text")
            }
          >
            <GridIcon size={15} />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            aria-pressed={view === "list"}
            aria-label="List view"
            title="List view"
            className={
              "inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors duration-150 " +
              (view === "list"
                ? "bg-text text-bg"
                : "text-text-muted hover:text-text")
            }
          >
            <ListIcon size={15} />
          </button>
        </div>

        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
    </header>
  );
}
