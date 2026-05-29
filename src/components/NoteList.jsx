import { AnimatePresence, motion } from "framer-motion";
import NoteCard from "./NoteCard";

/**
 * NoteList — renders notes as either a responsive grid or a stacked list.
 * Pure presentational; the parent owns sorting, filtering, and pinned-first ordering.
 *
 * Items use `layout` so reorders (sort change, pinning) animate smoothly,
 * and AnimatePresence handles enter/exit when notes are added or removed.
 */
export default function NoteList({
  notes,
  view = "grid",
  section,
  query,
  onOpen,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onUnarchive,
  onTrash,
  onRestore,
  onDeleteForever,
}) {
  if (!notes || notes.length === 0) return null;

  const containerCls =
    view === "list"
      ? "flex flex-col gap-app-sm"
      : "grid gap-app-md grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <ul className={containerCls} aria-label="Notes">
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
            <NoteCard
              note={note}
              view={view}
              section={section}
              query={query}
              onOpen={onOpen}
              onTogglePin={onTogglePin}
              onToggleFavorite={onToggleFavorite}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
              onTrash={onTrash}
              onRestore={onRestore}
              onDeleteForever={onDeleteForever}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
