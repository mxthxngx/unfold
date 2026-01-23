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
    "text-[1.75em] font-bold  m-y-[3px] tracking-tight pe-2",

  heading2:
    "text-[1.5em] font-semibold m-y-[3px] tracking-tight",

  heading3:
    "text-[1.25em] font-semibold m-y-[3px] tracking-tight",

  horizontalRule:
    "border-t border-zinc-700/60 my-6",

  codeMark:
    "bg-zinc-900/50 backdrop-blur-sm text-sm rounded-[4px] py-0.5 px-1.5 font-mono text-xs font-medium border border-zinc-700/60",

  codeBlock:
    "bg-zinc-900/50 backdrop-blur-sm text-sm rounded-lg p-5 border border-zinc-700/60 shadow-sm overflow-x-auto my-4",

  link:
    "text-zinc-400 underline decoration-zinc-600 decoration-[0.025em] decoration-solid hover:text-zinc-200 hover:decoration-zinc-400 transition-colors",

  paragraph:
    "text-base m-y-[3px]",

  listItem:
    "mb-2",

  bulletList:
    "list-disc pl-6 space-y-1",

  orderedList:
    "list-decimal pl-6 space-y-1",

  taskList:
  "list-none not-prose pl-2 space-y-2",

  taskItem:
  "flex items-start gap-2 [&>label]:flex [&>label]:items-start [&>label]:gap-2 [&>label]:shrink-0 [&>label>input]:mt-[0.125rem] [&>label>input]:flex-shrink-0 [&>label>input]:self-start [&_.task-item-content]:flex-1 [&_.task-item-content]:leading-normal [&_.task-item-content_p]:mb-0 [&_.task-item-content_p]:mt-0",

  // Beautiful table styling matching code block aesthetic
  table:
    /* Let `styles/table.css` control sizing/collapse for TipTap colgroup resizing */
    "text-sm my-4",

  tableRow:
    "transition-colors duration-150",

  tableHeader:
    "relative text-left font-semibold edge-cell",

  tableCell:
    "relative edge-cell [&_p]:mb-0 [&_p]:pb-0 [&_p]:leading-relaxed",

  bubbleMenu:
    "bg-editor-bubble-menu-surface border border-editor-bubble-menu-surface-border shadow-lg rounded-xl py-1.5 px-2 flex items-center justify-center gap-0.5",

};
