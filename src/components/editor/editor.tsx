import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useCallback, useRef } from "react";
import { useEditorContext } from "@/contexts/EditorContext";
import { HeadingExtension } from './extensions/heading';
import { TrailingNode } from "@tiptap/extensions";
import "./styles/drag-handle.css";
import "./styles/block-spacing.css";
import "./styles/image-node.css";
import "./styles/search-and-replace.css";
import { starterKit } from './extensions/starterkit';
import CustomKeymap from "./extensions/custom-keymap";
import { DocumentExtension } from "./extensions/document";
import { DocumentTitle } from "./extensions/document-title";
import { DragHandle } from "./extensions/drag-handle";
import { DragHandleButton } from "./components/drag-handle-button";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { useSettings } from "@/hooks/use-settings";
import { findFirstFileId } from "@/lib/file-tree";
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { editorClasses } from "./styles/extension-styles";
import TableView from "./components/table-view";
import { TableEdgeHandles } from "./extensions/table-edge-handles-extension";

import { TiptapImage } from "./extensions/image";
import { ImageNodeView } from "./components/image-node-view";
import { handlePaste, handleDrop } from "./extensions/paste-handler";
import NodeRange from "@tiptap/extension-node-range";
import { SearchAndReplace } from "./extensions/search-and-replace";
import { EditorBubbleMenu } from "./components/bubble-menu/bubble-menu";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

const DROP_HIGHLIGHT_DURATION = 1800;

const clearDropHighlight = (editorView: HTMLElement | null) => {
  if (!editorView) return;
  const highlighted = editorView.querySelectorAll('.drop-highlight');
  highlighted.forEach(el => el.classList.remove('drop-highlight'));
};

const addDropHighlight = (editorView: HTMLElement | null) => {
  if (!editorView) return;
  const selectedNodes = editorView.querySelectorAll('.ProseMirror-selectednode');
  selectedNodes.forEach(el => el.classList.add('drop-highlight'));
};

function Editor() {
    const { fileId } = useParams({ from: '/files/$fileId' });
    const navigate = useNavigate();
    const { getNode, updateNodeContent, fileTree, activeSpaceId, isLoading } = useFileSystem();
    const file = fileId ? getNode(fileId) : null;
    const { settings } = useSettings();
    const { setEditor } = useEditorContext();
    const hasInitialContent = Boolean(file?.content && file.content.trim() !== '');
    const lastSavedContentRef = useRef<string>('');
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const dropHighlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isContentLoadedRef = useRef<boolean>(false);

    const handleDropEnd = useCallback(() => {
        if (dropHighlightTimeoutRef.current) {
            clearTimeout(dropHighlightTimeoutRef.current);
        }

        requestAnimationFrame(() => {
            addDropHighlight(editorContainerRef.current);

            dropHighlightTimeoutRef.current = setTimeout(() => {
                clearDropHighlight(editorContainerRef.current);
            }, DROP_HIGHLIGHT_DURATION);
        });
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // If clicking outside the highlighted element, clear it immediately
            if (!target.closest('.drop-highlight')) {
                if (dropHighlightTimeoutRef.current) {
                    clearTimeout(dropHighlightTimeoutRef.current);
                }
                clearDropHighlight(editorContainerRef.current);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (dropHighlightTimeoutRef.current) {
                clearTimeout(dropHighlightTimeoutRef.current);
            }
        };
    }, []);

    // Save current fileId to localStorage when it changes
    useEffect(() => {
        if (fileId && activeSpaceId) {
            localStorage.setItem(`lastOpenedFile_${activeSpaceId}`, fileId);
        }
    }, [fileId, activeSpaceId]);

    useEffect(() => {
        if (!fileId) return;
        if (!file) {
            const firstAvailableId = findFirstFileId(fileTree);
            if (firstAvailableId) {
                navigate({ to: '/files/$fileId', params: { fileId: firstAvailableId } });
            } else {
                navigate({ to: '/' });
            }
        }
    }, [fileId, file, fileTree, navigate]);

    // Reset content loaded flag when file changes
    useEffect(() => {
        isContentLoadedRef.current = false;
    }, [fileId]);

    const saveContent = useCallback(
        (id: string, content: string) => {
            // Don't save until initial content has been loaded
            if (!isContentLoadedRef.current) {
                return;
            }
            if (content === lastSavedContentRef.current) {
                return;
            }
            lastSavedContentRef.current = content;
            updateNodeContent(id, content);
        },
        [updateNodeContent]
    );



    const editor = useEditor({
        extensions:[
          starterKit,
          DocumentTitle,
          HeadingExtension,
          DocumentExtension,
          TextStyle,
          Color,
          Highlight.configure({ multicolor: true }),
          TextAlign.configure({
            types: ['heading', 'paragraph'],
            alignments: ['left', 'center', 'right', 'justify'],
            defaultAlignment: 'left',
          }),
          NodeRange.configure({
            key: null,
          }),
          SearchAndReplace.configure({
            searchResultClass: 'search-result',
            searchResultCurrentClass: 'search-result-current',
            caseSensitive: false,
            disableRegex: true,
          }),
          TiptapImage.configure({
            resize:{
              enabled:true
            },
            view: ImageNodeView,
            allowBase64: false,
          }),
          Table.extend({
            addNodeView() {
              return ReactNodeViewRenderer(TableView, {
                contentDOMElementTag: "table",
              });
            },
          }).configure({
            resizable: true,
            HTMLAttributes: {
              class: editorClasses.table,
            },
          }),
          TableRow.configure({
            HTMLAttributes: {
              class: editorClasses.tableRow,
            },
          }),
          TableHeader.configure({
            HTMLAttributes: {
              class: editorClasses.tableHeader,
            },
          }),
          TableCell.configure({
            HTMLAttributes: {
              class: editorClasses.tableCell,
            },
          }),
          TableEdgeHandles,
          CustomKeymap.configure({
            selectAllKey: settings.keybindings.selectAll,
          }),
          TrailingNode.configure({
                 node: "paragraph",
                 notAfter: ["paragraph"],
          }),
        ],
        autofocus: hasInitialContent ? false : 'start',
        content: file?.content || '',
        onUpdate: ({ editor }) => {
          if (fileId) {
            // Store as JSON string for SQLite persistence
            const jsonContent = JSON.stringify(editor.getJSON());
            saveContent(fileId, jsonContent);
          }
        },
        coreExtensionOptions: {
          clipboardTextSerializer: {
            blockSeparator: "\n",
          },
        },
        editorProps: {
          attributes: {
            class: 'w-full outline-none bg-transparent border-none p-6 pt-7 py-0 text-foreground min-h-full',
          },
          handlePaste: (view, event) => {
            if (fileId) return handlePaste(view, event, fileId);
            return false;
          },
          handleDrop: (view, event, _slice, moved) => {
            if (fileId) return handleDrop(view, event, moved, fileId);
            return false;
          },
        },
    });

    // Register editor instance
    useEffect(() => {
        setEditor(editor);
        return () => setEditor(null);
    }, [editor, setEditor]);

    // Update content when file changes
    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (editor && file) {
            const rawContent = file.content || '';

            if (rawContent !== lastSavedContentRef.current) {
                let content: object | string = '';

                if (rawContent) {
                    try {
                        content = JSON.parse(rawContent);
                    } catch {
                      content=""
                    }
                }

                editor.commands.setContent(content);
                lastSavedContentRef.current = rawContent;
            }

            isContentLoadedRef.current = true;

            if (!rawContent || rawContent.trim() === '') {
                editor.commands.focus('start');
            }
        } else if (editor && !file && !isLoading) {
            isContentLoadedRef.current = true;
        }
    }, [fileId, editor, isLoading]);

    if (!editor) {
        return null;
    }

    return (
        <div ref={editorContainerRef} className="relative w-full">
          <DragHandle
            editor={editor}
            onElementDragEnd={handleDropEnd}
            shouldShow={(_node, pos) => {
              if (pos <= 0) return false;

              const { doc } = editor.state;
              const docText = doc.textContent.trim();

              if (!docText || docText.length === 0) return false;

              if (doc.childCount === 1 && doc.firstChild?.textContent === '') return false;

              return true;
            }}
          >
            <DragHandleButton />
          </DragHandle>

          <div className="">
            <EditorBubbleMenu editor={editor} />
            {
              editor && <EditorContent editor={editor} />
            }
          </div>
        </div>
    );
}

export default Editor;
