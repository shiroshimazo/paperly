import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  createNote,
  normalizeNote,
  patchNote,
  purgeExpiredTrash,
} from "../utils/noteUtils";

const STORAGE_KEY = "digital_notes";

/**
 * useNotes — high-level CRUD over the persisted notes array.
 *
 * All operations are immutable; setNotes triggers the localStorage write
 * via useLocalStorage. Returned helpers are stable via useCallback so
 * children don't re-render needlessly.
 */
export function useNotes() {
  const [rawNotes, setRawNotes] = useLocalStorage(STORAGE_KEY, []);

  // Defensive normalization in case localStorage was hand-edited or
  // imported from an older schema. We don't write back here — only
  // mutating actions persist.
  const notes = useMemo(() => {
    if (!Array.isArray(rawNotes)) return [];
    return rawNotes.map(normalizeNote).filter(Boolean);
  }, [rawNotes]);

  const addNote = useCallback(
    (overrides) => {
      const note = createNote(overrides);
      setRawNotes((prev) => [note, ...(Array.isArray(prev) ? prev : [])]);
      return note;
    },
    [setRawNotes],
  );

  /**
   * Duplicate a note as a fresh, active copy: new id and timestamps, all
   * status flags reset (pin/favorite/archive/trash), only content/tags/color
   * and a " (copy)" title carry over. Computes the copy synchronously from
   * `notes` (not inside the updater) so the returned value isn't stale and the
   * body is StrictMode-safe; the updater does only the pure prepend.
   * Returns the new note, or null if the source id isn't found.
   */
  const duplicateNote = useCallback(
    (id) => {
      const source = notes.find((n) => n.id === id);
      if (!source) return null;
      const base = (source.title || "").trim();
      const copy = createNote({
        title: base ? `${base} (copy)` : "",
        content: source.content,
        tags: [...(source.tags || [])],
        color: source.color,
      });
      setRawNotes((prev) => [copy, ...(Array.isArray(prev) ? prev : [])]);
      return copy;
    },
    [notes, setRawNotes],
  );

  const updateNote = useCallback(
    (id, patch) => {
      setRawNotes((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) =>
          n.id === id ? patchNote(n, patch) : n,
        ),
      );
    },
    [setRawNotes],
  );

  const replaceNote = useCallback(
    (id, next) => {
      setRawNotes((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) => (n.id === id ? next : n)),
      );
    },
    [setRawNotes],
  );

  // Soft delete → moves to Trash.
  const trashNote = useCallback(
    (id) => updateNote(id, { isDeleted: true, isPinned: false }),
    [updateNote],
  );

  // Restore from Trash or Archive back to All Notes.
  const restoreNote = useCallback(
    (id) => updateNote(id, { isDeleted: false, isArchived: false }),
    [updateNote],
  );

  // Hard delete — gone for good.
  const permanentlyDeleteNote = useCallback(
    (id) => {
      setRawNotes((prev) =>
        (Array.isArray(prev) ? prev : []).filter((n) => n.id !== id),
      );
    },
    [setRawNotes],
  );

  const emptyTrash = useCallback(() => {
    setRawNotes((prev) =>
      (Array.isArray(prev) ? prev : []).filter((n) => !n.isDeleted),
    );
  }, [setRawNotes]);

  /**
   * Drop trashed notes past the retention window. Computes synchronously from
   * the already-normalized `notes` (so legacy trashed notes get the same
   * deletedAt fallback as the rest of the app) and only writes when something
   * is actually purged. Returns the number removed so the caller can surface it.
   */
  const purgeExpired = useCallback(
    (now = Date.now()) => {
      const kept = purgeExpiredTrash(notes, now);
      const removed = notes.length - kept.length;
      if (removed > 0) setRawNotes(kept);
      return removed;
    },
    [notes, setRawNotes],
  );

  const togglePin = useCallback(
    (id) => {
      setRawNotes((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) =>
          n.id === id ? patchNote(n, { isPinned: !n.isPinned }) : n,
        ),
      );
    },
    [setRawNotes],
  );

  const toggleFavorite = useCallback(
    (id) => {
      setRawNotes((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) =>
          n.id === id ? patchNote(n, { isFavorite: !n.isFavorite }) : n,
        ),
      );
    },
    [setRawNotes],
  );

  const archiveNote = useCallback(
    (id) =>
      updateNote(id, { isArchived: true, isPinned: false }),
    [updateNote],
  );

  const unarchiveNote = useCallback(
    (id) => updateNote(id, { isArchived: false }),
    [updateNote],
  );

  /** Merge imported notes — dedupe by id, prefer the newer updatedAt. */
  const importNotes = useCallback(
    (incoming) => {
      const cleaned = (incoming || []).map(normalizeNote).filter(Boolean);
      setRawNotes((prev) => {
        const map = new Map();
        for (const n of Array.isArray(prev) ? prev : []) map.set(n.id, n);
        for (const n of cleaned) {
          const existing = map.get(n.id);
          if (!existing || existing.updatedAt < n.updatedAt) {
            map.set(n.id, n);
          }
        }
        return Array.from(map.values());
      });
      return cleaned.length;
    },
    [setRawNotes],
  );

  return {
    notes,
    addNote,
    duplicateNote,
    updateNote,
    replaceNote,
    trashNote,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    togglePin,
    toggleFavorite,
    archiveNote,
    unarchiveNote,
    importNotes,
    purgeExpired,
  };
}
