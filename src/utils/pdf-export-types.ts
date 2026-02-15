export type PdfBlock =
  | { type: 'heading'; text: string; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'taskList'; items: { checked: boolean; text: string }[] }
  | { type: 'horizontalRule' };

export interface PdfPageData {
  title: string;
  blocks: PdfBlock[];
}

/** Resolved theme colours passed into the worker so the PDF mirrors the app. */
export interface PdfThemeColors {
  /** true when the app is currently in dark mode */
  dark: boolean;

  /* page */
  pageBg: string;
  foreground: string;

  /* headings */
  headingColor: string;

  /* blockquote */
  blockquoteBorder: string;
  blockquoteText: string;
  blockquoteBg: string;

  /* code mark (inline) */
  codeMarkBg: string;
  codeMarkBorder: string;
  codeMarkText: string;

  /* code block */
  codeBlockBg: string;
  codeBlockBorder: string;

  /* horizontal rule */
  hrColor: string;

  /* highlight */
  highlightBg: string;
  highlightText: string;

  /* link */
  linkColor: string;

  /* table */
  tableBorder: string;
  tableHeaderBg: string;
  tableHeaderFg: string;
  tableText: string;
}

export interface PdfTypography {
  fontSans: string;
  fontMono: string;
  baseFontSizePx: number;
  baseLineHeight: number;
  pagePaddingHorizontalPx: number;
  pagePaddingVerticalPx: number;
  titleFontSizePx: number;
  titleLineHeight: number;
  titleFontWeight: number;
  titleLetterSpacingPx: number;
  titleMarginTopPx: number;
  titleMarginBottomPx: number;
  headingFontSizePx: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
  headingLineHeight: number;
  headingFontWeight: number;
  headingMarginTopPx: number;
  headingMarginBottomPx: number;
  paragraphMarginBottomPx: number;
  listIndentPx: number;
  listItemGapPx: number;
  taskListIndentPx: number;
  taskItemGapPx: number;
  codeFontSizePx: number;
  codeLineHeight: number;
  codeBlockPaddingPx: number;
  codeBlockMarginTopPx: number;
  codeBlockMarginBottomPx: number;
  blockquotePaddingLeftPx: number;
  blockquotePaddingRightPx: number;
  blockquotePaddingVerticalPx: number;
  blockquoteMarginTopPx: number;
  blockquoteMarginBottomPx: number;
  horizontalRuleMarginPx: number;
  tableCellPaddingVerticalPx: number;
  tableCellPaddingHorizontalPx: number;
  tableMarginTopPx: number;
  tableMarginBottomPx: number;
}

export interface PdfExportPayload {
  title: string;
  theme: PdfThemeColors;
  typography: PdfTypography;
  pages: PdfPageData[];
}
