import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { TrailingNode, Placeholder } from "@tiptap/extensions";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { useEditorContext } from "@/contexts/EditorContext";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { useSettings } from "@/hooks/use-settings";
import { Selection } from "@tiptap/pm/state";
import { HeadingExtension } from "./extensions/heading";
import { starterKit } from "./extensions/starterkit";
import CustomKeymap from "./extensions/custom-keymap";
import { DocumentExtension } from "./extensions/document";
import { DragHandle } from "./extensions/drag-handle";
import { DragHandleButton } from "./components/drag-handle-button";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { editorClasses } from "./styles/extension-styles";
import TableView from "./components/table-view";
import { TiptapImage } from "./extensions/image";
import { ImageNodeView } from "./components/image-node-view";
import { handlePaste, handleDrop } from "./extensions/paste-handler";
import NodeRange from "@tiptap/extension-node-range";
import { SearchAndReplace } from "./extensions/search-and-replace";
import { EditorBubbleMenu } from "./components/bubble-menu/bubble-menu";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import invoke from "@/utils/invoke";
import "./styles/drag-handle.css";
import "./styles/block-spacing.css";
import "./styles/image-node.css";
import "./styles/search-and-replace.css";
import "./styles/table.css";
import "./styles/page-editor.css";
import SlashCommand from "./extensions/slash-command";
import { slashMenuPluginKey } from "./extensions/slash-command";

interface PageEditorProps {
  fileId: string;
}

const TAB_INDENT = "    ";

function hasAncestorNode($pos: { depth: number; node: (depth: number) => { type: { name: string } } }, names: string[]) {
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    if (names.includes($pos.node(depth).type.name)) {
      return true;
    }
  }
  return false;
}

function isEditableSurface(target: HTMLElement) {
  return Boolean(
    target.closest('input, textarea, [contenteditable="true"], [contenteditable=""]') ||
      target.closest(".title-editor") ||
      target.closest("[data-bubble-menu='true']")
  );
}

function PageEditor({ fileId }: PageEditorProps) {
  const { setPageEditor, focusTitleEditor } = useEditorContext();
  const { getNode, updateNodeContent } = useFileSystem();
  const { settings } = useSettings();
  const file = getNode(fileId);
  
  const lastSavedRef = useRef<string>(file?.content || "");
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const pendingArrowScrollRef = useRef(false);

  const clearDropHighlight = useCallback(() => {
    if (!editorContainerRef.current) return;
    const highlighted = editorContainerRef.current.querySelectorAll(".drop-highlight");
    highlighted.forEach((el) => el.classList.remove("drop-highlight"));
  }, []);

  const clearNativeSelection = useCallback(() => {
    const selection = document.getSelection();
    if (selection && !selection.isCollapsed) {
      selection.removeAllRanges();
    }
  }, []);

  const handleExternalLinkOpen = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor || !editorContainerRef.current?.contains(anchor)) {
      return false;
    }

    const href = anchor.getAttribute("href")?.trim();
    if (!href || href.startsWith("#")) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();

    void invoke("open_external_url", { url: href }).catch((error) => {
      console.error("Failed to open external URL:", error);
    });

    return true;
  }, []);

  const initialContent = useMemo(() => {
    const raw = file?.content || "";
    if (!raw) return "";
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }, [fileId]);

  const editorExtensions = useMemo(
    () => [
      starterKit,
      HeadingExtension,
      DocumentExtension,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      NodeRange.configure({ key: null }),
      SearchAndReplace.configure({
        searchResultClass: "search-result",
        searchResultCurrentClass: "search-result-current",
        searchResultFirstClass: "search-result-first",
        caseSensitive: false,
        disableRegex: true,
      }),
      TiptapImage.configure({
        resize: { enabled: true },
        view: ImageNodeView,
        allowBase64: false,
      }),
      Table.extend({
        addNodeView() {
          return ReactNodeViewRenderer(TableView, { contentDOMElementTag: "table" });
        },
      }).configure({
        resizable: true,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
        HTMLAttributes: { class: editorClasses.table },
      }),
      TableRow.configure({ HTMLAttributes: { class: editorClasses.tableRow } }),
      TableHeader.configure({ HTMLAttributes: { class: editorClasses.tableHeader } }),
      TableCell.configure({ HTMLAttributes: { class: editorClasses.tableCell } }),
      CustomKeymap.configure({ selectAllKey: settings.keybindings.selectAll }),
      TrailingNode.configure({ node: "paragraph", notAfter: ["paragraph"] }),
      Placeholder.configure({
        placeholder: () => "Start typing...",
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      SlashCommand,
      TaskList.configure({ HTMLAttributes: { class: editorClasses.taskList } }),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: editorClasses.taskItem } }),
    ],
    [settings.keybindings.selectAll],
  );

  const editor = useEditor({
    extensions: editorExtensions,
    autofocus: false,
    content: initialContent,
    onUpdate: ({ editor }) => {
      const slashState = slashMenuPluginKey.getState(editor.state) as
        | { active?: boolean; query?: string }
        | undefined;

      if (slashState?.active) {
        return;
      }

      const jsonContent = JSON.stringify(editor.getJSON());
      if (jsonContent !== lastSavedRef.current) {
        lastSavedRef.current = jsonContent;
        updateNodeContent(fileId, jsonContent);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (!pendingArrowScrollRef.current) return;
      pendingArrowScrollRef.current = false;
      editor.view?.dispatch(editor.state.tr.scrollIntoView());
    },
    coreExtensionOptions: {
      clipboardTextSerializer: { blockSeparator: "\n" },
    },
    editorProps: {
      attributes: {
        class: "w-full outline-none bg-transparent border-none px-6 pb-6 text-foreground min-h-full",
      },
      handleDOMEvents: {
        click: (_view, event) => handleExternalLinkOpen(event),
        auxclick: (_view, event) => {
          if (event.button !== 1) {
            return false;
          }
          return handleExternalLinkOpen(event);
        },
        keydown: (view, event) => {
          if (event.isComposing || event.keyCode === 229) return false;
          if (event.key.startsWith("Arrow") && !event.metaKey && !event.ctrlKey && !event.altKey) {
            pendingArrowScrollRef.current = true;
          }
          const { $head, $anchor } = view.state.selection;
          const isAtDocumentStart = $head.pos <= 1;
          const isAtFirstBlockStart = $head.depth === 1 && 
            $head.parentOffset === 0 && 
            !$head.nodeBefore &&
            $head.pos === ($head.start($head.depth) + 1);
          const isAtStart = isAtDocumentStart || isAtFirstBlockStart;
          const hasNoSelection = $head.pos === $anchor.pos;
          if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
            const slashCommand = document.querySelector("#slash-command");
            if (slashCommand) {
              return false;
            }
          }

          if (event.key === "Tab") {
            const isListContext = hasAncestorNode($head, ["listItem", "taskItem"]);
            if (isListContext) {
              return false;
            }

            event.preventDefault();
            const { from, to, empty } = view.state.selection;

            if (event.shiftKey) {
              if (!empty) {
                return true;
              }

              const lineStart = $head.start();
              const textBeforeCursor = view.state.doc.textBetween(lineStart, from, "\n", "\0");
              const trailingSpaces = textBeforeCursor.match(/ *$/)?.[0]?.length ?? 0;
              if (!trailingSpaces) {
                return true;
              }

              view.dispatch(view.state.tr.delete(from - Math.min(4, trailingSpaces), from));
              return true;
            }

            view.dispatch(view.state.tr.insertText(TAB_INDENT, from, to));
            return true;
          }

          if (event.key === "ArrowUp" && isAtStart) {
            event.preventDefault();
            focusTitleEditor("end");
            return true;
          }


          if (event.key === "Backspace" && isAtStart && hasNoSelection) {
            event.preventDefault();
            const firstBlock = view.state.doc.firstChild;
            const canDropLeadingEmptyParagraph =
              view.state.doc.childCount > 1 &&
              firstBlock?.type.name === "paragraph" &&
              firstBlock.textContent.trim().length === 0;

            if (canDropLeadingEmptyParagraph && firstBlock) {
              view.dispatch(view.state.tr.delete(0, firstBlock.nodeSize));
            }

            focusTitleEditor("end");
            return true;
          }

          return false;
        },
      },
      handlePaste: (view, event) => handlePaste(view, event, fileId),
      handleDrop: (view, event, _slice, moved) => handleDrop(view, event, moved, fileId),
    },
  }, [fileId, settings.keybindings.selectAll]);

  const clearEditorSelection = useCallback(() => {
    if (!editor) return;
    const { selection } = editor.state;
    if (selection.empty) return;
    const nextSelection = Selection.near(selection.$to, 1);
    editor.view.dispatch(editor.state.tr.setSelection(nextSelection));
  }, [editor]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : e.target instanceof Node ? e.target.parentElement : null;
      if (!target) return;

      if (!target.closest(".drop-highlight")) {
        clearDropHighlight();
      }

      if (!editorContainerRef.current?.contains(target)) {
        clearEditorSelection();
        if (!isEditableSurface(target)) {
          clearNativeSelection();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clearDropHighlight, clearEditorSelection, clearNativeSelection]);

  useEffect(() => {
    if (!editor) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      const isInEditor = target ? editorContainerRef.current?.contains(target) : false;
      if (!editor.view.hasFocus() && !isInEditor) return;
      if (editor.state.selection.empty) return;

      event.preventDefault();
      clearEditorSelection();
      clearNativeSelection();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editor, clearEditorSelection, clearNativeSelection]);

  useEffect(() => {
    if (editor) {
      setPageEditor(editor);
    }
    return () => setPageEditor(null);
  }, [editor, setPageEditor]);

  if (!editor) return null;

  return (
    <div ref={editorContainerRef} className="relative w-full page-editor-container">
      <DragHandle
        editor={editor}
        shouldShow={(_node, _pos) => {

          const { doc } = editor.state;
          const docText = doc.textContent.trim();
          if (!docText) return false;
          if (doc.childCount === 1 && doc.firstChild?.textContent === "") return false;
          return true;
        }}
      >
        <DragHandleButton />
      </DragHandle>

      <EditorBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export default PageEditor;
