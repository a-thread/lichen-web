import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotesService } from '../../core/notes.service';
import { Note, parseBodyText } from '../../core/note.model';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="editor">
      <input [(ngModel)]="title" placeholder="Title" class="title-input" />
      <textarea [(ngModel)]="text" placeholder="Start writing..." rows="16"></textarea>
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
     textarea { font-size: 1rem; padding: 0.5rem; border: 1px solid #ddd; resize: vertical; }
     .actions { display: flex; gap: 0.5rem; }
     .danger { color: #b00; }`,
  ],
})
export class NoteEditorComponent implements OnInit {
  title = '';
  text = '';
  existingNote = signal<Note | undefined>(undefined);

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
      this.title = note.title;
      this.text = parseBodyText(note.body);
    }
  }

  async save(): Promise<void> {
    const userId = this.auth.userId();
    if (!userId) return; // route is guarded, but guard defensively
    const note = this.existingNote();
    if (note) {
      await this.notesService.updateNote(note, this.title, this.text);
    } else {
      await this.notesService.createNote(userId, this.title, this.text);
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
