/**
 * Browser file helpers — Blob/anchor download and JSON file picking.
 * Kept separate from noteUtils so the pure layer stays test-clean.
 */
import { slugify, deriveTitle } from "./noteUtils";

/** Trigger a Blob download in the browser. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export a single note as plain .txt. */
export function exportNoteAsTxt(note) {
  const title = deriveTitle(note);
  const tagsLine = note.tags?.length ? `Tags: ${note.tags.join(", ")}\n` : "";
  const body = note.content || "";
  const text = `${title}\n${"─".repeat(Math.min(title.length, 40))}\n${tagsLine}\n${body}\n`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${slugify(title)}.txt`);
}

/**
 * Export a single note as Markdown. The body is already markdown, so it's
 * emitted as-is. A "# Title" heading is added only when the note has an
 * explicit title — otherwise deriveTitle would echo the body's first line and
 * duplicate it. Tags use #hashtag syntax for portability to other md tools.
 */
export function exportNoteAsMarkdown(note) {
  const explicitTitle = (note.title || "").trim();
  const parts = [];
  if (explicitTitle) parts.push(`# ${explicitTitle}`);
  if (note.tags?.length) parts.push(note.tags.map((t) => `#${t}`).join(" "));
  if (note.content) parts.push(note.content);
  const text = parts.join("\n\n").replace(/\n*$/, "\n");
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `${slugify(deriveTitle(note))}.md`);
}

/** Export an array of notes as a JSON file (round-trippable via importNotes). */
export function exportNotesAsJson(notes, filename = "paperly-notes.json") {
  const payload = {
    app: "paperly",
    exportedAt: new Date().toISOString(),
    notes: notes ?? [],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(blob, filename);
}

/** Open a hidden <input type="file"> and resolve with the chosen file's text. */
export function pickJsonFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}
