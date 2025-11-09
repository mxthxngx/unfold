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

const CustomKeymap = Extension.create({
  name: "CustomKeymap",

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
        const selectWholeBlocks = (editor: Editor, fromPos: number, toPos: number) => {
      const { state, view } = editor;
      const $from = state.doc.resolve(fromPos);
      const $to = state.doc.resolve(toPos);

      const startNodePos = $from.start();
      const endNodePos = $to.end();

      const tr = state.tr.setSelection(
        TextSelection.create(state.doc, startNodePos, endNodePos)
      );
      view.dispatch(tr);
      return true;
    };
    return {
      "Mod-a": ({ editor }) => {
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
            if (!mouseEvent.shiftKey) return false;

            const { state, dispatch } = view;

            // anchor is the existing selection anchor (we'll use selection.from)
            const anchorPos = state.selection.from;
            const anchorResolved = state.doc.resolve(anchorPos);
            const anchorStart = anchorResolved.start();
            const anchorEnd = anchorResolved.end();

            // find the clicked document position from the mouse coordinates
            const coords = { left: mouseEvent.clientX, top: mouseEvent.clientY };
            // posAtCoords may return null if outside
            // @ts-ignore - posAtCoords is present on the view
            const posAt = view.posAtCoords(coords);
            if (!posAt) return false;
            const clickPos = posAt.pos;
            const clickResolved = state.doc.resolve(clickPos);
            const clickStart = clickResolved.start();
            const clickEnd = clickResolved.end();

            // compute full range covering whole blocks between anchor and click
            const from = Math.min(anchorStart, clickStart);
            const to = Math.max(anchorEnd, clickEnd);

            const tr = state.tr.setSelection(TextSelection.create(state.doc, from, to));
            dispatch(tr);
            // prevent the browser/editor default handling
            mouseEvent.preventDefault();
            return true;
          },
        },
      },
    });

    return [shiftClickSelectPlugin];
  },

});

export default CustomKeymap;