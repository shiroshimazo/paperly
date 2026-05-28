/**
 * Pure note operations — no React, no localStorage. Easy to test.
 *
 * Note shape:
 * {
 *   id, title, content, tags[], color,
 *   isPinned, isFavorite, isArchived, isDeleted,
 *   createdAt, updatedAt
 * }
 */

export const COLOR_LABELS = [
  { id: "none", label: "No color", swatch: "transparent" },
  { id: "slate", label: "Slate", swatch: "var(--color-label-slate)" },
  { id: "rose", label: "Rose", swatch: "var(--color-label-rose)" },
  { id: "amber", label: "Amber", swatch: "var(--color-label-amber)" },
  { id: "emerald", label: "Emerald", swatch: "var(--color-label-emerald)" },
  { id: "sky", label: "Sky", swatch: "var(--color-label-sky)" },
  { id: "violet", label: "Violet", swatch: "var(--color-label-violet)" },
];

export const SECTIONS = {
  ALL: "all",
  PINNED: "pinned",
  FAVORITES: "favorites",
  ARCHIVED: "archived",
  TRASH: "trash",
};

export const SORTS = {
  UPDATED_DESC: "updated-desc",
  UPDATED_ASC: "updated-asc",
  CREATED_DESC: "created-desc",
  CREATED_ASC: "created-asc",
  TITLE_ASC: "title-asc",
  TITLE_DESC: "title-desc",
};

/** Crypto-safe ID with a graceful fallback. */
export function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Build a fresh note with sensible defaults. */
export function createNote(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    title: "",
    content: "",
    tags: [],
    color: "none",
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Patch a note immutably and bump updatedAt. */
export function patchNote(note, patch) {
  return {
    ...note,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

/** Normalize loaded notes — guard against legacy/missing fields. */
export function normalizeNote(raw) {
  if (!raw || typeof raw !== "object") return null;
  const now = new Date().toISOString();
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : makeId(),
    title: typeof raw.title === "string" ? raw.title : "",
    content: typeof raw.content === "string" ? raw.content : "",
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim())
      : [],
    color: typeof raw.color === "string" ? raw.color : "none",
    isPinned: Boolean(raw.isPinned),
    isFavorite: Boolean(raw.isFavorite),
    isArchived: Boolean(raw.isArchived),
    isDeleted: Boolean(raw.isDeleted),
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || raw.createdAt || now,
  };
}

/** Lightweight title preview when title is empty. */
export function deriveTitle(note) {
  if (note.title && note.title.trim()) return note.title.trim();
  const firstLine = (note.content || "").split("\n").find((l) => l.trim());
  return firstLine ? firstLine.trim().slice(0, 80) : "Untitled";
}

/** Plain-text preview for cards (strips markdown noise lightly). */
export function derivePreview(note, max = 180) {
  const body = (note.content || "")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_`>#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!body) return "";
  return body.length > max ? `${body.slice(0, max)}…` : body;
}

/** Filter notes by section. */
export function filterBySection(notes, section) {
  switch (section) {
    case SECTIONS.PINNED:
      return notes.filter((n) => n.isPinned && !n.isArchived && !n.isDeleted);
    case SECTIONS.FAVORITES:
      return notes.filter((n) => n.isFavorite && !n.isArchived && !n.isDeleted);
    case SECTIONS.ARCHIVED:
      return notes.filter((n) => n.isArchived && !n.isDeleted);
    case SECTIONS.TRASH:
      return notes.filter((n) => n.isDeleted);
    case SECTIONS.ALL:
    default:
      return notes.filter((n) => !n.isArchived && !n.isDeleted);
  }
}

/** Search across title, content, and tags. Empty query is a passthrough. */
export function searchNotes(notes, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return notes;
  return notes.filter((n) => {
    if (n.title && n.title.toLowerCase().includes(q)) return true;
    if (n.content && n.content.toLowerCase().includes(q)) return true;
    if (n.tags && n.tags.some((t) => t.toLowerCase().includes(q))) return true;
    return false;
  });
}

/** Filter by selected tags. Empty array is a passthrough. */
export function filterByTags(notes, tags) {
  if (!tags || tags.length === 0) return notes;
  const set = new Set(tags.map((t) => t.toLowerCase()));
  return notes.filter((n) =>
    n.tags && n.tags.some((t) => set.has(t.toLowerCase())),
  );
}

/** Sort notes — pinned-first ordering applied separately. */
export function sortNotes(notes, sort) {
  const arr = [...notes];
  switch (sort) {
    case SORTS.UPDATED_ASC:
      return arr.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    case SORTS.CREATED_DESC:
      return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case SORTS.CREATED_ASC:
      return arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case SORTS.TITLE_ASC:
      return arr.sort((a, b) =>
        deriveTitle(a).localeCompare(deriveTitle(b), undefined, { sensitivity: "base" }),
      );
    case SORTS.TITLE_DESC:
      return arr.sort((a, b) =>
        deriveTitle(b).localeCompare(deriveTitle(a), undefined, { sensitivity: "base" }),
      );
    case SORTS.UPDATED_DESC:
    default:
      return arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

/** Apply pinned-first ordering on top of an already-sorted list (only in sections where it makes sense). */
export function pinnedFirst(notes, section) {
  if (section === SECTIONS.TRASH || section === SECTIONS.ARCHIVED) return notes;
  const pinned = notes.filter((n) => n.isPinned);
  const rest = notes.filter((n) => !n.isPinned);
  return [...pinned, ...rest];
}

/** Collect every distinct tag across active (non-deleted) notes, sorted. */
export function collectTags(notes) {
  const set = new Set();
  for (const n of notes) {
    if (n.isDeleted) continue;
    for (const t of n.tags || []) {
      if (t && t.trim()) set.add(t.trim());
    }
  }
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

/** Word and character count for the editor footer. */
export function countText(text) {
  const t = (text || "").trim();
  const chars = (text || "").length;
  const words = t ? t.split(/\s+/).filter(Boolean).length : 0;
  return { words, chars };
}

/** Filename-safe slug for export. */
export function slugify(input) {
  return (input || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "note";
}

/**
 * Validate and normalize an array of notes from imported JSON.
 * Accepts either a bare array or an object with a `notes` key.
 */
export function parseImport(json) {
  let parsed;
  try {
    parsed = typeof json === "string" ? JSON.parse(json) : json;
  } catch {
    throw new Error("Couldn't read that file — it doesn't look like valid JSON.");
  }
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.notes)
      ? parsed.notes
      : null;
  if (!list) {
    throw new Error("Expected a JSON array of notes (or { notes: [...] }).");
  }
  return list.map(normalizeNote).filter(Boolean);
}
