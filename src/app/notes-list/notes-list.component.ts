import { Component, OnInit, computed, inject, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { NotesStore } from "../data-access/notes/notes.store";
import { AuthStore } from "../data-access/auth/auth.store";
import { ToastStore } from "../shared/state/toast.store";
import { Note, parseBodyText } from "../data-access/notes/note.model";
import { parseEditorBlocks } from "../data-access/notes/note-blocks-parser";
import { NotesSort, NOTES_SORT_LABELS } from "../data-access/notes/notes-sort";
import {
  formatAllNotesExport,
  titleFromImportFilename,
} from "../shared/utils/export-format";
import { downloadTextFile } from "../shared/utils/download-file";
import { IconComponent } from "../shared/components/icon/icon.component";

type LayoutMode = "grid" | "list";

@Component({
  selector: "app-notes-list",
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent],
  templateUrl: "./notes-list.component.html",
  styleUrl: "./notes-list.component.scss",
})
export class NotesListComponent implements OnInit {
  readonly notesStore = inject(NotesStore);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastStore);

  fileInput = viewChild<{ nativeElement: HTMLInputElement }>("fileInput");
  searchInput = viewChild<{ nativeElement: HTMLInputElement }>("searchInput");
  menuTrigger = viewChild<{ nativeElement: HTMLButtonElement }>("menuTrigger");
  firstMenuItem = viewChild<{ nativeElement: HTMLButtonElement }>("firstMenuItem");

  search = signal("");
  layout = signal<LayoutMode>("grid");
  menuOpen = signal(false);
  searchOpen = signal(false);

  readonly sortOptions = Object.entries(NOTES_SORT_LABELS) as [
    NotesSort,
    string,
  ][];

  readonly filteredNotes = computed(() => {
    const query = this.search().trim().toLowerCase();
    const notes = this.notesStore.sortedNotes();
    if (!query) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        parseBodyText(note.body).toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
    this.notesStore.refreshFromRemote();
  }

  preview(body: string): string {
    const text = parseBodyText(body);
    const firstBlock = parseEditorBlocks(text)[0];
    if (!firstBlock) return "";
    if (firstBlock.type === "text" || firstBlock.type === "heading")
      return firstBlock.text.slice(0, 80);
    if (firstBlock.type === "checklist" || firstBlock.type === "numberedList")
      return firstBlock.items[0]?.text.slice(0, 80) ?? "";
    if (firstBlock.type === "bulletList")
      return firstBlock.items[0]?.slice(0, 80) ?? "";
    return text.slice(0, 80);
  }

  toggleLayout(): void {
    this.layout.update((l) => (l === "grid" ? "list" : "grid"));
  }

  toggleSearch(): void {
    const opening = !this.searchOpen();
    this.searchOpen.set(opening);
    if (opening) {
      queueMicrotask(() => this.searchInput()?.nativeElement.focus());
    } else {
      this.search.set("");
    }
  }

  onSortChange(sort: NotesSort): void {
    this.notesStore.setSort(sort);
  }

  toggleMenu(): void {
    const opening = !this.menuOpen();
    this.menuOpen.set(opening);
    if (opening) {
      queueMicrotask(() => this.firstMenuItem()?.nativeElement.focus());
    }
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    queueMicrotask(() => this.menuTrigger()?.nativeElement.focus());
  }

  async deleteNote(note: Note, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    await this.notesStore.deleteNote(note.id);
    this.toast.show("Note deleted", {
      actionLabel: "Undo",
      onAction: () => this.notesStore.restoreNote(note),
    });
  }

  triggerImport(): void {
    this.closeMenu();
    this.fileInput()?.nativeElement.click();
  }

  async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    const userId = this.auth.userId();
    if (!userId) return;

    const content = await file.text();
    if (!content.trim()) return;

    await this.notesStore.createNote(
      userId,
      titleFromImportFilename(file.name),
      content.trim(),
    );
    this.toast.show("Note imported");
  }

  exportAll(): void {
    this.closeMenu();
    downloadTextFile(
      "lichen-notes-export.txt",
      formatAllNotesExport(this.notesStore.notes()),
    );
    this.toast.show("Export complete");
  }
}
