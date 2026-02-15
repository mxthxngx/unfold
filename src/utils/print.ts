import { Editor } from '@tiptap/core';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import MarkdownIt from 'markdown-it';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { Node as FileNode } from '@/types/sidebar';
import { DocumentExtension } from '@/components/editor/extensions/document';
import { HeadingExtension } from '@/components/editor/extensions/heading';
import { TiptapImage } from '@/components/editor/extensions/image';
import { starterKit } from '@/components/editor/extensions/starterkit';
import { editorClasses } from '@/components/editor/styles/extension-styles';
import { renderPdfBytes } from '@/utils/pdf';
import type { PdfBlock, PdfExportPayload, PdfThemeColors, PdfTypography } from '@/utils/pdf-export-types';

export type PrintScope = 'current' | 'branch' | 'space';

export interface PrintableNode {
  id: string;
  name: string;
  content?: string;
  depth?: number;
}

function getPageName(name?: string | null) {
  const value = (name ?? '').trim();
  return value.length > 0 ? value : 'new page';
}

function sanitizeFilename(value: string) {
  const normalized = value.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized.slice(0, 120) : 'unfold export';
}

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

function buildEditor(content: object | string | null) {
  return new Editor({
    extensions: [
      starterKit,
      DocumentExtension,
      HeadingExtension,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'], defaultAlignment: 'left' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
        HTMLAttributes: { class: editorClasses.table },
      }),
      TableRow.configure({ HTMLAttributes: { class: editorClasses.tableRow } }),
      TableHeader.configure({ HTMLAttributes: { class: editorClasses.tableHeader } }),
      TableCell.configure({ HTMLAttributes: { class: editorClasses.tableCell } }),
      TiptapImage.configure({ allowBase64: true }),
    ],
    content: content ?? '',
    editable: false,
  });
}

function renderViaEditor(content: object | string) {
  const editor = buildEditor(content);
  const html = editor.getHTML();
  editor.destroy();
  return html;
}

function toHtml(content: string | undefined) {
  if (!content) return '';

  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'string') {
      return renderViaEditor(md.render(parsed));
    }
    if (parsed && typeof parsed === 'object') {
      return renderViaEditor(parsed);
    }
  } catch {
    return renderViaEditor(md.render(content));
  }

  return renderViaEditor(md.render(content));
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function htmlToBlocks(html: string): PdfBlock[] {
  if (typeof DOMParser === 'undefined') {
    const fallback = normalizeText(html);
    return fallback ? [{ type: 'paragraph', text: fallback }] : [];
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const rootChildren = Array.from(doc.body.children);
  const blocks: PdfBlock[] = [];

  const pushParagraph = (text: string) => {
    const value = normalizeText(text);
    if (value) blocks.push({ type: 'paragraph', text: value });
  };

  for (const el of rootChildren) {
    const tag = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      const text = normalizeText(el.textContent ?? '');
      if (!text) continue;
      blocks.push({ type: 'heading', text, level: Number(tag[1]) as 1 | 2 | 3 | 4 | 5 | 6 });
      continue;
    }

    if (tag === 'p') {
      pushParagraph(el.textContent ?? '');
      continue;
    }

    if (tag === 'hr') {
      blocks.push({ type: 'horizontalRule' });
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      // Check if this is a task list (contains checkboxes)
      const taskItems = Array.from(el.querySelectorAll(':scope > li')).filter(
        (li) => li.querySelector('input[type="checkbox"]') || li.getAttribute('data-type') === 'taskItem',
      );

      if (taskItems.length > 0) {
        const items = taskItems.map((li) => {
          const checkbox = li.querySelector('input[type="checkbox"]');
          const checked = checkbox ? (checkbox as HTMLInputElement).checked : false;
          const text = normalizeText(li.textContent ?? '');
          return { checked, text };
        }).filter((item) => item.text.length > 0);
        if (items.length > 0) {
          blocks.push({ type: 'taskList', items });
        }
      } else {
        const items = Array.from(el.querySelectorAll(':scope > li'))
          .map((li) => normalizeText(li.textContent ?? ''))
          .filter((item) => item.length > 0);
        if (items.length > 0) {
          blocks.push({ type: 'list', ordered: tag === 'ol', items });
        }
      }
      continue;
    }

    if (tag === 'pre') {
      const text = (el.textContent ?? '').replace(/\r/g, '').trim();
      if (text) blocks.push({ type: 'code', text });
      continue;
    }

    if (tag === 'blockquote') {
      const text = normalizeText(el.textContent ?? '');
      if (text) blocks.push({ type: 'quote', text });
      continue;
    }

    if (tag === 'table') {
      const rows = Array.from(el.querySelectorAll('tr')).map((row) =>
        Array.from(row.querySelectorAll('th,td'))
          .map((cell) => normalizeText(cell.textContent ?? ''))
          .filter((cell) => cell.length > 0),
      ).filter((row) => row.length > 0);
      if (rows.length > 0) blocks.push({ type: 'table', rows });
      continue;
    }

    pushParagraph(el.textContent ?? '');
  }

  if (blocks.length === 0) {
    pushParagraph(doc.body.textContent ?? '');
  }

  return blocks;
}

function getCssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function parseLengthToPx(raw: string): number | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const direct = Number.parseFloat(value);
  if (Number.isFinite(direct) && value.endsWith('px')) return direct;
  if (Number.isFinite(direct) && /^[\d.]+$/.test(value)) return direct;

  if (typeof document === 'undefined') {
    return Number.isFinite(direct) ? direct : null;
  }

  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.width = value;
  document.body.appendChild(probe);
  const measured = Number.parseFloat(getComputedStyle(probe).width);
  probe.remove();
  return Number.isFinite(measured) ? measured : Number.isFinite(direct) ? direct : null;
}

function readLengthPx(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  return parseLengthToPx(value) ?? fallback;
}

function readStyleLengthPx(
  style: CSSStyleDeclaration | null | undefined,
  property: string,
  fallback: number,
): number {
  if (!style) return fallback;
  return readLengthPx(style.getPropertyValue(property), fallback);
}

function readCssVarLengthPx(name: string, fallback: number): number {
  return readLengthPx(getCssVar(name), fallback);
}

function readFontWeight(style: CSSStyleDeclaration | null | undefined, fallback: number): number {
  if (!style) return fallback;
  const raw = style.getPropertyValue('font-weight').trim();
  const parsed = Number.parseInt(raw, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  if (raw === 'bold') return 700;
  if (raw === 'normal') return 400;
  return fallback;
}

function readLineHeightRatio(
  style: CSSStyleDeclaration | null | undefined,
  fallbackRatio: number,
  fallbackFontSizePx: number,
): number {
  if (!style) return fallbackRatio;
  const lineHeight = style.getPropertyValue('line-height').trim();
  if (!lineHeight || lineHeight === 'normal') return fallbackRatio;
  if (/^[\d.]+$/.test(lineHeight)) {
    const ratio = Number.parseFloat(lineHeight);
    return Number.isFinite(ratio) ? ratio : fallbackRatio;
  }
  const px = parseLengthToPx(lineHeight);
  if (px === null || !Number.isFinite(px) || !fallbackFontSizePx) return fallbackRatio;
  const ratio = px / fallbackFontSizePx;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : fallbackRatio;
}

function queryStyle(selector: string): CSSStyleDeclaration | null {
  if (typeof document === 'undefined') return null;
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) return null;
  return getComputedStyle(element);
}

function toHex(raw: string, bgHex?: string): string {
  if (!raw) return '';

  if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) return raw;

  const rgbMatch = raw.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/,
  );
  if (rgbMatch) {
    let r = Math.round(Number(rgbMatch[1]));
    let g = Math.round(Number(rgbMatch[2]));
    let b = Math.round(Number(rgbMatch[3]));
    const a = rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1;

    if (a < 1 && bgHex && /^#[0-9a-fA-F]{6}$/.test(bgHex)) {
      const br = parseInt(bgHex.slice(1, 3), 16);
      const bg = parseInt(bgHex.slice(3, 5), 16);
      const bb = parseInt(bgHex.slice(5, 7), 16);
      r = Math.round(r * a + br * (1 - a));
      g = Math.round(g * a + bg * (1 - a));
      b = Math.round(b * a + bb * (1 - a));
    }

    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(1, 1);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (bgHex) {
          ctx.fillStyle = bgHex;
          ctx.fillRect(0, 0, 1, 1);
        }
        ctx.fillStyle = raw;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
      }
    }
  } catch {
    // Ignore and try DOM canvas fallback below.
  }

  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (bgHex) {
          ctx.fillStyle = bgHex;
          ctx.fillRect(0, 0, 1, 1);
        }
        ctx.fillStyle = raw;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
      }
    } catch {
      // Ignore parsing failures.
    }
  }

  return '';
}

function resolveThemeColors(): PdfThemeColors {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const D = {
    bg:        '#0d0d0c',
    fg:        '#f7f2f2',
    bqBorder:  '#3f3f46',
    bqText:    '#d4d4d8',
    bqBg:      '#18181b',
    codeBg:    '#18181b',
    codeBorder:'#2a2d35',
    cmBg:      '#18181b',
    cmBorder:  '#27272a',
    hr:        '#2b2b2f',
    hlBg:      '#713f12',
    hlText:    '#fef08a',
    link:      '#a1a1aa',
    tblBorder: '#20201f',
    tblHdrBg:  '#111112',
  };

  const L = {
    bg:        '#ffffff',
    fg:        '#09090b',
    bqBorder:  '#d4d4d8',
    bqText:    '#3f3f46',
    bqBg:      '#f4f4f5',
    codeBg:    '#eceef3',
    codeBorder:'#d4d4d8',
    cmBg:      '#f4f4f5',
    cmBorder:  '#d4d4d8',
    hr:        '#d8d8dc',
    hlBg:      '#fde68a',
    hlText:    '#78350f',
    link:      '#3f3f46',
    tblBorder: '#ebebeb',
    tblHdrBg:  '#f8f8f9',
  };

  const f = dark ? D : L;

  const pageBg = toHex(getCssVar('--background-solid')) || f.bg;

  return {
    dark,
    pageBg,
    foreground:      toHex(getCssVar('--foreground'))                || f.fg,
    headingColor:    toHex(getCssVar('--foreground'))                || f.fg,
    blockquoteBorder:toHex(getCssVar('--editor-blockquote-border'), pageBg) || f.bqBorder,
    blockquoteText:  toHex(getCssVar('--editor-blockquote-text'), pageBg)   || f.bqText,
    blockquoteBg:    toHex(getCssVar('--editor-blockquote-bg'), pageBg)     || f.bqBg,
    codeMarkBg:      toHex(getCssVar('--editor-code-mark-bg'), pageBg)      || f.cmBg,
    codeMarkBorder:  toHex(getCssVar('--editor-code-mark-border'), pageBg)  || f.cmBorder,
    codeMarkText:    toHex(getCssVar('--foreground'))                || f.fg,
    codeBlockBg:     toHex(getCssVar('--code-block-bg'), pageBg)            || f.codeBg,
    codeBlockBorder: toHex(getCssVar('--editor-code-block-border'), pageBg) || f.codeBorder,
    hrColor:         toHex(getCssVar('--editor-hr'), pageBg)                || f.hr,
    highlightBg:     toHex(getCssVar('--editor-highlight-bg'), pageBg)      || f.hlBg,
    highlightText:   toHex(getCssVar('--editor-highlight-text'))    || f.hlText,
    linkColor:       toHex(getCssVar('--editor-link-text'))         || f.link,
    tableBorder:     toHex(getCssVar('--table-border'), pageBg)             || f.tblBorder,
    tableHeaderBg:   toHex(getCssVar('--table-header-bg'), pageBg)          || f.tblHdrBg,
    tableHeaderFg:   toHex(getCssVar('--foreground'))               || f.fg,
    tableText:       toHex(getCssVar('--foreground'))               || f.fg,
  };
}

function resolveTypography(): PdfTypography {
  const rootStyle = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const bodyStyle = typeof document !== 'undefined' ? getComputedStyle(document.body) : null;
  const proseStyle = queryStyle('.page-editor-container .ProseMirror');
  const titleStyle = queryStyle('.title-editor .ProseMirror h1');
  const paragraphStyle = queryStyle('.page-editor-container .ProseMirror p');
  const heading1Style = queryStyle('.page-editor-container .ProseMirror h1');
  const heading2Style = queryStyle('.page-editor-container .ProseMirror h2');
  const heading3Style = queryStyle('.page-editor-container .ProseMirror h3');
  const titleContainerStyle = queryStyle('.title-editor');
  const tableCellStyle = queryStyle('.page-editor-container .ProseMirror table td');

  const baseFontSizePx = readStyleLengthPx(proseStyle, 'font-size', readCssVarLengthPx('--font-size-note', 16));
  const baseLineHeight = readLineHeightRatio(proseStyle, readLengthPx(getCssVar('--line-height-relaxed'), 1.6), baseFontSizePx);

  const titleFontSizePx = readStyleLengthPx(
    titleStyle,
    'font-size',
    readCssVarLengthPx('--font-size-document-title', 52),
  );
  const titleLineHeight = readLineHeightRatio(titleStyle, 1.2, titleFontSizePx);
  const titleFontWeight = readFontWeight(titleStyle, 700);
  const titleLetterSpacingPx = readStyleLengthPx(titleStyle, 'letter-spacing', -0.5);
  const titleMarginTopPx = readStyleLengthPx(titleStyle, 'margin-top', 0);
  const titleMarginBottomPx = readStyleLengthPx(
    titleContainerStyle,
    'margin-bottom',
    readCssVarLengthPx('--editor-title-margin-bottom', 20),
  );

  const headingMargin = readCssVarLengthPx('--editor-heading-margin-y', 3);
  const paragraphMarginBottomPx = readStyleLengthPx(paragraphStyle, 'margin-bottom', baseFontSizePx);

  const headingFontSizeH1 = readStyleLengthPx(
    heading1Style,
    'font-size',
    readCssVarLengthPx('--font-size-heading-1', 36),
  );
  const headingFontSizeH2 = readStyleLengthPx(
    heading2Style,
    'font-size',
    readCssVarLengthPx('--font-size-heading-2', 28),
  );
  const headingFontSizeH3 = readStyleLengthPx(
    heading3Style,
    'font-size',
    readCssVarLengthPx('--font-size-heading-3', 20),
  );
  const headingLineHeight = readLineHeightRatio(
    heading1Style,
    readLengthPx(getCssVar('--line-height-tight'), 1.25),
    headingFontSizeH1,
  );
  const headingFontWeight = readFontWeight(heading1Style, 700);

  const fontSans = (
    proseStyle?.getPropertyValue('font-family') ||
    bodyStyle?.getPropertyValue('font-family') ||
    rootStyle?.getPropertyValue('--font-sans') ||
    'Helvetica'
  ).trim();
  const fontMono = (
    rootStyle?.getPropertyValue('--font-mono') ||
    'Courier'
  ).trim();

  return {
    fontSans,
    fontMono,
    baseFontSizePx,
    baseLineHeight,
    pagePaddingHorizontalPx: readStyleLengthPx(proseStyle, 'padding-left', 24),
    pagePaddingVerticalPx: readStyleLengthPx(proseStyle, 'padding-bottom', 24),
    titleFontSizePx,
    titleLineHeight,
    titleFontWeight,
    titleLetterSpacingPx,
    titleMarginTopPx,
    titleMarginBottomPx,
    headingFontSizePx: {
      1: headingFontSizeH1,
      2: headingFontSizeH2,
      3: headingFontSizeH3,
      4: Math.max(headingFontSizeH3 * 0.9, baseFontSizePx),
      5: Math.max(headingFontSizeH3 * 0.8, baseFontSizePx),
      6: Math.max(headingFontSizeH3 * 0.75, baseFontSizePx),
    },
    headingLineHeight,
    headingFontWeight,
    headingMarginTopPx: headingMargin,
    headingMarginBottomPx: headingMargin,
    paragraphMarginBottomPx,
    listIndentPx: readCssVarLengthPx('--editor-list-padding-left', 24),
    listItemGapPx: readCssVarLengthPx('--editor-list-item-gap', 4),
    taskListIndentPx: readCssVarLengthPx('--editor-task-list-padding-left', 8),
    taskItemGapPx: readCssVarLengthPx('--editor-task-item-gap', 8),
    codeFontSizePx: readCssVarLengthPx('--font-size-code', 13),
    codeLineHeight: 1.45,
    codeBlockPaddingPx: readCssVarLengthPx('--editor-code-block-padding', 20),
    codeBlockMarginTopPx: readCssVarLengthPx('--editor-code-block-margin-y', 16),
    codeBlockMarginBottomPx: readCssVarLengthPx('--editor-code-block-margin-y', 16),
    blockquotePaddingLeftPx: readCssVarLengthPx('--editor-blockquote-padding-x', 24),
    blockquotePaddingRightPx: readCssVarLengthPx('--editor-blockquote-padding-right', 16),
    blockquotePaddingVerticalPx: readCssVarLengthPx('--editor-blockquote-padding-y', 8),
    blockquoteMarginTopPx: readCssVarLengthPx('--editor-blockquote-margin-y', 16),
    blockquoteMarginBottomPx: readCssVarLengthPx('--editor-blockquote-margin-y', 16),
    horizontalRuleMarginPx: readCssVarLengthPx('--editor-hr-margin-y', 24),
    tableCellPaddingVerticalPx: readStyleLengthPx(tableCellStyle, 'padding-top', 8),
    tableCellPaddingHorizontalPx: readStyleLengthPx(tableCellStyle, 'padding-left', 12),
    tableMarginTopPx: readCssVarLengthPx('--editor-table-margin-y', 16),
    tableMarginBottomPx: readCssVarLengthPx('--editor-table-margin-y', 16),
  };
}

function buildPdfPayload(nodes: PrintableNode[], exportTitle: string): PdfExportPayload {
  const pages = nodes.map((node) => {
    const title = getPageName(node.name);
    const contentHtml = toHtml(node.content);
    const blocks = htmlToBlocks(contentHtml);
    return { title, blocks };
  });

  return {
    title: exportTitle,
    theme: resolveThemeColors(),
    typography: resolveTypography(),
    pages,
  };
}

export async function exportRichContent(
  nodes: PrintableNode[],
  exportTitle: string,
): Promise<void> {
  if (!nodes.length) {
    throw new Error('No content to export.');
  }

  const safeName = sanitizeFilename(exportTitle);
  const payload = buildPdfPayload(nodes, exportTitle);
  const bytes = await renderPdfBytes(payload);

  await tauriInvoke('save_pdf_file', {
    request: {
      suggested_name: `${safeName}.pdf`,
      pdf_bytes: Array.from(bytes),
    },
  });
}

export function flattenBranch(node: FileNode | null): PrintableNode[] {
  if (!node) return [];
  const walk = (n: FileNode, depth = 0): PrintableNode[] => {
    const current: PrintableNode = {
      id: n.id,
      name: getPageName(n.name),
      content: n.content,
      depth,
    };
    const children = (n.nodes ?? []).flatMap((child) => walk(child, depth + 1));
    return [current, ...children];
  };
  return walk(node);
}

export function flattenSpace(tree: FileNode[]): PrintableNode[] {
  const walk = (nodes: FileNode[], depth = 0): PrintableNode[] =>
    nodes.flatMap((node) => {
      const current: PrintableNode = {
        id: node.id,
        name: getPageName(node.name),
        content: node.content,
        depth,
      };
      const children = node.nodes ? walk(node.nodes, depth + 1) : [];
      return [current, ...children];
    });
  return walk(tree, 0);
}

export function selectPrintableNodes(
  scope: PrintScope,
  fileId: string | null | undefined,
  tree: FileNode[],
  getNode: (id: string) => FileNode | null,
): PrintableNode[] {
  if (scope === 'space') return flattenSpace(tree);
  if (!fileId) return [];

  const current = getNode(fileId);
  if (!current) return [];

  if (scope === 'current') {
    return [{ id: current.id, name: getPageName(current.name), content: current.content, depth: 0 }];
  }

  return flattenBranch(current);
}
