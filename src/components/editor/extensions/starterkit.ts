import StarterKit from "@tiptap/starter-kit";
import { editorClasses } from "../styles/extension-styles";
import { cx } from "class-variance-authority";

export const starterKit = StarterKit.configure({
    heading: false,
    document: false,
    trailingNode: false,
    bold: {
        HTMLAttributes: {
            class: cx(editorClasses.bold),
        },
    },
    bulletList: {
        HTMLAttributes: {
            class: cx(editorClasses.bulletList),
        }
    },
    code: {
        HTMLAttributes: {
            class: cx(editorClasses.codeMark),
        },
    },
    codeBlock: {
        HTMLAttributes: {
            class: cx(editorClasses.codeBlock),
        },
    },
    italic: {
        HTMLAttributes: {
            class: cx(editorClasses.italic),
        },
    },
    orderedList: {
        HTMLAttributes: {
            class: cx(editorClasses.orderedList),
        }
    },
    listItem: {
        HTMLAttributes: {
            class: cx(editorClasses.listItem),
        },
    },
        blockquote: {
            HTMLAttributes: {
                class: cx(editorClasses.blockquote),
            },
        },  

        paragraph: {
            HTMLAttributes: {
                class: cx(editorClasses.paragraph),
            },
        },
    dropcursor: {
      width: 4,
      color: "#70CFF8",
      class: "bg-red-500",
    },
});