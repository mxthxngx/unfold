import { memo } from 'react';
import { PiSidebarSimple } from 'react-icons/pi';
import { motion } from 'motion/react';
import { FileBreadcrumbs } from '@/components/breadcrumbs/breadcrumbs';
import { cn } from '@/lib/tiptap-utils';

interface ToolbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Toolbar = memo(function Toolbar({ onToggleSidebar }: ToolbarProps) {

  return (
    <div
      className={cn(
        'h-10 border-b border-border',
        'bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60',
        'flex items-center justify-between',
        'text-sm select-none',
        'pl-24 pr-4',
        'relative'
      )}
    >
      <div 
        className="absolute inset-0" 
        data-tauri-drag-region
      />
      
      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10" data-tauri-drag-region>
        <motion.button 
          onClick={onToggleSidebar}
          className={cn(
            'flex items-center justify-center p-1.5',
            'transition-all duration-200',
            'hover:opacity-70',
            'text-sidebar-foreground',
            'relative z-20'
          )}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Toggle sidebar"
        >
          <PiSidebarSimple size={18} />
        </motion.button>

        <div className="flex-1 min-w-0 relative z-10"  data-tauri-drag-region>
          <FileBreadcrumbs />
        </div>
      </div>

      <div className="flex items-center text-foreground-muted text-xs relative z-10"  data-tauri-drag-region>
        Last Edited on
      </div>
    </div>
  );
});

