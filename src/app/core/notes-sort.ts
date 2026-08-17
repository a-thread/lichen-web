import { Note } from './note.model';

export type NotesSort = 'date-newest' | 'date-oldest' | 'title-asc' | 'title-desc';

export const NOTES_SORT_LABELS: Record<NotesSort, string> = {
  'date-newest': 'Newest first',
  'date-oldest': 'Oldest first',
  'title-asc': 'Title A–Z',
  'title-desc': 'Title Z–A',
};

export function sortNotes(notes: Note[], sort: NotesSort): Note[] {
  const sorted = [...notes];
  switch (sort) {
    case 'date-newest':
      return sorted.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    case 'date-oldest':
      return sorted.sort((a, b) => a.updated_at.localeCompare(b.updated_at));
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
  }
}
