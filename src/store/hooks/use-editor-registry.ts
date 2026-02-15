import { useCallback } from 'react';
import { Editor } from '@tiptap/react';

const pageEditorRef: { current: Editor | null } = { current: null };
const titleEditorRef: { current: Editor | null } = { current: null };

export function useEditorRegistry() {
  const setPageEditor = useCallback((editor: Editor | null) => {
    pageEditorRef.current = editor;
  }, []);

  const setTitleEditor = useCallback((editor: Editor | null) => {
    titleEditorRef.current = editor;
  }, []);

  const focusPageEditor = useCallback((position: 'start' | 'end' = 'start') => {
    pageEditorRef.current?.commands.focus(position);
  }, []);

  const focusPageEditorAtEnd = useCallback(() => {
    const editor = pageEditorRef.current;
    if (!editor) {
      return;
    }

    const { doc } = editor.state;

    if (doc.childCount === 0) {
      editor.commands.focus('start');
      return;
    }

    const lastNode = doc.lastChild;
    if (lastNode && lastNode.type.name === 'paragraph' && lastNode.textContent.trim() === '') {
      const endPos = doc.content.size - 1;
      editor.commands.setTextSelection(endPos);
      editor.commands.focus();
      return;
    }

    const insertPosition = doc.content.size;
    editor.commands.insertContentAt(insertPosition, { type: 'paragraph' });
    editor.commands.setTextSelection(insertPosition + 1);
    editor.commands.focus();
  }, []);

  const focusTitleEditor = useCallback((position: 'start' | 'end' = 'end') => {
    titleEditorRef.current?.commands.focus(position);
  }, []);

  return {
    pageEditorRef,
    titleEditorRef,
    setPageEditor,
    setTitleEditor,
    focusPageEditor,
    focusPageEditorAtEnd,
    focusTitleEditor,
  };
}
