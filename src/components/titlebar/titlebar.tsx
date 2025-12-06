import { PanelLeftIcon } from 'lucide-react';

import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Ripple } from '@/components/ui/ripple';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

function Titlebar() {
  const { toggleSidebar } = useSidebar();

  return (
    <div
      className="h-10 border-[var(--border)] flex items-center px-3 select-none"
      data-tauri-drag-region
    >
      <button
        onClick={toggleSidebar}
        className={cn(
          'relative z-10 flex items-center justify-center size-8 overflow-hidden',
          'rounded-full text-sidebar-foreground',
          'transition-all duration-150 hover:bg-black/55 active:scale-95'
        )}
        aria-label="Toggle sidebar"
      >
        <AnimatedIcon>
          <PanelLeftIcon size={16} strokeWidth={2.2} />
        </AnimatedIcon>
        <Ripple />
      </button>
    </div>
  );
}

export default Titlebar;
