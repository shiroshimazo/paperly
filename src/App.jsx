import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Archive,
  FileText,
  Pin,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import ConfirmModal from "./components/ConfirmModal";
import EmptyState from "./components/EmptyState";
import NoteEditor from "./components/NoteEditor";
import NoteList from "./components/NoteList";
import Sidebar from "./components/Sidebar";
import SortMenu from "./components/SortMenu";
import Splash from "./components/Splash";
import TagFilter from "./components/TagFilter";
import Toast from "./components/Toast";
import Topbar from "./components/Topbar";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useNotes } from "./hooks/useNotes";
import {
  SECTIONS,
  SORTS,
  TRASH_RETENTION_DAYS,
  collectTags,
  deriveTitle,
  filterBySection,
  filterByTags,
  parseImport,
  pinnedFirst,
  searchNotes,
  sortNotes,
} from "./utils/noteUtils";
import {
  exportNoteAsTxt,
  exportNotesAsJson,
  pickJsonFile,
} from "./utils/fileUtils";

const THEME_KEY = "paperly_theme";
const VIEW_KEY = "paperly_view";
const SORT_KEY = "paperly_sort";

const EMPTY_BY_SECTION = {
  [SECTIONS.ALL]: {
    icon: FileText,
    title: "Your notebook is empty",
    description:
      "Capture an idea, a list, or a plan. Everything stays on this device — no signup, no cloud.",
  },
  [SECTIONS.PINNED]: {
    icon: Pin,
    title: "No pinned notes",
    description: "Pin a note from its card or editor to keep it at the top of your list.",
  },
  [SECTIONS.FAVORITES]: {
    icon: Star,
    title: "No favorites yet",
    description: "Star the notes you keep coming back to — they'll all live here.",
  },
  [SECTIONS.ARCHIVED]: {
    icon: Archive,
    title: "Nothing archived",
    description: "Archived notes are out of sight in All Notes but never lost.",
  },
  [SECTIONS.TRASH]: {
    icon: Trash2,
    title: "Trash is empty",
    description: "Deleted notes appear here first so you can restore them.",
  },
};

const NO_CONFIRM = { open: false };
const NO_TOAST = { open: false };
const SPLASH_MIN_MS = 700;

export default function App() {
  const [theme, setTheme] = useLocalStorage(THEME_KEY, getInitialTheme);
  const [view, setView] = useLocalStorage(VIEW_KEY, "grid");
  const [sort, setSort] = useLocalStorage(SORT_KEY, SORTS.UPDATED_DESC);
  const [section, setSection] = useState(SECTIONS.ALL);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [confirm, setConfirm] = useState(NO_CONFIRM);
  const [toast, setToast] = useState(NO_TOAST);
  const [booted, setBooted] = useState(false);

  const {
    notes,
    addNote,
    updateNote,
    togglePin,
    toggleFavorite,
    archiveNote,
    unarchiveNote,
    trashNote,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    importNotes,
    purgeExpired,
  } = useNotes();

  // Reflect theme on the documentElement so all CSS vars flip.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // Boot splash: hold until web fonts settle and a minimum dwell elapses, so
  // the brand mark gets a beat to land instead of flashing past.
  useEffect(() => {
    let cancelled = false;
    const start = performance.now();
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady.finally(() => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, SPLASH_MIN_MS - elapsed);
      const id = setTimeout(() => {
        if (!cancelled) setBooted(true);
      }, wait);
      return () => clearTimeout(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Trash auto-purge: on boot, drop notes that have sat in Trash past the
  // retention window. Runs once (ref-guarded against StrictMode's double
  // mount so the summary toast doesn't fire twice). purgeExpired is a no-op
  // write when nothing has expired. Declared after showToast so it can
  // reference it without a forward use.
  const didPurge = useRef(false);

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

  // Find the open note (live reference so toolbar reflects pin/favorite changes).
  const openNote = useMemo(
    () => (openId ? notes.find((n) => n.id === openId) || null : null),
    [openId, notes],
  );

  // If the open note vanishes (permanent delete elsewhere), close the editor.
  useEffect(() => {
    if (openId && !openNote) setOpenId(null);
  }, [openId, openNote]);

  const handleCreate = useCallback(() => {
    const note = addNote({});
    setSection(SECTIONS.ALL);
    setSidebarOpen(false);
    setOpenId(note.id);
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

  const handleOpen = useCallback((note) => {
    setOpenId(note.id);
  }, []);

  const handleCloseEditor = useCallback(() => setOpenId(null), []);

  const closeConfirm = useCallback(() => setConfirm(NO_CONFIRM), []);
  const closeToast = useCallback(() => setToast(NO_TOAST), []);

  const showToast = useCallback((message, tone = "info", action = null, duration) => {
    setToast({ open: true, message, tone, action, duration });
  }, []);

  useEffect(() => {
    if (didPurge.current) return;
    didPurge.current = true;
    const removed = purgeExpired();
    if (removed > 0) {
      // Intentional one-time boot notification after the purge write; the
      // single cascading render the rule warns about is harmless here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showToast(
        `Cleared ${removed} ${removed === 1 ? "note" : "notes"} from Trash after ${TRASH_RETENTION_DAYS} days.`,
      );
    }
    // Boot-only sweep — intentionally not re-run when its deps change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permanent-delete confirmation flow — used by both the card and the editor.
  const confirmPermanentDelete = useCallback(
    (note) => {
      const title = deriveTitle(note);
      setConfirm({
        open: true,
        title: "Delete this note forever?",
        description: `“${title}” will be removed from this device. This can't be undone.`,
        confirmLabel: "Delete forever",
        cancelLabel: "Keep",
        onConfirm: () => {
          permanentlyDeleteNote(note.id);
          if (openId === note.id) setOpenId(null);
          closeConfirm();
        },
      });
    },
    [permanentlyDeleteNote, openId, closeConfirm],
  );

  const confirmEmptyTrash = useCallback(() => {
    const trashedCount = counts[SECTIONS.TRASH] || 0;
    setConfirm({
      open: true,
      title: "Empty Trash?",
      description: `${trashedCount} ${trashedCount === 1 ? "note" : "notes"} will be permanently deleted from this device. This can't be undone.`,
      confirmLabel: "Empty Trash",
      cancelLabel: "Keep",
      onConfirm: () => {
        emptyTrash();
        closeConfirm();
        showToast(
          `Trash emptied — ${trashedCount} ${trashedCount === 1 ? "note" : "notes"} removed.`,
        );
      },
    });
  }, [counts, emptyTrash, closeConfirm, showToast]);

  // Trash with an Undo affordance. Capture isPinned first — trashNote clears it,
  // so a faithful undo has to put it back.
  const handleTrash = useCallback(
    (id) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      const wasPinned = note.isPinned;
      trashNote(id);
      showToast("Note moved to Trash.", "info", {
        label: "Undo",
        onAction: () =>
          updateNote(id, { isDeleted: false, isPinned: wasPinned }),
      });
    },
    [notes, trashNote, updateNote, showToast],
  );

  // Archive with an Undo affordance — same pin-preservation concern as trash.
  const handleArchive = useCallback(
    (id) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      const wasPinned = note.isPinned;
      archiveNote(id);
      showToast("Note archived.", "info", {
        label: "Undo",
        onAction: () =>
          updateNote(id, { isArchived: false, isPinned: wasPinned }),
      });
    },
    [notes, archiveNote, updateNote, showToast],
  );

  // Trash from inside the editor → close editor, but keep the Undo toast.
  const handleEditorTrash = useCallback(
    (note) => {
      handleTrash(note.id);
      setOpenId(null);
    },
    [handleTrash],
  );

  // Export everything (including archived + trashed) so import is fully round-trippable.
  const handleExport = useCallback(() => {
    if (notes.length === 0) {
      showToast("Nothing to export yet — write a note first.");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    exportNotesAsJson(notes, `paperly-notes-${stamp}.json`);
    showToast(
      `Exported ${notes.length} ${notes.length === 1 ? "note" : "notes"}.`,
      "success",
    );
  }, [notes, showToast]);

  const handleImport = useCallback(async () => {
    try {
      const text = await pickJsonFile();
      if (!text) return; // user cancelled
      const incoming = parseImport(text);
      if (incoming.length === 0) {
        showToast("That file didn't contain any notes.");
        return;
      }
      const added = importNotes(incoming);
      showToast(
        `Imported ${added} ${added === 1 ? "note" : "notes"}.`,
        "success",
      );
    } catch (err) {
      showToast(err?.message || "Couldn't import that file.", "danger");
    }
  }, [importNotes, showToast]);

  // Global shortcuts: Ctrl/Cmd+N → new note, Ctrl/Cmd+K or "/" → focus search.
  useEffect(() => {
    function isTypingTarget(el) {
      if (!el) return false;
      return (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
      );
    }
    function focusSearch() {
      const input = document.getElementById("topbar-search");
      if (input) {
        input.focus();
        input.select?.();
      }
    }
    function onKey(e) {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "n" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleCreate();
        return;
      }
      // Ctrl/Cmd+K → focus search (skip while the editor covers it).
      if (meta && e.key.toLowerCase() === "k" && !e.shiftKey && !e.altKey) {
        if (openId) return;
        e.preventDefault();
        focusSearch();
        return;
      }
      // "/" → focus search, but only when not already typing into a field.
      if (e.key === "/" && !meta && !e.altKey && !isTypingTarget(e.target)) {
        if (openId) return;
        e.preventDefault();
        focusSearch();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCreate, openId]);

  const sectionEmpty = EMPTY_BY_SECTION[section];
  const hasActiveFilters = query.trim().length > 0 || selectedTags.length > 0;
  const isFilteredMiss = visibleCount === 0 && hasActiveFilters;
  const showTagFilter = allTags.length > 0 && section !== SECTIONS.TRASH;
  const trashCount = counts[SECTIONS.TRASH] || 0;
  const showEmptyTrash = section === SECTIONS.TRASH && trashCount > 0;

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
          onExport={handleExport}
          onImport={handleImport}
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
              <div className="flex flex-wrap items-center justify-between gap-app-sm">
                {showTagFilter ? (
                  <TagFilter
                    tags={allTags}
                    selected={selectedTags}
                    onToggle={handleTagToggle}
                    onClear={() => setSelectedTags([])}
                  />
                ) : (
                  <span aria-hidden="true" />
                )}

                {showEmptyTrash ? (
                  <button
                    type="button"
                    onClick={confirmEmptyTrash}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-soft px-app-sm py-1.5 text-label uppercase tracking-wide font-medium text-text-muted hover:text-text hover:border-border-strong transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                    Empty Trash
                  </button>
                ) : null}
              </div>

              {visibleCount > 0 ? (
                <NoteList
                  notes={visibleNotes}
                  view={view}
                  section={section}
                  query={query}
                  onOpen={handleOpen}
                  onTogglePin={togglePin}
                  onToggleFavorite={toggleFavorite}
                  onArchive={handleArchive}
                  onUnarchive={unarchiveNote}
                  onTrash={handleTrash}
                  onRestore={restoreNote}
                  onDeleteForever={confirmPermanentDelete}
                />
              ) : isFilteredMiss ? (
                <EmptyState
                  icon={Search}
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
                        <Plus size={14} strokeWidth={1.75} />
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

      <AnimatePresence>
        {openNote ? (
          <NoteEditor
            key={openNote.id}
            note={openNote}
            onChange={updateNote}
            onClose={handleCloseEditor}
            onTogglePin={togglePin}
            onToggleFavorite={toggleFavorite}
            onArchive={handleArchive}
            onUnarchive={unarchiveNote}
            onTrash={handleEditorTrash}
            onRestore={restoreNote}
            onDeleteForever={confirmPermanentDelete}
            onExportTxt={exportNoteAsTxt}
          />
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel}
        cancelLabel={confirm.cancelLabel}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      <Toast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        action={toast.action}
        duration={toast.duration}
        onDismiss={closeToast}
      />

      <AnimatePresence>{!booted ? <Splash key="splash" /> : null}</AnimatePresence>
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
