import { useCallback, useRef, useState } from 'react';
import { highlightSearchTerm } from 'highlight-search-term';

type UseEditorSearchOptions = {
  containerRef: React.RefObject<HTMLElement | null>;
  selector?: string;
};

type UseEditorSearchResult = {
  isOpen: boolean;
  query: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  matchesCount: number;
  activeIndex: number;
  openSearch: () => void;
  closeSearch: () => void;
  updateQuery: (value: string) => void;
  runSearch: (value: string) => void;
  goToNext: () => void;
  goToPrev: () => void;
};

/**
 * Provides search within the editor content using the CSS Custom Highlight API.
 * Scopes the search to the given selector, supports navigation, and auto-scrolls the active match.
 */
export function useEditorSearch({
  containerRef,
  selector = '.ProseMirror',
}: UseEditorSearchOptions): UseEditorSearchResult {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [matchesCount, setMatchesCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const matchRangesRef = useRef<Range[]>([]);

  const clearHighlights = useCallback(() => {
    const highlights = (CSS as any)?.highlights;
    highlights?.delete?.('search');
    highlights?.delete?.('search-active');
    matchRangesRef.current = [];
    setMatchesCount(0);
    setActiveIndex(-1);
  }, []);

  const scrollRangeIntoView = useCallback(
    (range: Range | null | undefined) => {
      if (!range) return;
      const baseRect =
        typeof range.getBoundingClientRect === 'function'
          ? range.getBoundingClientRect()
          : null;
      const rect =
        baseRect && (baseRect.width || baseRect.height)
          ? baseRect
          : Array.from(range.getClientRects())[0];

      if (!rect) return;

      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const targetTop = rect.top - containerRect.top + container.scrollTop;
        const targetBottom = rect.bottom - containerRect.top + container.scrollTop;

        const viewTop = container.scrollTop;
        const viewBottom = viewTop + container.clientHeight;
        const offsetTop = Math.max(targetTop - container.clientHeight * 0.25, 0);

        if (targetTop < viewTop || targetBottom > viewBottom) {
          container.scrollTo({
            top: offsetTop,
            behavior: 'smooth',
          });
        }
      } else {
        const offsetTop = rect.top - window.innerHeight * 0.25;
        window.scrollBy({
          top: offsetTop,
          behavior: 'smooth',
        });
      }
    },
    [containerRef]
  );

  const applyActiveIndex = useCallback(
    (nextIndex: number) => {
      const ranges = matchRangesRef.current;
      const highlights = (CSS as any)?.highlights;

      if (!ranges.length || nextIndex < 0 || !highlights?.set) {
        highlights?.delete?.('search-active');
        setActiveIndex(-1);
        return;
      }

      const normalizedIndex = ((nextIndex % ranges.length) + ranges.length) % ranges.length;
      const range = ranges[normalizedIndex];
      highlights.delete?.('search-active');
      highlights.set('search-active', new Highlight(range));
      setActiveIndex(normalizedIndex);
      scrollRangeIntoView(range);
    },
    [scrollRangeIntoView]
  );

  const runSearch = useCallback(
    (value: string) => {
      setQuery(value);

      const trimmed = value.trim();
      if (!trimmed) {
        clearHighlights();
        return;
      }

      try {
        highlightSearchTerm({
          search: trimmed,
          selector,
          customHighlightName: 'search',
        });

        const highlightCollection = (CSS as any)?.highlights?.get?.('search');
        const ranges = highlightCollection
          ? Array.from(highlightCollection.values ? highlightCollection.values() : highlightCollection)
          : [];

        matchRangesRef.current = ranges;
        setMatchesCount(ranges.length);

        if (ranges.length > 0) {
          applyActiveIndex(0);
        } else {
          (CSS as any)?.highlights?.delete?.('search-active');
          setActiveIndex(-1);
        }
      } catch (error) {
        console.warn('Search highlight failed:', error);
      }
    },
    [selector, applyActiveIndex, clearHighlights]
  );

  const openSearch = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    clearHighlights();
  }, [clearHighlights]);

  const updateQuery = useCallback(
    (value: string) => {
      runSearch(value);
    },
    [runSearch]
  );

  const goToNext = useCallback(() => {
    const total = matchRangesRef.current.length;
    if (!total) return;
    const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % total : 0;
    applyActiveIndex(nextIndex);
  }, [activeIndex, applyActiveIndex]);

  const goToPrev = useCallback(() => {
    const total = matchRangesRef.current.length;
    if (!total) return;
    const prevIndex = activeIndex >= 0 ? (activeIndex - 1 + total) % total : total - 1;
    applyActiveIndex(prevIndex);
  }, [activeIndex, applyActiveIndex]);

  return {
    isOpen,
    query,
    inputRef,
    matchesCount,
    activeIndex,
    openSearch,
    closeSearch,
    updateQuery,
    runSearch,
    goToNext,
    goToPrev,
  };
}

