import {
  ArchiveIcon,
  NoteIcon,
  PinIcon,
  SparkleIcon,
  StarIcon,
  TrashIcon,
  CloseIcon,
} from "./icons";
import { SECTIONS } from "../utils/noteUtils";

const NAV = [
  { id: SECTIONS.ALL, label: "All Notes", Icon: NoteIcon },
  { id: SECTIONS.PINNED, label: "Pinned", Icon: PinIcon },
  { id: SECTIONS.FAVORITES, label: "Favorites", Icon: StarIcon },
  { id: SECTIONS.ARCHIVED, label: "Archived", Icon: ArchiveIcon },
  { id: SECTIONS.TRASH, label: "Trash", Icon: TrashIcon },
];

/**
 * Sidebar — primary navigation. Collapsible on mobile via `isOpen`.
 * Counts are computed in App and passed in so the sidebar stays presentational.
 */
export default function Sidebar({
  section,
  onSectionChange,
  counts,
  isOpen,
  onClose,
  onCreate,
}) {
  return (
    <>
      {/* Mobile scrim */}
      <button
        type="button"
        aria-hidden={!isOpen}
        tabIndex={-1}
        onClick={onClose}
        className={
          "fixed inset-0 z-30 bg-overlay backdrop-blur-[2px] " +
          "transition-opacity duration-200 lg:hidden " +
          (isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none")
        }
      />

      <aside
        aria-label="Primary"
        className={
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col " +
          "border-r border-border bg-bg " +
          "transition-transform duration-200 ease-out-soft " +
          "lg:static lg:translate-x-0 " +
          (isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
        }
        style={{ "--ease-out-soft": "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between px-app-md border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-text text-bg">
              <SparkleIcon size={14} />
            </div>
            <span className="font-semibold tracking-tight text-text">
              Paperly
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-bg-soft"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* New note CTA */}
        <div className="px-app-md pt-app-md">
          <button
            type="button"
            onClick={onCreate}
            className={
              "w-full inline-flex items-center justify-center gap-2 " +
              "rounded-md bg-text text-bg px-app-md py-2.5 " +
              "text-label font-medium uppercase tracking-wide " +
              "hover:opacity-90 active:scale-[0.99] transition " +
              "shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
            }
          >
            <span className="text-base">+</span>
            <span>New note</span>
            <kbd className="ml-1 hidden sm:inline-flex items-center rounded-sm bg-bg/15 px-1.5 py-0.5 text-[10px] font-medium tracking-normal">
              Ctrl N
            </kbd>
          </button>
        </div>

        {/* Sections */}
        <nav className="flex-1 overflow-y-auto px-app-sm py-app-md" aria-label="Sections">
          <p className="px-app-sm pb-app-sm text-label uppercase tracking-wider text-text-subtle">
            Library
          </p>
          <ul className="space-y-0.5">
            {NAV.map(({ id, label, Icon }) => {
              const active = id === section;
              const count = counts?.[id] ?? 0;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onSectionChange(id)}
                    aria-current={active ? "page" : undefined}
                    className={
                      "group flex w-full items-center gap-3 rounded-md " +
                      "px-app-sm py-2 text-left transition-colors duration-150 " +
                      (active
                        ? "bg-text text-bg"
                        : "text-text-muted hover:bg-bg-soft hover:text-text")
                    }
                  >
                    <Icon
                      size={16}
                      className={active ? "" : "text-text-subtle group-hover:text-text"}
                    />
                    <span className="flex-1 text-[0.92rem] font-medium">
                      {label}
                    </span>
                    <span
                      className={
                        "rounded-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums " +
                        (active
                          ? "bg-bg/15 text-bg"
                          : "bg-bg-soft text-text-subtle group-hover:bg-neutral")
                      }
                    >
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-app-md py-app-md">
          <p className="text-label text-text-subtle leading-snug">
            Local-only.<br />
            Notes live in your browser.
          </p>
        </div>
      </aside>
    </>
  );
}
