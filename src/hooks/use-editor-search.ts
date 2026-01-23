import { useState, useCallback, useRef, useEffect } from "react";
import { useEditorContext } from "@/contexts/EditorContext";
import type { Editor } from "@tiptap/react";

interface SearchAndReplaceStorage {
  searchTerm: string;
  replaceTerm: string;
  results: Array<{ from: number; to: number }>;
  resultIndex: number;
  caseSensitive: boolean;
}

function getSearchStorage(editor: Editor | null): SearchAndReplaceStorage | null {
  if (!editor?.storage) return null;
  return (editor.storage as any).searchAndReplace as SearchAndReplaceStorage;
}

export function useEditorSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { pageEditorRef } = useEditorContext();

  const editor = pageEditorRef.current;
  const searchStorage = getSearchStorage(editor);

  const matchesCount = searchStorage?.results?.length || 0;
  const activeIndex = searchStorage?.resultIndex ?? -1;

  const openSearch = useCallback(() => {
    setIsOpen(true);
    
    // Get selected text if any
    if (editor) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      
      if (selectedText && selectedText.trim()) {
        setQuery(selectedText);
        setTimeout(() => {
          editor.commands.setSearchTerm(selectedText);
          editor.commands.resetIndex();
          editor.commands.selectCurrentItem();
        }, 0);
      }
    }
    
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [editor]);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    
    if (editor) {
      editor.commands.setSearchTerm("");
    }
  }, [editor]);

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    
    if (editor) {
      editor.commands.setSearchTerm(value);
      editor.commands.resetIndex();
      
      if (value.trim()) {
        editor.commands.selectCurrentItem();
      }
    }
  }, [editor]);

  const goToNext = useCallback(() => {
    if (editor && matchesCount > 0) {
      editor.commands.nextSearchResult();
      scrollToCurrentResult();
    }
  }, [editor, matchesCount]);

  const goToPrev = useCallback(() => {
    if (editor && matchesCount > 0) {
      editor.commands.previousSearchResult();
      scrollToCurrentResult();
    }
  }, [editor, matchesCount]);

  const toggleCaseSensitive = useCallback(() => {
    const newValue = !caseSensitive;
    setCaseSensitive(newValue);
    
    if (editor) {
      editor.commands.setCaseSensitive(newValue);
      editor.commands.resetIndex();
      
      if (query.trim()) {
        editor.commands.selectCurrentItem();
      }
    }
  }, [editor, caseSensitive, query]);

  const scrollToCurrentResult = useCallback(() => {
    setTimeout(() => {
      const element = document.querySelector(".search-result-current, .search-result-first");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  }, []);

  // Listen for editor events to open search
  useEffect(() => {
    const handleOpenSearch = () => {
      openSearch();
    };

    document.addEventListener("openFindDialogFromEditor", handleOpenSearch);

    return () => {
      document.removeEventListener("openFindDialogFromEditor", handleOpenSearch);
    };
  }, [openSearch]);

  useEffect(() => {
    if (isOpen && activeIndex >= 0 && matchesCount > 0) {
      scrollToCurrentResult();
    }
  }, [activeIndex, isOpen, matchesCount, scrollToCurrentResult]);

  return {
    isOpen,
    query,
    inputRef,
    matchesCount,
    activeIndex,
    caseSensitive,
    openSearch,
    closeSearch,
    updateQuery,
    goToNext,
    goToPrev,
    toggleCaseSensitive,
  };
}