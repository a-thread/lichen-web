import { computed, inject } from "@angular/core";
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from "@ngrx/signals";
import { Note, newNoteId, textBody } from "./note.model";
import { NotesSort, sortNotes } from "./notes-sort";
import { NotesApiService } from "./notes-api.service";
import { NotesOfflineService } from "./notes-offline.service";

type NotesState = {
  notes: Note[];
  isOnline: boolean;
  isSyncing: boolean;
  sort: NotesSort;
};

const initialState: NotesState = {
  notes: [],
  isOnline: navigator.onLine,
  isSyncing: false,
  sort: NotesSort.DateNewest,
};

export const NotesStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed(({ notes, sort }) => ({
    sortedNotes: computed(() => sortNotes(notes(), sort())),
  })),
  withMethods((store) => {
    const api = inject(NotesApiService);
    const offline = inject(NotesOfflineService);

    async function loadLocal(): Promise<void> {
      const local = await offline.getAllNotes();
      patchState(store, { notes: sortNotes(local, NotesSort.DateNewest) });
    }

    async function syncPending(): Promise<void> {
      if (!store.isOnline() || store.isSyncing()) return;
      patchState(store, { isSyncing: true });
      try {
        const pending = await offline.getPendingChanges();
        for (const change of pending) {
          if (change.op === "delete") {
            await api.deleteNote(change.noteId);
          } else {
            const note = await offline.getNote(change.noteId);
            if (note) await api.upsertNote(note);
          }
          await offline.clearPendingChange(change.noteId);
        }
      } catch (err) {
        // Left in the queue; will retry on next connectivity change or app load.
        console.error("Sync failed, will retry later", err);
      } finally {
        patchState(store, { isSyncing: false });
      }
    }

    async function saveLocalAndQueue(note: Note): Promise<void> {
      await offline.putNote(note);
      await offline.queueChange({
        noteId: note.id,
        op: "upsert",
        queuedAt: new Date().toISOString(),
      });
      await loadLocal();
      if (store.isOnline()) syncPending();
    }

    return {
      setSort(sort: NotesSort): void {
        patchState(store, { sort });
      },

      loadLocal,
      syncPending,

      /** Pull the latest from Supabase and merge into the local cache. Call on app start / pull-to-refresh. */
      async refreshFromRemote(): Promise<void> {
        if (!store.isOnline()) return;
        try {
          const remote = await api.fetchNotes();
          await offline.putNotes(remote);
          await loadLocal();
        } catch (err) {
          console.error("Failed to refresh notes from Supabase", err);
        }
      },

      async createNote(
        userId: string,
        title: string,
        text: string,
      ): Promise<Note> {
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
        await saveLocalAndQueue(note);
        return note;
      },

      async updateNote(note: Note, title: string, text: string): Promise<void> {
        const updated: Note = {
          ...note,
          title,
          body: textBody(text),
          updated_at: new Date().toISOString(),
        };
        await saveLocalAndQueue(updated);
      },

      async deleteNote(id: string): Promise<void> {
        await offline.deleteNote(id);
        await offline.queueChange({
          noteId: id,
          op: "delete",
          queuedAt: new Date().toISOString(),
        });
        await loadLocal();
        if (store.isOnline()) syncPending();
      },

      /** Re-inserts a just-deleted note verbatim. Used by the list's "Undo" toast action. */
      async restoreNote(note: Note): Promise<void> {
        await saveLocalAndQueue(note);
      },
    };
  }),
  withHooks({
    onInit(store) {
      window.addEventListener("online", () => {
        patchState(store, { isOnline: true });
        store.syncPending();
      });
      window.addEventListener("offline", () => patchState(store, { isOnline: false }));

      store.loadLocal().then(() => {
        if (store.isOnline()) store.syncPending();
      });
    },
  }),
);
