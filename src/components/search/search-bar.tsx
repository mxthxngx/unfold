import { X, Search as SearchIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { cn } from '@/lib/utils';

type SearchBarProps = {
  isOpen: boolean;
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  matchesCount: number;
  activeIndex: number;
  placeholder?: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
};

export const SearchBar = forwardRef<HTMLDivElement, SearchBarProps>(function SearchBar(
  {
    isOpen,
    value,
    matchesCount,
    activeIndex,
    placeholder = 'curious about...',
    inputRef,
    onChange,
    onNext,
    onPrev,
    onClose,
  },
  ref
) {
  const shortcut = getShortcutDisplay(KEYBOARD_SHORTCUTS.FIND_IN_PAGE);
  const hasMatches = matchesCount > 0;
  const activeDisplay = hasMatches && activeIndex >= 0 ? activeIndex + 1 : 0;

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
          'pointer-events-auto flex items-center gap-2 rounded-full border border-border/70',
          'bg-card/95 backdrop-blur-xl px-3 py-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]'
        )}
      >
        <SearchIcon size={14} className="text-muted-foreground/70" />
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onNext();
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
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
          <span className="px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/60 leading-none">
            {shortcut}
          </span>
          <span className="hidden sm:inline text-muted-foreground/60">to open</span>
        </div>
        <div className="flex items-center gap-2 pl-1 pr-1 text-xs text-muted-foreground/70">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasMatches}
            className={cn(
              'inline-flex items-center justify-center rounded-full size-7 transition border border-border/80',
              'bg-muted/70 hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed'
            )}
            aria-label="Previous match"
          >
            <ChevronUp size={14} />
          </button>
          <div className="min-w-[46px] text-center tabular-nums font-medium text-foreground/85">
            {activeDisplay}/{matchesCount}
          </div>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasMatches}
            className={cn(
              'inline-flex items-center justify-center rounded-full size-7 transition border border-border/80',
              'bg-muted/70 hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed'
            )}
            aria-label="Next match"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'size-7 text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition'
          )}
          aria-label="Close search"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
});

