import { useDndContext, useDroppable } from '@dnd-kit/core';

import { useSidebarStore } from '../stores/sidebar-store';
import {
  DND_DROP_PINNED,
  dropTargetPinnedRowId,
  isPinnedDropOverId,
  parseDragSourceId,
} from '../utils/dnd';

import type { FlatNodeDto } from '@/api/nodes';
import {
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/utils/tailwind';

type PinnedSectionProps = {
  nodes: FlatNodeDto[];
  allNodes: FlatNodeDto[];
};

function PinnedRow({
  node,
  visibleOrder,
  allNodes,
}: {
  node: FlatNodeDto;
  visibleOrder: readonly string[];
  allNodes: FlatNodeDto[];
}) {
  const isSelected = useSidebarStore((s) => s.selectedIds.has(node.id));
  const selectNode = useSidebarStore((s) => s.selectNode);
  const { setNodeRef } = useDroppable({
    id: dropTargetPinnedRowId(node.id),
  });

  return (
    <SidebarMenuItem className="min-w-0">
      <div ref={setNodeRef} className="cursor-pointer">
        <SidebarMenuButton
          isActive={isSelected}
          variant="default"
          size="sm"
          className="cursor-pointer"
          onClick={(e) =>
            selectNode(e, node.id, { visibleOrder, allNodes })
          }
        >
          <span className="truncate text-xs">{node.name}</span>
        </SidebarMenuButton>
      </div>
    </SidebarMenuItem>
  );
}

export function PinnedSection({ nodes, allNodes }: PinnedSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: DND_DROP_PINNED });
  const { active, over } = useDndContext();
  const overId = over?.id != null ? String(over.id) : null;
  const draggingFromNotes = parseDragSourceId(active?.id) != null;
  const showPinnedDropFrame =
    draggingFromNotes && (isOver || isPinnedDropOverId(overId));
  const pinnedVisibleOrder = nodes.map((n) => n.id);

  return (
    <>
      <SidebarGroupLabel>pinned</SidebarGroupLabel>
      <SidebarGroupContent>
        <div
          ref={setNodeRef}
          className={cn(
            'rounded-lg border border-dashed border-transparent transition-colors',
            showPinnedDropFrame &&
              'border-sidebar-border bg-sidebar-accent/30 dark:border-sidebar-foreground/22',
            'cursor-pointer',
          )}
        >
          <SidebarMenu className="flex flex-col gap-1 px-0 cursor-pointer">
            {nodes.length === 0 ? (
              <p
                className={cn(
                  'text-muted-foreground text-tiny px-2.5 py-1',
                  'cursor-pointer',
                )}
              >
                drop notes here to pin
              </p>
            ) : (
              nodes.map((node) => (
                <PinnedRow
                  key={node.id}
                  node={node}
                  visibleOrder={pinnedVisibleOrder}
                  allNodes={allNodes}
                />
              ))
            )}
          </SidebarMenu>
        </div>
      </SidebarGroupContent>
    </>
  );
}
