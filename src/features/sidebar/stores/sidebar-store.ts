import * as React from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type SidebarState = {
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  activeNodeId: string | null;
  rangeAnchorId: string | null;
  lastSelectedId: string | null;
};

/** Pass `visibleOrder` for shift+range (pinned strip or notes outline). */
export type SelectNodeContext = {
  visibleOrder?: readonly string[];
};

type SidebarActions = {
  toggleExpand: (id: string, open: boolean) => void;
  selectNode: (
    event: React.MouseEvent,
    nodeId: string,
    context?: SelectNodeContext,
  ) => void;
  setActiveNodeId: (nodeId: string) => void;
  clearSelection: () => void;
};

export const useSidebarStore = create<SidebarState & SidebarActions>()(
  immer((set) => ({
    expandedIds: new Set(),
    selectedIds: new Set(),
    activeNodeId: null,
    rangeAnchorId: null,
    lastSelectedId: null,

    toggleExpand: (id, open) =>
      set((state) => {
        if (open) {
          state.expandedIds.add(id);
        } else {
          state.expandedIds.delete(id);
        }
      }),

    setActiveNodeId: (nodeId: string) =>
      set((state) => {
        state.activeNodeId = nodeId;
      }),

    selectNode: (event, nodeId, context) => {
      set((state) => {
        const visibleOrder = context?.visibleOrder;
        const shift = event.shiftKey;
        const mod = event.metaKey || event.ctrlKey;

        if (
          shift &&
          visibleOrder &&
          state.rangeAnchorId != null &&
          !mod
        ) {
          const a = visibleOrder.indexOf(state.rangeAnchorId);
          const b = visibleOrder.indexOf(nodeId);
          if (a !== -1 && b !== -1) {
            const lo = Math.min(a, b);
            const hi = Math.max(a, b);
            state.selectedIds.clear();
            for (let i = lo; i <= hi; i++) {
              state.selectedIds.add(visibleOrder[i]!);
            }
            state.lastSelectedId = nodeId;
            return;
          }
        }

        if (mod) {
          if (state.selectedIds.has(nodeId)) {
            state.selectedIds.delete(nodeId);
          } else {
            state.selectedIds.add(nodeId);
          }
          state.rangeAnchorId = nodeId;
          state.lastSelectedId = nodeId;
          return;
        }

        state.selectedIds.clear();
        state.selectedIds.add(nodeId);
        state.rangeAnchorId = nodeId;
        state.lastSelectedId = nodeId;
      });
    },

    clearSelection: () =>
      set((state) => {
        state.selectedIds.clear();
        state.rangeAnchorId = null;
        state.lastSelectedId = null;
      }),
  })),
);
