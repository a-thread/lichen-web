import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotesService } from '../../core/notes.service';
import { parseBodyText } from '../../core/note.model';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="toolbar">
      <button (click)="notesService.refreshFromRemote()">Refresh</button>
      <a routerLink="/note/new"><button>+ New Note</button></a>
    </div>

    @if (notesService.notes().length === 0) {
      <p class="empty">No notes yet \u2014 create your first one.</p>
    }

    <ul class="notes-list">
      @for (note of notesService.notes(); track note.id) {
        <li>
          <a [routerLink]="['/note', note.id]">
            <strong>{{ note.title || 'Untitled' }}</strong>
            <p>{{ preview(note.body) }}</p>
          </a>
        </li>
      }
    </ul>
  `,
  styles: [
    `.toolbar { display: flex; gap: 0.5rem; padding: 0 1rem 1rem; }
     .notes-list { list-style: none; margin: 0; padding: 0 1rem; }
     .notes-list li { border-bottom: 1px solid #ddd; padding: 0.75rem 0; }
     .notes-list a { text-decoration: none; color: inherit; display: block; }
     .notes-list p { margin: 0.25rem 0 0; opacity: 0.7; font-size: 0.9rem;
       white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
     .empty { padding: 0 1rem; opacity: 0.6; }`,
  ],
})
export class NotesListComponent implements OnInit {
  constructor(public notesService: NotesService) {}

  ngOnInit(): void {
    this.notesService.refreshFromRemote();
  }

  preview(body: string): string {
    return parseBodyText(body).slice(0, 80);
  }
}
