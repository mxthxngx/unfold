import type { EditorView } from "@tiptap/pm/view";
import { handleImagePaste, handleImageDrop } from "./image-paste-handler";

/**
 * Generic paste handler that delegates to specific handlers
 * Can be extended to handle other paste types (links, code blocks, etc.)
 */
export const handlePaste = (
  view: EditorView,
  event: ClipboardEvent,
  noteId: string,
) => {
  // Try image paste first
  if (handleImagePaste(view, event, noteId)) {
    return true;
  }

  // Add more paste handlers here as needed
  // e.g., handleLinkPaste, handleCodePaste, etc.

  // Let TipTap handle default paste behavior
  return false;
};

/**
 * Generic drop handler that delegates to specific handlers
 * Can be extended to handle other drop types
 */
export const handleDrop = (
  view: EditorView,
  event: DragEvent,
  moved: boolean,
  noteId: string,
) => {
  // Try image drop first
  if (handleImageDrop(view, event, moved, noteId)) {
    return true;
  }

  // Add more drop handlers here as needed

  // Let TipTap handle default drop behavior
  return false;
};
