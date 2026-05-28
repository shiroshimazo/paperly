import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Download,
  FileText,
  Pin,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { SECTIONS } from "../utils/noteUtils";

const NAV = [
  { id: SECTIONS.ALL, label: "All Notes", Icon: FileText },
  { id: SECTIONS.PINNED, label: "Pinned", Icon: Pin },
  { id: SECTIONS.FAVORITES, label: "Favorites", Icon: Star },
  { id: SECTIONS.ARCHIVED, label: "Archived", Icon: Archive },
  { id: SECTIONS.TRASH, label: "Trash", Icon: Trash2 },
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
  onExport,
  onImport,
}) {
  return (
    <>
      {/* Mobile scrim */}
      <AnimatePresence>
        {isOpen ? (
          <motion.button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-30 bg-overlay backdrop-blur-[2px] lg:hidden"
          />
        ) : null}
      </AnimatePresence>

      <aside
        aria-label="Primary"
        className={
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col " +
          "border-r border-border bg-bg " +
          "transition-transform duration-200 ease-out-soft " +
          "lg:static lg:translate-x-0 " +
          (isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
        }
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between px-app-md border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-text text-bg">
              <Sparkles size={14} strokeWidth={1.75} />
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
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* New note CTA */}
        <div className="px-app-md pt-app-md">
          <motion.button
            type="button"
            onClick={onCreate}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={
              "w-full inline-flex items-center justify-center gap-2 " +
              "rounded-md bg-text text-bg px-app-md py-2.5 " +
              "text-label font-medium uppercase tracking-wide " +
              "hover:opacity-90 transition " +
              "shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
            }
          >
            <span className="text-base">+</span>
            <span>New note</span>
            <kbd className="ml-1 hidden sm:inline-flex items-center rounded-sm bg-bg/15 px-1.5 py-0.5 text-[10px] font-medium tracking-normal">
              Ctrl N
            </kbd>
          </motion.button>
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
                      strokeWidth={1.75}
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

          {/* Data actions */}
          <p className="mt-app-md px-app-sm pb-app-sm text-label uppercase tracking-wider text-text-subtle">
            Data
          </p>
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={onExport}
                className="group flex w-full items-center gap-3 rounded-md px-app-sm py-2 text-left text-text-muted hover:bg-bg-soft hover:text-text transition-colors duration-150"
              >
                <Download size={16} strokeWidth={1.75} className="text-text-subtle group-hover:text-text" />
                <span className="flex-1 text-[0.92rem] font-medium">Export</span>
                <span className="text-label text-text-subtle">.json</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onImport}
                className="group flex w-full items-center gap-3 rounded-md px-app-sm py-2 text-left text-text-muted hover:bg-bg-soft hover:text-text transition-colors duration-150"
              >
                <Upload size={16} strokeWidth={1.75} className="text-text-subtle group-hover:text-text" />
                <span className="flex-1 text-[0.92rem] font-medium">Import</span>
                <span className="text-label text-text-subtle">.json</span>
              </button>
            </li>
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
