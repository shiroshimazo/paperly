import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  Download,
  Pin,
  RotateCcw,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { COLOR_LABELS, countText, deriveTitle, slugify } from "../utils/noteUtils";
import { formatDateTime, formatRelative } from "../utils/dateUtils";
import { renderMarkdown } from "../utils/markdown";
import { useDebouncedEffect } from "../hooks/useDebouncedEffect";

const AUTOSAVE_MS = 350;

/**
 * NoteEditor — focused editing surface for a single note.
 *
 * State model:
 *  - Local draft state (title, content, tags, color) is owned here so typing
 *    feels instant. A debounced effect commits to the parent's `onChange`,
 *    which in turn writes to localStorage via useNotes.
 *  - When the active note id changes (user switched notes), we hydrate the
 *    local draft from props.
 *  - "Saved · 2s ago" indicator reflects the last commit.
 */
export default function NoteEditor({
  note,
  onChange,
  onClose,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onUnarchive,
  onTrash,
  onRestore,
  onDeleteForever,
  onExportTxt,
}) {
  // Local draft mirrors the note so typing is fluid.
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags || []);
  const [color, setColor] = useState(note.color || "none");
  const [tagDraft, setTagDraft] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const lastSavedAt = useRef(note.updatedAt);
  const [, forceTick] = useState(0);

  // Re-hydrate when switching to a different note.
  const idRef = useRef(note.id);
  useEffect(() => {
    if (idRef.current !== note.id) {
      idRef.current = note.id;
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setColor(note.color || "none");
      setTagDraft("");
      setShowPreview(false);
      lastSavedAt.current = note.updatedAt;
    }
  }, [note.id, note.title, note.content, note.tags, note.color, note.updatedAt]);

  // Debounced commit to parent. The parent decides whether anything changed.
  useDebouncedEffect(
    () => {
      const dirty =
        title !== note.title ||
        content !== note.content ||
        color !== note.color ||
        !sameTags(tags, note.tags);
      if (!dirty) return;
      onChange?.(note.id, { title, content, tags, color });
      lastSavedAt.current = new Date().toISOString();
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 900);
      return () => clearTimeout(t);
    },
    AUTOSAVE_MS,
    [title, content, tags, color],
  );

  // Tick the "saved 5s ago" indicator without committing on every render.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Ctrl+S forces an immediate save (parity with users' muscle memory).
  // We just commit the latest draft without the debounce.
  useEffect(() => {
    function onKey(e) {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        onChange?.(note.id, { title, content, tags, color });
        lastSavedAt.current = new Date().toISOString();
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 900);
      } else if (e.key === "Escape") {
        onClose?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [note.id, title, content, tags, color, onChange, onClose]);

  const inTrash = !!note.isDeleted;
  const inArchive = !!note.isArchived;
  const stats = useMemo(() => countText(content), [content]);
  const previewHtml = useMemo(() => renderMarkdown(content), [content]);

  function commitTagDraft() {
    const next = tagDraft.trim().replace(/^#+/, "");
    if (!next) return;
    if (tags.some((t) => t.toLowerCase() === next.toLowerCase())) {
      setTagDraft("");
      return;
    }
    setTags([...tags, next]);
    setTagDraft("");
  }

  function removeTag(t) {
    setTags(tags.filter((x) => x !== t));
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 flex flex-col bg-bg"
      role="dialog"
      aria-label="Note editor"
    >
      {/* Editor header */}
      <header className="flex h-14 shrink-0 items-center gap-app-sm border-b border-border bg-bg px-app-md">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to notes"
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-app-sm text-text-muted hover:text-text hover:bg-bg-soft transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[0.88rem]">Back</span>
        </button>

        <span className="hidden md:inline text-label text-text-subtle">
          {inTrash ? "In Trash" : inArchive ? "Archived" : "Editing"}
        </span>

        <div className="ml-auto flex items-center gap-app-sm">
          <SaveIndicator savedFlash={savedFlash} savedAt={lastSavedAt.current} />

          {!inTrash ? (
            <>
              <ToolbarButton
                label="Toggle preview"
                pressed={showPreview}
                onClick={() => setShowPreview((v) => !v)}
              >
                <Sparkles size={16} strokeWidth={1.75} />
                <span className="hidden md:inline text-[0.85rem]">
                  {showPreview ? "Edit" : "Preview"}
                </span>
              </ToolbarButton>

              <ToolbarButton
                label={note.isPinned ? "Unpin note" : "Pin note"}
                pressed={note.isPinned}
                onClick={() => onTogglePin?.(note.id)}
              >
                <Pin
                  size={16}
                  strokeWidth={1.75}
                  fill={note.isPinned ? "currentColor" : "none"}
                />
              </ToolbarButton>
              <ToolbarButton
                label={note.isFavorite ? "Unfavorite" : "Favorite"}
                pressed={note.isFavorite}
                onClick={() => onToggleFavorite?.(note.id)}
              >
                <Star
                  size={16}
                  strokeWidth={1.75}
                  fill={note.isFavorite ? "currentColor" : "none"}
                />
              </ToolbarButton>

              {inArchive ? (
                <ToolbarButton
                  label="Move to All Notes"
                  onClick={() => onUnarchive?.(note.id)}
                >
                  <RotateCcw size={16} strokeWidth={1.75} />
                </ToolbarButton>
              ) : (
                <ToolbarButton
                  label="Archive note"
                  onClick={() => onArchive?.(note.id)}
                >
                  <Archive size={16} strokeWidth={1.75} />
                </ToolbarButton>
              )}

              <ToolbarButton label="Export as .txt" onClick={() => onExportTxt?.(note)}>
                <Download size={16} strokeWidth={1.75} />
              </ToolbarButton>

              <ToolbarButton
                label="Move to Trash"
                onClick={() => onTrash?.(note)}
              >
                <Trash2 size={16} strokeWidth={1.75} />
              </ToolbarButton>
            </>
          ) : (
            <>
              <ToolbarButton label="Restore" onClick={() => onRestore?.(note.id)}>
                <RotateCcw size={16} strokeWidth={1.75} />
                <span className="hidden md:inline text-[0.85rem]">Restore</span>
              </ToolbarButton>
              <ToolbarButton
                label="Delete forever"
                onClick={() => onDeleteForever?.(note)}
              >
                <Trash2 size={16} strokeWidth={1.75} />
                <span className="hidden md:inline text-[0.85rem]">Delete</span>
              </ToolbarButton>
            </>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-app-md px-app-md py-app-lg">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            disabled={inTrash}
            aria-label="Note title"
            className={
              "w-full bg-transparent text-h1 font-semibold tracking-tight " +
              "text-text placeholder:text-text-subtle " +
              "focus:outline-none disabled:opacity-60"
            }
          />

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-app-md gap-y-1 text-label text-text-subtle">
            <span>Created {formatDateTime(note.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span>Updated {formatRelative(note.updatedAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{stats.words} words</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{stats.chars} chars</span>
          </div>

          {/* Color labels */}
          {!inTrash ? (
            <div className="flex items-center gap-app-sm">
              <span className="inline-flex items-center gap-1 text-label uppercase tracking-wider text-text-subtle">
                Color
              </span>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Color label">
                {COLOR_LABELS.map((c) => {
                  const active = color === c.id;
                  const isNone = c.id === "none";
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={c.label}
                      onClick={() => setColor(c.id)}
                      className={
                        "relative inline-flex h-6 w-6 items-center justify-center rounded-sm " +
                        "border transition-colors duration-150 " +
                        (active
                          ? "border-text"
                          : "border-border hover:border-border-strong")
                      }
                    >
                      {isNone ? (
                        <X size={11} strokeWidth={1.75} className="text-text-subtle" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 rounded-sm"
                          style={{ backgroundColor: c.swatch }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Tags */}
          {!inTrash ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 pr-1 text-label uppercase tracking-wider text-text-subtle">
                <Tag size={12} strokeWidth={1.75} />
                Tags
              </span>
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-sm border border-border bg-bg-soft px-1.5 py-0.5 text-[12px] font-medium text-text-muted"
                >
                  <span className="opacity-60">#</span>
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    aria-label={`Remove tag ${t}`}
                    className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-sm text-text-subtle hover:text-text hover:bg-neutral"
                  >
                    <X size={11} strokeWidth={1.75} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    commitTagDraft();
                  } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                    setTags(tags.slice(0, -1));
                  }
                }}
                onBlur={commitTagDraft}
                placeholder={tags.length ? "Add tag" : "personal, school…"}
                aria-label="Add tag"
                className="min-w-[8ch] flex-1 bg-transparent px-1 py-0.5 text-[12px] placeholder:text-text-subtle focus:outline-none"
              />
            </div>
          ) : null}

          {/* Body / Preview */}
          {showPreview ? (
            <article
              className="md-preview text-[1rem] leading-relaxed text-text"
              // renderMarkdown escapes HTML before producing safe markup.
              dangerouslySetInnerHTML={{ __html: previewHtml || placeholderPreview() }}
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing… use #, **bold**, - lists, > quotes."
              disabled={inTrash}
              aria-label="Note body"
              rows={18}
              className={
                "w-full min-h-[60vh] resize-none bg-transparent " +
                "text-[1rem] leading-relaxed text-text placeholder:text-text-subtle " +
                "focus:outline-none disabled:opacity-60"
              }
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ToolbarButton({ label, pressed, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={typeof pressed === "boolean" ? pressed : undefined}
      className={
        "inline-flex h-9 items-center gap-1.5 rounded-md px-app-sm transition-colors duration-150 " +
        (pressed
          ? "bg-text text-bg"
          : "text-text-muted hover:text-text hover:bg-bg-soft")
      }
    >
      {children}
    </button>
  );
}

function SaveIndicator({ savedFlash, savedAt }) {
  return (
    <span
      className={
        "hidden sm:inline-flex items-center gap-1.5 text-label tabular-nums " +
        (savedFlash ? "text-text" : "text-text-subtle")
      }
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={
          "inline-block h-1.5 w-1.5 rounded-full transition-colors duration-150 " +
          (savedFlash ? "bg-text" : "bg-border-strong")
        }
      />
      {savedFlash ? "Saving…" : `Saved ${formatRelative(savedAt)}`}
    </span>
  );
}

function placeholderPreview() {
  return '<p class="md-empty">Nothing to preview yet.</p>';
}

function sameTags(a = [], b = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
