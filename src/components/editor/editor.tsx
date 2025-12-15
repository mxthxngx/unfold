import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useCallback, useRef } from "react";
import { useEditorContext } from "@/contexts/EditorContext";
import { HeadingExtension } from './extensions/heading';
import { TrailingNode } from "@tiptap/extensions";
import "./styles/drag-handle.css";
import "./styles/block-spacing.css";
import "./styles/image-node.css";
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
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { TiptapImage } from "./extensions/image";
import { ImageNodeView } from "./components/image-node-view";
import { ImagePasteExtension } from "./extensions/image-paste-extension";

// Debounce delay for auto-saving content (ms)
const SAVE_DEBOUNCE_DELAY = 500;

function Editor() {
    const { fileId } = useParams({ from: '/files/$fileId' });
    const navigate = useNavigate();
    const { getNode, updateNodeContent, fileTree, activeSpaceId } = useFileSystem();
    const file = fileId ? getNode(fileId) : null;
    const { settings } = useSettings();
    const { setEditor } = useEditorContext();
    const hasInitialContent = Boolean(file?.content && file.content.trim() !== '');
    const lastSavedContentRef = useRef<string>('');

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

    // Debounced save function for content updates
    const saveContent = useCallback(
        (id: string, content: string) => {
            // Skip if content hasn't actually changed
            if (content === lastSavedContentRef.current) return;
            lastSavedContentRef.current = content;
            updateNodeContent(id, content);
        },
        [updateNodeContent]
    );

    const { debouncedCallback: debouncedSave, flush: flushSave } = useDebouncedCallback(
        saveContent,
        SAVE_DEBOUNCE_DELAY
    );

    // Flush pending saves when switching files or unmounting
    useEffect(() => {
        return () => {
            flushSave();
        };
    }, [fileId, flushSave]);

    const editor = useEditor({
        extensions:[
          starterKit,
          DocumentTitle,
          HeadingExtension,
          DocumentExtension,
          TiptapImage.configure({
            view: ImageNodeView,
            allowBase64: false,
          }),
          ImagePasteExtension.configure({
            noteId: fileId,
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
            debouncedSave(fileId, jsonContent);
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
        },
    });

    // Register editor instance
    useEffect(() => {
        setEditor(editor);
        return () => setEditor(null);
    }, [editor, setEditor]);

    // Update content when file changes
    useEffect(() => {
        if (editor && file) {
            // Parse JSON content (TipTap JSON format)
            const rawContent = file.content || '';
            let content: object | string = '';
            
            if (rawContent) {
                try {
                    content = JSON.parse(rawContent);
                } catch {
                    // If not valid JSON, start fresh
                    content = '';
                }
            }
            
            editor.commands.setContent(content);
            lastSavedContentRef.current = rawContent;
            
            if (!rawContent || rawContent.trim() === '') {
                editor.commands.focus('start');
            }
        }
    }, [fileId, editor]); // Only trigger when fileId changes (or editor instance)
    
    if (!editor) {
        return null;
    }

    return (
        <div className="relative w-full">
          <DragHandle 
            editor={editor} 
            shouldShow={(_node, pos) => {
              // Don't show for first position
              if (pos <= 0) return false;
              
              const { doc } = editor.state;
              const docText = doc.textContent.trim();
              
              // Don't show if document is empty or only whitespace
              if (!docText || docText.length === 0) return false;
              
              // Don't show if document has only one empty paragraph (default state)
              if (doc.childCount === 1 && doc.firstChild?.textContent === '') return false;
              
              return true;
            }}
          >
            <DragHandleButton />
          </DragHandle>

          <div className="">
            <EditorContent editor={editor} />
          </div>
        </div>
    );
}

export default Editor;
