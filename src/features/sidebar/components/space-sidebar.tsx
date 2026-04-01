import { PointerActivationConstraints } from '@dnd-kit/dom';
import {
  DragOverlay,
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  useDragOperation,
} from '@dnd-kit/react';
import { Suspense, useEffect, useRef } from 'react';

import {
  useMoveNodesMutation,
  useNodesSuspenseQuery,
  useSetPinnedMutation,
} from '../api/use-nodes';
import { useSidebarStore } from '../stores/sidebar-store';

import { DROPPABLE_NOTES_SECTION_ID, NotesSection } from './notes-section';
import { DROPPABLE_PINNED_SECTION_ID, PinnedSection2 } from './pinned-section';
import { SpaceSidebarSkeleton } from './space-sidebar-skeleton';

import { FlatNode } from '@/api/nodes';
import { useSpaceStore } from '@/components/store/space.store';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { DEFAULT_SPACE_ID } from '@/config/spaces';

/**
 * TODOS
 * 1. pinned section isnt draggable, so unpinning isnt possible, maybe pinning should be a context menu option
 * 2. drag and drop doesnt alway work, fiiles that were just dropped isnt working
 * 3. allow only 5 levels of nesting, and show a warning when user tries to exceed that, this is because the current design of the sidebar with the current indentation style will break if we allow more levels, we can revisit the design later to accomodate more levels
 * 4. touchpad haptics on drag and drop would be a nice to have
 */

const spaceId = DEFAULT_SPACE_ID;

type onDragOver = NonNullable<
  React.ComponentProps<typeof DragDropProvider>['onDragOver']
>;
type OnDragEnd = NonNullable<
  React.ComponentProps<typeof DragDropProvider>['onDragEnd']
>;

const sidebarSensors = [
  PointerSensor.configure({
    activationConstraints: [
      //  this is required to prevent dragging when user just wants to click and open the note, without this, every click will be treated as drag and drop
      new PointerActivationConstraints.Distance({ value: 6 }),
    ],
  }),
  KeyboardSensor,
];

const isPinned = (id: string) => {
  if (id.startsWith(DROPPABLE_PINNED_SECTION_ID)) {
    return true;
  }
  return false;
};

const getOperationId = (value: unknown): string | null => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
};

export const byParent = (nodes: FlatNode[]) => {
  const map = new Map<string | null, FlatNode[]>();

  for (const node of nodes) {
    const key = node.parentId ?? null;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(node);
  }

  return map;
};
export const SpaceSidebar = () => {
  const nodes = useNodesSuspenseQuery(spaceId).data.nodes ?? [];
  const hoverExpandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hoverExpandTargetIdRef = useRef<string | null>(null);

  const setCurrentSpaceID = useSpaceStore((s) => s.setCurrentSpaceID);

  const pinnedNodes = nodes.filter((node) => node.isPinned);

  const toggleExpand = useSidebarStore((s) => s.toggleExpand);
  const expandParentNodes = (startNodeId: string) => {
    let current = nodes.find((n) => n.id === startNodeId);
    const visited = new Set<string>();

    while (current?.parentId) {
      if (visited.has(current.parentId)) break;
      visited.add(current.parentId);

      const parent = nodes.find((n) => n.id === current?.parentId);
      if (!parent) break;

      toggleExpand(parent.id, true);
      current = parent;
    }
  };

  const moveNodes = useMoveNodesMutation();
  const setPin = useSetPinnedMutation();

  const clearHoverExpand = () => {
    if (hoverExpandTimeoutRef.current) {
      clearTimeout(hoverExpandTimeoutRef.current);
      hoverExpandTimeoutRef.current = null;
    }
    hoverExpandTargetIdRef.current = null;
  };

  const onDragOver: onDragOver = (event) => {
    const targetParentId = getOperationId(event.operation?.target?.id);
    const sourceItemId = getOperationId(event.operation?.source?.id);

    if (!sourceItemId || !targetParentId) {
      clearHoverExpand();
      return;
    }

    if (
      sourceItemId === targetParentId ||
      targetParentId === DROPPABLE_NOTES_SECTION_ID ||
      isPinned(targetParentId) ||
      isPinned(sourceItemId)
    ) {
      clearHoverExpand();
      return;
    }

    if (hoverExpandTargetIdRef.current === targetParentId) {
      return;
    }

    clearHoverExpand();
    hoverExpandTargetIdRef.current = targetParentId;

    hoverExpandTimeoutRef.current = setTimeout(() => {
      toggleExpand(targetParentId, true);
      hoverExpandTimeoutRef.current = null;
      hoverExpandTargetIdRef.current = null;
    }, 900);
  };

  const onDragEnd: OnDragEnd = (event) => {
    clearHoverExpand();

    const targetParentId = getOperationId(event.operation?.target?.id);
    const sourceItemId = getOperationId(event.operation?.source?.id);

    if (!sourceItemId) return;
    if (!targetParentId) return;
    if (sourceItemId === targetParentId) return;

    if (
      targetParentId !== DROPPABLE_NOTES_SECTION_ID &&
      !isPinned(targetParentId)
    ) {
      toggleExpand(targetParentId, true);
    }

    if (isPinned(targetParentId)) {
      if (pinnedNodes.some((n) => n.id === sourceItemId)) {
        // already pinned, do nothing
        return;
      }
      setPin.mutate({ spaceId, nodeIds: [sourceItemId], isPinned: true });
      return;
    }

    moveNodes.mutate({
      spaceId: spaceId,
      nodeIds: [sourceItemId],
      newParentId:
        targetParentId === DROPPABLE_NOTES_SECTION_ID ? null : targetParentId,
    });
  };

  useEffect(() => {
    setCurrentSpaceID(spaceId);
  }, [setCurrentSpaceID, spaceId]);

  useEffect(() => {
    return () => {
      clearHoverExpand();
    };
  }, []);

  return (
    <Sidebar
      variant="floating"
      collapsible="offcanvas"
      className="w-55 justify-center align-middle"
      style={{
        top: 'var(--spacing-space-sidebar-top)',
        paddingLeft: 'var(--spacing-space-sidebar-inline)',
        height: `calc(98vh - var(--spacing-space-sidebar-top))`,
      }}
    >
      <div className="h-3" />
      <Suspense fallback={<SpaceSidebarSkeleton />}>
        <SidebarContent className="min-h-0 gap-1 overflow-y-auto">
          <DragDropProvider
            sensors={sidebarSensors}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
          >
            <SidebarGroup>
              <SidebarGroupLabel>pinned</SidebarGroupLabel>
              <PinnedSection2
                pinnedNodes={pinnedNodes}
                expandParentNodes={expandParentNodes}
              />
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>notes</SidebarGroupLabel>
              <NotesSection
                nodes={nodes}
                expandParentNodes={expandParentNodes}
              />
            </SidebarGroup>
            <DragOverlay dropAnimation={null}>
              <SidebarDragOverlay nodes={nodes} />
            </DragOverlay>
          </DragDropProvider>
        </SidebarContent>
      </Suspense>
    </Sidebar>
  );
};

const SidebarDragOverlay = ({ nodes }: { nodes: FlatNode[] }) => {
  const { source } = useDragOperation();
  const sourceId = getOperationId(source?.id);

  if (!sourceId) {
    return null;
  }

  const sourceNode = nodes.find((node) => node.id === sourceId);

  return (
    <div className="pointer-events-none w-40 max-w-60">
      <div className="text-sidebar-accent-foreground border-sidebar-border bg-sidebar-accent flex h-7 items-center gap-2 rounded-xl border px-2.5 py-1 shadow-[0_8px_18px_rgba(0,0,0,0.32)]">
        <span className="truncate text-sm font-medium">
          {sourceNode?.name ?? 'moving note'}
        </span>
      </div>
    </div>
  );
};
