import { Component, input, output } from "@angular/core";
import { EditorBlock } from "../../../core/editor/editor-block.model";
import { parseEditorBlocks } from "../../../core/editor/editor-block-parser";
import {
  InlineSpan,
  renderInlineMarkdown,
} from "../../../core/editor/inline-markdown";

@Component({
  selector: "app-note-preview",
  standalone: true,
  templateUrl: "./note-preview.component.html",
  styleUrl: "./note-preview.component.scss",
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
