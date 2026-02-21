import { Editor } from '@tiptap/core';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import MarkdownIt from 'markdown-it';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { Node as FileNode } from '@/types/sidebar';
import { DocumentExtension } from '@/components/editor/extensions/document';
import { HeadingExtension } from '@/components/editor/extensions/heading';
import { TiptapImage } from '@/components/editor/extensions/image';
import { starterKit } from '@/components/editor/extensions/starterkit';
import { editorClasses } from '@/components/editor/styles/extension-styles';

export type PrintScope = 'current' | 'branch' | 'space';

export interface PrintableNode {
  id: string;
  name: string;
  content?: string;
  depth?: number;
}

// --- Helpers ----------------------------------------------------------------

function getPageName(name?: string | null) {
  const value = (name ?? '').trim();
  return value.length > 0 ? value : 'new page';
}

function sanitizeFilename(value: string) {
  const normalized = value.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized.slice(0, 120) : 'unfold export';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Content rendering via headless TipTap ----------------------------------

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

// --- PDF export via html2canvas + jsPDF -------------------------------------

/** A4 dimensions in mm. */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/** Render width in CSS px – approximates A4 at comfortable on-screen size. */
const RENDER_WIDTH_PX = 816;

/** Padding inside each rendered page (CSS px). */
const PAGE_PADDING_X_PX = 48;
const PAGE_PADDING_TOP_PX = 24;
const PAGE_PADDING_BOTTOM_PX = 48;

/** html2canvas capture scale for high-DPI (retina) output. */
const CAPTURE_SCALE = 2;

/** Stable ID used to scope the override <style> element to the container. */
const PDF_CONTAINER_ID = 'pdf-export-container';

function getCssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Inject a scoped <style> into document.head so html2canvas is guaranteed to
 * pick it up (styles inside a div's innerHTML are not reliably applied during
 * canvas capture).  Returns the element so the caller can clean it up after.
 */
function injectCaptureStyles(): HTMLStyleElement {
  const S = `#${PDF_CONTAINER_ID}`;
  const style = document.createElement('style');
  style.textContent = `
    /* ---- Code marks -------------------------------------------------------
       html2canvas mishandles inline-flex + backdrop-filter: the compositing
       pass paints a solid background rect at the wrong z-order (covering the
       whole line).  Switch to inline-block so it renders as a simple box.
       Use baseline alignment so the box sits flush around the word. */
    ${S} code:not(pre code) {
      display: inline-block !important;
      vertical-align: baseline !important;
      line-height: 1.4 !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    /* ---- Code blocks ------------------------------------------------------
       backdrop-blur causes html2canvas to paint a rogue dark rect; remove it
       so the solid background-color is used directly.
       Override both top AND bottom margin (my-4 = 1rem each side) to prevent
       a 2rem gap accumulating between adjacent blocks. */
    ${S} pre {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      margin: 0.375rem 0 !important;
    }

    /* ---- All top-level ProseMirror blocks ---------------------------------
       In the live editor [data-id] wrappers zero out inner margins via
       block-spacing.css, but headless rendering has no drag wrappers, so
       Tailwind my-* margins accumulate (blockquote, details, hr, etc.).
       Tighten every direct child to a consistent small margin. */
    ${S} .ProseMirror > * {
      margin-top: 0.375rem !important;
      margin-bottom: 0.375rem !important;
    }

    /* ---- Tables -----------------------------------------------------------
       border-collapse:separate + border-radius + border-spacing causes
       html2canvas to double-paint borders and misplace cell backgrounds.
       Collapse to a simple grid so cells render predictably.
       Force full-width to match code blocks (remove space reserved for
       the add-column button that exists in the live editor). */
    ${S} table {
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      border-radius: 0 !important;
      width: 100% !important;
      min-width: 0 !important;
    }
    ${S} table td,
    ${S} table th {
      border-radius: 0 !important;
      vertical-align: top !important;
    }
    /* Hide editor-only table control buttons so they don't consume space */
    ${S} .add-row-button,
    ${S} .add-column-button {
      display: none !important;
    }
    /* Remove padding-bottom reserved for add-row button; tighten own margin */
    ${S} .table-wrapper {
      padding-bottom: 0 !important;
      margin: 0.375rem 0 !important;
    }
    /* Make the scroll-container div take full width when add-column is hidden */
    ${S} .table-wrapper > div > div:first-child {
      overflow: visible !important;
      width: 100% !important;
    }

    /* ---- Global capture fixes --------------------------------------------
       Kill transitions / animations (prevents mid-frame captures) and strip
       any remaining backdrop-filter from every element. */
    ${S} *, ${S} *::before, ${S} *::after {
      transition: none !important;
      animation: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
  `;
  document.head.appendChild(style);
  return style;
}

/**
 * Build the HTML for a single printable node (title + editor content).
 * Uses the same CSS classes as the real editor so all Tailwind / custom-
 * property-driven styles are applied when the container lives in the DOM.
 */
function buildNodeHtml(node: PrintableNode): string {
  const title = escapeHtml(getPageName(node.name));
  const contentHtml = toHtml(node.content);

  return `
    <div class="title-editor" style="margin-bottom:var(--editor-title-margin-bottom, 20px);">
      <div class="ProseMirror">
        <h1 class="${editorClasses.documentTitle}">${title}</h1>
      </div>
    </div>
    <div class="page-editor-container">
      <div class="ProseMirror editor-block-spacing">
        ${contentHtml}
      </div>
    </div>
  `;
}

/**
 * Export one or more nodes to a PDF file.
 *
 * Approach:
 *  1. Create a hidden off-screen container that inherits the app's theme.
 *  2. For each node render the title + content using the editor's CSS classes.
 *  3. Capture the rendered content with html2canvas.
 *  4. Slice the captured canvas into A4-page-height chunks.
 *  5. Assemble all pages into a jsPDF document.
 *  6. Save through Tauri's native file-save dialog.
 */
export async function exportToPdf(
  nodes: PrintableNode[],
  exportTitle: string,
): Promise<void> {
  if (!nodes.length) throw new Error('No content to export.');

  const isDark = document.documentElement.classList.contains('dark');
  const bg =
    getCssVar('--background-solid') || (isDark ? '#0d0d0c' : '#ffffff');
  const fg = getCssVar('--foreground') || (isDark ? '#f7f2f2' : '#09090b');
  const bodyFont =
    getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';

  // Off-screen container – inherits the app's theme CSS variables because
  // it lives inside the document and carries the same root classes.
  const container = document.createElement('div');
  container.id = PDF_CONTAINER_ID;
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = `${RENDER_WIDTH_PX}px`;
  container.style.paddingTop = `${PAGE_PADDING_TOP_PX}px`;
  container.style.paddingBottom = `${PAGE_PADDING_BOTTOM_PX}px`;
  container.style.paddingLeft = `${PAGE_PADDING_X_PX}px`;
  container.style.paddingRight = `${PAGE_PADDING_X_PX}px`;
  container.style.background = bg;
  container.style.color = fg;
  container.style.fontFamily = bodyFont;
  container.style.boxSizing = 'border-box';
  container.style.overflow = 'visible';
  // Copy the root element's class list so dark/light mode + theme tokens work
  container.className = document.documentElement.className;
  document.body.appendChild(container);

  // Inject capture-time CSS overrides into <head> — must live in the document
  // stylesheet so html2canvas picks them up (not just inside the div innerHTML).
  const captureStyle = injectCaptureStyles();

  const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let isFirstPage = true;

  // A4-page height expressed in canvas pixels (at the chosen capture scale)
  const pageHeightCanvasPx = Math.floor(
    (A4_HEIGHT_MM / A4_WIDTH_MM) * RENDER_WIDTH_PX * CAPTURE_SCALE,
  );

  try {
    for (const node of nodes) {
      container.innerHTML = buildNodeHtml(node);

      // Allow the browser to lay out & paint the new content
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );

      // Wait for web fonts if available
      if (document.fonts?.ready) {
        try { await document.fonts.ready; } catch { /* continue */ }
      }

      const canvas = await html2canvas(container, {
        scale: CAPTURE_SCALE,
        useCORS: true,
        backgroundColor: bg,
        logging: false,
        width: RENDER_WIDTH_PX,
      });

      const totalHeight = canvas.height;
      const pageCount = Math.max(1, Math.ceil(totalHeight / pageHeightCanvasPx));

      for (let p = 0; p < pageCount; p++) {
        if (!isFirstPage) pdfDoc.addPage();
        isFirstPage = false;

        const srcY = p * pageHeightCanvasPx;
        const srcH = Math.min(pageHeightCanvasPx, totalHeight - srcY);

        // Always produce a full A4-height slice so the background fills
        // the entire page – no white strip after content ends.
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = pageHeightCanvasPx;

        const ctx = slice.getContext('2d');
        if (ctx) {
          // Fill the full page with the theme background first
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, slice.width, slice.height);
          // Draw the content slice on top (may be shorter than the page)
          ctx.drawImage(
            canvas,
            0, srcY, canvas.width, srcH,
            0, 0, canvas.width, srcH,
          );
        }

        const imgData = slice.toDataURL('image/jpeg', 0.92);
        pdfDoc.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
      }
    }

    // Convert to byte array and hand off to the Tauri backend for saving
    const arrayBuffer = pdfDoc.output('arraybuffer');
    const bytes = new Uint8Array(arrayBuffer);
    const safeName = sanitizeFilename(exportTitle);

    await tauriInvoke('save_pdf_file', {
      request: {
        suggested_name: `${safeName}.pdf`,
        pdf_bytes: Array.from(bytes),
      },
    });
  } finally {
    container.remove();
    captureStyle.remove();
  }
}

// --- Tree-walking utilities -------------------------------------------------

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
