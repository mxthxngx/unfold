import { Editor, Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";
import { NodeRangeSelection } from "@tiptap/extension-node-range";

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
            
            // Find the actual node we clicked on (not the parent)
            const clickedNodeBefore = clickResolved.nodeBefore;
            const clickedNodeAfter = clickResolved.nodeAfter;
            
            // Determine if we clicked on a block node (like an image)
            let clickStart: number;
            let clickEnd: number;
            
            if (clickedNodeAfter && clickedNodeAfter.isBlock) {
              // Clicked at the start of a block node
              clickStart = clickPos;
              clickEnd = clickPos + clickedNodeAfter.nodeSize;
            } else if (clickedNodeBefore && clickedNodeBefore.isBlock) {
              // Clicked at the end of a block node
              clickStart = clickPos - clickedNodeBefore.nodeSize;
              clickEnd = clickPos;
            } else {
              // Clicked in inline content or text - use parent block boundaries
              clickStart = clickResolved.start();
              clickEnd = clickResolved.end();
            }

         
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

            // Get the current selection boundaries
            const anchorPos = state.selection.from;
            const anchorTo = state.selection.to;
            const anchorResolved = state.doc.resolve(anchorPos);
            
            // Determine anchor block boundaries similarly
            const anchorNodeAfter = anchorResolved.nodeAfter;
            const anchorNodeBefore = anchorResolved.nodeBefore;
            
            let anchorStart: number;
            let anchorEnd: number;
            
            // Check if selection is a whole block (like a selected image)
            if (anchorNodeAfter && anchorNodeAfter.isBlock && anchorPos + anchorNodeAfter.nodeSize === anchorTo) {
              anchorStart = anchorPos;
              anchorEnd = anchorTo;
            } else if (anchorNodeBefore && anchorNodeBefore.isBlock && anchorPos - anchorNodeBefore.nodeSize === state.selection.to) {
              anchorStart = state.selection.to;
              anchorEnd = anchorPos;
            } else {
              // Use actual selection positions for text
              anchorStart = anchorPos;
              anchorEnd = anchorTo;
            }
            
            const isAnchorWholeBlockSelection =
              state.selection.from === anchorStart && state.selection.to === anchorEnd &&
              (anchorNodeAfter?.isBlock || anchorNodeBefore?.isBlock);

            // SHIFT + click -> extend selection between blocks
            if (mouseEvent.shiftKey) {
              const from = Math.min(anchorStart, clickStart);
              const to = Math.max(anchorEnd, clickEnd);
              
              try {
                // Use NodeRangeSelection which properly handles selection across block nodes
                const selection = NodeRangeSelection.create(state.doc, from, to);
                const tr = state.tr.setSelection(selection);
                dispatch(tr);
                mouseEvent.preventDefault();
                return true;
              } catch (e) {
                console.error("Selection failed:", e);
                return false;
              }
            }

            // If the current selection is a whole-block selection, clicking another block
            // should select that whole block (not just place the caret).
            if (isAnchorWholeBlockSelection) {
              // If clicking the same block, let default behavior happen
              if (clickStart === anchorStart && clickEnd === anchorEnd) {
                return false;
              }
              
              try {
                // Use NodeRangeSelection for block selections
                const selection = NodeRangeSelection.create(state.doc, clickStart, clickEnd);
                const tr = state.tr.setSelection(selection);
                dispatch(tr);
                mouseEvent.preventDefault();
                return true;
              } catch (e) {
                // If selection fails for block nodes, just let default behavior happen
                return false;
              }
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