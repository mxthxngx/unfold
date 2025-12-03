import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';

interface EditorContextType {
  editorRef: React.MutableRefObject<Editor | null>;
  setEditor: (editor: Editor | null) => void;
  focusEditor: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const editorRef = useRef<Editor | null>(null);

  const setEditor = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
  }, []);

  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      const { doc } = editorRef.current.state;
      const docText = doc.textContent.trim();
      const isEmpty = !docText && doc.childCount === 1 && doc.firstChild?.textContent === '';
      
      if (isEmpty) {
        editorRef.current.commands.focus('start');
      }
    }
  }, []);

  return (
    <EditorContext.Provider value={{ editorRef, setEditor, focusEditor }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within a EditorProvider');
  }
  return context;
}
