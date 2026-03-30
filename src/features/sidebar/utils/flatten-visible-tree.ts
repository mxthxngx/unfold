import {
  childrenByParent,
} from './nodes-from-flat';

import type { FlatNodeDto } from '@/api/nodes';

export enum FlatVisibleRowKind {
  node = 'node',
  empty = 'empty',
}

/** One visible row in the virtual notes list (real node or empty-state under an expanded leaf). */
export type FlatVisibleRow =
  | {
      kind: FlatVisibleRowKind.node;
      id: string;
      name: string;
      depth: number;
      hasChildren: boolean;
    }
  | {
      kind: FlatVisibleRowKind.empty;
      id: string;
      depth: number;
      parentId: string;
    };

/**
 * DFS from flat rows + `parentId` grouping, respecting `expandedIds`.
 * Pinned items stay in the tree (they also appear in the pinned strip).
 */
export function flattenVisibleOutline(
  allNodes: FlatNodeDto[],
  expandedIds: ReadonlySet<string>,
): FlatVisibleRow[] {
  const byParent = childrenByParent(allNodes);
  const out: FlatVisibleRow[] = [];

  const walk = (parentKey: string | null, depth: number) => {
    const siblings = byParent.get(parentKey) ?? [];
    for (const n of siblings) {
      const childList = byParent.get(n.id) ?? [];
      const hasChildren = childList.length > 0;
      const expanded = expandedIds.has(n.id);

      out.push({
        kind: FlatVisibleRowKind.node,
        id: n.id,
        name: n.name,
        depth,
        hasChildren,
      });

      if (hasChildren && expanded) {
        walk(n.id, depth + 1);
      } else if (!hasChildren && expanded) {
        out.push({
          kind: FlatVisibleRowKind.empty,
          id: `${n.id}::__empty`, // this is required because dnd always needs a unique id
          parentId: n.id,
          depth: depth + 1,
        });
      }
    }
  };

  walk(null, 0);
  return out;
}
