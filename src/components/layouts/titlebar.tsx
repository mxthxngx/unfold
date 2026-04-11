import * as React from 'react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSidebarStore } from '@/features/sidebar/stores/sidebar-store';
import { useFullscreen } from '@/hooks/use-fullscreen';

interface TitlebarProps {
  sidebarPosition: 'left' | 'right';
}

export function Titlebar({ sidebarPosition }: TitlebarProps) {
  const activeId = useSidebarStore((s) => s.activeNodeId);
  const fullscreen = useFullscreen();
  console.log({ fullscreen });

  return (
    <div className="bg-background sticky top-0 z-10 flex h-8 w-full items-center gap-3 px-1 select-none">
      {!fullscreen && <div className="w-16" />}

      {sidebarPosition === 'left' && <SidebarTrigger />}

      <div
        data-tauri-drag-region
        className="text-muted-foreground flex flex-1 shrink-0 font-mono text-xs"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {activeId ?? ''}
      </div>

      {sidebarPosition === 'right' && <SidebarTrigger />}
    </div>
  );
}
