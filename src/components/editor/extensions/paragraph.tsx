import { Paragraph } from "@tiptap/extension-paragraph"
import { mergeAttributes } from "@tiptap/react";
import { editorClasses } from "../styles/extensions";
export const ParagraphExtension = Paragraph.extend({
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes, { class: editorClasses.paragraph }), 0];
  },
});
