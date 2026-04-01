import type { FlatNode } from '@/api/nodes';

/** Sort siblings like the server: `sort_order`, then `name`. */
export function sortNodesByOrder(a: FlatNode, b: FlatNode): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

/**
 * Buckets nodes by effective parent (`parentId` nulled if the parent id is missing from `nodes`).
 * Sorts each sibling list for stable outline order.
 */
export function childrenByParent(
  nodes: FlatNode[],
): Map<string | null, FlatNode[]> {
  const ids = new Set(nodes.map((n) => n.id));
  const map = new Map<string | null, FlatNode[]>();
  for (const n of nodes) {
    let p: string | null = n.parentId;
    if (p !== null && !ids.has(p)) p = null;
    const list = map.get(p) ?? [];
    list.push(n);
    map.set(p, list);
  }
  for (const list of map.values()) {
    list.sort(sortNodesByOrder);
  }
  return map;
}

/** Pinned strip: `isPinned` rows, ordered by pin `sort_order` / name. */
export function getPinnedNodesForStrip(nodes: FlatNode[]): FlatNode[] {
  return [...nodes].filter((n) => n.isPinned).sort(sortNodesByOrder);
}

/** Parent ids from `nodeId` up to the root — expand these so the tree reveals the node (no selection). */
export function ancestorIdsForNode(
  allNodes: FlatNode[],
  nodeId: string,
): string[] {
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const out: string[] = [];
  let p: string | null = byId.get(nodeId)?.parentId ?? null;
  while (p) {
    out.push(p);
    const n = byId.get(p);
    if (!n) break;
    p = n.parentId;
  }
  return out;
}

/** `rootId` first, then descendants (DFS). Used when building move/pin payloads. */
export function collectDescendantIds(
  allNodes: FlatNode[],
  rootId: string,
): string[] {
  const byParent = childrenByParent(allNodes);
  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    const kids = byParent.get(id) ?? [];
    for (let i = kids.length - 1; i >= 0; i--) {
      stack.push(kids[i]!.id);
    }
  }
  return out;
}

/**
 * Ordered ids to send to the server when dragging: each root in `baseOrderedIds`, plus any
 * descendant not already included (so a folder drag moves its whole subtree).
 */
export function expandIdsWithDescendantsForDrag(
  allNodes: FlatNode[],
  baseOrderedIds: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const root of baseOrderedIds) {
    for (const id of collectDescendantIds(allNodes, root)) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  console.log('out', out);
  return out;
}
