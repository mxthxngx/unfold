import { useDroppable } from '@dnd-kit/react';

import { useSidebarStore } from '../stores/sidebar-store';

import { FlatNode } from '@/api/nodes';
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/utils/tailwind';

interface PinnedSectionProps {
  pinnedNodes: FlatNode[];
  expandParentNodes: (nodeId: string) => void;
}

export const DROPPABLE_PINNED_SECTION_ID = 'pinned-section';
export const PinnedSection2 = ({
  pinnedNodes,
  expandParentNodes,
}: PinnedSectionProps) => {
  const { isDropTarget, ref } = useDroppable({
    id: DROPPABLE_PINNED_SECTION_ID,
  });
  const currentlyActiveNodeId = useSidebarStore((s) => s.activeNodeId);
  const setActiveNodeId = useSidebarStore((s) => s.setActiveNodeId);
  return (
    <SidebarGroupContent>
      <div
        ref={ref}
        className={cn(
          isDropTarget
            ? 'border-sidebar-border border border-dashed'
            : 'border border-transparent',
          'rounded-2xl p-1',
        )}
      >
        <SidebarMenu className="w-full gap-1">
          {pinnedNodes.map((node) => (
            <SidebarMenuItem key={node.id}>
              <SidebarMenuButton
                variant="outline"
                size="sm"
                isActive={currentlyActiveNodeId === node.id}
                className="w-full"
                onClick={() => {
                  setActiveNodeId(node.id);
                  expandParentNodes(node.id);
                }}
              >
                <span className="min-w-0 truncate text-xs">{node.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
    </SidebarGroupContent>
  );
};
