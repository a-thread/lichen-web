import { Component, input, output } from "@angular/core";
import { EditorBlock } from "../../core/editor/editor-block.model";
import { parseEditorBlocks } from "../../core/editor/editor-block-parser";
import {
  InlineSpan,
  renderInlineMarkdown,
} from "../../core/editor/inline-markdown";

@Component({
  selector: "app-note-preview",
  standalone: true,
  template: `
    <div class="preview">
      @for (block of blocks(); track $index) {
        @switch (block.type) {
          @case ("heading") {
            <div [class]="'heading h' + block.level">{{ block.text }}</div>
          }
          @case ("text") {
            <p class="text-block">
              @for (span of spans(block.text); track $index) {
                @if (span.bold) {
                  <strong>{{ span.text }}</strong>
                } @else if (span.italic) {
                  <em>{{ span.text }}</em>
                } @else if (span.code) {
                  <code>{{ span.text }}</code>
                } @else {
                  <span>{{ span.text }}</span>
                }
              }
            </p>
          }
          @case ("bulletList") {
            <div class="list">
              @for (raw of block.items; track $index) {
                <div
                  class="list-row"
                  [style.paddingLeft.px]="indentLevel(raw) * 16"
                >
                  <span class="marker">&bull;</span>
                  <span>
                    @for (span of spans(stripBulletPrefix(raw)); track $index) {
                      @if (span.bold) {
                        <strong>{{ span.text }}</strong>
                      } @else if (span.italic) {
                        <em>{{ span.text }}</em>
                      } @else if (span.code) {
                        <code>{{ span.text }}</code>
                      } @else {
                        <span>{{ span.text }}</span>
                      }
                    }
                  </span>
                </div>
              }
            </div>
          }
          @case ("numberedList") {
            <div class="list">
              @for (item of block.items; track $index) {
                <div
                  class="list-row"
                  [style.paddingLeft.px]="indentLevel(item.text) * 16"
                >
                  <span class="marker">{{ extractNumber(item.text) }}.</span>
                  <span>{{ stripNumberPrefix(item.text) }}</span>
                </div>
              }
            </div>
          }
          @case ("checklist") {
            <div class="list">
              @for (item of block.items; track item.lineIndex) {
                <div
                  class="checklist-row"
                  [style.paddingLeft.px]="indentLevel(item.text) * 16"
                  (click)="toggleChecklist.emit(item.lineIndex)"
                >
                  <input
                    type="checkbox"
                    [checked]="item.checked"
                    (click)="
                      $event.stopPropagation();
                      toggleChecklist.emit(item.lineIndex)
                    "
                  />
                  <span [class.checked]="item.checked">{{ item.text }}</span>
                </div>
              }
            </div>
          }
          @case ("divider") {
            <hr />
          }
        }
      }
    </div>
  `,
  styles: [
    `
      .preview {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0 0.1rem;
      }
      .heading {
        font-weight: 500;
        margin: 0.5rem 0;
        color: var(--color-text);
      }
      .heading.h1 {
        font-size: 1.5rem;
      }
      .heading.h2 {
        font-size: 1.25rem;
      }
      .heading.h3 {
        font-size: 1.1rem;
      }
      .text-block {
        margin: 0;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      code {
        font-family: monospace;
        background: var(--color-surface-variant);
        padding: 0 0.25rem;
        border-radius: 3px;
      }
      .list {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .list-row {
        display: flex;
        gap: 0.5rem;
      }
      .marker {
        color: var(--color-on-surface-variant);
      }
      .checklist-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }
      .checklist-row .checked {
        text-decoration: line-through;
        color: var(--color-on-surface-variant);
      }
      hr {
        border: none;
        border-top: 1px solid var(--color-outline);
        margin: 1rem 0;
      }
    `,
  ],
})
export class NotePreviewComponent {
  body = input("");
  toggleChecklist = output<number>();

  blocks(): EditorBlock[] {
    return parseEditorBlocks(this.body());
  }

  spans(text: string): InlineSpan[] {
    return renderInlineMarkdown(text);
  }

  indentLevel(line: string): number {
    const leading = line.match(/^ */)?.[0].length ?? 0;
    return Math.floor(leading / 2);
  }

  stripBulletPrefix(line: string): string {
    return line.trimStart().replace(/^- /, "");
  }

  stripNumberPrefix(line: string): string {
    return line.trimStart().replace(/^\d+\.\s/, "");
  }

  extractNumber(line: string): number {
    return parseInt(/^(\d+)\./.exec(line.trimStart())?.[1] ?? "1", 10);
  }
}
