import { Editor } from "@tiptap/react";

export const isTextSelected = (editor: Editor) => {
  const { state } = editor;
  const { selection } = state;
  const { from, to } = selection;
  
  // Check if there's actual content selected
  if (from === to) return false;
  
  const text = state.doc.textBetween(from, to, ' ');
  return text.trim().length > 0;
};
