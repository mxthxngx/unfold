import { useDroppable } from '@dnd-kit/react';

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
}

export const DROPPABLE_PINNED_SECTION_ID = 'pinned-section';
export const PinnedSection2 = ({ pinnedNodes }: PinnedSectionProps) => {
  const { isDropTarget, ref } = useDroppable({
    id: DROPPABLE_PINNED_SECTION_ID,
  });
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
        <SidebarMenu className="w-full">
          {pinnedNodes.map((node) => (
            <SidebarMenuItem key={node.id}>
              <SidebarMenuButton>{node.name}</SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
    </SidebarGroupContent>
  );
};
