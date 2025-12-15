import Image from "@tiptap/extension-image";
import { ImageOptions as DefaultImageOptions } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { mergeAttributes, Range } from "@tiptap/core";
import { ImageNodeView } from "../components/image-node-view";

export interface ImageOptions extends DefaultImageOptions {
  view: any;
}

export interface ImageAttributes {
  src?: string;
  alt?: string;
  title?: string;
  align?: string;
  attachmentId?: string;
  size?: number;
  width?: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageBlock: {
      setImage: (attributes: ImageAttributes) => ReturnType;
      setImageAt: (
        attributes: ImageAttributes & { pos: number | Range },
      ) => ReturnType;
      setImageAlign: (align: "left" | "center" | "right") => ReturnType;
      setImageWidth: (width: number) => ReturnType;
    };
  }
}

export const TiptapImage = Image.extend<ImageOptions>({
  name: "image",

  inline: false,
  group: "block",
  isolating: true,
  atom: true,
  defining: true,

  addOptions() {
    return {
      ...this.parent?.(),
      view: null as any,
      allowBase64: false,
      inline: false,
      HTMLAttributes: {},
      resize: false,
    };
  },

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => ({
          src: attributes.src,
        }),
      },
      width: {
        default: "100%",
        parseHTML: (element) => element.getAttribute("width") || element.style.width,
        renderHTML: (attributes: ImageAttributes) => ({
          width: attributes.width,
        }),
      },
      height: {
        default: "auto",
        parseHTML: (element) => element.getAttribute("height") || element.style.height,
        renderHTML: (attributes: any) => ({
          height: attributes.height,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align"),
        renderHTML: (attributes: ImageAttributes) => ({
          "data-align": attributes.align,
        }),
      },
      alt: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("alt"),
        renderHTML: (attributes: ImageAttributes) => ({
          alt: attributes.alt,
        }),
      },
      attachmentId: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes: ImageAttributes) => ({
          "data-attachment-id": attributes.attachmentId,
        }),
      },
      size: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-size"),
        renderHTML: (attributes: ImageAttributes) => ({
          "data-size": attributes.size,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },

  addCommands() {
    return {
      setImage:
        (attrs: ImageAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "image",
            attrs: attrs,
          });
        },

      setImageAt:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContentAt(attrs.pos, {
            type: "image",
            attrs: attrs,
          });
        },

      setImageAlign:
        (align) =>
        ({ commands }) =>
          commands.updateAttributes("image", { align }),

      setImageWidth:
        (width) =>
        ({ commands }) =>
          commands.updateAttributes("image", {
            width: `${Math.max(0, Math.min(100, width))}%`,
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(this.options.view || ImageNodeView);
  },
});
