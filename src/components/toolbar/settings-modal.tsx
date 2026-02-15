import { PaletteIcon, PrinterIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Ripple } from '@/components/ui/ripple';
import { ThemePreference, useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/tiptap-utils';
import { PrintScope } from '@/utils/print';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printScope: PrintScope;
  onScopeChange: (scope: PrintScope) => void;
  printableCount: number;
  isPrinting: boolean;
  hasActiveFile: boolean;
  onPrint: () => void;
}

export function SettingsModal({
  open,
  onOpenChange,
  printScope,
  onScopeChange,
  printableCount,
  isPrinting,
  hasActiveFile,
  onPrint,
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<'export' | 'appearance'>('export');

  useEffect(() => {
    if (!open) {
      setActiveSection('export');
    }
  }, [open]);

  const scopeOptions: Array<{
    value: PrintScope;
    title: string;
    subtitle: string;
    disabled?: boolean;
  }> = [
    { value: 'current', title: 'current file', subtitle: 'export only this file', disabled: !hasActiveFile },
    { value: 'branch', title: 'current + children', subtitle: 'export this file and nested files', disabled: !hasActiveFile },
    { value: 'space', title: 'whole space', subtitle: 'export every file in the space', disabled: printableCount === 0 },
  ];

  const appearanceOptions: Array<{
    value: ThemePreference;
    title: string;
    subtitle: string;
  }> = [
    { value: 'dark', title: 'dark', subtitle: 'always use dark mode' },
    { value: 'light', title: 'light', subtitle: 'always use light mode' },
    { value: 'system', title: 'system', subtitle: 'follow your device setting' },
  ];


  const sections: Array<{
    id: 'export' | 'appearance';
    label: string;
    icon: ComponentType<{ size?: number }>;
  }> = [
    { id: 'export', label: 'export', icon: PrinterIcon },
    { id: 'appearance', label: 'appearance', icon: PaletteIcon },
  ];

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      showKeyboardHints={false}
      showClose={false}
      className={cn(
        'w-[min(92vw,1040px)] md:w-[min(54vw,1040px)] max-w-none p-0',
        'h-[74vh] overflow-hidden',
        'border-modal-surface-border/70 ring-modal-surface-border/70',
      )}
      backdropClassName="bg-sidebar/50"
    >
      <div className="grid h-full min-h-0 select-none grid-cols-1 md:grid-cols-[216px_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-sidebar-container-border/80 bg-sidebar-container-bg p-3 md:border-b-0 md:border-r">
          <p className="mb-3.5 px-2 font-sans text-[11px] font-medium tracking-wide text-sidebar-foreground/50">
            settings
          </p>
          <div className="space-y-0.5">
            {sections.map((section) => {
              const selected = activeSection === section.id;
              const Icon = section.icon;

              return (
                <div
                  key={section.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => setActiveSection(section.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveSection(section.id);
                    }
                  }}
                  className={cn(
                    'relative overflow-hidden group/space flex items-center gap-2 w-full min-w-0 rounded-xl border px-3 py-1.5 text-[0.84rem] font-normal text-left leading-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-ring',
                    selected
                      ? 'bg-sidebar-item-hover-bg/80 text-foreground border-border-elevated'
                      : 'bg-transparent border-transparent text-sidebar-foreground/90 hover:text-foreground hover:bg-sidebar-item-hover-bg/45',
                  )}
                >
                  <Icon size={12} />
                  <span className="truncate select-none font-sans-serif text-inherit">{section.label}</span>
                  <Ripple
                    duration={1200}
                    color="color-mix(in srgb, var(--sidebar-item-hover-bg) 85%, transparent)"
                  />
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <header className="flex items-center justify-between border-b border-modal-surface-border/70 px-5 py-3">
            <h2 className="font-sans-serif text-[1.18rem] font-medium leading-tight tracking-tight text-modal-surface-foreground">
              {activeSection}
            </h2>
            <button
              type="button"
              aria-label="Close modal"
              onClick={() => onOpenChange(false)}
              className="inline-flex size-8 items-center justify-center rounded-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-icon-hover-bg transition-colors"
            >
              <X size={16} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {activeSection === 'export' ? (
              <div className="space-y-4">
                <div className="max-w-135 px-3.5">
                  <p className="whitespace-nowrap text-right font-sans text-[0.82rem] font-medium tracking-[0.02em] text-modal-surface-foreground/92">
                    export scope
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="max-w-135 overflow-hidden rounded-xl border border-modal-surface-border/55 bg-sidebar-container-bg">
                    {scopeOptions.map((option, index) => {
                      const selected = printScope === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={option.disabled}
                          onClick={() => onScopeChange(option.value)}
                          className={cn(
                            'group relative flex w-full items-start justify-between gap-3 overflow-hidden text-left',
                            'px-3.5 py-2.5 transition-colors duration-100',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-ring',
                            selected
                              ? 'bg-sidebar-item-hover-bg/55 text-modal-surface-foreground'
                              : 'bg-transparent text-modal-surface-foreground/80 hover:bg-sidebar-item-hover-bg/30',
                            option.disabled && 'cursor-not-allowed opacity-45',
                          )}
                        >
                          <div className="relative z-10 min-w-0 space-y-0.5">
                            <p className="font-sans-serif text-[0.84rem] font-medium leading-tight">{option.title}</p>
                            <p className="font-sans text-[0.72rem] leading-snug text-modal-surface-foreground/58">
                              {option.subtitle}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border',
                              selected
                                ? 'border-2 border-sidebar-border/70 bg-sidebar-item-hover-bg/60 text-modal-surface-foreground/85'
                                : 'border-modal-surface-border/55 text-transparent',
                            )}
                          >
                            {selected ? <span className="size-2 rounded-full bg-modal-surface-foreground/68" /> : null}
                          </span>
                          <Ripple
                            duration={1200}
                            color="color-mix(in srgb, var(--sidebar-item-hover-bg) 85%, transparent)"
                          />
                          {index < scopeOptions.length - 1 ? (
                            <span className="pointer-events-none absolute right-3 left-3 bottom-0 h-px bg-modal-surface-border/45" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-w-135 px-3.5">
                  <p className="whitespace-nowrap text-right font-sans text-[0.82rem] font-medium tracking-[0.02em] text-modal-surface-foreground/92">
                    color theme
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="max-w-135 overflow-hidden rounded-xl border border-modal-surface-border/55 bg-sidebar-container-bg">
                    {appearanceOptions.map((option, index) => {
                      const selected = theme === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTheme(option.value)}
                          className={cn(
                            'group relative flex w-full items-start justify-between gap-3 overflow-hidden text-left',
                            'px-3.5 py-2.5 transition-colors duration-100',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-ring',
                            selected
                              ? 'bg-sidebar-item-hover-bg/55 text-modal-surface-foreground'
                              : 'bg-transparent text-modal-surface-foreground/80 hover:bg-sidebar-item-hover-bg/30',
                          )}
                        >
                          <div className="relative z-10 min-w-0 space-y-0.5">
                            <p className="font-sans-serif text-[0.84rem] font-medium leading-tight">{option.title}</p>
                            <p className="font-sans text-[0.72rem] leading-snug text-modal-surface-foreground/58">
                              {option.subtitle}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border',
                              selected
                                ? 'border-2 border-sidebar-border/70 bg-sidebar-item-hover-bg/60 text-modal-surface-foreground/85'
                                : 'border-modal-surface-border/55 text-transparent',
                            )}
                          >
                            {selected ? <span className="size-2 rounded-full bg-modal-surface-foreground/68" /> : null}
                          </span>
                          <Ripple
                            duration={1200}
                            color="color-mix(in srgb, var(--sidebar-item-hover-bg) 85%, transparent)"
                          />
                          {index < appearanceOptions.length - 1 ? (
                            <span className="pointer-events-none absolute right-3 left-3 bottom-0 h-px bg-modal-surface-border/45" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>

          {activeSection === 'export' ? (
            <footer className="flex items-center justify-between gap-4 border-t border-modal-surface-border/70 px-5 py-3">
              <p className="font-sans text-xs italic text-modal-surface-foreground/60">
                {printableCount ? `${printableCount} file${printableCount === 1 ? '' : 's'} ready` : 'pick what to export'}
              </p>
              <Button
                onClick={onPrint}
                variant="outline"
                size="lg"
                disabled={isPrinting || printableCount === 0 || (!hasActiveFile && printScope !== 'space')}
                className={cn(
                  'cursor-pointer relative overflow-hidden justify-start gap-2 px-3 py-2 text-sm font-semibold',
                  'text-sidebar-foreground bg-sidebar-item-hover-bg/60 border-2 border-sidebar-border/70 hover:bg-sidebar-item-hover-bg/80',
                  'transition-all duration-200 w-fit',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <span className="relative z-10 inline-flex items-center gap-2 font-sans-serif">
                  {isPrinting ? 'preparing export...' : 'export'}
                </span>
                <Ripple
                  duration={1200}
                  color="color-mix(in srgb, var(--sidebar-item-hover-bg) 82%, transparent)"
                />
              </Button>
            </footer>
          ) : (
            <footer className="flex items-center justify-between gap-4 border-t border-modal-surface-border/70 px-5 py-3">
              <p className="font-sans text-xs italic text-modal-surface-foreground/60">
                we will remember your preference
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                size="lg"
                className={cn(
                  'cursor-pointer relative overflow-hidden justify-start gap-2 px-3 py-2 text-sm font-semibold',
                  'text-sidebar-foreground bg-sidebar-item-hover-bg/60 border-2 border-sidebar-border/70 hover:bg-sidebar-item-hover-bg/80',
                  'transition-all duration-200 w-fit',
                )}
              >
                <span className="relative z-10 inline-flex items-center gap-2 font-sans-serif">
                  done
                </span>
                <Ripple
                  duration={1200}
                  color="color-mix(in srgb, var(--sidebar-item-hover-bg) 82%, transparent)"
                />
              </Button>
            </footer>
          )}
        </section>
      </div>
    </Modal>
  );
}
