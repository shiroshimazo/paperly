import { describe, it, expect } from "vitest";
import {
  SECTIONS,
  SORTS,
  TRASH_RETENTION_DAYS,
  createNote,
  patchNote,
  normalizeNote,
  deriveTitle,
  derivePreview,
  filterBySection,
  searchNotes,
  filterByTags,
  sortNotes,
  pinnedFirst,
  collectTags,
  countText,
  slugify,
  parseImport,
  escapeRegExp,
  highlightSegments,
  daysUntilPurge,
  purgeExpiredTrash,
} from "./noteUtils";

const DAY = 24 * 60 * 60 * 1000;

/** Minimal note factory for tests — overrides win. */
function note(overrides = {}) {
  return {
    id: overrides.id || Math.random().toString(36).slice(2),
    title: "",
    content: "",
    tags: [],
    color: "none",
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("createNote", () => {
  it("creates a note with sane defaults", () => {
    const n = createNote();
    expect(n.id).toBeTruthy();
    expect(n.title).toBe("");
    expect(n.tags).toEqual([]);
    expect(n.isDeleted).toBe(false);
    expect(n.deletedAt).toBeNull();
    expect(n.createdAt).toBe(n.updatedAt);
  });

  it("applies overrides", () => {
    const n = createNote({ title: "Hi", isPinned: true });
    expect(n.title).toBe("Hi");
    expect(n.isPinned).toBe(true);
  });
});

describe("patchNote — deletedAt lifecycle", () => {
  it("stamps deletedAt when entering trash", () => {
    const n = note();
    const trashed = patchNote(n, { isDeleted: true });
    expect(trashed.isDeleted).toBe(true);
    expect(trashed.deletedAt).toBe(trashed.updatedAt);
  });

  it("clears deletedAt when restoring", () => {
    const trashed = patchNote(note(), { isDeleted: true });
    const restored = patchNote(trashed, { isDeleted: false });
    expect(restored.deletedAt).toBeNull();
  });

  it("preserves deletedAt across other edits while trashed", () => {
    const trashed = patchNote(note(), { isDeleted: true });
    const pinned = patchNote(trashed, { isPinned: true });
    expect(pinned.deletedAt).toBe(trashed.deletedAt);
  });

  it("bumps updatedAt on every patch", () => {
    const n = note({ updatedAt: "2020-01-01T00:00:00.000Z" });
    const patched = patchNote(n, { title: "x" });
    expect(patched.updatedAt).not.toBe(n.updatedAt);
  });
});

describe("normalizeNote", () => {
  it("returns null for non-objects", () => {
    expect(normalizeNote(null)).toBeNull();
    expect(normalizeNote("nope")).toBeNull();
    expect(normalizeNote(42)).toBeNull();
  });

  it("coerces missing/invalid fields to defaults", () => {
    const n = normalizeNote({ id: "x" });
    expect(n.title).toBe("");
    expect(n.tags).toEqual([]);
    expect(n.color).toBe("none");
    expect(n.isPinned).toBe(false);
  });

  it("trims and drops empty tags", () => {
    const n = normalizeNote({ id: "x", tags: ["  a ", "", "  ", "b"] });
    expect(n.tags).toEqual(["a", "b"]);
  });

  it("falls back deletedAt to updatedAt for legacy trashed notes", () => {
    const n = normalizeNote({
      id: "x",
      isDeleted: true,
      updatedAt: "2026-05-01T00:00:00.000Z",
    });
    expect(n.deletedAt).toBe("2026-05-01T00:00:00.000Z");
  });

  it("keeps deletedAt null for non-deleted notes", () => {
    const n = normalizeNote({ id: "x", isDeleted: false, deletedAt: "2026-05-01T00:00:00.000Z" });
    expect(n.deletedAt).toBeNull();
  });

  it("preserves an explicit deletedAt on trashed notes", () => {
    const n = normalizeNote({
      id: "x",
      isDeleted: true,
      deletedAt: "2026-05-10T00:00:00.000Z",
      updatedAt: "2026-05-20T00:00:00.000Z",
    });
    expect(n.deletedAt).toBe("2026-05-10T00:00:00.000Z");
  });
});

describe("deriveTitle", () => {
  it("uses the title when present", () => {
    expect(deriveTitle(note({ title: "  Hello  " }))).toBe("Hello");
  });
  it("falls back to first non-empty content line", () => {
    expect(deriveTitle(note({ content: "\n\nFirst line\nSecond" }))).toBe("First line");
  });
  it("returns Untitled for empty notes", () => {
    expect(deriveTitle(note())).toBe("Untitled");
  });
});

describe("derivePreview", () => {
  it("strips markdown noise and collapses whitespace", () => {
    const p = derivePreview(note({ content: "# Heading\n\n- **bold**   item" }));
    expect(p).not.toContain("#");
    expect(p).not.toContain("*");
    expect(p).not.toContain("  ");
  });
  it("truncates with an ellipsis past max", () => {
    const p = derivePreview(note({ content: "x".repeat(300) }), 50);
    expect(p.endsWith("…")).toBe(true);
    expect(p.length).toBeLessThanOrEqual(51);
  });
});

describe("filterBySection", () => {
  const notes = [
    note({ id: "active" }),
    note({ id: "pinned", isPinned: true }),
    note({ id: "fav", isFavorite: true }),
    note({ id: "arch", isArchived: true }),
    note({ id: "trash", isDeleted: true }),
    note({ id: "pinned-archived", isPinned: true, isArchived: true }),
  ];

  it("ALL excludes archived and deleted", () => {
    const ids = filterBySection(notes, SECTIONS.ALL).map((n) => n.id);
    expect(ids).toEqual(["active", "pinned", "fav"]);
  });
  it("PINNED excludes archived/deleted pinned notes", () => {
    const ids = filterBySection(notes, SECTIONS.PINNED).map((n) => n.id);
    expect(ids).toEqual(["pinned"]);
  });
  it("ARCHIVED excludes deleted", () => {
    const ids = filterBySection(notes, SECTIONS.ARCHIVED).map((n) => n.id);
    expect(ids).toEqual(["arch", "pinned-archived"]);
  });
  it("TRASH returns only deleted", () => {
    const ids = filterBySection(notes, SECTIONS.TRASH).map((n) => n.id);
    expect(ids).toEqual(["trash"]);
  });
});

describe("searchNotes", () => {
  const notes = [
    note({ id: "a", title: "Grocery list", content: "milk and eggs" }),
    note({ id: "b", title: "Meeting", content: "discuss roadmap", tags: ["work"] }),
    note({ id: "c", title: "Random", content: "nothing here" }),
  ];

  it("passes through on empty query", () => {
    expect(searchNotes(notes, "")).toHaveLength(3);
    expect(searchNotes(notes, "   ")).toHaveLength(3);
  });
  it("matches title case-insensitively", () => {
    expect(searchNotes(notes, "GROCERY").map((n) => n.id)).toEqual(["a"]);
  });
  it("matches content", () => {
    expect(searchNotes(notes, "roadmap").map((n) => n.id)).toEqual(["b"]);
  });
  it("matches tags", () => {
    expect(searchNotes(notes, "work").map((n) => n.id)).toEqual(["b"]);
  });
  it("returns empty when nothing matches", () => {
    expect(searchNotes(notes, "zzz")).toEqual([]);
  });
});

describe("filterByTags", () => {
  const notes = [
    note({ id: "a", tags: ["work", "urgent"] }),
    note({ id: "b", tags: ["personal"] }),
    note({ id: "c", tags: ["Work"] }),
  ];
  it("passes through on empty selection", () => {
    expect(filterByTags(notes, [])).toHaveLength(3);
  });
  it("matches case-insensitively (OR semantics)", () => {
    expect(filterByTags(notes, ["work"]).map((n) => n.id)).toEqual(["a", "c"]);
  });
  it("matches any selected tag", () => {
    expect(filterByTags(notes, ["personal", "urgent"]).map((n) => n.id)).toEqual(["a", "b"]);
  });
});

describe("sortNotes", () => {
  const notes = [
    note({ id: "old", updatedAt: "2026-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", title: "Banana" }),
    note({ id: "new", updatedAt: "2026-03-01T00:00:00.000Z", createdAt: "2026-02-01T00:00:00.000Z", title: "Apple" }),
  ];
  it("sorts by updated desc by default", () => {
    expect(sortNotes(notes, SORTS.UPDATED_DESC).map((n) => n.id)).toEqual(["new", "old"]);
  });
  it("sorts by updated asc", () => {
    expect(sortNotes(notes, SORTS.UPDATED_ASC).map((n) => n.id)).toEqual(["old", "new"]);
  });
  it("sorts by created asc", () => {
    expect(sortNotes(notes, SORTS.CREATED_ASC).map((n) => n.id)).toEqual(["old", "new"]);
  });
  it("sorts by title asc", () => {
    expect(sortNotes(notes, SORTS.TITLE_ASC).map((n) => n.id)).toEqual(["new", "old"]);
  });
  it("does not mutate the input array", () => {
    const input = [...notes];
    sortNotes(input, SORTS.TITLE_DESC);
    expect(input.map((n) => n.id)).toEqual(["old", "new"]);
  });
});

describe("pinnedFirst", () => {
  const notes = [
    note({ id: "a" }),
    note({ id: "b", isPinned: true }),
    note({ id: "c" }),
  ];
  it("hoists pinned notes in ALL", () => {
    expect(pinnedFirst(notes, SECTIONS.ALL).map((n) => n.id)).toEqual(["b", "a", "c"]);
  });
  it("is a passthrough in TRASH and ARCHIVED", () => {
    expect(pinnedFirst(notes, SECTIONS.TRASH).map((n) => n.id)).toEqual(["a", "b", "c"]);
    expect(pinnedFirst(notes, SECTIONS.ARCHIVED).map((n) => n.id)).toEqual(["a", "b", "c"]);
  });
});

describe("collectTags", () => {
  it("collects distinct tags from non-deleted notes, sorted", () => {
    const notes = [
      note({ tags: ["b", "a"] }),
      note({ tags: ["a", "c"] }),
      note({ tags: ["z"], isDeleted: true }),
    ];
    expect(collectTags(notes)).toEqual(["a", "b", "c"]);
  });
});

describe("countText", () => {
  it("counts words and chars", () => {
    expect(countText("hello world")).toEqual({ words: 2, chars: 11 });
  });
  it("handles empty input", () => {
    expect(countText("")).toEqual({ words: 0, chars: 0 });
    expect(countText("   ")).toEqual({ words: 0, chars: 3 });
  });
});

describe("slugify", () => {
  it("produces a filename-safe slug", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });
  it("falls back to 'note' for empty input", () => {
    expect(slugify("")).toBe("note");
    expect(slugify("!!!")).toBe("note");
  });
});

describe("parseImport", () => {
  it("accepts a bare array", () => {
    const out = parseImport(JSON.stringify([{ id: "a", title: "x" }]));
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("x");
  });
  it("accepts a { notes: [...] } envelope", () => {
    const out = parseImport(JSON.stringify({ notes: [{ id: "a" }] }));
    expect(out).toHaveLength(1);
  });
  it("throws on invalid JSON", () => {
    expect(() => parseImport("{not json")).toThrow();
  });
  it("throws on a shape with no notes array", () => {
    expect(() => parseImport(JSON.stringify({ foo: 1 }))).toThrow();
  });
  it("normalizes imported notes", () => {
    const out = parseImport(JSON.stringify([{ id: "a", tags: [" x ", ""] }]));
    expect(out[0].tags).toEqual(["x"]);
    expect(out[0].deletedAt).toBeNull();
  });
});

describe("escapeRegExp", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRegExp("a.b*c+")).toBe("a\\.b\\*c\\+");
  });
});

describe("highlightSegments", () => {
  it("returns a single non-match segment for empty query", () => {
    expect(highlightSegments("hello", "")).toEqual([{ text: "hello", match: false }]);
  });
  it("splits around a case-insensitive match", () => {
    expect(highlightSegments("Hello world", "world")).toEqual([
      { text: "Hello ", match: false },
      { text: "world", match: true },
    ]);
  });
  it("handles regex-special queries literally", () => {
    expect(() => highlightSegments("c++ rocks", "c++")).not.toThrow();
    expect(highlightSegments("c++ rocks", "c++")[0]).toEqual({ text: "c++", match: true });
  });
  it("finds multiple matches", () => {
    const segs = highlightSegments("ab ab", "ab");
    expect(segs.filter((s) => s.match)).toHaveLength(2);
  });
  it("rejoins losslessly", () => {
    const src = "The quick brown fox";
    const segs = highlightSegments(src, "quick");
    expect(segs.map((s) => s.text).join("")).toBe(src);
  });
});

describe("daysUntilPurge", () => {
  const NOW = new Date("2026-05-29T12:00:00.000Z").getTime();
  it("returns null for non-trashed notes", () => {
    expect(daysUntilPurge(note(), NOW)).toBeNull();
  });
  it("returns null without a deletedAt anchor", () => {
    expect(daysUntilPurge(note({ isDeleted: true, deletedAt: null }), NOW)).toBeNull();
  });
  it("returns the full window for a just-trashed note", () => {
    expect(daysUntilPurge(note({ isDeleted: true, deletedAt: new Date(NOW).toISOString() }), NOW)).toBe(TRASH_RETENTION_DAYS);
  });
  it("counts down as time passes", () => {
    const at = new Date(NOW - 29 * DAY).toISOString();
    expect(daysUntilPurge(note({ isDeleted: true, deletedAt: at }), NOW)).toBe(1);
  });
  it("clamps to 0 at/after the window", () => {
    const at = new Date(NOW - 40 * DAY).toISOString();
    expect(daysUntilPurge(note({ isDeleted: true, deletedAt: at }), NOW)).toBe(0);
  });
});

describe("purgeExpiredTrash", () => {
  const NOW = new Date("2026-05-29T12:00:00.000Z").getTime();
  it("drops trash past the window, keeps the rest", () => {
    const notes = [
      note({ id: "active" }),
      note({ id: "fresh", isDeleted: true, deletedAt: new Date(NOW - 29 * DAY).toISOString() }),
      note({ id: "stale", isDeleted: true, deletedAt: new Date(NOW - 31 * DAY).toISOString() }),
    ];
    const ids = purgeExpiredTrash(notes, NOW).map((n) => n.id);
    expect(ids).toEqual(["active", "fresh"]);
  });
  it("keeps trashed notes lacking an anchor (can't safely purge)", () => {
    const notes = [note({ id: "no-anchor", isDeleted: true, deletedAt: null })];
    expect(purgeExpiredTrash(notes, NOW).map((n) => n.id)).toEqual(["no-anchor"]);
  });
  it("returns a new array (no mutation)", () => {
    const notes = [note({ id: "a" })];
    const out = purgeExpiredTrash(notes, NOW);
    expect(out).not.toBe(notes);
  });
  it("tolerates non-array input", () => {
    expect(purgeExpiredTrash(null, NOW)).toEqual([]);
  });
});
