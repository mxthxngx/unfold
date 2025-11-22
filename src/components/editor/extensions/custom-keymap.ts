import { Editor, Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { Plugin } from "prosemirror-state";

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
    const shiftClickSelectPlugin = new Plugin({
      props: {
        handleDOMEvents: {
          mousedown: (view, event: Event) => {
            const mouseEvent = event as MouseEvent;
            const { state, dispatch } = view;

            // find the clicked document position from the mouse coordinates
            const coords = { left: mouseEvent.clientX, top: mouseEvent.clientY };

            // @ts-ignore - posAtCoords is present on the view
            const posAt = view.posAtCoords(coords);
            if (!posAt) return false;
            const clickPos = posAt.pos;
            const clickResolved = state.doc.resolve(clickPos);
            const clickStart = clickResolved.start();
            const clickEnd = clickResolved.end();

         
            try {
              // @ts-ignore - domAtPos exists on EditorView
              const domAt = (view as any).domAtPos && (view as any).domAtPos(clickPos);
              if (domAt && domAt.node) {
                const isTextNode = domAt.node.nodeType === Node.TEXT_NODE;
                if (isTextNode && !mouseEvent.shiftKey) {
                  // clicking inside text content without Shift - allow
                  // default caret placement
                  return false;
                }
              }
            } catch (e) {
              // ignore and continue with default behavior if detection fails
            }

            // anchor is the existing selection anchor (we'll use selection.from)
            const anchorPos = state.selection.from;
            const anchorResolved = state.doc.resolve(anchorPos);
            const anchorStart = anchorResolved.start();
            const anchorEnd = anchorResolved.end();
            const isAnchorWholeBlockSelection =
              state.selection.from === anchorStart && state.selection.to === anchorEnd;

            // SHIFT + click -> extend selection between blocks
            if (mouseEvent.shiftKey) {
              const from = Math.min(anchorStart, clickStart);
              const to = Math.max(anchorEnd, clickEnd);
              const tr = state.tr.setSelection(TextSelection.create(state.doc, from, to));
              dispatch(tr);
              mouseEvent.preventDefault();
              return true;
            }

            // If the current selection is a whole-block selection, clicking another block
            // should select that whole block (not just place the caret).
            if (isAnchorWholeBlockSelection) {
              // If clicking the same block, let default behavior happen
              if (clickStart === anchorStart && clickEnd === anchorEnd) {
                return false;
              }
              const tr = state.tr.setSelection(TextSelection.create(state.doc, clickStart, clickEnd));
              dispatch(tr);
              mouseEvent.preventDefault();
              return true;
            }

            return false;
          },
        },
      },
    });

    return [shiftClickSelectPlugin];
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