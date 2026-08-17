import { Component, OnInit, computed, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotesService } from '../../core/notes.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Note, parseBodyText } from '../../core/note.model';
import { parseEditorBlocks } from '../../core/editor/editor-block-parser';
import { NotesSort, NOTES_SORT_LABELS } from '../../core/notes-sort';
import { formatAllNotesExport, titleFromImportFilename } from '../../core/export-format';
import { downloadTextFile } from '../../core/download-file';
import { IconComponent } from '../../shared/icon/icon.component';

type LayoutMode = 'grid' | 'list';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent],
  templateUrl: './notes-list.component.html',
  styleUrl: './notes-list.component.scss',
})
export class NotesListComponent implements OnInit {
  fileInput = viewChild<{ nativeElement: HTMLInputElement }>('fileInput');
  searchInput = viewChild<{ nativeElement: HTMLInputElement }>('searchInput');

  search = signal('');
  layout = signal<LayoutMode>('grid');
  menuOpen = signal(false);
  searchOpen = signal(false);

  readonly sortOptions = Object.entries(NOTES_SORT_LABELS) as [NotesSort, string][];

  readonly filteredNotes = computed(() => {
    const query = this.search().trim().toLowerCase();
    const notes = this.notesService.sortedNotes();
    if (!query) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        parseBodyText(note.body).toLowerCase().includes(query),
    );
  });

  constructor(
    public notesService: NotesService,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.notesService.refreshFromRemote();
  }

  preview(body: string): string {
    const text = parseBodyText(body);
    const firstBlock = parseEditorBlocks(text)[0];
    if (!firstBlock) return '';
    if (firstBlock.type === 'text' || firstBlock.type === 'heading') return firstBlock.text.slice(0, 80);
    if (firstBlock.type === 'checklist' || firstBlock.type === 'numberedList')
      return firstBlock.items[0]?.text.slice(0, 80) ?? '';
    if (firstBlock.type === 'bulletList') return firstBlock.items[0]?.slice(0, 80) ?? '';
    return text.slice(0, 80);
  }

  toggleLayout(): void {
    this.layout.update((l) => (l === 'grid' ? 'list' : 'grid'));
  }

  toggleSearch(): void {
    const opening = !this.searchOpen();
    this.searchOpen.set(opening);
    if (opening) {
      queueMicrotask(() => this.searchInput()?.nativeElement.focus());
    } else {
      this.search.set('');
    }
  }

  onSortChange(sort: NotesSort): void {
    this.notesService.setSort(sort);
  }

  async deleteNote(note: Note, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    await this.notesService.deleteNote(note.id);
    this.toast.show('Note deleted', {
      actionLabel: 'Undo',
      onAction: () => this.notesService.restoreNote(note),
    });
  }

  triggerImport(): void {
    this.menuOpen.set(false);
    this.fileInput()?.nativeElement.click();
  }

  async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const userId = this.auth.userId();
    if (!userId) return;

    const content = await file.text();
    if (!content.trim()) return;

    await this.notesService.createNote(userId, titleFromImportFilename(file.name), content.trim());
    this.toast.show('Note imported');
  }

  exportAll(): void {
    this.menuOpen.set(false);
    downloadTextFile('lichen-notes-export.txt', formatAllNotesExport(this.notesService.notes()));
    this.toast.show('Export complete');
  }
}
