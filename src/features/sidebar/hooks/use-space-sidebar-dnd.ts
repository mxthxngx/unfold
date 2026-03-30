import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as React from 'react';

import {
  getSpaceNodesSnapshot,
  invalidateSpaceNodesQuery,
} from '../api/node-query-client';
import { useSetPinnedMutation } from '../api/use-nodes';
import { useSidebarStore } from '../stores/sidebar-store';
import {
  isPinnedDropOverId,
  orderedDragIds,
  parseDragSourceId,
  resolveSidebarDropTarget,
} from '../utils/dnd';
import { expandIdsWithDescendantsForDrag } from '../utils/nodes-from-flat';

import { nodesApplySpaceSnapshot, nodesMoveUnpinned } from '@/api/nodes';
import type { FlatNodeDto } from '@/api/nodes';
import { getUndoManager } from '@/core/undo/undo-manager';

const HOVER_EXPAND_MS = 1000;

type UseSpaceSidebarDndParams = {
  spaceId: string;
  fullOrder: string[];
  selectedIds: ReadonlySet<string>;
  /** Full space flat list — expands a dragged folder to its subtree ids for move/pin. */
  allNodes: FlatNodeDto[];
};

/**
 * Structural DnD: one {@link ExecuteUndo} — push stack entry, then `execute` (mutate + invalidate);
 * undo restores snapshot; redo re-runs `execute`. Wrapped in `startGroup`/`endGroup` for batched gestures.
 */
async function runSpaceMutationWithUndo({
  spaceId,
  before,
  forward,
  qc,
}: {
  spaceId: string;
  before: FlatNodeDto[] | undefined;
  forward: () => Promise<void>;
  qc: QueryClient;
}): Promise<boolean> {
  if (!before) return false;

  const mgr = getUndoManager();
    await mgr.add({
      execute: async () => {
        await forward();
        await invalidateSpaceNodesQuery(qc, spaceId);
      },
      undo: async () => {
        await nodesApplySpaceSnapshot({ spaceId, nodes: before });
        await invalidateSpaceNodesQuery(qc, spaceId);
      },
    });
  return true;
}

/**
 * Notes-only drags: reorder/nest in outline, or drop onto pinned zone / pinned row to pin.
 * Pinned strip rows are not draggable.
 */
export function useSpaceSidebarDnd({
  spaceId,
  fullOrder,
  selectedIds,
  allNodes,
}: UseSpaceSidebarDndParams) {
  const qc = useQueryClient();
  const pinMut = useSetPinnedMutation();
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);
  const [dragOverlayCount, setDragOverlayCount] = React.useState(1);
  const hoverExpandTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const lastHoverDropTargetIdRef = React.useRef<string | null>(null);

  function clearHoverExpandTimer() {
    if (hoverExpandTimerRef.current) {
      clearTimeout(hoverExpandTimerRef.current);
      hoverExpandTimerRef.current = null;
    }
  }

  function resetDragState() {
    clearHoverExpandTimer();
    lastHoverDropTargetIdRef.current = null;
    setDragOverlayCount(1);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    clearHoverExpandTimer();
    lastHoverDropTargetIdRef.current = null;
    const id = parseDragSourceId(event.active.id);
    if (!id) {
      setDragOverlayCount(1);
      return;
    }
    const raw = orderedDragIds(id, selectedIds, fullOrder);
    const moving = expandIdsWithDescendantsForDrag(allNodes, raw);
    setDragOverlayCount(moving.length);
  }

  function handleDragMove(event: DragMoveEvent) {
    const overId = event.over?.id != null ? String(event.over.id) : null;
    if (isPinnedDropOverId(overId)) {
      clearHoverExpandTimer();
      lastHoverDropTargetIdRef.current = null;
      return;
    }

    const dropTarget = overId
      ? resolveSidebarDropTarget(overId)
      : { kind: 'none' as const };
    const targetId =
      dropTarget.kind === 'nest-under' ? dropTarget.parentId : null;

    if (!targetId || targetId === lastHoverDropTargetIdRef.current) {
      return;
    }

    clearHoverExpandTimer();
    lastHoverDropTargetIdRef.current = targetId;

    hoverExpandTimerRef.current = setTimeout(() => {
      toggleExpand(targetId, true);
      hoverExpandTimerRef.current = null;
    }, HOVER_EXPAND_MS);
  }

  async function handleDragEnd(event: DragEndEvent) {
    resetDragState();

    const { active, over } = event;
    const draggedId = parseDragSourceId(active.id);
    if (!draggedId || !over) return;
    console.log('draggedId', draggedId);
    console.log('selectedIds', selectedIds);
    console.log('fullOrder', fullOrder);
    const rawOrdered = orderedDragIds(draggedId, selectedIds, fullOrder);
    if (rawOrdered.length === 0) return;
    console.log('rawOrdered', rawOrdered);
    const moving = expandIdsWithDescendantsForDrag(allNodes, rawOrdered);
    if (moving.length === 0) return;

    const before = getSpaceNodesSnapshot(qc, spaceId);
    const dropTarget = resolveSidebarDropTarget(String(over.id));

    try {
      switch (dropTarget.kind) {
        case 'pinned':
          await runSpaceMutationWithUndo({
            spaceId,
            before,
            qc,
            forward: () =>
              pinMut.mutateAsync({
                spaceId,
                nodeIds: moving,
                isPinned: true,
              }),
          });
          return;

        case 'notes-root':
        case 'nest-under': {
          const newParentId =
            dropTarget.kind === 'notes-root' ? null : dropTarget.parentId;

          if (
            dropTarget.kind === 'nest-under' &&
            moving.includes(newParentId!)
          ) {
            return;
          }

          const didMove = await runSpaceMutationWithUndo({
            spaceId,
            before,
            qc,
            forward: () =>
              nodesMoveUnpinned({
                spaceId,
                nodeIds: moving,
                newParentId,
                insertBeforeId: null,
              }),
          });

          if (didMove && dropTarget.kind === 'nest-under') {
            toggleExpand(newParentId!, true);
          }
          return;
        }

        case 'none':
          return;
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleDragCancel() {
    resetDragState();
  }

  React.useEffect(() => {
    return () => {
      if (hoverExpandTimerRef.current) {
        clearTimeout(hoverExpandTimerRef.current);
        hoverExpandTimerRef.current = null;
      }
    };
  }, []);

  return {
    handleDragCancel,
    dragOverlayCount,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
    sensors,
  };
}
