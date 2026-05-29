import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  MoreVertical,
  Pin,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { COLOR_LABELS, SECTIONS, derivePreview, deriveTitle, highlightSegments } from "../utils/noteUtils";
import { formatRelative } from "../utils/dateUtils";

const COLOR_BY_ID = Object.fromEntries(COLOR_LABELS.map((c) => [c.id, c.swatch]));

/**
 * NoteCard — a single note in the list. Click anywhere on the body to open.
 * Toolbar action buttons are stop-propagation so they don't trip the open handler.
 */
export default function NoteCard({
  note,
  view = "grid",
  section = SECTIONS.ALL,
  query = "",
  onOpen,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onUnarchive,
  onTrash,
  onRestore,
  onDeleteForever,
}) {
  const title = deriveTitle(note);
  const preview = derivePreview(note, view === "list" ? 220 : 160);
  const colorSwatch = COLOR_BY_ID[note.color] || "transparent";
  const inTrash = section === SECTIONS.TRASH;
  const inArchive = section === SECTIONS.ARCHIVED;

  return (
    <article
      className={
        "group relative flex flex-col rounded-lg border border-border bg-card " +
        "transition-[border-color,box-shadow] duration-150 " +
        "hover:border-border-strong " +
        "focus-within:border-border-strong " +
        (view === "list" ? "p-app-md md:flex-row md:items-start md:gap-app-md" : "p-app-md")
      }
    >
      {/* Color stripe */}
      {note.color && note.color !== "none" ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg"
          style={{ backgroundColor: colorSwatch }}
        />
      ) : null}

      {/* Click-to-open surface fills the card under the toolbar */}
      <button
        type="button"
        onClick={() => onOpen?.(note)}
        className={
          "text-left flex-1 min-w-0 rounded-md " +
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-text " +
          (view === "list" ? "" : "")
        }
        aria-label={`Open note: ${title}`}
      >
        <div className="flex items-start gap-app-sm">
          <h3 className="flex-1 min-w-0 text-[1.02rem] font-semibold leading-snug text-text line-clamp-2">
            <Highlight text={title} query={query} />
          </h3>
          {note.isPinned && !inTrash ? (
            <Pin
              size={14}
              strokeWidth={1.75}
              fill="currentColor"
              className="mt-1 shrink-0 text-text"
              aria-label="Pinned"
            />
          ) : null}
        </div>

        {preview ? (
          <p
            className={
              "mt-app-sm text-[0.9rem] leading-relaxed text-text-muted " +
              (view === "list" ? "line-clamp-2" : "line-clamp-4")
            }
          >
            <Highlight text={preview} query={query} />
          </p>
        ) : (
          <p className="mt-app-sm text-[0.9rem] italic text-text-subtle">
            Empty note
          </p>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 ? (
          <ul className="mt-app-md flex flex-wrap gap-1.5">
            {note.tags.slice(0, 4).map((t) => (
              <li
                key={t}
                className="rounded-sm bg-bg-soft px-1.5 py-0.5 text-[11px] font-medium text-text-muted border border-border"
              >
                #{t}
              </li>
            ))}
            {note.tags.length > 4 ? (
              <li className="rounded-sm px-1.5 py-0.5 text-[11px] text-text-subtle">
                +{note.tags.length - 4}
              </li>
            ) : null}
          </ul>
        ) : null}
      </button>

      {/* Footer: timestamp + actions */}
      <div
        className={
          "mt-app-md flex items-center justify-between gap-app-sm " +
          (view === "list" ? "md:mt-0 md:flex-col md:items-end md:justify-start md:min-w-[180px]" : "")
        }
      >
        <time
          className="text-label text-text-subtle tabular-nums"
          dateTime={note.updatedAt}
          title={new Date(note.updatedAt).toLocaleString()}
        >
          {formatRelative(note.updatedAt)}
        </time>

        <CardToolbar
          note={note}
          inTrash={inTrash}
          inArchive={inArchive}
          onTogglePin={onTogglePin}
          onToggleFavorite={onToggleFavorite}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onTrash={onTrash}
          onRestore={onRestore}
          onDeleteForever={onDeleteForever}
        />
      </div>
    </article>
  );
}

function CardToolbar({
  note,
  inTrash,
  inArchive,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onUnarchive,
  onTrash,
  onRestore,
  onDeleteForever,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Click-outside / Escape to close.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (inTrash) {
    return (
      <div className="flex items-center gap-1">
        <IconButton
          label="Restore"
          onClick={(e) => {
            e.stopPropagation();
            onRestore?.(note.id);
          }}
        >
          <RotateCcw size={15} strokeWidth={1.75} />
        </IconButton>
        <IconButton
          label="Delete forever"
          tone="danger"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteForever?.(note);
          }}
        >
          <Trash2 size={15} strokeWidth={1.75} />
        </IconButton>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative flex items-center gap-1">
      <IconButton
        label={note.isPinned ? "Unpin" : "Pin"}
        active={note.isPinned}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin?.(note.id);
        }}
      >
        <Pin
          size={15}
          strokeWidth={1.75}
          fill={note.isPinned ? "currentColor" : "none"}
        />
      </IconButton>
      <IconButton
        label={note.isFavorite ? "Unfavorite" : "Favorite"}
        active={note.isFavorite}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(note.id);
        }}
      >
        <Star
          size={15}
          strokeWidth={1.75}
          fill={note.isFavorite ? "currentColor" : "none"}
        />
      </IconButton>

      <IconButton
        label="More"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
      >
        <MoreVertical size={15} strokeWidth={1.75} />
      </IconButton>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className={
              "absolute right-0 top-full mt-1.5 z-10 w-44 rounded-md border border-border " +
              "bg-card shadow-lg shadow-black/5 dark:shadow-black/30 " +
              "py-1 text-[0.88rem] origin-top-right"
            }
            onClick={(e) => e.stopPropagation()}
          >
            {inArchive ? (
              <MenuItem
                onSelect={() => {
                  setMenuOpen(false);
                  onUnarchive?.(note.id);
                }}
              >
                <RotateCcw size={14} strokeWidth={1.75} />
                Move to All Notes
              </MenuItem>
            ) : (
              <MenuItem
                onSelect={() => {
                  setMenuOpen(false);
                  onArchive?.(note.id);
                }}
              >
                <Archive size={14} strokeWidth={1.75} />
                Archive
              </MenuItem>
            )}
            <MenuItem
              tone="danger"
              onSelect={() => {
                setMenuOpen(false);
                onTrash?.(note.id);
              }}
            >
              <Trash2 size={14} strokeWidth={1.75} />
              Move to Trash
            </MenuItem>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Highlight — renders `text` with case-insensitive matches of `query` wrapped
 * in <mark>. Uses the pure highlightSegments helper; segments are plain strings
 * so React escapes them — no HTML injection risk from note content or query.
 */
function Highlight({ text, query }) {
  if (!query || !query.trim() || !text) return text || null;
  const segments = highlightSegments(text, query);
  return segments.map((seg, i) =>
    seg.match ? (
      <mark key={i} className="bg-mark-highlight text-text rounded-[1px]">
        {seg.text}
      </mark>
    ) : (
      <span key={i}>{seg.text}</span>
    ),
  );
}

function IconButton({ label, active, tone, children, ...rest }) {
  const base =
    "inline-flex h-8 w-8 items-center justify-center rounded-md " +
    "transition-colors duration-150 ";
  const tones = active
    ? "bg-text text-bg"
    : tone === "danger"
      ? "text-text-muted hover:text-text hover:bg-bg-soft"
      : "text-text-muted hover:text-text hover:bg-bg-soft";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={base + tones}
      {...rest}
    >
      {children}
    </button>
  );
}

function MenuItem({ tone, onSelect, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={
        "flex w-full items-center gap-2 px-app-sm py-1.5 text-left " +
        "hover:bg-bg-soft " +
        (tone === "danger" ? "text-text" : "text-text")
      }
    >
      <span className="text-text-muted inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
