import { DragDropProvider } from '@dnd-kit/react';
import { Suspense, useEffect } from 'react';

import {
  useMoveNodesMutation,
  useNodesSuspenseQuery,
  useSetPinnedMutation,
} from '../api/use-nodes';
import { useSidebarStore } from '../stores/sidebar-store';

import { DROPPABLE_NOTES_SECTION_ID, NotesSection2 } from './notes-section2';
import { DROPPABLE_PINNED_SECTION_ID, PinnedSection2 } from './pinned-section2';
import { SpaceSidebarSkeleton } from './space-sidebar-skeleton';

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
 * 1. pinned section isnt draggable, so unpinning isnt possible,
 * 2. drag and drop doesnt alway work, fiiles that were just dropped isnt working
 */

const spaceId = DEFAULT_SPACE_ID;
type OnDragEnd = NonNullable<
  React.ComponentProps<typeof DragDropProvider>['onDragEnd']
>;

const isPinned = (id: string) => {
  if (id.startsWith(DROPPABLE_PINNED_SECTION_ID)) {
    return true;
  }
  return false;
};
export const SpaceSidebar2 = () => {
  const notes = useNodesSuspenseQuery(spaceId).data.nodes ?? [];

  const setCurrentSpaceID = useSpaceStore((s) => s.setCurrentSpaceID);

  const pinnedNodes = notes.filter((note) => note.isPinned);

  const toggleExpand = useSidebarStore((s) => s.toggleExpand);

  const moveNodes = useMoveNodesMutation();
  const setPin = useSetPinnedMutation();

  const onDragEnd: OnDragEnd = (event) => {
    const targetParentId = String(event.operation?.target?.id);
    const sourceItemId = String(event.operation?.source?.id);

    if (!sourceItemId) return;

    if (targetParentId) {
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

    console.log('Drag ended:', {
      sourceItemId,
      targetParentId,
    });
  };

  useEffect(() => {
    setCurrentSpaceID(spaceId);
  }, [setCurrentSpaceID, spaceId]);

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
        <SidebarContent className="min-h-0 gap-1">
          <DragDropProvider onDragEnd={onDragEnd}>
            <SidebarGroup>
              <SidebarGroupLabel>pinned</SidebarGroupLabel>
              <PinnedSection2 pinnedNodes={pinnedNodes} />
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>notes</SidebarGroupLabel>
              <NotesSection2 notes={notes} />
            </SidebarGroup>
          </DragDropProvider>
        </SidebarContent>
      </Suspense>
    </Sidebar>
  );
};
