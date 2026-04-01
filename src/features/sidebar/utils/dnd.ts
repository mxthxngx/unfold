// import {
//   closestCenter,
//   pointerWithin,
//   type CollisionDetection,
//   type Modifier,
// } from '@dnd-kit/core';

// import { getPinnedNodesForStrip } from './nodes-from-flat';

// import type { FlatNode } from '@/api/nodes';

// /** Droppable zone id for “pin these notes”. */
// export const DND_DROP_PINNED = 'drop-pinned';
// /** Row targets in the pinned strip (not draggable — drop-only) so notes can be dropped onto an existing pin. */
// export const DND_DROP_PINNED_ROW_PREFIX = 'drop-pinned-on:';
// /** Droppable zone for moving items to top-level outline roots. */
// export const DND_DROP_NOTES_ROOT = 'drop-notes-root';
// export const DND_DROP_ON_PREFIX = 'drop-on:';
// /** Unique id for “no sub notes” rows (same nest-under semantics as `drop-on:<parentId>`). */
// export const DND_DROP_EMPTY_PREFIX = 'drop-empty:';

// export type SidebarDropTarget =
//   | { kind: 'pinned' }
//   | { kind: 'notes-root' }
//   | { kind: 'nest-under'; parentId: string }
//   | { kind: 'none' };

// /** Notes outline row draggable id (pinned strip rows are not draggable). */
// export function dragSourceId(id: string) {
//   return `drag-node:${id}`;
// }

// export function dropTargetPinnedRowId(nodeId: string) {
//   return `${DND_DROP_PINNED_ROW_PREFIX}${nodeId}`;
// }

// /** Pin zone or a pinned-row droppable — used to show the dashed border while dragging notes over either. */
// export function isPinnedDropOverId(overId: string | null | undefined): boolean {
//   if (overId == null) return false;
//   const s = String(overId);
//   return s === DND_DROP_PINNED || s.startsWith(DND_DROP_PINNED_ROW_PREFIX);
// }

// /** Droppable id for nesting under a real outline row. */
// export function dropTargetNodeId(id: string) {
//   return `${DND_DROP_ON_PREFIX}${id}`;
// }

// /** Droppable id for the “no sub notes” row under a leaf parent. */
// export function dropTargetEmptyPlaceholderId(parentId: string) {
//   return `${DND_DROP_EMPTY_PREFIX}${parentId}`;
// }

// /** Parses `drop-on:<nodeId>` droppable ids; returns `null` if not a node drop target. */
// export function parseDropOnNodeId(overId: string): string | null {
//   if (!overId.startsWith(DND_DROP_ON_PREFIX)) return null;
//   return overId.slice(DND_DROP_ON_PREFIX.length);
// }

// /** Nest-under id from either a node row (`drop-on:`) or empty placeholder (`drop-empty:`). */
// export function parseDropTargetNestUnderId(overId: string): string | null {
//   const onNode = parseDropOnNodeId(overId);
//   if (onNode) return onNode;
//   if (!overId.startsWith(DND_DROP_EMPTY_PREFIX)) return null;
//   return overId.slice(DND_DROP_EMPTY_PREFIX.length);
// }

// /**
//  * Maps collision `over.id` to semantic drop target (pin, root, nest, none).
//  * Pinned rows use {@link dropTargetPinnedRowId} (drop-only) so notes can be dropped onto them to pin.
//  */
// export function resolveSidebarDropTarget(overId: string): SidebarDropTarget {
//   if (overId === DND_DROP_PINNED) {
//     return { kind: 'pinned' };
//   }

//   if (overId.startsWith(DND_DROP_PINNED_ROW_PREFIX)) {
//     return { kind: 'pinned' };
//   }

//   if (overId === DND_DROP_NOTES_ROOT) {
//     return { kind: 'notes-root' };
//   }

//   const parentId = parseDropTargetNestUnderId(overId);
//   if (parentId) {
//     return { kind: 'nest-under', parentId };
//   }

//   return { kind: 'none' };
// }

// /** True if `overId` refers to nest-under a node or empty placeholder (not pin/root zones). */
// export function isSidebarNestDropTargetId(overId: string) {
//   return (
//     overId.startsWith(DND_DROP_ON_PREFIX) ||
//     overId.startsWith(DND_DROP_EMPTY_PREFIX)
//   );
// }

// const DRAG_NODE_PREFIX = 'drag-node:';

// /** Strips the `drag-node:` prefix from an active draggable id. */
// export function parseDragSourceId(
//   activeId: string | number | undefined,
// ): string | null {
//   if (activeId == undefined || activeId == null) return null;
//   const s = String(activeId);
//   if (!s.startsWith(DRAG_NODE_PREFIX)) return null;
//   return s.slice(DRAG_NODE_PREFIX.length);
// }

// /**
//  * Ordered ids to move: full selection when the active id is selected, otherwise just the active id.
//  * Rows that appear in `order` keep that order; selected ids not in `order` (e.g. descendants of a
//  * collapsed folder) are appended so nothing in the selection is dropped.
//  */
// export function orderedDragIds(
//   activeId: string,
//   selectedIds: ReadonlySet<string>,
//   order: string[],
// ): string[] {
//   const set = selectedIds.has(activeId) ? selectedIds : new Set([activeId]);
//   const inOrder = order.filter((id) => set.has(id));
//   const inOrderSet = new Set(inOrder);
//   const rest = [...set].filter((id) => !inOrderSet.has(id));
//   return [...inOrder, ...rest];
// }

// /**
//  * Linear order for multi-drag: pinned strip (by `sort_order`) then visible outline nodes top-to-bottom.
//  */
// export function buildFullDragOrder(
//   allNodes: FlatNode[],
//   visibleOutlineNodeIds: string[],
// ): string[] {
//   const pinnedIds = getPinnedNodesForStrip(allNodes).map((n) => n.id);
//   const pinnedSet = new Set(pinnedIds);
//   const rest = visibleOutlineNodeIds.filter((id) => !pinnedSet.has(id));
//   return [...pinnedIds, ...rest];
// }

// /**
//  * Pointer collisions: **pinned** (zone or row) wins over nest-under so hovering the strip does not
//  * resolve to `drop-on:` for the same note in the outline (which would fire hover-expand).
//  */
// export const sidebarPointerCollision: CollisionDetection = (args) => {
//   const byPointer = pointerWithin(args);
//   if (byPointer.length > 0) {
//     const onPinned = byPointer.filter((c) => isPinnedDropOverId(String(c.id)));
//     if (onPinned.length > 0) {
//       return onPinned;
//     }
//     const onNodeRow = byPointer.filter((collision) =>
//       isSidebarNestDropTargetId(String(collision.id)),
//     );
//     if (onNodeRow.length > 0) {
//       return onNodeRow;
//     }
//     return byPointer;
//   }

//   return closestCenter(args);
// };

// // Shifts the drag overlay so its top-left corner starts exactly at the cursor.
// export const snapToCursor: Modifier = ({
//   activatorEvent,
//   draggingNodeRect,
//   transform,
// }) => {
//   if (draggingNodeRect && activatorEvent && 'clientX' in activatorEvent) {
//     const evt = activatorEvent as PointerEvent;
//     return {
//       ...transform,
//       x: transform.x + evt.clientX - draggingNodeRect.left,
//       y: transform.y + evt.clientY - draggingNodeRect.top,
//     };
//   }
//   return transform;
// };
