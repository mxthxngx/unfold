import Heading from "@tiptap/extension-heading";
import { editorClasses } from "../styles/extension-styles";
import { mergeAttributes } from "@tiptap/react";

export const HeadingExtension = Heading.extend({
  addOptions() {
    return {
      levels: [2, 3],
      HTMLAttributes: {},
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level;
    let className = "";

    switch (level) {
      case 1:
        className = editorClasses.heading1;
        break;
      case 2:
        className = editorClasses.heading2;
        break;
      case 3:
        className = editorClasses.heading3;
        break;
    }

    return [`h${level}`, mergeAttributes(HTMLAttributes, { class: className }), 0];
  },
});
