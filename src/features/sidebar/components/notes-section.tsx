import { useDraggable, useDroppable } from '@dnd-kit/react';
import { ChevronRight, Plus } from 'lucide-react';

import { useCreateNodeMutation } from '../api/use-nodes';
import { useSidebarStore } from '../stores/sidebar-store';

import { byParent } from './space-sidebar';

import { FlatNode } from '@/api/nodes';
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/tailwind';

/**
 * TODOS
 * make every parent call its children and not rely on the main component to do it, minimises re-render
 * {{ paddingLeft: depth * 12 }} this should be driven by that css variable
 */

interface NotesSectionProps {
  nodes: FlatNode[];
  expandParentNodes: (nodeId: string) => void;
}

interface NotesGroupProps {
  node: FlatNode;
  byParent: Map<string | null, FlatNode[]>;
  expandParentNodes: (nodeId: string) => void;
}

export const DROPPABLE_NOTES_SECTION_ID = 'notes-section';

const NotesGroup = ({ node, byParent, expandParentNodes }: NotesGroupProps) => {
  const children = byParent.get(node.id) ?? [];
  const spaceId = node.spaceId;

  const isExpanded = useSidebarStore((s) => s.expandedIds.has(node.id));
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);

  const isActive = useSidebarStore((s) => s.activeNodeId === node.id);
  const setActiveNodeId = useSidebarStore((s) => s.setActiveNodeId);

  // create childs notes
  const createChildMutation = useCreateNodeMutation();

  const { ref, handleRef, isDragging } = useDraggable({
    id: node.id,
    type: 'item',
  });

  const { ref: droppableRef } = useDroppable({
    id: node.id,
  });

  return (
    <SidebarMenuItem className="w-full">
      <div className="w-full">
        <SidebarMenuButton
          asChild
          variant="outline"
          size="sm"
          isActive={isActive}
          className="w-full"
        >
          <div
            ref={(el) => {
              ref(el);
              handleRef(el);
              droppableRef(el);
            }}
            data-sidebar-dnd-dragging={isDragging}
            className="group/note-row flex w-full items-center gap-1"
            onClick={() => {
              setActiveNodeId(node.id);
              expandParentNodes(node.id);
            }}
          >
            <span className="min-w-0 flex-1 truncate text-xs">{node.name}</span>

            <span className="pointer-events-none ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/note-row:pointer-events-auto group-hover/note-row:opacity-100">
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-sidebar-foreground hover:text-sidebar-accent-foreground flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      createChildMutation.mutate({
                        spaceId,
                        parentId: node.id,
                        name: 'new page',
                      });
                      if (!isExpanded) {
                        toggleExpand(node.id, true);
                      }
                    }}
                  >
                    <Plus size={11} strokeWidth={3} />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-sidebar text-sidebar-foreground border-sidebar-border"
                >
                  add child
                </TooltipContent>
              </Tooltip>

              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-sidebar-foreground hover:text-sidebar-accent-foreground flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node.id, !isExpanded);
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
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-sidebar text-sidebar-foreground border-sidebar-border"
                >
                  {isExpanded ? 'collapse' : 'expand'}
                </TooltipContent>
              </Tooltip>
            </span>
          </div>
        </SidebarMenuButton>
      </div>

      {isExpanded ? (
        children.length > 0 ? (
          <SidebarMenuSub className="mt-1 gap-1">
            {children.map((child) => (
              <NotesGroup
                key={child.id}
                node={child}
                byParent={byParent}
                expandParentNodes={expandParentNodes}
              />
            ))}
          </SidebarMenuSub>
        ) : (
          <SidebarMenuSub className="mt-1 gap-1">
            <SidebarMenuItem className="w-full">
              <NoSubNotes />
            </SidebarMenuItem>
          </SidebarMenuSub>
        )
      ) : null}
    </SidebarMenuItem>
  );
};

const NoSubNotes = () => {
  return (
    <div className="w-full">
      <div className="text-tiny text-muted-foreground-heavy flex h-7 min-w-0 items-center truncate px-2.5">
        no sub notes
      </div>
    </div>
  );
};
export const NotesSection = ({
  nodes,
  expandParentNodes,
}: NotesSectionProps) => {
  const parentNodesMap = byParent(nodes);
  const rootNodes = parentNodesMap.get(null) ?? [];

  // dnd
  const { isDropTarget, ref } = useDroppable({
    id: DROPPABLE_NOTES_SECTION_ID,
  });

  return (
    <SidebarGroupContent>
      <div
        ref={ref}
        className={cn(
          isDropTarget
            ? 'border-sidebar-border border border-dashed'
            : 'border border-transparent',
          'rounded-2xl p-1',
        )}
      >
        <SidebarMenu className="w-full gap-1">
          {rootNodes.map((node) => (
            <NotesGroup
              key={node.id}
              node={node}
              byParent={parentNodesMap}
              expandParentNodes={expandParentNodes}
            />
          ))}
        </SidebarMenu>
      </div>
    </SidebarGroupContent>
  );
};
