import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { PanelLeftIcon, SlidersHorizontalIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { FileBreadcrumbs } from '@/components/breadcrumbs/breadcrumbs';
import { cn } from '@/lib/tiptap-utils';
import { Ripple } from '@/components/ui/ripple';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipTrigger, AppTooltipContent } from '@/components/ui/tooltip';
import { SettingsModal } from '@/components/toolbar/settings-modal';
import { useParams } from '@tanstack/react-router';
import { useFileSystem } from '@/contexts/FileSystemContext';
import {
  PrintScope,
  exportRichContent,
  selectPrintableNodes,
} from '@/utils/print';

function parseNodeTimestamp(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.includes('T')
    ? value
    : `${value.replace(' ', 'T')}Z`;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRelativeTime(timestamp: Date, nowMs: number): string {
  const diffMs = timestamp.getTime() - nowMs;
  const absMs = Math.abs(diffMs);

  if (absMs < 45_000) {
    return 'just now';
  }

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;

  if (absMs < hour) {
    return rtf.format(Math.round(diffMs / minute), 'minute');
  }

  if (absMs < day) {
    return rtf.format(Math.round(diffMs / hour), 'hour');
  }

  return rtf.format(Math.round(diffMs / day), 'day');
}

export const Toolbar = memo(function Toolbar() {
  const { toggleSidebar } = useSidebar();
  const toggleSidebarShortcut = getShortcutDisplay(KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR);
  const { fileId } = useParams({ strict: false });
  const { fileTree, getNode, spaceName } = useFileSystem();

  const [printScope, setPrintScope] = useState<PrintScope>('current');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const hasActiveFile = Boolean(fileId);

  useEffect(() => {
    if (!hasActiveFile && printScope !== 'space') {
      setPrintScope('space');
    }
  }, [hasActiveFile, printScope]);

  const printableCount = useMemo(() => {
    const nodes = selectPrintableNodes(printScope, fileId, fileTree, getNode);
    return nodes.length;
  }, [fileId, fileTree, getNode, printScope]);

  const handlePrint = useCallback(async () => {
    try {
      setIsPrinting(true);
      const nodes = selectPrintableNodes(printScope, fileId, fileTree, getNode);
      if (!nodes.length) {
        return;
      }
      const currentNode = fileId ? getNode(fileId) : null;
      const currentName = currentNode?.name?.trim() || 'new page';
      const scopedTitle = printScope === 'space'
        ? (spaceName || 'Space')
        : currentName;
      await exportRichContent(nodes, scopedTitle);
    } catch (error) {
      console.error('[toolbar:print]', error);
    } finally {
      setIsPrinting(false);
    }
  }, [fileId, fileTree, getNode, printScope, spaceName]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeNode = fileId ? getNode(fileId) : null;
  const editedDate = parseNodeTimestamp(activeNode?.updatedAt ?? activeNode?.createdAt);
  const relativeText = editedDate ? formatRelativeTime(editedDate, nowMs) : null;
  const absoluteText = editedDate
    ? editedDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div
      className={cn(
        'h-10',
        'bg-background',
        'flex items-center justify-between',
        'text-xs select-none',
        'pl-24 pr-4',
        'relative'
      )}
      data-tauri-drag-region
    >
      <div 
        className="absolute inset-0" 
        data-tauri-drag-region
      />
      
      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10" data-tauri-drag-region>
        <Tooltip delayDuration={120}>
          <TooltipTrigger asChild>
            <motion.button 
              onClick={toggleSidebar}
              className={cn(
                'relative z-20 flex items-center justify-center size-7 overflow-hidden',
                'rounded-full bg-transparent text-sidebar-foreground',
                'transition-all duration-200 hover:bg-sidebar-item-hover-bg/80 active:scale-95'
              )}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Toggle sidebar"
              data-tauri-drag-region="false"
            >
              <PanelLeftIcon size={15} strokeWidth={2.2} />
              <Ripple />
            </motion.button>
          </TooltipTrigger>
          <AppTooltipContent label="Toggle sidebar" shortcut={toggleSidebarShortcut} />
        </Tooltip>

        <div className="flex-1 min-w-0 relative z-10"  data-tauri-drag-region>
          <FileBreadcrumbs />
        </div>
      </div>

      <div className="flex items-center text-sidebar-foreground/50 text-xs relative z-10 font-light" data-tauri-drag-region>
        {relativeText && (
          <span
            className="mr-2 text-sidebar-foreground/60"
            title={absoluteText ?? undefined}
          >
            last edited {relativeText}
          </span>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          onClick={() => setIsSettingsOpen(true)}
          className={cn(
            'sidebar-icon-button relative ml-2 size-5 rounded-md flex items-center justify-center overflow-hidden',
            'text-sidebar-foreground hover:text-foreground',
            'hover:bg-sidebar-icon-hover-bg/70 active:scale-95'
          )}
          aria-label="Workspace menu"
          data-tauri-drag-region="false"
        >
          <SlidersHorizontalIcon size={14} strokeWidth={2.2} />
          <Ripple />
        </motion.button>

        <SettingsModal
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          printScope={printScope}
          onScopeChange={setPrintScope}
          printableCount={printableCount}
          isPrinting={isPrinting}
          hasActiveFile={hasActiveFile}
          onPrint={handlePrint}
        />

      </div>
    </div>
  );
});
