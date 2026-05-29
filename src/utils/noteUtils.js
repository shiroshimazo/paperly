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

/** Trashed notes are permanently purged after this many days. */
export const TRASH_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

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
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Patch a note immutably and bump updatedAt. Also manages deletedAt off the
 * isDeleted transition so callers (trash / restore / undo) never have to stamp
 * it themselves: set when entering Trash, cleared when leaving it, preserved
 * (so the purge clock keeps running) while a note stays trashed.
 */
export function patchNote(note, patch) {
  const next = {
    ...note,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (next.isDeleted && !note.isDeleted) {
    next.deletedAt = next.updatedAt;
  } else if (!next.isDeleted) {
    next.deletedAt = null;
  }
  return next;
}

/** Normalize loaded notes — guard against legacy/missing fields. */
export function normalizeNote(raw) {
  if (!raw || typeof raw !== "object") return null;
  const now = new Date().toISOString();
  const isDeleted = Boolean(raw.isDeleted);
  const updatedAt = raw.updatedAt || raw.createdAt || now;
  // deletedAt anchors the purge clock. Legacy trashed notes (no field) fall
  // back to updatedAt — trashing bumps updatedAt, so it's their trash time.
  const deletedAt = isDeleted
    ? typeof raw.deletedAt === "string" && raw.deletedAt
      ? raw.deletedAt
      : updatedAt
    : null;
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
    isDeleted,
    createdAt: raw.createdAt || now,
    updatedAt,
    deletedAt,
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

/**
 * Whole days remaining before a trashed note is auto-purged.
 * Returns null for notes that aren't trashed or lack a deletedAt anchor.
 * `now` is injectable for testing; rounds up so "expires today" reads as 0.
 */
export function daysUntilPurge(note, now = Date.now()) {
  if (!note?.isDeleted || !note.deletedAt) return null;
  const deletedMs = new Date(note.deletedAt).getTime();
  if (Number.isNaN(deletedMs)) return null;
  const elapsed = (typeof now === "number" ? now : new Date(now).getTime()) - deletedMs;
  const remaining = TRASH_RETENTION_DAYS * DAY_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / DAY_MS));
}

/**
 * Drop trashed notes whose retention window has fully elapsed. Pure: returns a
 * new array, leaving non-trashed notes and within-window trash untouched.
 * Notes without a valid deletedAt are kept (no anchor → can't safely purge).
 */
export function purgeExpiredTrash(notes, now = Date.now()) {
  const nowMs = typeof now === "number" ? now : new Date(now).getTime();
  const cutoff = nowMs - TRASH_RETENTION_DAYS * DAY_MS;
  return (Array.isArray(notes) ? notes : []).filter((n) => {
    if (!n.isDeleted || !n.deletedAt) return true;
    const deletedMs = new Date(n.deletedAt).getTime();
    if (Number.isNaN(deletedMs)) return true;
    return deletedMs > cutoff;
  });
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

/** Escape a string for safe use inside a RegExp. */
export function escapeRegExp(input) {
  return (input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split `text` into segments around case-insensitive matches of `query`.
 * Returns [{ text, match }] so a renderer can wrap matches without building
 * HTML (keeps it React-safe and testable). Empty query → single non-match
 * segment. No match → single non-match segment.
 */
export function highlightSegments(text, query) {
  const src = text || "";
  const q = (query || "").trim();
  if (!q) return src ? [{ text: src, match: false }] : [];
  const re = new RegExp(escapeRegExp(q), "ig");
  const segments = [];
  let last = 0;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) segments.push({ text: src.slice(last, m.index), match: false });
    segments.push({ text: m[0], match: true });
    last = m.index + m[0].length;
    // Guard against zero-length matches looping forever.
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  if (last < src.length) segments.push({ text: src.slice(last), match: false });
  return segments;
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
