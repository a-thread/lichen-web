// Mirrors the existing `notes` table used by the Lichen Android app,
// so this client reads/writes the same Supabase project without any schema changes.
export interface Note {
  id: string; // uuid
  user_id: string;
  title: string;
  body: string; // JSON-encoded NoteBody, e.g. { "type": "text", "text": "..." }
  created_at: string; // ISO timestamp
  created_by: string;
  updated_at: string;
  updated_by: string;
  is_public: boolean;
}

// Local-only bookkeeping for the offline sync queue.
export interface PendingChange {
  noteId: string;
  op: 'upsert' | 'delete';
  queuedAt: string;
}

export function newNoteId(): string {
  return crypto.randomUUID();
}

export function textBody(text: string): string {
  return JSON.stringify({ type: 'text', text });
}

export function parseBodyText(body: string): string {
  try {
    const parsed = JSON.parse(body);
    return parsed?.text ?? '';
  } catch {
    return body; // tolerate plain-text bodies
  }
}
