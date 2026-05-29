# Paperly

**A calm, local-first place to think and write.**

Paperly is a notes app that lives entirely in your browser. There's no signup, no cloud, no server — every note stays on your device. Open it, write, and close the tab; your notes are still there when you come back. It's fast, works offline, and gets out of your way.

---

## Why Paperly

Most notes apps want an account, a subscription, and a network connection. Paperly wants none of that. It's built around three ideas:

- **Yours, on your device.** Notes are saved to your browser's local storage. Nothing leaves your machine unless you explicitly export it.
- **Calm by design.** A quiet monochrome interface, smooth animations, and a focused editor that keeps the writing front and center.
- **Works offline.** Install it like an app and it runs without a connection — your notebook is always available.

---

## Features

### Writing
- **Markdown editor** with a live preview toggle — headings, **bold**, *italic*, `inline code`, code blocks, quotes, lists, and horizontal rules.
- **Task lists** — write `- [ ]` and `- [x]` to render real checkboxes. Lists can mix tasks and plain bullets.
- **Wikilinks** — type `[[Note Title]]` to link notes together. Resolved links are clickable; use `[[Title|alias]]` for custom link text. Each note shows a **"Linked from"** panel listing every note that links to it (backlinks).
- **Autosave** — your draft is committed as you type. `Ctrl/Cmd + S` forces an immediate save out of muscle memory.
- **Live stats** — word and character counts update as you write.

### Organizing
- **Sections** — All Notes, Pinned, Favorites, Archived, and Trash, each with live counts.
- **Pin & favorite** — keep important notes at the top or in a dedicated list.
- **Tags** — tag notes (`#personal`, `#work`) and filter by one or more tag chips.
- **Color labels** — mark notes with a color stripe (slate, rose, amber, emerald, sky, violet).
- **Sort** — by last updated, date created, or title (ascending or descending).
- **Search** — instant search across titles, content, and tags, with matches **highlighted** right in the cards.
- **Grid or list view** — switch layouts to suit how you browse.

### Safety & recovery
- **Undo** — trashing or archiving a note shows a toast with an Undo button that restores it, pin state and all.
- **Soft delete** — deleted notes go to Trash first, where you can restore them.
- **Auto-purge** — notes in Trash are permanently removed after 30 days. Each trashed card shows a "Purges in N days" countdown so nothing disappears as a surprise.
- **Confirm prompts** — permanent deletes and "Empty Trash" ask before they act.

### Getting data in and out
- **Duplicate** a note into a fresh, editable copy.
- **Export a single note** as `.txt` or `.md` (Markdown).
- **Export everything** as a JSON file (`Sidebar → Export`) — including archived and trashed notes, so it round-trips perfectly.
- **Import** a Paperly JSON export or a plain array of notes. Imports merge by note ID, keeping whichever copy was edited more recently.

### Comfort
- **Light & dark themes** — follows your system preference by default, remembers your choice, and never flashes the wrong theme on load.
- **Installable (PWA)** — install Paperly to your home screen or desktop and run it offline like a native app.
- **Accessible** — keyboard-navigable, focus is trapped inside dialogs and restored when they close, and interactive elements are labeled for screen readers.

---

## How to use it

1. **Create a note** — click *New note* (or press `Ctrl/Cmd + N`). The editor opens immediately.
2. **Write** — type in Markdown. Toggle *Preview* to see it rendered. Add tags and a color from the editor.
3. **Link notes** — reference another note with `[[Its Title]]`. Click the link in Preview to jump there.
4. **Organize** — pin, favorite, tag, or archive from any note's card menu or the editor toolbar.
5. **Find things** — press `/` or `Ctrl/Cmd + K` to jump to search. Matches are highlighted as you type.
6. **Recover mistakes** — deleted something? Hit *Undo* on the toast, or restore it from Trash.
7. **Back up** — export to JSON from the sidebar anytime. Import it on another device or browser to move your notes.

### Keyboard shortcuts

| Shortcut            | Action                          |
|---------------------|---------------------------------|
| `Ctrl/Cmd + N`      | New note                        |
| `Ctrl/Cmd + K` or `/` | Focus search                  |
| `Ctrl/Cmd + S`      | Force save (in editor)          |
| `Esc`               | Close editor / dismiss dialog   |

---

## Your data & privacy

Paperly stores everything in your browser's `localStorage` — it never sends your notes anywhere. That means:

- **Private by default.** No account, no telemetry, no network calls for your content.
- **Tied to the browser.** Notes live in the browser profile you wrote them in. To move them, use Export → Import.
- **Back up occasionally.** Clearing your browser data will remove your notes, so export a JSON copy if they matter to you.

---

## Run it locally

Paperly is a React + Vite app. You'll need [Node.js](https://nodejs.org).

```bash
npm install
npm run dev      # start the dev server → http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the built bundle locally
npm run test     # run the test suite
npm run lint     # lint the codebase
```

To try the installable/offline experience, run `npm run build` then `npm run preview` — the service worker is active in production builds.

---

## Tech stack

- **[React 19](https://react.dev)** with the React Compiler
- **[Vite](https://vite.dev)** for dev server and bundling
- **[Tailwind CSS v4](https://tailwindcss.com)** for styling
- **[framer-motion](https://www.framer.com/motion/)** for animations
- **[lucide-react](https://lucide.dev)** for icons
- **[Vitest](https://vitest.dev)** for tests

No backend, no database, no external state — just the browser.

---

## Project structure

```
src/
├── App.jsx                    Top-level state, section routing, shortcuts, boot tasks
├── components/                UI — Sidebar, Topbar, NoteList, NoteCard, NoteEditor,
│                              ConfirmModal, Toast, SearchBar, SortMenu, TagFilter, …
├── hooks/
│   ├── useNotes.js            CRUD over the persisted notes array
│   ├── useLocalStorage.js     Stateful localStorage with cross-tab sync
│   ├── useDebouncedEffect.js  Debounced autosave
│   └── useFocusTrap.js        Trap + restore focus inside dialogs
└── utils/
    ├── noteUtils.js           Pure helpers — filter, sort, search, wikilinks, purge
    ├── fileUtils.js           Blob downloads, JSON/txt/md export, file picking
    ├── markdown.js            Dependency-free Markdown renderer for the preview
    └── dateUtils.js           Relative & absolute date formatting
```

The logic worth testing lives in `src/utils/noteUtils.js` and `markdown.js` — both are pure (no React, no DOM) and covered by the Vitest suite.

---

## License

Personal project. Use the code freely.
