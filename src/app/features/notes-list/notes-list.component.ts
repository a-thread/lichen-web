import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotesService } from '../../core/notes.service';
import { parseBodyText } from '../../core/note.model';
import { parseEditorBlocks } from '../../core/editor/editor-block-parser';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './notes-list.component.html',
  styleUrl: './notes-list.component.scss',
})
export class NotesListComponent implements OnInit {
  constructor(public notesService: NotesService) {}

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
}
