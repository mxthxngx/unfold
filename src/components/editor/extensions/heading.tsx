import Heading from "@tiptap/extension-heading";
import { editorClasses } from "../styles/extension-styles";
import { mergeAttributes } from "@tiptap/react";
import { textblockTypeInputRule } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";

export const HeadingExtension = Heading.extend({
  addOptions() {
    return {
      levels: [1, 2, 3],
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

  addInputRules() {
    return this.options.levels.map((level: number) =>
      textblockTypeInputRule({
        find: new RegExp(`^(#{1,${level}})\\s$`),
        type: this.type,
        getAttributes: () => ({
          level,
        }),
      }),
    );
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("headingInputRuleFix"),
        appendTransaction: (transactions, oldState, newState) => {
          for (const tr of transactions) {
            // Check if this transaction has inputRule metadata (created by input rule)
            if (!tr.getMeta("inputRule")) {
              continue;
            }

            // Find if a heading was created in this transaction
            const docChanged = tr.docChanged;
            if (!docChanged) {
              continue;
            }

            // Look for a block node created at the start of the document
            const firstNode = newState.doc.firstChild;
            if (!firstNode) {
              continue;
            }

            const isTargetBlock = ["heading", "codeBlock", "blockquote"].includes(
              firstNode.type.name,
            );
            if (!isTargetBlock) {
              continue;
            }

            const firstNodeSize = firstNode.nodeSize;
            const cursorPos = newState.selection.$head.pos;

            // If cursor is after the first block, move it inside at the end of content
            if (cursorPos > firstNodeSize) {
              const newTr = newState.tr;
              newTr.setSelection(
                TextSelection.create(newState.doc, firstNodeSize - 1),
              );
              return newTr;
            }
          }
          return null;
        },
      }),
    ];
  },
}).configure({
  levels: [1, 2, 3],
});
