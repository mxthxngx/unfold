import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';

interface EditorContextType {
  pageEditorRef: React.MutableRefObject<Editor | null>;
  titleEditorRef: React.MutableRefObject<Editor | null>;
  setPageEditor: (editor: Editor | null) => void;
  setTitleEditor: (editor: Editor | null) => void;
  focusPageEditor: (position?: 'start' | 'end') => void;
  focusPageEditorAtEnd: () => void;
  focusTitleEditor: (position?: 'start' | 'end') => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const pageEditorRef = useRef<Editor | null>(null);
  const titleEditorRef = useRef<Editor | null>(null);

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
    if (!editor) return;
    
    const { state } = editor;
    const { doc } = state;
    
    if (doc.childCount > 0) {
      const lastNode = doc.lastChild;
      if (lastNode && lastNode.type.name === 'paragraph' && lastNode.textContent.trim() === '') {
        const endPos = doc.content.size - 1;
        editor.commands.setTextSelection(endPos);
        editor.commands.focus();
      } else {
        // Create a new empty paragraph at the end and focus it
        const endPos = doc.content.size;
        editor.commands.insertContentAt(endPos, { type: 'paragraph' });
        editor.commands.setTextSelection(endPos + 1);
        editor.commands.focus();
      }
    } else {
      editor.commands.focus('start');
    }
  }, []);

  const focusTitleEditor = useCallback((position: 'start' | 'end' = 'end') => {
    titleEditorRef.current?.commands.focus(position);
  }, []);

  return (
    <EditorContext.Provider value={{ 
      pageEditorRef, 
      titleEditorRef, 
      setPageEditor, 
      setTitleEditor,
      focusPageEditor,
      focusPageEditorAtEnd,
      focusTitleEditor
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
}
