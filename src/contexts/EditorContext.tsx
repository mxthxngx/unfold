import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';

interface EditorContextType {
  pageEditorRef: React.MutableRefObject<Editor | null>;
  titleEditorRef: React.MutableRefObject<Editor | null>;
  setPageEditor: (editor: Editor | null) => void;
  setTitleEditor: (editor: Editor | null) => void;
  focusPageEditor: (position?: 'start' | 'end') => void;
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
