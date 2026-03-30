import { useMemo } from 'react';
import { FlatNodeDto } from '@/api/nodes';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSidebarStore } from '../stores/sidebar-store';
import { cn } from '@/utils/tailwind';
import { ChevronRight, Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

/**
 * TODOS"
 * make indentation on either of the element correct
 */

interface NotesSectionProps {
  notes: FlatNodeDto[];
}

interface NotesGroupProps {
  note: FlatNodeDto;
  byParent: Map<string | null, FlatNodeDto[]>;
  depth: number;
}

const NotesGroup = ({ note, byParent, depth }: NotesGroupProps) => {
  const children = byParent.get(note.id) ?? [];
  const isExpanded = useSidebarStore((s) => s.expandedIds.has(note.id));
  const activeNodeId = useSidebarStore((s) => s.activeNodeId);
  const isActive = activeNodeId === note.id;
  const setActiveNodeId = useSidebarStore((s) => s.setActiveNodeId);
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);

  console.log('isExpanded', isExpanded, 'note.id', note.id);
  return (
    <SidebarMenuItem className="w-full">
      <div
        className="flex w-full items-center"
        style={{ paddingLeft: depth * 12 }}
      >
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

      {children.length > 0 && isExpanded ? (
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
      )}
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
    const map = new Map<string | null, FlatNodeDto[]>();

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

  return (
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
  );
};
