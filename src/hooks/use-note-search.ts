import { useState, useCallback } from 'react';
import * as db from '@/services/database';
import type { SearchResult } from '@/types/database';

export type SearchScope = 'global' | 'space' | 'node';

interface UseNoteSearchOptions {
  debounceMs?: number;
}

interface UseNoteSearchReturn {
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
  search: (query: string, scope: SearchScope, scopeId?: string) => Promise<void>;
  clearResults: () => void;
}

/**
 * Hook for searching notes across the database using FTS5 full-text search.
 * 
 * @param options - Configuration options
 * @returns Search state and functions
 * 
 * @example
 * ```tsx
 * const { results, isSearching, search, clearResults } = useNoteSearch();
 * 
 * // Global search
 * await search('typescript react', 'global');
 * 
 * // Search within a space
 * await search('hooks', 'space', spaceId);
 * 
 * // Search within a node and its children
 * await search('useState', 'node', nodeId);
 * ```
 */
export function useNoteSearch(_options: UseNoteSearchOptions = {}): UseNoteSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string, scope: SearchScope, scopeId?: string) => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setResults([]);
        setError(null);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        let searchResults: SearchResult[];

        // FTS5 query syntax: wrap in quotes for phrase search, use * for prefix
        // For simple searches, we'll do a prefix search on each word
        const ftsQuery = trimmedQuery
          .split(/\s+/)
          .map((word) => `${word}*`)
          .join(' ');

        switch (scope) {
          case 'space':
            if (!scopeId) {
              throw new Error('Space ID required for space-scoped search');
            }
            // TODO: Implement searchInSpace
            searchResults = [];
            break;

          case 'node':
            if (!scopeId) {
              throw new Error('Node ID required for node-scoped search');
            }
            // TODO: Implement searchInNode
            searchResults = [];
            break;

          case 'global':
          default:
            // TODO: Implement searchGlobal
            searchResults = [];
            break;
        }

        setResults(searchResults);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isSearching,
    error,
    search,
    clearResults,
  };
}

/**
 * Extract plain text from note content for display in search results
 */
export function extractPlainText(content: string, maxLength = 200): string {
  if (!content) return '';

  try {
    // Try parsing as TipTap JSON
    const json = JSON.parse(content);
    const text = extractTextFromTipTapNode(json);
    return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  } catch {
    // Fallback: strip HTML tags for legacy content
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  }
}

function extractTextFromTipTapNode(node: unknown): string {
  if (!node || typeof node !== 'object') return '';

  const n = node as { text?: string; content?: unknown[] };

  if (n.text) return n.text;

  if (n.content && Array.isArray(n.content)) {
    return n.content.map(extractTextFromTipTapNode).join(' ');
  }

  return '';
}
