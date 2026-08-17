import { Injectable, computed, signal } from '@angular/core';
import { Note, newNoteId, textBody } from './note.model';
import { NotesSort, sortNotes } from './notes-sort';
import { OfflineStoreService } from './offline-store.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class NotesService {
  readonly notes = signal<Note[]>([]);
  readonly isOnline = signal(navigator.onLine);
  readonly isSyncing = signal(false);
  readonly sort = signal<NotesSort>('date-newest');
  readonly sortedNotes = computed(() => sortNotes(this.notes(), this.sort()));

  setSort(sort: NotesSort): void {
    this.sort.set(sort);
  }

  constructor(
    private offlineStore: OfflineStoreService,
    private supabase: SupabaseService
  ) {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.syncPending();
    });
    window.addEventListener('offline', () => this.isOnline.set(false));

    this.loadLocal().then(() => {
      if (this.isOnline()) this.syncPending();
    });
  }

  private async loadLocal(): Promise<void> {
    const local = await this.offlineStore.getAllNotes();
    this.notes.set(sortNotes(local, 'date-newest'));
  }

  /** Pull the latest from Supabase and merge into the local cache. Call on app start / pull-to-refresh. */
  async refreshFromRemote(): Promise<void> {
    if (!this.isOnline()) return;
    try {
      const remote = await this.supabase.fetchNotes();
      await this.offlineStore.putNotes(remote);
      await this.loadLocal();
    } catch (err) {
      console.error('Failed to refresh notes from Supabase', err);
    }
  }

  async createNote(userId: string, title: string, text: string): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: newNoteId(),
      user_id: userId,
      title,
      body: textBody(text),
      created_at: now,
      created_by: userId,
      updated_at: now,
      updated_by: userId,
      is_public: false,
    };
    await this.saveLocalAndQueue(note);
    return note;
  }

  async updateNote(note: Note, title: string, text: string): Promise<void> {
    const updated: Note = {
      ...note,
      title,
      body: textBody(text),
      updated_at: new Date().toISOString(),
    };
    await this.saveLocalAndQueue(updated);
  }

  async deleteNote(id: string): Promise<void> {
    await this.offlineStore.deleteNote(id);
    await this.offlineStore.queueChange({ noteId: id, op: 'delete', queuedAt: new Date().toISOString() });
    await this.loadLocal();
    if (this.isOnline()) this.syncPending();
  }

  /** Re-inserts a just-deleted note verbatim. Used by the list's "Undo" toast action. */
  async restoreNote(note: Note): Promise<void> {
    await this.saveLocalAndQueue(note);
  }

  private async saveLocalAndQueue(note: Note): Promise<void> {
    await this.offlineStore.putNote(note);
    await this.offlineStore.queueChange({ noteId: note.id, op: 'upsert', queuedAt: new Date().toISOString() });
    await this.loadLocal();
    if (this.isOnline()) this.syncPending();
  }

  /** Flush the pending-change queue to Supabase. Safe to call repeatedly; no-ops when offline or empty. */
  async syncPending(): Promise<void> {
    if (!this.isOnline() || this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      const pending = await this.offlineStore.getPendingChanges();
      for (const change of pending) {
        if (change.op === 'delete') {
          await this.supabase.deleteNote(change.noteId);
        } else {
          const note = await this.offlineStore.getNote(change.noteId);
          if (note) await this.supabase.upsertNote(note);
        }
        await this.offlineStore.clearPendingChange(change.noteId);
      }
    } catch (err) {
      // Left in the queue; will retry on next connectivity change or app load.
      console.error('Sync failed, will retry later', err);
    } finally {
      this.isSyncing.set(false);
    }
  }
}
