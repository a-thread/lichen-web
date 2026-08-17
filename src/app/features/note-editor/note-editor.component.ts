import { Component, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotesService } from '../../core/notes.service';
import { Note, parseBodyText } from '../../core/note.model';
import { AuthService } from '../../core/auth.service';
import { transformEditorInput, TextState } from '../../core/editor/editor-input-transform';
import { toggleChecklistLine } from '../../core/editor/editor-block-parser';
import { Selection } from '../../core/editor/toolbar-actions';
import { FormattingToolbarComponent } from './formatting-toolbar.component';
import { NotePreviewComponent } from './note-preview.component';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [FormsModule, FormattingToolbarComponent, NotePreviewComponent],
  template: `
    <div class="editor">
      <input [ngModel]="title()" (ngModelChange)="title.set($event)" placeholder="Title" class="title-input" />

      <div class="mode-switch">
        <button type="button" [class.active]="mode() === 'write'" (click)="mode.set('write')">Write</button>
        <button type="button" [class.active]="mode() === 'preview'" (click)="mode.set('preview')">Preview</button>
      </div>

      @if (mode() === 'write') {
        <app-formatting-toolbar [selection]="currentSelection()" (applyChange)="applyToolbarResult($event)" />
        <textarea #bodyInput [ngModel]="text()" (ngModelChange)="onBodyChange($event)"
                  (keyup)="onCaretMoved()" (click)="onCaretMoved()"
                  placeholder="Start writing..." rows="16"></textarea>
      } @else {
        <app-note-preview [body]="text()" (toggleChecklist)="onToggleChecklist($event)" />
      }

      <div class="actions">
        <button (click)="save()">Save</button>
        @if (existingNote()) {
          <button (click)="remove()" class="danger">Delete</button>
        }
      </div>
    </div>
  `,
  styles: [
    `.editor { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; max-width: 700px; }
     .title-input { font-size: 1.25rem; font-weight: 600; padding: 0.5rem; border: 1px solid #ddd; }
     textarea { font-size: 1rem; padding: 0.5rem; border: 1px solid #ddd; resize: vertical; font-family: inherit; }
     .actions { display: flex; gap: 0.5rem; }
     .danger { color: #b00; }
     .mode-switch { display: flex; gap: 0.25rem; }
     .mode-switch button { border: 1px solid #ccc; background: white; padding: 0.3rem 0.75rem;
       border-radius: 4px; cursor: pointer; }
     .mode-switch button.active { background: #457b9d; color: white; border-color: #457b9d; }`,
  ],
})
export class NoteEditorComponent implements OnInit {
  bodyInput = viewChild<{ nativeElement: HTMLTextAreaElement }>('bodyInput');

  title = signal('');
  text = signal('');
  mode = signal<'write' | 'preview'>('write');
  existingNote = signal<Note | undefined>(undefined);
  private caret = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notesService: NotesService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return; // new note
    const note = this.notesService.notes().find((n) => n.id === id);
    if (note) {
      this.existingNote.set(note);
      this.title.set(note.title);
      this.text.set(parseBodyText(note.body));
    }
  }

  private nativeTextarea(): HTMLTextAreaElement | undefined {
    return this.bodyInput()?.nativeElement;
  }

  onCaretMoved(): void {
    const el = this.nativeTextarea();
    if (el) this.caret = el.selectionStart ?? this.text().length;
  }

  onBodyChange(newValue: string): void {
    const el = this.nativeTextarea();
    const newCursor = el?.selectionStart ?? newValue.length;
    const oldState: TextState = { text: this.text(), cursor: this.caret };
    const result = transformEditorInput(oldState, { text: newValue, cursor: newCursor });
    this.text.set(result.text);
    this.caret = result.cursor;
    queueMicrotask(() => {
      el?.setSelectionRange(result.cursor, result.cursor);
    });
  }

  currentSelection(): Selection {
    const el = this.nativeTextarea();
    const start = el?.selectionStart ?? this.caret;
    const end = el?.selectionEnd ?? this.caret;
    return { text: this.text(), cursor: start, selectionEnd: end };
  }

  applyToolbarResult(result: Selection): void {
    this.text.set(result.text);
    this.caret = result.cursor;
    const el = this.nativeTextarea();
    queueMicrotask(() => {
      el?.focus();
      el?.setSelectionRange(result.cursor, result.selectionEnd);
    });
  }

  onToggleChecklist(lineIndex: number): void {
    this.text.set(toggleChecklistLine(this.text(), lineIndex));
  }

  async save(): Promise<void> {
    const userId = this.auth.userId();
    if (!userId) return; // route is guarded, but guard defensively
    const note = this.existingNote();
    if (note) {
      await this.notesService.updateNote(note, this.title(), this.text());
    } else {
      await this.notesService.createNote(userId, this.title(), this.text());
    }
    this.router.navigate(['/']);
  }

  async remove(): Promise<void> {
    const note = this.existingNote();
    if (!note) return;
    await this.notesService.deleteNote(note.id);
    this.router.navigate(['/']);
  }
}
