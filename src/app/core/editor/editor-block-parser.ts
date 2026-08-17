import { ChecklistItem, EditorBlock } from './editor-block.model';

export function toggleChecklistLine(text: string, lineIndex: number): string {
  const lines = text.split('\n');
  if (lineIndex < 0 || lineIndex >= lines.length) return text;
  const line = lines[lineIndex];
  if (line.includes('- [ ]')) {
    lines[lineIndex] = line.replace('- [ ]', '- [x]');
  } else if (line.includes('- [x]')) {
    lines[lineIndex] = line.replace('- [x]', '- [ ]');
  }
  return lines.join('\n');
}

const TAB_WIDTH = 4;

function normalizedIndent(line: string): string {
  let raw = '';
  for (const ch of line) {
    if (ch === ' ' || ch === '\t') raw += ch;
    else break;
  }
  let out = '';
  for (const ch of raw) out += ch === '\t' ? ' '.repeat(TAB_WIDTH) : ' ';
  return out;
}

export function parseEditorBlocks(text: string): EditorBlock[] {
  const lines = text.split('\n');
  const blocks: EditorBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // ---------- DIVIDER ----------
    if (line.trim() === '---') {
      blocks.push({ type: 'divider', startLine: index, endLine: index });
      index++;
      continue;
    }

    // ---------- HEADING ----------
    if (line.trimStart().startsWith('#')) {
      const trimmed = line.trimStart();
      let level = 0;
      while (trimmed[level] === '#') level++;
      const headingText = trimmed.slice(level).trimStart();
      blocks.push({
        type: 'heading',
        level: Math.min(level, 3),
        text: headingText,
        startLine: index,
        endLine: index,
      });
      index++;
      continue;
    }

    // ---------- CHECKLIST ----------
    if (line.trimStart().startsWith('- [')) {
      const items: ChecklistItem[] = [];
      const start = index;
      while (index < lines.length && lines[index].trimStart().startsWith('- [')) {
        const rawLine = lines[index];
        const indent = normalizedIndent(rawLine);
        const trimmed = rawLine.trimStart();
        const checked = trimmed.startsWith('- [x]');
        const content = trimmed.replace(/^- \[x\] /, '').replace(/^- \[ \] /, '');
        items.push({ text: indent + content, checked, lineIndex: index });
        index++;
      }
      blocks.push({ type: 'checklist', items, startLine: start, endLine: index - 1 });
      continue;
    }

    // ---------- NUMBERED LIST ----------
    if (/^\d+\.\s/.test(line.trimStart())) {
      const items: ChecklistItem[] = [];
      const start = index;
      while (index < lines.length && /^\d+\.\s/.test(lines[index].trimStart())) {
        items.push({ text: lines[index], checked: false, lineIndex: index });
        index++;
      }
      blocks.push({ type: 'numberedList', items, startLine: start, endLine: index - 1 });
      continue;
    }

    // ---------- BULLET LIST ----------
    if (line.trimStart().startsWith('- ')) {
      const items: string[] = [];
      const start = index;
      const baseIndent = normalizedIndent(line).length;

      while (index < lines.length) {
        const rawLine = lines[index];
        if (!rawLine.trimStart().startsWith('- ')) break;
        const indent = normalizedIndent(rawLine).length;
        if (indent < baseIndent) break;
        const trimmed = rawLine.trimStart().replace(/^- /, '');
        items.push(' '.repeat(indent) + trimmed);
        index++;
      }
      blocks.push({ type: 'bulletList', items, startLine: start, endLine: index - 1 });
      continue;
    }

    // ---------- TEXT BLOCK ----------
    const start = index;
    const buffer: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !lines[index].trimStart().startsWith('- [') &&
      !lines[index].trimStart().startsWith('- ') &&
      !lines[index].trimStart().startsWith('#') &&
      !/^\d+\.\s/.test(lines[index].trimStart()) &&
      lines[index].trim() !== '---'
    ) {
      buffer.push(lines[index]);
      index++;
    }

    const textBlock = buffer.join('\n').trimEnd();
    if (textBlock.trim() !== '') {
      blocks.push({ type: 'text', text: textBlock, startLine: start, endLine: index - 1 });
    } else {
      index++;
    }
  }

  return blocks;
}
