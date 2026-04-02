import * as React from 'react';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppLevelLayout } from '@/config/app-level';
import { SpaceSidebar } from '@/features/sidebar/components/space-sidebar';
import { useSidebarStore } from '@/features/sidebar/stores/sidebar-store';
import { useFullscreen } from '@/hooks/use-fullscreen';

function ActiveFileIdPanel() {
  const activeId = useSidebarStore((s) => s.activeNodeId);
  return (
    <div className="text-muted-foreground border-border mb-3 shrink-0 border-b pb-2 font-mono text-xs">
      {activeId ?? '—'}
    </div>
  );
}

export function SpaceLayout({ children }: { children: React.ReactNode }) {
  const fullScreen = useFullscreen();

  const trafficLightHeight = `${AppLevelLayout.trafficLights.heightRem}rem`;
  const trafficLightWidth = `${AppLevelLayout.trafficLights.widthRem}rem`;

  return (
    <div className="flex h-svh w-full flex-col">
      <SidebarProvider className="flex min-h-0 flex-1 flex-row">
        <div className="sticky top-0 right-0 left-0 flex shrink-0">
          <div
            style={
              fullScreen
                ? undefined
                : { height: trafficLightHeight, width: trafficLightWidth }
            }
          />
          {
            <span className="flex-1" style={{ height: trafficLightHeight }}>
              {' '}
              <SidebarTrigger className="mt-1 -ml-1" />
            </span>
          }
        </div>
        <SpaceSidebar />
        <SidebarInset className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <ActiveFileIdPanel />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
