import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BlockTextStyle } from "../../core/editor/editor-block.model";
import {
  Selection,
  applyTextStyle,
  detectFormatting,
  toggleBlock,
  toggleInline,
} from "../../core/editor/toolbar-actions";

@Component({
  selector: "app-formatting-toolbar",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="toolbar">
      <select
        [ngModel]="formatting().textStyle"
        (ngModelChange)="onStyleChange($event)"
      >
        <option value="NORMAL">Normal</option>
        <option value="H1">Heading 1</option>
        <option value="H2">Heading 2</option>
        <option value="H3">Heading 3</option>
      </select>

      <span class="divider"></span>

      <button
        type="button"
        [class.active]="formatting().bold"
        (click)="apply(toggleInline(selection(), '**'))"
        title="Bold"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        [class.active]="formatting().italic"
        (click)="apply(toggleInline(selection(), '*'))"
        title="Italic"
      >
        <i>I</i>
      </button>

      <span class="divider"></span>

      <button
        type="button"
        [class.active]="formatting().bullet"
        (click)="apply(toggleBlock(selection(), 'bullet'))"
        title="Bullet list"
      >
        &bull; List
      </button>
      <button
        type="button"
        [class.active]="formatting().checklist"
        (click)="apply(toggleBlock(selection(), 'checklist'))"
        title="Checklist"
      >
        &#9745; List
      </button>
      <button
        type="button"
        [class.active]="formatting().numbered"
        (click)="apply(toggleBlock(selection(), 'numbered'))"
        title="Numbered list"
      >
        1. List
      </button>

      <span class="divider"></span>

      <button
        type="button"
        [class.active]="formatting().code"
        (click)="apply(toggleInline(selection(), '\`'))"
        title="Code"
      >
        <code>&lt;/&gt;</code>
      </button>
    </div>
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.5rem;
        background: var(--color-surface-variant);
        border-radius: 4px;
        flex-wrap: wrap;
      }
      button {
        border: 1px solid transparent;
        background: transparent;
        color: var(--color-text);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
      }
      button.active {
        background: var(--color-accent);
        color: var(--color-on-accent);
      }
      select {
        border: 1px solid var(--color-outline);
        border-radius: 4px;
        padding: 0.2rem;
        font-size: 0.85rem;
        background: var(--color-surface);
        color: var(--color-text);
      }
      .divider {
        width: 1px;
        height: 1.25rem;
        background: var(--color-outline);
        margin: 0 0.25rem;
      }
    `,
  ],
})
export class FormattingToolbarComponent {
  selection = input.required<Selection>();
  applyChange = output<Selection>();

  formatting() {
    return detectFormatting(this.selection());
  }

  apply(result: Selection): void {
    this.applyChange.emit(result);
  }

  toggleInline = toggleInline;
  toggleBlock = toggleBlock;

  onStyleChange(style: BlockTextStyle): void {
    this.applyChange.emit(applyTextStyle(this.selection(), style));
  }
}
