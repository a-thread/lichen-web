import { Note } from "./note.model";

export enum NotesSort {
  DateNewest = "date-newest",
  DateOldest = "date-oldest",
  TitleAsc = "title-asc",
  TitleDesc = "title-desc",
}

export const NOTES_SORT_LABELS: Record<NotesSort, string> = {
  [NotesSort.DateNewest]: "Newest first",
  [NotesSort.DateOldest]: "Oldest first",
  [NotesSort.TitleAsc]: "Title A-Z",
  [NotesSort.TitleDesc]: "Title Z-A",
};

export function sortNotes(notes: Note[], sort: NotesSort): Note[] {
  const sorted = [...notes];
  switch (sort) {
    case NotesSort.DateNewest:
      return sorted.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    case NotesSort.DateOldest:
      return sorted.sort((a, b) => a.updated_at.localeCompare(b.updated_at));
    case NotesSort.TitleAsc:
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case NotesSort.TitleDesc:
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
  }
}
