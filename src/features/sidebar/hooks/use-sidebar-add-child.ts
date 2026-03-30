import { useQueryClient } from '@tanstack/react-query';

import {
  getSpaceNodesSnapshot,
  invalidateSpaceNodesQuery,
} from '../api/node-query-client';
import { useCreateNodeMutation } from '../api/use-nodes';
import { useSidebarStore } from '../stores/sidebar-store';

import { nodesDelete, nodesApplySpaceSnapshot } from '@/api/nodes';
import { getUndoManager } from '@/core/undo/undo-manager';

/**
 * Returns `addChild(parentId)` — creates a child node, registers undo (snapshot / delete redo), expands parent.
 */
export function useSidebarAddChild(spaceId: string) {
  const qc = useQueryClient();
  const createMut = useCreateNodeMutation();
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);

  return async function addChild(parentId: string) {
    const before = getSpaceNodesSnapshot(qc, spaceId);
    try {
      await createMut.mutateAsync({
        spaceId,
        parentId,
        name: 'new page',
      });
      if (before) {
        void getUndoManager().add({
          undo: async () => {
            await nodesApplySpaceSnapshot({ spaceId, nodes: before });
            await invalidateSpaceNodesQuery(qc, spaceId);
          },
          redo: async () => {
            const created = getSpaceNodesSnapshot(qc, spaceId);
            const newest = created?.find(
              (n) => !before.some((b) => b.id === n.id),
            );
            if (newest) {
              await nodesDelete({ spaceId, nodeIds: [newest.id] });
              await invalidateSpaceNodesQuery(qc, spaceId);
            }
          },
        });
      }
      toggleExpand(parentId, true);
    } catch (e) {
      console.error(e);
    }
  };
}
