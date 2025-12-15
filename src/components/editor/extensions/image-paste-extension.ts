import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { handleImagePaste, handleImageDrop } from "./image-paste-handler";

export interface ImagePasteOptions {
  noteId?: string;
}

export const ImagePasteExtension = Extension.create<ImagePasteOptions>({
  name: "imagePaste",

  addOptions() {
    return {
      noteId: undefined,
    };
  },

  addProseMirrorPlugins() {
    const noteId = this.options.noteId;

    return [
      new Plugin({
        key: new PluginKey("imagePaste"),
        props: {
          handlePaste: (view, event) => {
            if (!noteId) return false;
            return handleImagePaste(view, event, noteId);
          },
          handleDrop: (view, event, _slice, moved) => {
            if (!noteId) return false;
            return handleImageDrop(view, event, moved, noteId);
          },
        },
      }),
    ];
  },
});
