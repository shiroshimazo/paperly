import NoteCard from "./NoteCard";

/**
 * NoteList — renders notes as either a responsive grid or a stacked list.
 * Pure presentational; the parent owns sorting, filtering, and pinned-first ordering.
 */
export default function NoteList({
  notes,
  view = "grid",
  section,
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
      {notes.map((note) => (
        <li key={note.id} className="contents">
          <NoteCard
            note={note}
            view={view}
            section={section}
            onOpen={onOpen}
            onTogglePin={onTogglePin}
            onToggleFavorite={onToggleFavorite}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onTrash={onTrash}
            onRestore={onRestore}
            onDeleteForever={onDeleteForever}
          />
        </li>
      ))}
    </ul>
  );
}
