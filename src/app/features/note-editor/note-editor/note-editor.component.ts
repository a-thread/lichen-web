import { Component, effect, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NotesService } from "../../../core/notes.service";
import { Note, parseBodyText } from "../../../core/note.model";
import { AuthService } from "../../../core/auth.service";
import { ToastService } from "../../../core/toast.service";
import { formatSingleNoteExport } from "../../../core/export-format";
import { downloadTextFile } from "../../../core/download-file";
import {
  transformEditorInput,
  TextState,
} from "../../../core/editor/editor-input-transform";
import { toggleChecklistLine } from "../../../core/editor/editor-block-parser";
import { Selection } from "../../../core/editor/toolbar-actions";
import { FormattingToolbarComponent } from "../formatting-toolbar/formatting-toolbar.component";
import { NotePreviewComponent } from "../note-preview/note-preview.component";
import { ConfirmDialogComponent } from "../../../shared/confirm-dialog/confirm-dialog.component";
import { IconComponent } from "../../../shared/icon/icon.component";

type ScreenMode = "read" | "edit";

@Component({
  selector: "app-note-editor",
  standalone: true,
  imports: [
    FormsModule,
    FormattingToolbarComponent,
    NotePreviewComponent,
    ConfirmDialogComponent,
    IconComponent,
  ],
  templateUrl: "./note-editor.component.html",
  styleUrl: "./note-editor.component.scss",
})
export class NoteEditorComponent {
  bodyInput = viewChild<{ nativeElement: HTMLTextAreaElement }>("bodyInput");

  title = signal("");
  text = signal("");
  mode = signal<"write" | "preview">("write");
  screenMode = signal<ScreenMode>("edit");
  existingNote = signal<Note | undefined>(undefined);
  showDiscardDialog = signal(false);
  private caret = 0;
  private originalTitle = "";
  private originalText = "";
  private loadedFromNote = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notesService: NotesService,
    private auth: AuthService,
    private toast: ToastService,
  ) {
    // A direct navigation (fresh tab, hard refresh, pasted link) may land here
    // before the local cache has ever synced with Supabase — make sure this
    // note has a chance to show up even on a device/session with nothing
    // cached locally yet.
    if (this.route.snapshot.paramMap.get("id")) {
      this.notesService.refreshFromRemote();
    }

    // NotesService loads from IndexedDB asynchronously, so on a direct
    // navigation `notes()` can still be empty when this component is
    // created. Watch it reactively instead of doing a one-shot lookup.
    effect(() => {
      if (this.loadedFromNote) return;
      const id = this.route.snapshot.paramMap.get("id");
      if (!id) return; // new note — screenMode stays 'edit'

      const note = this.notesService.notes().find((n) => n.id === id);
      if (!note) return;

      this.loadedFromNote = true;
      this.existingNote.set(note);
      this.title.set(note.title);
      this.text.set(parseBodyText(note.body));
      this.originalTitle = note.title;
      this.originalText = parseBodyText(note.body);
      this.screenMode.set("read");
    });
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
    const result = transformEditorInput(oldState, {
      text: newValue,
      cursor: newCursor,
    });
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

  /** Checklist toggles from the read-only view save immediately — there's no Save action on that screen. */
  async toggleChecklistReadOnly(lineIndex: number): Promise<void> {
    const note = this.existingNote();
    if (!note) return;
    const newText = toggleChecklistLine(this.text(), lineIndex);
    this.text.set(newText);
    this.originalText = newText;
    await this.notesService.updateNote(note, this.title(), newText);
    this.existingNote.set(this.notesService.notes().find((n) => n.id === note.id) ?? note);
  }

  hasUnsavedChanges(): boolean {
    return this.title() !== this.originalTitle || this.text() !== this.originalText;
  }

  enterEdit(): void {
    this.screenMode.set("edit");
    const el = this.nativeTextarea();
    queueMicrotask(() => {
      const end = this.text().length;
      el?.focus();
      el?.setSelectionRange(end, end);
      this.caret = end;
    });
  }

  requestClose(): void {
    if (this.hasUnsavedChanges()) {
      this.showDiscardDialog.set(true);
      return;
    }
    this.exitEditNoChanges();
  }

  confirmDiscard(): void {
    this.title.set(this.originalTitle);
    this.text.set(this.originalText);
    this.showDiscardDialog.set(false);
    this.exitEditNoChanges();
  }

  cancelDiscard(): void {
    this.showDiscardDialog.set(false);
  }

  private exitEditNoChanges(): void {
    // Only "close edit without saving" drops back to the read view. Back from
    // the read view itself (or closing a brand-new, still-unsaved note)
    // actually leaves the screen.
    if (this.screenMode() === "edit" && this.existingNote()) {
      this.screenMode.set("read");
      return;
    }
    this.router.navigate(["/"]);
  }

  async save(): Promise<void> {
    const userId = this.auth.userId();
    if (!userId) return; // route is guarded, but guard defensively

    const note = this.existingNote();
    if (note) {
      await this.notesService.updateNote(note, this.title(), this.text());
      this.existingNote.set(this.notesService.notes().find((n) => n.id === note.id) ?? note);
    } else {
      const created = await this.notesService.createNote(userId, this.title(), this.text());
      this.existingNote.set(created);
      this.router.navigate(["/note", created.id], { replaceUrl: true });
    }

    this.originalTitle = this.title();
    this.originalText = this.text();
    this.screenMode.set("read");
  }

  async remove(): Promise<void> {
    const note = this.existingNote();
    if (!note) return;
    await this.notesService.deleteNote(note.id);
    this.router.navigate(["/"]);
  }

  exportNote(): void {
    const note = this.existingNote();
    if (!note) return;
    const { filename, content } = formatSingleNoteExport(note);
    downloadTextFile(filename, content);
    this.toast.show("Export complete");
  }
}
