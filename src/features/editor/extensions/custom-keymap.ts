import { Editor, Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  // eslint-disable-next-line no-unused-vars
  interface Commands<ReturnType> {
    customkeymap: {
      /**
       * Select text between node boundaries
       */
      selectTextWithinNodeBoundaries: () => ReturnType;
    };
  }
}

interface CustomKeymapOptions {
  selectAllKey: string;
}

const CustomKeymap = Extension.create<CustomKeymapOptions>({
  name: "CustomKeymap",

  addOptions() {
    return {
      selectAllKey: "Mod-a",
    };
  },

  addCommands() {
    return {
      selectTextWithinNodeBoundaries:
        () =>
        ({ editor, commands }) => {
          const { state } = editor;
          const { tr } = state;
          const startNodePos = tr.selection.$from.start();
          const endNodePos = tr.selection.$to.end();
          return commands.setTextSelection({
            from: startNodePos,
            to: endNodePos,
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      [this.options.selectAllKey]: ({ editor }) => {
        const { state } = editor;
        const { tr } = state;
        const startSelectionPos = tr.selection.from;
        const endSelectionPos = tr.selection.to;
        const startNodePos = tr.selection.$from.start();
        const endNodePos = tr.selection.$to.end();
        const isCurrentTextSelectionNotExtendedToNodeBoundaries =
          startSelectionPos > startNodePos || endSelectionPos < endNodePos;
        if (isCurrentTextSelectionNotExtendedToNodeBoundaries) {
          editor.chain().selectTextWithinNodeBoundaries().run();
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    // Shift+click block selection is now handled by the NodeRange extension
    return [];
  },

  onCreate() {
    try {
      // add the optional spacing utility class to the editor DOM root
      // `this.editor` is provided by tiptap extension lifecycle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const editor = (this as any).editor as Editor | undefined;
      const dom = editor?.view?.dom as HTMLElement | undefined;
      if (dom && !dom.classList.contains("editor-block-spacing")) {
        dom.classList.add("editor-block-spacing");
      }
    } catch (e) {
      // noop
    }
  },

  onDestroy() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const editor = (this as any).editor as Editor | undefined;
      const dom = editor?.view?.dom as HTMLElement | undefined;
      if (dom && dom.classList.contains("editor-block-spacing")) {
        dom.classList.remove("editor-block-spacing");
      }
    } catch (e) {
      // noop
    }
  },

});

export default CustomKeymap;