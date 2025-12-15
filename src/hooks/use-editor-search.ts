import { useState, useCallback, useRef } from "react";

export function useEditorSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openSearch = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
  }, []);

  return {
    isOpen,
    query,
    inputRef,
    matchesCount: 0,
    activeIndex: -1,
    openSearch,
    closeSearch,
    updateQuery,
    goToNext: () => {},
    goToPrev: () => {},
  };
}