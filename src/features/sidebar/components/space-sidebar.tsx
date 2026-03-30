import { DndContext, DragOverlay, useDndContext } from '@dnd-kit/core';
import * as React from 'react';

import { useNodesSuspenseQuery } from '../api/use-nodes';
import { useSidebarAddChild } from '../hooks/use-sidebar-add-child';
import { useSpaceSidebarDnd } from '../hooks/use-space-sidebar-dnd';
import { useSidebarStore } from '../stores/sidebar-store';
import {
  buildFullDragOrder,
  sidebarPointerCollision,
  snapToCursor,
} from '../utils/dnd';
import {
  flattenVisibleOutline,
  FlatVisibleRowKind,
} from '../utils/flatten-visible-tree';
import { getPinnedNodesForStrip } from '../utils/nodes-from-flat';

import { getUndoManager } from '@/core/undo/undo-manager';

import { NotesTreeVirtual } from './notes-tree-virtual';
import { PinnedSection } from './pinned-section';
import { SpaceSidebarSkeleton } from './space-sidebar-skeleton';

import { Sidebar, SidebarContent, SidebarGroup } from '@/components/ui/sidebar';
import { DEFAULT_SPACE_ID } from '@/config/spaces';

type SpaceSidebarProps = React.ComponentProps<typeof Sidebar> & {
  spaceId?: string;
};

type SpaceSidebarShellProps = SpaceSidebarProps & {
  shellRef?: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
};

function SpaceSidebarShell({
  shellRef,
  children,
  ...sidebarProps
}: SpaceSidebarShellProps) {
  return (
    <div ref={shellRef} className="min-w-0 shrink-0 outline-none">
      <Sidebar
        variant="floating"
        collapsible="offcanvas"
        className="w-55 justify-center align-middle"
        style={{
          top: 'var(--spacing-space-sidebar-top)',
          paddingLeft: 'var(--spacing-space-sidebar-inline)',
          height: `calc(98vh - var(--spacing-space-sidebar-top))`,
        }}
        {...sidebarProps}
      >
        <div className="h-3" />
        {children}
      </Sidebar>
    </div>
  );
}

function SidebarContentWithDndDragSuppression(
  props: React.ComponentProps<typeof SidebarContent>,
) {
  const { active } = useDndContext();
  return (
    <SidebarContent
      data-sidebar-dnd-dragging={active ? 'true' : undefined}
      {...props}
    />
  );
}

export function SpaceSidebar({
  spaceId: spaceIdProp,
  ...props
}: SpaceSidebarProps) {
  const spaceId = spaceIdProp ?? DEFAULT_SPACE_ID;
  return (
    <React.Suspense
      fallback={
        <SpaceSidebarShell {...props}>
          <SidebarContent className="min-h-0 gap-1">
            <SpaceSidebarSkeleton />
          </SidebarContent>
        </SpaceSidebarShell>
      }
    >
      <SpaceSidebarImpl spaceId={spaceId} {...props} />
    </React.Suspense>
  );
}

function SpaceSidebarImpl({
  spaceId,
  ...props
}: SpaceSidebarProps & { spaceId: string }) {
  const { data: spaceNotes } = useNodesSuspenseQuery(spaceId);

  const nodes = spaceNotes.nodes;
  const pinnedNodes = getPinnedNodesForStrip(nodes);

  const expandedIds = useSidebarStore((s) => s.expandedIds);
  const flatVisibleRows = flattenVisibleOutline(nodes, expandedIds);
  const visibleNodeIds = flatVisibleRows
    .filter((r) => r.kind === FlatVisibleRowKind.node)
    .map((r) => r.id);

  const selectedIds = useSidebarStore((s) => s.selectedIds);

  const onAddChild = useSidebarAddChild(spaceId);
  const shellRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    return getUndoManager().attachKeyboardShortcuts(() => shellRef.current);
  }, []);

  const fullOrder = buildFullDragOrder(nodes, visibleNodeIds);

  const {
    dragOverlayCount,
    handleDragCancel,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
    sensors,
  } = useSpaceSidebarDnd({
    spaceId,
    fullOrder,
    selectedIds,
    allNodes: nodes,
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={sidebarPointerCollision}
      modifiers={[snapToCursor]}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SpaceSidebarShell shellRef={shellRef} {...props}>
        <SidebarContentWithDndDragSuppression className="min-h-0 gap-1">
          <SidebarGroup className="flex flex-col gap-1">
            <PinnedSection nodes={pinnedNodes} allNodes={nodes} />
          </SidebarGroup>
          <SidebarGroup className="flex min-h-0 flex-1 flex-col">
            <NotesTreeVirtual
              parentRef={scrollRef}
              flatRows={flatVisibleRows}
              onAddChild={onAddChild}
              allNodes={nodes}
            />
          </SidebarGroup>
        </SidebarContentWithDndDragSuppression>
      </SpaceSidebarShell>
      <DragOverlay dropAnimation={null}>
        <SidebarDragOverlay selectedCount={dragOverlayCount} />
      </DragOverlay>
    </DndContext>
  );
}

function SidebarDragOverlay({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="bg-sidebar text-sidebar-foreground border-sidebar-border text-tiny pointer-events-none cursor-default rounded-lg border px-3 py-2 shadow-md">
      {selectedCount > 1 ? `${selectedCount} notes` : 'moving note'}
    </div>
  );
}
