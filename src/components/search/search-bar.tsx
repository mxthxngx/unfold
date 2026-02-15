import { X, Search as SearchIcon, ChevronUp, ChevronDown, CaseSensitive, Replace } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import type { Node } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { cn } from '@/lib/utils';
import { useEditorContext } from '@/contexts/EditorContext';

/** Get the word at the given position in the document (for pre-filling find with word under cursor). */
function getWordAtPosition(doc: Node, pos: number): string {
  let start = pos;
  let end = pos;
  let found = false;
  doc.nodesBetween(pos, pos + 1, (node, from) => {
    if (found) return false;
    if (node.isText && node.text != null) {
      const text = node.text;
      const offset = pos - from;
      let s = offset;
      while (s > 0 && /\w/.test(text[s - 1] ?? '')) s--;
      start = from + s;
      let e = offset;
      while (e < text.length && /\w/.test(text[e] ?? '')) e++;
      end = from + e;
      found = true;
      return false;
    }
  });
  return !found ? '' : doc.textBetween(start, end);
}

interface SearchResultRange {
  from: number;
  to: number;
}

interface SearchStorageState {
  results?: SearchResultRange[];
  resultIndex?: number;
}

function getSearchStorage(editor: Editor | null | undefined): SearchStorageState {
  if (!editor) {
    return {};
  }

  return (editor.storage as { searchAndReplace?: SearchStorageState }).searchAndReplace ?? {};
}

export const SearchBar = React.forwardRef<HTMLDivElement>(function SearchBar(
  _props,
  ref
) {
  const shortcut = getShortcutDisplay(KEYBOARD_SHORTCUTS.FIND_IN_PAGE);
  const { pageEditorRef } = useEditorContext();
  const editor = pageEditorRef.current;

  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const shouldFocusClosestOnOpenRef = useRef(false);
  const openCursorPosRef = useRef<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const searchState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx?.editor) return { matchesCount: 0, activeIndex: -1 };
      const storage = getSearchStorage(ctx.editor);
      return {
        matchesCount: storage?.results?.length || 0,
        activeIndex: storage?.resultIndex ?? -1,
      };
    },
  });
  const matchesCount = searchState?.matchesCount ?? 0;
  const activeIndex = searchState?.activeIndex ?? -1;
  
  const hasMatches = matchesCount > 0;
  const activeDisplay = hasMatches && activeIndex >= 0 ? activeIndex + 1 : 0;

  const searchInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const replaceInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceText(event.target.value);
  };

  const closeDialog = () => {
    shouldFocusClosestOnOpenRef.current = false;
    setSearchText('');
    setReplaceText('');
    setIsOpen(false);
    if (showReplace) {
      setShowReplace(false);
    }
    if (editor) {
      editor.commands.setSearchTerm('');
    }
  };

  const focusActiveResult = () => {
    const editorToUse = pageEditorRef.current ?? editor;
    if (!editorToUse) return;

    const storage = getSearchStorage(editorToUse);
    const results = storage?.results ?? [];
    const resultIndex = storage?.resultIndex ?? -1;
    const position = results[resultIndex];

    if (!position) return;

    const { state, view } = editorToUse;
    const selection = TextSelection.create(state.doc, position.from, position.to);
    const tr = state.tr.setSelection(selection).scrollIntoView();
    view.dispatch(tr);
    if (view.dom.isConnected && !view.hasFocus()) {
      const { node } = view.domAtPos(position.from);
      const el = (node.nodeType === 3 ? node.parentNode : node) as HTMLElement | null; 
      if (el?.scrollIntoView) {
        el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      }
    }
  };

  const focusClosestResultToCursor = () => {
    const editorRef = pageEditorRef.current;
    if (!editorRef) return;
    const storage = getSearchStorage(editorRef);
    const results = storage?.results ?? [];
    if (!results.length) return;
    const cursorPos = openCursorPosRef.current ?? editorRef.state.selection.from;
    let closestIndex = 0;
    let closestDistance = Math.abs(results[0].from - cursorPos);
    for (let i = 1; i < results.length; i++) {
      const distance = Math.abs(results[i].from - cursorPos);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
    editorRef.commands.setResultIndex(closestIndex);
    editorRef.commands.selectCurrentItem();
    focusActiveResult();
  };

  const next = () => {
    if (!editor) return;
    shouldFocusClosestOnOpenRef.current = false;
    editor.commands.nextSearchResult();
    focusActiveResult();
  };

  const previous = () => {
    if (!editor) return;
    shouldFocusClosestOnOpenRef.current = false;
    editor.commands.previousSearchResult();
    focusActiveResult();
  };

  const replace = () => {
    if (!editor) return;
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replace();
    focusActiveResult();
  };

  const replaceAll = () => {
    if (!editor) return;
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replaceAll();
  };

  const toggleCaseSensitive = () => {
    setCaseSensitive(!caseSensitive);
  };

  const toggleReplace = () => {
    setShowReplace(!showReplace);
    if (!showReplace) {
      setTimeout(() => replaceInputRef.current?.focus(), 50);
    }
  };

  useEffect(() => {
    if (!editor) return;
    editor.commands.setSearchTerm(searchText);
    const skipReset = shouldFocusClosestOnOpenRef.current && searchText.trim().length > 0;
    if (!skipReset) {
      editor.commands.resetIndex();
      editor.commands.selectCurrentItem();
      focusActiveResult();
    }
    const willFocusClosest = shouldFocusClosestOnOpenRef.current && searchText.trim() && matchesCount > 0;
    if (willFocusClosest) {
      focusClosestResultToCursor();
    }
  }, [searchText, editor]);

  useEffect(() => {
    if (!shouldFocusClosestOnOpenRef.current) return;
    if (!editor) return;
    if (!searchText.trim() || matchesCount === 0) return;
    focusClosestResultToCursor();
  }, [matchesCount, searchText, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setCaseSensitive(caseSensitive);
    editor.commands.resetIndex();
    editor.commands.selectCurrentItem();
    focusActiveResult();
  }, [caseSensitive, editor]);

  const handleOpenEvent = (event?: Event) => {
    const editorInHandler = pageEditorRef.current;
    const detail = (event as CustomEvent<{ cursorPos?: number | null }>)?.detail;
    const cursorPos = detail?.cursorPos ?? editorInHandler?.state.selection.from ?? null;
    setIsOpen(true);
    shouldFocusClosestOnOpenRef.current = true;
    openCursorPosRef.current = cursorPos;

    if (editorInHandler) {
      const selectedText = editorInHandler.state.doc.textBetween(
        editorInHandler.state.selection.from,
        editorInHandler.state.selection.to,
      );
      if (selectedText !== '') {
        setSearchText(selectedText);
      } else if (cursorPos != null) {
        const wordAtCursor = getWordAtPosition(editorInHandler.state.doc, cursorPos);
        if (wordAtCursor) {
          setSearchText(wordAtCursor);
        }
      }
    }

    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleCloseEvent = () => {
    closeDialog();
  };

  // Listen for editor events
  useEffect(() => {
    document.addEventListener('openFindDialogFromEditor', handleOpenEvent);
    document.addEventListener('closeFindDialogFromEditor', handleCloseEvent);

    return () => {
      document.removeEventListener('openFindDialogFromEditor', handleOpenEvent);
      document.removeEventListener('closeFindDialogFromEditor', handleCloseEvent);
    };
  }, [editor]);



  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-none fixed right-4 z-40 transition-transform duration-200',
        'top-14',
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      )}
    >
      <div
        className={cn(
          'pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-border',
          'bg-card/95 backdrop-blur-xl p-2 shadow-search',
          'min-w-[320px] w-[520px] max-w-[calc(100vw-2rem)]'
        )}
      >
        {/* Search Row */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <SearchIcon size={14} className="text-muted-foreground/70" />
            <input
              ref={inputRef}
              value={searchText}
              placeholder="Find in page..."
              onChange={searchInputEvent}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) {
                    previous();
                  } else {
                    next();
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  closeDialog();
                } else if (e.altKey && e.key.toLowerCase() === 'c') {
                  e.preventDefault();
                  toggleCaseSensitive();
                } else if (e.altKey && e.key.toLowerCase() === 'r') {
                  e.preventDefault();
                  toggleReplace();
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className={cn(
                'bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60',
                'focus:outline-none w-full'
              )}
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <span className="min-w-[46px] text-center tabular-nums font-medium text-foreground/85">
              {searchText.trim() ? (
                hasMatches ? `${activeDisplay}/${matchesCount}` : 'No results'
              ) : ''}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={previous}
              disabled={!hasMatches}
              title="Previous match (Shift+Enter)"
              className={cn(
                'inline-flex items-center justify-center rounded-md size-7 transition border border-border/60',
                'bg-muted/50 hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed'
              )}
              aria-label="Previous match"
            >
              <ChevronUp size={14} />
            </button>
            
            <button
              type="button"
              onClick={next}
              disabled={!hasMatches}
              title="Next match (Enter)"
              className={cn(
                'inline-flex items-center justify-center rounded-md size-7 transition border border-border/60',
                'bg-muted/50 hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed'
              )}
              aria-label="Next match"
            >
              <ChevronDown size={14} />
            </button>

            <button
              type="button"
              onClick={toggleCaseSensitive}
              title="Match case (Alt+C)"
              className={cn(
                'inline-flex items-center justify-center rounded-md size-7 transition border border-border/60',
                caseSensitive
                  ? 'bg-highlight-vivid/20 border-highlight-vivid/50 text-highlight-vivid'
                  : 'bg-muted/50 hover:bg-muted/80 text-muted-foreground/70'
              )}
              aria-label="Toggle case sensitive"
            >
              <CaseSensitive size={14} />
            </button>

            <button
              type="button"
              onClick={toggleReplace}
              title="Replace (Alt+R)"
              className={cn(
                'inline-flex items-center justify-center rounded-md size-7 transition border border-border/60',
                showReplace
                  ? 'bg-highlight-vivid/20 border-highlight-vivid/50 text-highlight-vivid'
                  : 'bg-muted/50 hover:bg-muted/80 text-muted-foreground/70'
              )}
              aria-label="Toggle replace"
            >
              <Replace size={14} />
            </button>

            <button
              type="button"
              onClick={closeDialog}
              title={`Close (${shortcut})`}
              className={cn(
                'inline-flex items-center justify-center rounded-md',
                'size-7 text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition'
              )}
              aria-label="Close search"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Replace Row */}
        {showReplace && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/70">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Replace size={14} className="text-muted-foreground/70" />
              <input
                ref={replaceInputRef}
                value={replaceText}
                placeholder="Replace with..."
                onChange={replaceInputEvent}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.ctrlKey || e.metaKey) {
                      replaceAll();
                    } else {
                      replace();
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowReplace(false);
                  } else if (e.altKey && e.key.toLowerCase() === 'c') {
                    e.preventDefault();
                    toggleCaseSensitive();
                  } else if (e.altKey && e.key.toLowerCase() === 'r') {
                    e.preventDefault();
                    toggleReplace();
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className={cn(
                  'bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60',
                  'focus:outline-none w-full'
                )}
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={replace}
                disabled={!hasMatches || !replaceText}
                title="Replace (Enter)"
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition border border-border/60',
                  'bg-muted/50 hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed',
                  'font-medium text-foreground/90'
                )}
              >
                Replace
              </button>
              
              <button
                type="button"
                onClick={replaceAll}
                disabled={!hasMatches || !replaceText}
                title="Replace All (Cmd/Ctrl+Enter)"
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition border border-border/60',
                  'bg-muted/50 hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed',
                  'font-medium text-foreground/90 whitespace-nowrap'
                )}
              >
                Replace All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
