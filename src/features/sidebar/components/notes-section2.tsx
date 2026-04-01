import { useDraggable, useDroppable } from '@dnd-kit/react';
import { ChevronRight, Plus } from 'lucide-react';
import { useMemo } from 'react';

import { useCreateNodeMutation } from '../api/use-nodes';
import { useSidebarStore } from '../stores/sidebar-store';

import { FlatNode } from '@/api/nodes';
import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/tailwind';

/**
 * TODOS
 * make indentation on either of the element correct
 * make every parent call its children and not rely on the main component to do it, minimises re-render
 * {{ paddingLeft: depth * 12 }} this should be driven by that css variable
 */

interface NotesSectionProps {
  notes: FlatNode[];
}

interface NotesGroupProps {
  note: FlatNode;
  byParent: Map<string | null, FlatNode[]>;
  depth: number;
}

export const DROPPABLE_NOTES_SECTION_ID = 'notes-section';

const NotesGroup = ({ note, byParent, depth }: NotesGroupProps) => {
  const children = byParent.get(note.id) ?? [];
  const spaceId = note.spaceId;

  const isExpanded = useSidebarStore((s) => s.expandedIds.has(note.id));
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);

  const isActive = useSidebarStore((s) => s.activeNodeId === note.id);
  const setActiveNodeId = useSidebarStore((s) => s.setActiveNodeId);

  // create childs notes
  const createChildMutation = useCreateNodeMutation();

  const { ref, handleRef, isDragging } = useDraggable({
    id: note.id,
    type: 'item',
  });

  const { ref: droppableRef } = useDroppable({
    id: note.id,
  });

  return (
    <SidebarMenuItem className="w-full">
      <div
        className="flex w-full items-center"
        style={{ paddingLeft: depth * 12 }}
        ref={(el) => {
          ref(el);
          droppableRef(el);
        }}
        data-sidebar-dnd-dragging={isDragging}
      >
        <div className="min-w-0 flex-1" ref={handleRef}>
          <SidebarMenuButton
            variant="outline"
            className={cn(
              'w-full',
              isActive && 'bg-sidebar-accent',
              'hover:bg-sidebar-accent/50',
            )}
            onClick={() => setActiveNodeId(note.id)}
          >
            <span className="min-w-0 truncate text-xs">{note.name}</span>
          </SidebarMenuButton>
        </div>

        <span className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="icon"
                size="icon-xs"
                className={cn('text-sidebar-foreground')}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  createChildMutation.mutate({
                    spaceId,
                    parentId: note.id,
                    name: 'new page',
                  });
                  if (!isExpanded) {
                    toggleExpand(note.id, true);
                  }
                }}
              >
                <Plus size={11} strokeWidth={3} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">add child</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="text-sidebar-foreground flex cursor-pointer items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(note.id, !isExpanded);
                }}
              >
                <ChevronRight
                  size={12}
                  strokeWidth={3}
                  className={cn(
                    'transition-transform duration-200',
                    isExpanded && 'rotate-90',
                  )}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isExpanded ? 'collapse' : 'expand'}
            </TooltipContent>
          </Tooltip>
        </span>
      </div>

      {isExpanded ? (
        children.length > 0 ? (
          <SidebarMenu className="w-full">
            {children.map((child) => (
              <NotesGroup
                key={child.id}
                note={child}
                byParent={byParent}
                depth={depth + 1}
              />
            ))}
          </SidebarMenu>
        ) : (
          <SidebarMenu className="w-full">
            <SidebarMenuItem className="w-full">
              <NoSubNotes depth={depth + 1} />
            </SidebarMenuItem>
          </SidebarMenu>
        )
      ) : null}
    </SidebarMenuItem>
  );
};

const NoSubNotes = ({ depth }: { depth: number }) => {
  return (
    <div
      style={{ paddingLeft: depth * 12 }}
      className="text-tiny text-muted-foreground-heavy min-w-0 truncate"
    >
      no sub notes
    </div>
  );
};
export const NotesSection2 = ({ notes }: NotesSectionProps) => {
  const byParent = useMemo(() => {
    const map = new Map<string | null, FlatNode[]>();

    for (const note of notes) {
      const key = note.parentId ?? null;

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)!.push(note);
    }

    return map;
  }, [notes]);

  const rootNodes = byParent.get(null) ?? [];

  // dnd
  const { isDropTarget, ref } = useDroppable({
    id: DROPPABLE_NOTES_SECTION_ID,
  });

  return (
    <div
      ref={ref}
      className={cn(
        isDropTarget
          ? 'border-sidebar-border border border-dashed'
          : 'border border-transparent',
        'rounded-2xl',
      )}
    >
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="w-full">
            {rootNodes.map((note) => (
              <NotesGroup
                key={note.id}
                note={note}
                byParent={byParent}
                depth={0}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
};
