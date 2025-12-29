import { X, Search as SearchIcon, ChevronUp, ChevronDown, CaseSensitive, Replace } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { cn } from '@/lib/utils';
import { useEditorContext } from '@/contexts/EditorContext';


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
  
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const searchStorage = (editor?.storage as any)?.searchAndReplace;
  const matchesCount = searchStorage?.results?.length || 0;
  const activeIndex = searchStorage?.resultIndex ?? -1;
  
  const hasMatches = matchesCount > 0;
  const activeDisplay = hasMatches && activeIndex >= 0 ? activeIndex + 1 : 0;

  const searchInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const replaceInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceText(event.target.value);
  };

  const closeDialog = () => {
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

  const goToSelection = () => {
    if (!editor) return;

    const { results, resultIndex } = (editor.storage as any).searchAndReplace;
    const position = results[resultIndex];

    if (!position) return;

    editor.commands.setTextSelection(position);

    const element = document.querySelector('.search-result-current');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    editor.commands.setTextSelection(0);
  };

  const next = () => {
    if (!editor) return;
    editor.commands.nextSearchResult();
    goToSelection();
  };

  const previous = () => {
    if (!editor) return;
    editor.commands.previousSearchResult();
    goToSelection();
  };

  const replace = () => {
    if (!editor) return;
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replace();
    goToSelection();
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

  // Effect to update search term in editor
  useEffect(() => {
    if (!editor) return;
    editor.commands.setSearchTerm(searchText);
    editor.commands.resetIndex();
    editor.commands.selectCurrentItem();
  }, [searchText, editor]);

  // Effect to update case sensitivity
  useEffect(() => {
    if (!editor) return;
    editor.commands.setCaseSensitive(caseSensitive);
    editor.commands.resetIndex();
    editor.commands.selectCurrentItem();
    goToSelection();
  }, [caseSensitive, editor]);

  // Handle open event from editor
  const handleOpenEvent = () => {
    setIsOpen(true);
    
    if (editor) {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
      );
      if (selectedText !== '') {
        setSearchText(selectedText);
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
        'pointer-events-none fixed right-4 z-40 transition-all duration-200',
        'top-14',
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      )}
    >
      <div
        className={cn(
          'pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-border',
          'bg-card/95 backdrop-blur-xl p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)]'
        )}
      >
        {/* Search Row */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
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
                'focus:outline-none w-48 sm:w-60'
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
                  ? 'bg-[rgba(167,139,250,0.2)] border-[rgba(167,139,250,0.5)] text-[rgb(167,139,250)]'
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
                  ? 'bg-[rgba(167,139,250,0.2)] border-[rgba(167,139,250,0.5)] text-[rgb(167,139,250)]'
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
            <div className="flex items-center gap-2 flex-1">
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
                  'focus:outline-none w-48 sm:w-60'
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