import { memo, useEffect, useState } from 'react';
import { PanelLeftIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { FileBreadcrumbs } from '@/components/breadcrumbs/breadcrumbs';
import { cn } from '@/lib/tiptap-utils';
import { Ripple } from '@/components/ui/ripple';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipTrigger, AppTooltipContent } from '@/components/ui/tooltip';

export const Toolbar = memo(function Toolbar() {
  const { toggleSidebar } = useSidebar();
  const toggleSidebarShortcut = getShortcutDisplay(KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR);



  return (
    <div
      className={cn(
        'h-10 border-b border-border',
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

      <div className="flex items-center text-sidebar-foreground/50 text-xs relative z-10 font-light"  data-tauri-drag-region>
        Last Edited on
      </div>
    </div>
  );
});

