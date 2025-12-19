export const editorClasses = {
  documentTitle:
    "bg-[rgba(14,14,17,0.01)] text-[2.5em] font-bold mt-[.5em] mb-[0.5em] tracking-tight pe-2",

  blockquote:
    "border-l-[3px] border-zinc-700 pl-6 pr-4 py-2 my-4 italic text-zinc-300 bg-zinc-900/50 rounded-r-md",

  bold: "font-bold",

  details:
    "border border-zinc-700/60 rounded-lg mb-4 overflow-hidden bg-zinc-900/20 shadow-sm",

  detailsSummary:
    "cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 px-5 py-3 rounded-t-lg font-medium text-zinc-100 transition-colors duration-150",

  detailsContent: "px-5 py-4 text-zinc-300",

  highlight:
    "bg-yellow-900/30 text-yellow-200 px-1 rounded",

  italic: "italic",

  heading1:
    "text-[1.75em] font-bold mt-[1.4em] mb-[0.5em] tracking-tight pe-2",

  heading2:
    "text-[1.5em] font-semibold mt-8 mb-3 tracking-tight",

  heading3:
    "text-[1.25em] font-semibold mt-7 mb-2.5 tracking-tight",

  horizontalRule:
    "border-t border-zinc-700/60 my-6",

  codeMark:
    "bg-zinc-900/50 backdrop-blur-sm text-sm rounded-[4px] py-0.5 px-1.5 font-mono text-xs font-medium border border-zinc-700/60",

  codeBlock:
    "bg-zinc-900/50 backdrop-blur-sm text-sm rounded-lg p-5 border border-zinc-700/60 shadow-sm overflow-x-auto my-4",

  link:
    "text-zinc-400 underline decoration-zinc-600 decoration-[0.025em] decoration-solid hover:text-zinc-200 hover:decoration-zinc-400 transition-colors",

  paragraph:
    "text-base mb-3",

  listItem:
    "mb-2",

  bulletList:
    "list-disc pl-6 space-y-1",

  orderedList:
    "list-decimal pl-6 space-y-1",

  taskList:
    "flex not-prose pl-2 space-y-2",

  taskItem:
    "flex items-start gap-2",

  // Minimalistic table styling matching code block aesthetic
  table:
    "w-full border-collapse text-sm text-table-text bg-table-surface border border-table-border rounded-lg overflow-hidden shadow-sm my-4",

  tableRow:
    "bg-table-row-bg hover:bg-table-row-hover transition-colors duration-150 last:[&>td]:border-b-0 last:[&>th]:border-b-0 [&>td]:border-r [&>td]:border-table-border [&>td]:last:border-r-0 [&>th]:border-r [&>th]:border-table-border [&>th]:last:border-r-0",

  tableHeader:
    "relative px-4 py-3 pb-0 text-left font-medium text-table-header-foreground bg-table-header-bg border-b border-table-border border-r last:border-r-0 edge-cell",

  tableCell:
    "relative px-4 py-3 text-table-text-muted border-b border-table-border border-r last:border-r-0 [&_p]:mb-0 [&_p]:pb-0 edge-cell",

  bubbleMenu:
    "bg-editor-bubble-menu-surface border border-editor-bubble-menu-surface-border shadow-lg rounded-xl py-1.5 px-2 flex items-center justify-center gap-0.5",
};