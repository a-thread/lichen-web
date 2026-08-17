import { Note, parseBodyText } from "../../data-access/notes/note.model";

/** Mirrors NoteRepositoryImpl.exportNoteAsText — filename + raw body text. */
export function formatSingleNoteExport(note: Note): {
  filename: string;
  content: string;
} {
  const title = note.title.trim() || "Untitled";
  const safeFileName = title.replace(/[\\/:*?"<>|]/g, "_");
  return { filename: `${safeFileName}.txt`, content: parseBodyText(note.body) };
}

/** Mirrors NoteRepositoryImpl.exportNotesAsText — same header/frontmatter format. */
export function formatAllNotesExport(notes: Note[]): string {
  let out = "# Lichen Notes Export\n# version: 1\n\n";
  for (const note of notes) {
    out += "---\n";
    out += `id: ${note.id}\n`;
    out += `createdAt: ${note.created_at}\n`;
    out += `updatedAt: ${note.updated_at}\n`;
    out += "---\n\n";
    out += `# ${note.title}\n`;
    out += `${parseBodyText(note.body)}\n\n`;
  }
  return out;
}

/** Mirrors NoteRepositoryImpl.importNoteFromTextFile's title derivation. */
export function titleFromImportFilename(fileName: string): string {
  const title = fileName.replace(/\.txt$/i, "");
  return title.trim() || "Untitled";
}
