import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "./components/EmptyState";
import NoteList from "./components/NoteList";
import Sidebar from "./components/Sidebar";
import SortMenu from "./components/SortMenu";
import TagFilter from "./components/TagFilter";
import Topbar from "./components/Topbar";
import {
  ArchiveIcon,
  NoteIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
} from "./components/icons";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useNotes } from "./hooks/useNotes";
import {
  SECTIONS,
  SORTS,
  collectTags,
  filterBySection,
  filterByTags,
  pinnedFirst,
  searchNotes,
  sortNotes,
} from "./utils/noteUtils";

const THEME_KEY = "paperly_theme";
const VIEW_KEY = "paperly_view";
const SORT_KEY = "paperly_sort";

const EMPTY_BY_SECTION = {
  [SECTIONS.ALL]: {
    icon: NoteIcon,
    title: "Your notebook is empty",
    description:
      "Capture an idea, a list, or a plan. Everything stays on this device — no signup, no cloud.",
  },
  [SECTIONS.PINNED]: {
    icon: PinIcon,
    title: "No pinned notes",
    description: "Pin a note from its card or editor to keep it at the top of your list.",
  },
  [SECTIONS.FAVORITES]: {
    icon: StarIcon,
    title: "No favorites yet",
    description: "Star the notes you keep coming back to — they'll all live here.",
  },
  [SECTIONS.ARCHIVED]: {
    icon: ArchiveIcon,
    title: "Nothing archived",
    description: "Archived notes are out of sight in All Notes but never lost.",
  },
  [SECTIONS.TRASH]: {
    icon: TrashIcon,
    title: "Trash is empty",
    description: "Deleted notes appear here first so you can restore them.",
  },
};

export default function App() {
  const [theme, setTheme] = useLocalStorage(THEME_KEY, getInitialTheme);
  const [view, setView] = useLocalStorage(VIEW_KEY, "grid");
  const [sort, setSort] = useLocalStorage(SORT_KEY, SORTS.UPDATED_DESC);
  const [section, setSection] = useState(SECTIONS.ALL);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    notes,
    addNote,
    togglePin,
    toggleFavorite,
    archiveNote,
    unarchiveNote,
    trashNote,
    restoreNote,
    permanentlyDeleteNote,
  } = useNotes();

  // Reflect theme on the documentElement so all CSS vars flip.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const onThemeToggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, [setTheme]);

  // Per-section counts for the sidebar badges.
  const counts = useMemo(
    () => ({
      [SECTIONS.ALL]: filterBySection(notes, SECTIONS.ALL).length,
      [SECTIONS.PINNED]: filterBySection(notes, SECTIONS.PINNED).length,
      [SECTIONS.FAVORITES]: filterBySection(notes, SECTIONS.FAVORITES).length,
      [SECTIONS.ARCHIVED]: filterBySection(notes, SECTIONS.ARCHIVED).length,
      [SECTIONS.TRASH]: filterBySection(notes, SECTIONS.TRASH).length,
    }),
    [notes],
  );

  // Distinct tags across active notes — drives the chip strip.
  const allTags = useMemo(() => collectTags(notes), [notes]);

  // Reconcile: if a tag is removed (last note retagged), drop it from selection.
  useEffect(() => {
    if (selectedTags.length === 0) return;
    const present = new Set(allTags.map((t) => t.toLowerCase()));
    const next = selectedTags.filter((t) => present.has(t.toLowerCase()));
    if (next.length !== selectedTags.length) setSelectedTags(next);
  }, [allTags, selectedTags]);

  // Build the visible list: section → tags → search → sort → pinned-first.
  const visibleNotes = useMemo(() => {
    const sectioned = filterBySection(notes, section);
    const tagged = filterByTags(sectioned, selectedTags);
    const searched = searchNotes(tagged, query);
    const sorted = sortNotes(searched, sort);
    return pinnedFirst(sorted, section);
  }, [notes, section, selectedTags, query, sort]);

  const visibleCount = visibleNotes.length;

  const handleCreate = useCallback(() => {
    addNote({});
    setSection(SECTIONS.ALL);
    setSidebarOpen(false);
  }, [addNote]);

  const handleSectionChange = useCallback((next) => {
    setSection(next);
    setSelectedTags([]);
    setSidebarOpen(false);
  }, []);

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  // Open is wired in Task 6 (NoteEditor). For now, stub it.
  const handleOpen = useCallback(() => {
    /* editor lands in Task 6 */
  }, []);

  const sectionEmpty = EMPTY_BY_SECTION[section];
  const hasActiveFilters = query.trim().length > 0 || selectedTags.length > 0;
  const isFilteredMiss = visibleCount === 0 && hasActiveFilters;
  const showTagFilter =
    allTags.length > 0 && section !== SECTIONS.TRASH;

  return (
    <div className="min-h-dvh bg-bg text-text font-sans">
      <div className="flex min-h-dvh">
        <Sidebar
          section={section}
          onSectionChange={handleSectionChange}
          counts={counts}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onCreate={handleCreate}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            section={section}
            query={query}
            onQueryChange={setQuery}
            view={view}
            onViewChange={setView}
            theme={theme}
            onThemeToggle={onThemeToggle}
            onOpenSidebar={() => setSidebarOpen(true)}
            count={visibleCount}
            rightSlot={<SortMenu value={sort} onChange={setSort} />}
          />

          <main className="flex-1 px-app-md py-app-md md:py-app-lg lg:px-app-lg">
            <div className="mx-auto max-w-7xl space-y-app-md">
              {showTagFilter ? (
                <TagFilter
                  tags={allTags}
                  selected={selectedTags}
                  onToggle={handleTagToggle}
                  onClear={() => setSelectedTags([])}
                />
              ) : null}

              {visibleCount > 0 ? (
                <NoteList
                  notes={visibleNotes}
                  view={view}
                  section={section}
                  onOpen={handleOpen}
                  onTogglePin={togglePin}
                  onToggleFavorite={toggleFavorite}
                  onArchive={archiveNote}
                  onUnarchive={unarchiveNote}
                  onTrash={trashNote}
                  onRestore={restoreNote}
                  onDeleteForever={(note) => permanentlyDeleteNote(note.id)}
                />
              ) : isFilteredMiss ? (
                <EmptyState
                  icon={SearchIcon}
                  title="No matching notes"
                  description={
                    selectedTags.length > 0 && query.trim()
                      ? "Try clearing some tags or adjusting your search."
                      : selectedTags.length > 0
                        ? "No notes carry all the selected tags in this section."
                        : `No notes match “${query.trim()}” in this section.`
                  }
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setSelectedTags([]);
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-bg-soft px-app-md py-2 text-label font-medium uppercase tracking-wide text-text-muted hover:text-text hover:border-border-strong transition"
                    >
                      Clear filters
                    </button>
                  }
                />
              ) : (
                <EmptyState
                  icon={sectionEmpty.icon}
                  title={sectionEmpty.title}
                  description={sectionEmpty.description}
                  action={
                    section === SECTIONS.ALL ? (
                      <button
                        type="button"
                        onClick={handleCreate}
                        className={
                          "inline-flex items-center gap-2 rounded-md bg-text text-bg " +
                          "px-app-md py-2.5 text-label font-medium uppercase tracking-wide " +
                          "hover:opacity-90 active:scale-[0.99] transition"
                        }
                      >
                        <PlusIcon size={14} />
                        New note
                      </button>
                    ) : null
                  }
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
