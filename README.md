# Paperly

A local-only notes app. Everything lives in your browser — no signup, no cloud, no server.

Built with React 19, Vite, Tailwind v4, framer-motion, and lucide-react.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the built bundle
npm run lint
```

## What's inside

- **State** — `useNotes` hook over `useLocalStorage`. All CRUD is immutable, persisted to `localStorage` under `digital_notes`.
- **Pure layer** — `src/utils/noteUtils.js` holds filter/sort/search/parse helpers with no React or DOM. Easy to test, easy to reuse.
- **Browser layer** — `src/utils/fileUtils.js` handles Blob downloads and the JSON file picker.
- **UI** — section-based navigation (All / Pinned / Favorites / Archived / Trash) with grid/list view, tag chips, sort menu, and a focused editor with autosave + markdown preview.

## Project structure

```
src/
├── App.jsx                    Top-level state, routing-by-section, keyboard shortcuts
├── components/
│   ├── Sidebar.jsx            Section nav, new-note CTA, export/import
│   ├── Topbar.jsx             Search, view toggle, theme toggle
│   ├── NoteList.jsx           Grid / list container with layout animations
│   ├── NoteCard.jsx           One note + toolbar + more-menu
│   ├── NoteEditor.jsx         Full-screen editor with debounced autosave
│   ├── ConfirmModal.jsx       Confirmation dialog for destructive actions
│   ├── Toast.jsx              Auto-dismissing status banner
│   ├── SearchBar.jsx          SortMenu, TagFilter, EmptyState, ThemeToggle
├── hooks/
│   ├── useNotes.js            CRUD over the persisted notes array
│   ├── useLocalStorage.js     Stateful localStorage with cross-tab sync
│   └── useDebouncedEffect.js  For autosave
└── utils/
    ├── noteUtils.js           Pure helpers (filter, sort, search, parse)
    ├── fileUtils.js           Blob downloads, JSON file picking
    ├── markdown.js            Tiny markdown renderer for the preview pane
    └── dateUtils.js           formatRelative, formatDateTime
```

## Icons (lucide-react)

All icons come from [`lucide-react`](https://lucide.dev). Import only what you use — they tree-shake.

```jsx
import { Pin, Star, Trash2 } from "lucide-react";

<Pin size={16} strokeWidth={1.75} />
```

**Conventions used in this project:**

- `size={N}` — match the visual weight of nearby text. Common sizes: `12`, `14`, `15`, `16`, `18`, `22`.
- `strokeWidth={1.75}` — slightly chunkier than lucide's default (`2`). Apply consistently.
- `fill="currentColor"` — for filled variants of toggleable icons (e.g. an active `Pin` or `Star`). Use the same icon, not a separate `*Filled` import.

```jsx
<Pin
  size={15}
  strokeWidth={1.75}
  fill={note.isPinned ? "currentColor" : "none"}
/>
```

**Color** — icons inherit `currentColor`, so set color via Tailwind on the parent (`text-text-muted`, `text-text-subtle`, etc).

**Adding a new icon** — pick from [lucide.dev/icons](https://lucide.dev/icons), import by PascalCase name, follow the size/stroke conventions above.

## Animations (framer-motion)

framer-motion drives every overlay, dropdown, and list reorder. The CSS keyframes were removed.

**Standard easing:** `[0.22, 1, 0.36, 1]` (a soft-out cubic). Use this for any in/out transition unless there's a reason not to.

**Standard durations:** `0.14`–`0.22` seconds. Anything longer feels sluggish for utility UI.

### Pattern: conditional mount with enter/exit

Wrap conditional content in `AnimatePresence` so exit animations run before unmount:

```jsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence>
  {open ? (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      …
    </motion.div>
  ) : null}
</AnimatePresence>
```

Used by: `Toast`, `ConfirmModal`, `NoteEditor`, `NoteCard` more-menu, `SortMenu`, `Sidebar` mobile scrim.

### Pattern: layout animations on lists

When list order changes (sort change, pinning), `layout` makes items glide instead of jump:

```jsx
<AnimatePresence initial={false}>
  {notes.map((note) => (
    <motion.li
      key={note.id}
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      …
    </motion.li>
  ))}
</AnimatePresence>
```

Note: `display: contents` breaks `layout` (it removes the element from layout flow). Don't combine them.

### Pattern: swap with origin direction

For toggleable icon swaps (e.g. theme toggle), use `mode="wait"` and a key that changes:

```jsx
<AnimatePresence mode="wait" initial={false}>
  <motion.span
    key={isDark ? "sun" : "moon"}
    initial={{ rotate: -90, opacity: 0, scale: 0.85 }}
    animate={{ rotate: 0, opacity: 1, scale: 1 }}
    exit={{ rotate: 90, opacity: 0, scale: 0.85 }}
    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
  >
    {isDark ? <Sun /> : <Moon />}
  </motion.span>
</AnimatePresence>
```

### Pattern: tap response

For primary buttons that benefit from a press feel:

```jsx
<motion.button whileTap={{ scale: 0.98 }} transition={{ duration: 0.12 }}>
  …
</motion.button>
```

## Theming

The `dark` class on `<html>` flips a set of CSS variables defined in `src/index.css`. The initial theme is set inline in `index.html` before paint to avoid a flash. `ThemeToggle` writes to `localStorage` under `paperly_theme`.

Color tokens you'll use most:

| Variable           | Purpose                              |
|--------------------|--------------------------------------|
| `--color-text`     | Primary foreground                   |
| `--color-text-muted` | Secondary foreground               |
| `--color-text-subtle` | Tertiary / placeholder            |
| `--color-bg`       | Page background                      |
| `--color-bg-soft`  | Hover / nested surface               |
| `--color-card`     | Card / dialog surface                |
| `--color-border`   | Default border                       |
| `--color-overlay`  | Modal scrim                          |

Tailwind utilities map onto these (`bg-bg`, `text-text-muted`, `border-border`, etc.).

## Keyboard shortcuts

| Shortcut       | Action                          |
|----------------|---------------------------------|
| `Ctrl/Cmd + N` | New note                        |
| `Ctrl/Cmd + S` | Force save (in editor)          |
| `Esc`          | Close editor / dismiss dialog   |

## Data

- **Storage** — `localStorage`, key `digital_notes`. Notes are normalized on load to tolerate legacy or hand-edited JSON.
- **Export** — Sidebar → Export. Writes a JSON envelope (`{ app, exportedAt, notes }`) with every note (including archived and trashed) so it round-trips cleanly.
- **Import** — Sidebar → Import. Accepts the export shape or a bare `Note[]` array. Merges by `id`, keeping whichever copy has the newer `updatedAt`.

## License

Personal project. Use the code freely.
