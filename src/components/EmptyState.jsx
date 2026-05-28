import { NoteIcon } from "./icons";

/**
 * EmptyState — used in every section when no notes match the current view.
 * Provides a primary action (e.g. "Create a note", "Empty trash") via children.
 */
export default function EmptyState({
  title = "Nothing here yet",
  description = "When you add your first note, it will show up here.",
  icon: Icon = NoteIcon,
  action,
}) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center text-center " +
        "rounded-lg border border-dashed border-border-strong bg-bg-soft " +
        "px-app-md py-app-lg min-h-[280px]"
      }
    >
      <div
        aria-hidden="true"
        className="mb-app-md inline-flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card text-text"
      >
        <Icon size={22} />
      </div>
      <h2 className="text-[1.1rem] font-semibold tracking-tight text-text">
        {title}
      </h2>
      <p className="mt-1.5 max-w-sm text-[0.92rem] text-text-muted leading-relaxed">
        {description}
      </p>
      {action ? <div className="mt-app-md">{action}</div> : null}
    </div>
  );
}
