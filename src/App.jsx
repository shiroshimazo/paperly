import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useNotes } from "./hooks/useNotes";
import { SECTIONS, filterBySection } from "./utils/noteUtils";

const THEME_KEY = "paperly_theme";
const VIEW_KEY = "paperly_view";

export default function App() {
  const [theme, setTheme] = useLocalStorage(THEME_KEY, getInitialTheme);
  const [view, setView] = useLocalStorage(VIEW_KEY, "grid");
  const [section, setSection] = useState(SECTIONS.ALL);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { notes, addNote } = useNotes();

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

  const visibleCount = counts[section] ?? 0;

  const handleCreate = useCallback(() => {
    addNote({});
    setSection(SECTIONS.ALL);
    setSidebarOpen(false);
  }, [addNote]);

  const handleSectionChange = useCallback((next) => {
    setSection(next);
    setSidebarOpen(false);
  }, []);

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
          />

          <main className="flex-1 px-app-md py-app-lg lg:px-app-lg">
            <div className="mx-auto max-w-6xl">
              {/* Placeholder body — note list lands here in Task 4. */}
              <div className="rounded-lg border border-border bg-card p-app-lg">
                <h2 className="text-h1 tracking-tight">Layout ready.</h2>
                <p className="mt-app-sm text-text-muted">
                  Sidebar, topbar, search and theme toggle are wired. Notes list and editor
                  arrive in the next tasks.
                </p>
                <p className="mt-app-md text-label uppercase tracking-wider text-text-subtle">
                  Section · {section} · {visibleCount} notes · view: {view}
                </p>
              </div>
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
