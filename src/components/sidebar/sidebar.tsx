import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useNavigate } from '@tanstack/react-router';
import { Ripple } from '@/components/ui/ripple';
import {
  SpaceDialogRoot,
  SpaceDialogTrigger,
  SpaceDialogContent,
} from '@/components/ui/space-dialog';
import { Node as SidebarNode } from '../../types/sidebar';
import { cn } from '@/lib/tiptap-utils';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useSidebarContextMenu } from '@/hooks/use-sidebar-context-menu';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { motion } from 'framer-motion';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react';
import { AnimatedIcon } from '@/components/ui/animated-icon';

const findFirstNode = (nodes: SidebarNode[]): string | null => {
  if (!nodes || nodes.length === 0) return null;
  const [first] = nodes;
  return first?.id ?? null;
};

const Sidebar = memo(function Sidebar() {
  const {
    spaces,
    activeSpaceId,
    fileTree,
    spaceName,
    addNode,
    addSpace,
    renameSpace,
    deleteSpace,
    setActiveSpace,
    getNodePath,
    toggleFolder,
  } = useFileSystem();
  const { fileId } = useParams({ strict: false });
  const navigate = useNavigate();
  const lastExpandedFileId = useRef<string | null>(null);
  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const activeSpaceItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (fileId && fileId !== lastExpandedFileId.current) {
      lastExpandedFileId.current = fileId;
      const path = getNodePath(fileId);
      path.forEach((node, index) => {
        if (index < path.length - 1 && node.nodes && node.nodes.length > 0 && !node.isOpen) {
          toggleFolder(node.id);
        }
      });
    }
  }, [fileId, getNodePath, toggleFolder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        isSpaceMenuOpen &&
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setIsSpaceMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isSpaceMenuOpen]);

  useEffect(() => {
    if (isSpaceMenuOpen && activeSpaceItemRef.current) {
      activeSpaceItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSpaceMenuOpen, activeSpaceId]);

  const handleGlobalAdd = () => {
    const newId = addNode(null);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  const handleSwitchSpace = (spaceId: string) => {
    const target = spaces.find((space) => space.id === spaceId);
    setActiveSpace(spaceId);
    setIsSpaceMenuOpen(false);

    if (!target) {
      navigate({ to: '/' });
      return;
    }

    const firstId = findFirstNode(target.fileTree);
    if (firstId) {
      navigate({ to: '/files/$fileId', params: { fileId: firstId } });
    } else {
      navigate({ to: '/' });
    }
  };

  const handleAddSpace = () => {
    const newId = addSpace('New Space');
    setEditingSpaceId(newId);
    setDraftName('New Space');
    setIsSpaceMenuOpen(true);
    navigate({ to: '/' });
  };

  const handleRenameCommit = (spaceId: string) => {
    renameSpace(spaceId, draftName || 'Untitled Space');
    setEditingSpaceId(null);
    setDraftName('');
  };

  const handleDeleteSpace = (spaceId: string) => {
    if (spaces.length <= 1) return;
    const remaining = spaces.filter((space) => space.id !== spaceId);
    const nextSpace = spaceId === activeSpaceId ? remaining[0] : spaces.find((s) => s.id === activeSpaceId);

    deleteSpace(spaceId);
    setIsSpaceMenuOpen(false);

    if (!nextSpace) {
      navigate({ to: '/' });
      return;
    }

    const firstId = findFirstNode(nextSpace.fileTree);
    if (firstId) {
      navigate({ to: '/files/$fileId', params: { fileId: firstId } });
    } else {
      navigate({ to: '/' });
    }
  };

  const sortedSpaces = useMemo(
    () => [...spaces].sort((a, b) => a.name.localeCompare(b.name)),
    [spaces]
  );

  return (
    <ShadcnSidebar 
      variant="sidebar"
      collapsible="offcanvas"
      className={cn(
        'bg-sidebar-container-bg/80 border-sidebar-container-border/80',
        'backdrop-blur-xl border-r border-b border-l border-t-0',
        'shadow-[0_10px_40px_-25px_rgba(0,0,0,0.8)]',
        'top-10! bottom-auto! h-[calc(100vh-2.5rem)]!',
        'flex flex-col'
      )}
    >
      <SidebarHeader className="px-4 pt-3">
        <div className="h-1" />
      </SidebarHeader>

      <SidebarContent className="px-4 overflow-y-auto">
        <SidebarMenu className="space-y-0.5">
          {fileTree.map((node) => (
            <SidebarNodes key={node.id} node={node} selectedItem={fileId || null} level={0} />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2 w-full">
          <SpaceDialogRoot className="relative flex-1">
            <SpaceDialogTrigger
              ref={triggerRef}
              label={spaceName}
              isOpen={isSpaceMenuOpen}
              onClick={() => setIsSpaceMenuOpen((open) => !open)}
              className="bg-sidebar-item-hover-bg/50"
            />

            <SpaceDialogContent
              isOpen={isSpaceMenuOpen}
              menuRef={menuRef}
              className="max-h-[60vh] bg-sidebar/95 backdrop-blur-xl px-3 py-2.5 space-y-2"
            >
              <div className="text-xs uppercase tracking-[0.08em] text-sidebar-foreground/60 px-1">
                Spaces
              </div>
              <div className="max-h-[48vh] overflow-y-auto overscroll-contain space-y-2 pr-1">
                {sortedSpaces.map((space) => {
                  const isActive = space.id === activeSpaceId;
                  const isEditing = editingSpaceId === space.id;

                  return (
                    <motion.div
                      key={space.id}
                      ref={isActive ? activeSpaceItemRef : undefined}
                      layout
                      className={cn(
                        'group/space flex items-center gap-.5 rounded-lg px-2.5 py-1.5 transition-colors',
                        isActive
                          ? 'bg-sidebar-selected-bg text-white border border-sidebar-border/60'
                          : 'text-sidebar-foreground hover:bg-sidebar-item-hover-bg/80'
                      )}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onBlur={() => handleRenameCommit(space.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameCommit(space.id);
                            if (e.key === 'Escape') {
                              setEditingSpaceId(null);
                              setDraftName('');
                            }
                          }}
                          className="w-full rounded-md bg-sidebar-accent text-sidebar-foreground px-2 py-1 text-sm outline-none border border-sidebar-border focus:border-sidebar-ring"
                        />
                      ) : (
                        <button
                          onClick={() => handleSwitchSpace(space.id)}
                          className="flex-1 text-left truncate text-sm font-medium text-inherit"
                        >
                          {space.name}
                        </button>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/space:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSpaceId(space.id);
                              setDraftName(space.name);
                            }}
                            className="rounded-md p-1 hover:bg-sidebar-icon-hover-bg text-sidebar-foreground/80"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSpace(space.id);
                            }}
                            disabled={sortedSpaces.length <= 1}
                            className={cn(
                              'rounded-md p-1 hover:bg-sidebar-icon-hover-bg text-sidebar-foreground/80 disabled:opacity-40 disabled:cursor-not-allowed'
                            )}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={handleAddSpace}
                className="w-full mt-1 py-4 rounded-lg border border-dashed border-sidebar-border text-sidebar-foreground/80 hover:text-sidebar-foreground hover:border-sidebar-ring hover:bg-sidebar-item-hover-bg/70 transition-colors px-3 py-2.5 flex items-center gap-2 justify-center text-sm font-medium"
              >
                <Plus size={14} strokeWidth={2.5} />
                Add new space
              </button>
            </SpaceDialogContent>
          </SpaceDialogRoot>

        <button
          onClick={handleGlobalAdd}
          title={`Create Child Note ${getShortcutDisplay(KEYBOARD_SHORTCUTS.CREATE_CHILD_NOTE)}`}
          className="flex items-center justify-center shrink-0 relative overflow-hidden size-7 rounded-full text-sidebar-foreground transition-all hover:bg-sidebar-item-hover-bg/80 active:scale-95"
        >
          <AnimatedIcon className="w-full h-full flex items-center justify-center">
            <Plus size={14} strokeWidth={3}/>
          </AnimatedIcon>
          <Ripple />
        </button>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
});

export const SidebarNodes = memo(({ 
  node, 
  selectedItem, 
  level = 0,
  isFirstChild = false
}: { 
  node: SidebarNode;
  selectedItem: null | string;
  level?: number;
  isFirstChild?: boolean;
}) => {
  const { toggleFolder, addNode, deleteNode, getPreviousVisibleNode } = useFileSystem();
  const navigate = useNavigate();

  const hasChildren = node.nodes && node.nodes.length > 0;
  const isSelected = selectedItem === node.id;

  // Context menu handler
  const { handleContextMenu } = useSidebarContextMenu({
    nodeId: node.id,
    onCreateChild: (nodeId) => {
      const newId = addNode(nodeId);
      navigate({ to: '/files/$fileId', params: { fileId: newId } });
    },
    onDelete: (nodeId) => {
      // If the deleted node is the selected one, navigate to the previous visible node
      if (selectedItem === nodeId) {
        const prevNodeId = getPreviousVisibleNode(nodeId);
        if (prevNodeId) {
          navigate({ to: '/files/$fileId', params: { fileId: prevNodeId } });
        } else {
          navigate({ to: '/' });
        }
      }
      deleteNode(nodeId);
    }
  });

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = addNode(node.id);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(node.id);
  };

  // Root level items
  if (level === 0) {
    return (
      <SidebarMenuItem className="px-0">
        <div
          className={cn(
            'group/item-row flex items-center w-full rounded-lg border transition-all text-[13px] font-[450] px-2 py-1',
            isSelected
              ? 'bg-sidebar-selected-bg text-white/90 font-[450] border-sidebar-border/70 ring-1 ring-sidebar-ring/30'
              : 'text-sidebar-foreground/90 hover:text-white hover:bg-sidebar-item-hover-bg/80 border-transparent'
          )}
          onClick={() => navigate({ to: '/files/$fileId', params: { fileId: node.id } })}
          onContextMenu={handleContextMenu}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate({ to: '/files/$fileId', params: { fileId: node.id } });
            }
          }}
        >
          <div className="flex-1 min-w-0">
            <span className="block truncate">{node.name}</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 pl-2 overflow-hidden transition-opacity duration-150",
              "opacity-0 max-w-0 pointer-events-none",
              "group-hover/item-row:opacity-100 group-hover/item-row:max-w-[5.5rem] group-hover/item-row:pointer-events-auto"
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddChild(e);
              }}
            className="rounded-md hover:bg-sidebar-icon-hover-bg/60 active:scale-95 transition-all size-5 flex items-center justify-center"
            >
              <AnimatedIcon className="w-full h-full flex items-center justify-center">
                <Plus size={14} strokeWidth={3}/>
              </AnimatedIcon>
              <Ripple />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(e);
              }}
            className="rounded-md hover:bg-sidebar-icon-hover-bg/60 active:scale-95 transition-all size-5 flex items-center justify-center"
            >
              <AnimatedIcon className="w-full h-full flex items-center justify-center">
                {node.isOpen ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
              </AnimatedIcon>
              <Ripple />
            </button>
          </div>
        </div>

        {node.isOpen && (
          <SidebarMenuSub 
            key={`sub-${node.id}`}
            className="ml-2.5 pl-2.5 pt-0 pb-0 gap-1 before:top-1"
          >
            {hasChildren ? (
              node.nodes!.map((childNode, index) => (
                <SidebarNodes
                  key={childNode.id}
                  node={childNode}
                  selectedItem={selectedItem}
                  level={level + 1}
                  isFirstChild={index === 0}
                />
              ))
            ) : (
              <div className="text-sidebar-foreground/50 text-xs py-1 px-2 mt-1">No sub notes</div>
            )}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  // Nested items
  return (
    <SidebarMenuSubItem className={cn(isFirstChild && 'mt-1', 'px-0')}>
      <>
        <div 
          className={cn(
            'group/sub-item-row flex items-center w-full rounded-lg border transition-all text-[13px] font-[450] px-2 py-1',
            isSelected
              ? 'bg-sidebar-selected-bg text-white/90 font-[450] border-sidebar-border/70 ring-1 ring-sidebar-ring/30'
              : 'text-sidebar-foreground/90 hover:text-white hover:bg-sidebar-item-hover-bg/70 border-transparent'
          )}
          onContextMenu={handleContextMenu}
          onClick={() => navigate({ to: '/files/$fileId', params: { fileId: node.id } })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate({ to: '/files/$fileId', params: { fileId: node.id } });
            }
          }}
        >
          <div className="flex-1 min-w-0">
            <span className="block truncate">{node.name}</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1 pl-2 overflow-hidden transition-opacity duration-150",
              "opacity-0 max-w-0 pointer-events-none",
              "group-hover/sub-item-row:opacity-100 group-hover/sub-item-row:max-w-[5.5rem] group-hover/sub-item-row:pointer-events-auto"
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddChild(e);
              }}
            className="rounded-md hover:bg-sidebar-icon-hover-bg/60 active:scale-95 transition-all size-5 flex items-center justify-center"
            >
              <AnimatedIcon className="w-full h-full flex items-center justify-center">
                <Plus size={14} strokeWidth={3} />
              </AnimatedIcon>
              <Ripple />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(e);
              }}
            className="rounded-md hover:bg-sidebar-icon-hover-bg/60 active:scale-95 transition-all size-5 flex items-center justify-center"
            >
              <AnimatedIcon className="w-full h-full flex items-center justify-center">
                {node.isOpen ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
              </AnimatedIcon>
              <Ripple />
            </button>
          </div>
        </div>
        {node.isOpen && (
          <SidebarMenuSub 
            key={`sub-${node.id}`}
            className="ml-0 pl-2.5 pt-0 pb-0 gap-1 before:top-1"
          >
            {hasChildren ? (
              node.nodes!.map((childNode, index) => (
                <SidebarNodes
                  key={childNode.id}
                  node={childNode}
                  selectedItem={selectedItem}
                  level={level + 1}
                  isFirstChild={index === 0}
                />
              ))
            ) : (
              <div className="text-sidebar-foreground/50 text-xs py-1 px-2 mt-1">No sub notes</div>
            )}
          </SidebarMenuSub>
        )}
      </>
    </SidebarMenuSubItem>
  );
});

export default Sidebar;
