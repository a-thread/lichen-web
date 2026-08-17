import { Component, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NotesService } from "../../core/notes.service";
import { parseBodyText } from "../../core/note.model";
import { parseEditorBlocks } from "../../core/editor/editor-block-parser";

@Component({
  selector: "app-notes-list",
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="toolbar">
      <button
        type="button"
        class="secondary"
        (click)="notesService.refreshFromRemote()"
      >
        Refresh
      </button>
      <a routerLink="/note/new"
        ><button type="button" class="accent">+ New Note</button></a
      >
    </div>

    @if (notesService.notes().length === 0) {
      <p class="empty">No notes yet — create your first one.</p>
    }

    <ul class="notes-list">
      @for (note of notesService.notes(); track note.id) {
        <li>
          <a [routerLink]="['/note', note.id]">
            <strong>{{ note.title || "Untitled" }}</strong>
            <p>{{ preview(note.body) }}</p>
          </a>
        </li>
      }
    </ul>
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        gap: 0.5rem;
        padding: 1rem 1.25rem;
      }
      button.secondary {
        background: transparent;
        color: var(--color-text);
        border: 1px solid var(--color-outline);
      }
      button.accent {
        background: var(--color-accent);
        border-color: var(--color-accent);
        color: var(--color-on-accent);
      }
      .notes-list {
        list-style: none;
        margin: 0;
        padding: 0 1.25rem;
      }
      .notes-list li {
        border-bottom: 1px solid var(--color-outline);
        padding: 0.85rem 0;
      }
      .notes-list a {
        text-decoration: none;
        color: var(--color-text);
        display: block;
      }
      .notes-list strong {
        font-weight: 500;
      }
      .notes-list p {
        margin: 0.3rem 0 0;
        color: var(--color-on-surface-variant);
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .empty {
        padding: 0 1.25rem;
        color: var(--color-on-surface-variant);
      }
    `,
  ],
})
export class NotesListComponent implements OnInit {
  constructor(public notesService: NotesService) {}

  ngOnInit(): void {
    this.notesService.refreshFromRemote();
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
}
