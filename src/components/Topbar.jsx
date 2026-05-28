import {
  GridIcon,
  ListIcon,
  SidebarIcon,
} from "./icons";
import SearchBar from "./SearchBar";
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
  rightSlot,
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

        {/* Search */}
        <SearchBar
          id="topbar-search"
          value={query}
          onChange={onQueryChange}
          className="ml-auto flex-1 max-w-xl"
        />

        {/* Sort + extras supplied by App */}
        {rightSlot}

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
