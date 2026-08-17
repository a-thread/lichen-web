export interface ChecklistItem {
  text: string;
  checked: boolean;
  lineIndex: number;
}

export type EditorBlock =
  | { type: 'text'; text: string; startLine: number; endLine: number }
  | { type: 'heading'; level: number; text: string; startLine: number; endLine: number }
  | { type: 'bulletList'; items: string[]; startLine: number; endLine: number }
  | { type: 'checklist'; items: ChecklistItem[]; startLine: number; endLine: number }
  | { type: 'numberedList'; items: ChecklistItem[]; startLine: number; endLine: number }
  | { type: 'divider'; startLine: number; endLine: number };

export type BlockTextStyle = 'NORMAL' | 'H1' | 'H2' | 'H3';

export interface SelectionFormatting {
  bold: boolean;
  italic: boolean;
  code: boolean;
  textStyle: BlockTextStyle;
  bullet: boolean;
  checklist: boolean;
  numbered: boolean;
}
