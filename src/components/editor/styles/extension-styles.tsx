export const editorClasses = {
  documentTitle:
    "bg-editor-title text-4xl font-bold mt-2 mb-2 tracking-tight pe-2",

  blockquote:
    "border-l-[3px] border-editor-blockquote-border pl-6 pr-4 py-2 my-4 text-editor-blockquote-text bg-editor-blockquote-bg rounded-r-md",

  bold: "font-bold",

  details:
    "border border-editor-details-border rounded-lg mb-4 overflow-hidden bg-editor-details-bg",

  detailsSummary:
    "cursor-pointer bg-editor-details-summary-bg hover:bg-editor-details-summary-hover-bg px-5 py-3 rounded-t-lg font-medium text-editor-details-summary-text transition-colors duration-150",

  detailsContent: "px-5 py-4 text-editor-details-text",

  highlight:
    "bg-editor-highlight-bg text-editor-highlight-text px-1 rounded",

  italic: "italic",

  heading1:
    "text-4xl font-bold my-1 tracking-tight pe-2",

  heading2:
    "text-2xl font-semibold my-1 tracking-tight",

  heading3:
    "text-xl font-semibold my-1 tracking-tight",

  horizontalRule:
    "border-t border-editor-hr my-6",

  codeMark:
    "bg-editor-code-mark-bg inline-flex items-baseline align-baseline rounded-md px-1.5 py-px font-mono text-editor-code-mark-text leading-[1.1] border border-editor-code-mark-border ",

  codeBlock:
    "bg-code-block-bg text-code text-editor-code-block-text rounded-lg p-5 border border-editor-code-block-border overflow-x-auto my-4",

  link:
    "text-editor-link-text underline decoration-editor-link-decoration decoration-[0.025em] decoration-solid hover:text-editor-link-hover-text hover:decoration-editor-link-hover-decoration transition-colors",

  paragraph:
    "mt-0",

  listItem:
    "mb-2",

  bulletList:
    "list-disc pl-6 space-y-1",

  orderedList:
    "list-decimal pl-6 space-y-1",

  taskList:
  "list-none not-prose pl-2 space-y-2",

  taskItem:
  "flex gap-2",

  table:
    "text-sm my-4",

  tableRow:
    "transition-colors duration-150",

  tableHeader:
    "relative text-left font-semibold edge-cell",

  tableCell:
    "relative edge-cell [&_p]:mb-0 [&_p]:pb-0 [&_p]:leading-relaxed",

  bubbleMenu:
    "bg-sidebar-container-bg border border-sidebar-container-border rounded-xl py-1.5 px-2 flex items-center justify-center gap-0.5",

};
