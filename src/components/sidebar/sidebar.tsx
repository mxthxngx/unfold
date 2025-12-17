import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useNavigate } from '@tanstack/react-router';
import { Ripple } from '@/components/ui/ripple';
import { DialogRoot, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Modal } from '@/components/ui/modal';
import { Node as SidebarNode } from '../../types/sidebar';
import { cn } from '@/lib/tiptap-utils';
import { findFirstFileId } from '@/lib/file-tree';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useSidebarContextMenu } from '@/hooks/use-sidebar-context-menu';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { Tooltip, TooltipTrigger, AppTooltipContent } from '@/components/ui/tooltip';
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
import { Skeleton } from '@/components/ui/skeleton';

const Sidebar = memo(function Sidebar() {
  const {
    spaces,
    activeSpaceId,
    fileTree,
    spaceName,
    isLoading,
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
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [newSpaceName, setNewSpaceName] = useState('');
  const [createSpaceError, setCreateSpaceError] = useState('');
  const [spaceToDelete, setSpaceToDelete] = useState<{ id: string; name: string } | null>(null);
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

  const handleGlobalAdd = async () => {
    const newId = await addNode(null);
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

    const firstId = findFirstFileId(target.fileTree);
    if (firstId) {
      navigate({ to: '/files/$fileId', params: { fileId: firstId } });
    } else {
      navigate({ to: '/' });
    }
  };

  const handleOpenCreateSpace = () => {
    setNewSpaceName('');
    setCreateSpaceError('');
    setIsSpaceMenuOpen(false);
    setIsCreateSpaceOpen(true);
  };

  const handleCloseCreateSpace = () => {
    setIsCreateSpaceOpen(false);
    setNewSpaceName('');
    setCreateSpaceError('');
  };

  const handleCreateSpace = async (event?: React.FormEvent | KeyboardEvent | MouseEvent) => {
    event?.preventDefault?.();
    const nextName = newSpaceName.trim();
    if (!nextName) {
      setCreateSpaceError('Space name is required');
      return;
    }
    await addSpace(nextName);
    setIsCreateSpaceOpen(false);
    setEditingSpaceId(null);
    setDraftName('');
    setNewSpaceName('');
    setCreateSpaceError('');
  };

  const handleRenameCommit = async (spaceId: string) => {
    await renameSpace(spaceId, draftName || 'Untitled Space');
    setEditingSpaceId(null);
    setDraftName('');
  };

  const handleRequestDeleteSpace = (spaceId: string) => {
    if (spaces.length <= 1) return;
    const targetSpace = spaces.find((space) => space.id === spaceId);
    if (!targetSpace) return;
    setSpaceToDelete({ id: spaceId, name: targetSpace.name });
  };

  const handleCancelDeleteSpace = () => setSpaceToDelete(null);

  const handleConfirmDeleteSpace = async () => {
    if (!spaceToDelete) return;
    const spaceId = spaceToDelete.id;
    const remaining = spaces.filter((space) => space.id !== spaceId);
    const nextSpace = spaceId === activeSpaceId ? remaining[0] : spaces.find((s) => s.id === activeSpaceId);

    await deleteSpace(spaceId);
    setIsSpaceMenuOpen(false);
    setSpaceToDelete(null);

    if (!nextSpace) {
      navigate({ to: '/' });
      return;
    }

    const firstId = findFirstFileId(nextSpace.fileTree);
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

  const addFileShortcut = useMemo(
    () => getShortcutDisplay(KEYBOARD_SHORTCUTS.CREATE_FILE),
    []
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
        <SidebarMenu className="space-y-0.5 pt-px">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <SidebarMenuItem key={i}>
                  <div className="flex items-center px-2 py-1.5">
                    <Skeleton className="h-4 w-50 rounded" />
                  </div>
                </SidebarMenuItem>
              ))}
            </>
          ) : (
            fileTree.map((node) => (
              <SidebarNodes
                key={node.id}
                node={node}
                selectedItem={fileId || null}
                level={0}
                addFileShortcut={addFileShortcut}
              />
            ))
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2 w-full">
          <DialogRoot className="relative flex-1">
            <DialogTrigger
              ref={triggerRef}
              label={spaceName}
              isOpen={isSpaceMenuOpen}
              onClick={() => setIsSpaceMenuOpen((open) => !open)}
              className="bg-sidebar-item-hover-bg/50"
            />

            <DialogContent
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
                              handleRequestDeleteSpace(space.id);
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
                onClick={handleOpenCreateSpace}
                className="w-full mt-1 px-3 py-3 rounded-xl border-2 border-dashed border-sidebar-border/40 bg-sidebar/25 text-sidebar-foreground/70 hover:text-sidebar-foreground/80 hover:bg-sidebar-item-hover-bg/35 hover:border-sidebar-border/50 transition-colors flex items-center gap-2 justify-center text-sm font-medium"
              >
                <Plus size={14} strokeWidth={2.5} />
                Add new space
              </button>
            </DialogContent>
          </DialogRoot>

          <Tooltip delayDuration={120}>
            <TooltipTrigger asChild>
              <button
                onClick={handleGlobalAdd}
                title=""
                className="rounded-md hover:bg-sidebar-icon-hover-bg/60 active:scale-95 transition-all size-5 flex items-center justify-center shrink-0 relative overflow-hidden text-sidebar-foreground"
              >
                <AnimatedIcon className="w-full h-full flex items-center justify-center">
                  <Plus size={14} strokeWidth={3}/>
                </AnimatedIcon>
                <Ripple />
              </button>
            </TooltipTrigger>
            <AppTooltipContent label="Add a new file" shortcut={addFileShortcut} />
          </Tooltip>
        </div>
      </SidebarFooter>

      <Modal
        open={isCreateSpaceOpen}
        onClose={handleCloseCreateSpace}
        onCancel={handleCloseCreateSpace}
        onConfirm={handleCreateSpace}
      >
        <form
          onSubmit={handleCreateSpace}
          className="flex flex-col gap-(--space-md) p-(--space-lg)"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-sidebar-foreground">Create space</h3>
            <p className="text-sm text-sidebar-foreground/80">Name your new space.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.08em] text-sidebar-foreground/70">
              Space name
            </label>
            <input
              autoFocus
              value={newSpaceName}
              onChange={(event) => {
                setNewSpaceName(event.target.value);
                if (createSpaceError) setCreateSpaceError('');
              }}
              aria-invalid={!!createSpaceError}
              className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground px-3 py-2 text-sm outline-none focus:border-sidebar-ring focus:ring-0"
              placeholder="Enter a space name"
            />
            <p className="min-h-[1.1rem] text-xs text-red-400">
              {createSpaceError ? createSpaceError : ''}
            </p>
          </div>

          <div className="flex items-center justify-end gap-(--space-sm)">
            <button
              type="button"
              onClick={handleCloseCreateSpace}
              className="inline-flex items-center gap-1.5 rounded-md border border-modal-action-border bg-modal-action-bg px-3 py-2 text-sm font-medium text-modal-action-text hover:bg-modal-action-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md border border-modal-action-border bg-white text-modal-primary-foreground px-3 py-2 text-sm font-medium hover:bg-[rgba(255,255,255,0.9)] transition-colors"
            >
              Create space
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={!!spaceToDelete}
        onClose={handleCancelDeleteSpace}
        onCancel={handleCancelDeleteSpace}
        onConfirm={handleConfirmDeleteSpace}
      >
        <div className="flex flex-col gap-(--space-md) p-5">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-sidebar-foreground">
              {spaceToDelete ? `Delete "${spaceToDelete.name}"?` : 'Delete space?'}
            </h3>
            <p className="text-sm text-sidebar-foreground/80">
              This will move all the content to trash for 15 days. You can restore it from Trash during that window.
            </p>
          </div>
          <div className="flex items-center justify-end gap-(--space-sm)">
            <button
              type="button"
              onClick={handleCancelDeleteSpace}
              className="inline-flex items-center gap-1.5 rounded-md border border-modal-action-border bg-modal-action-bg px-3 py-2 text-sm font-medium text-modal-action-text hover:bg-modal-action-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteSpace}
              className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-red-500/70 px-3 py-2 text-sm font-medium text-white/95 shadow-sm hover:bg-red-500/85 transition-colors"
            >
              Move to trash
            </button>
          </div>
        </div>
      </Modal>
    </ShadcnSidebar>
  );
});

export const SidebarNodes = memo(({ 
  node, 
  selectedItem, 
  level = 0,
  isFirstChild = false,
  addFileShortcut
}: { 
  node: SidebarNode;
  selectedItem: null | string;
  level?: number;
  isFirstChild?: boolean;
  addFileShortcut: string;
}) => {
  const { toggleFolder, addNode, deleteNode, getPreviousVisibleNode } = useFileSystem();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const hasChildren = node.nodes && node.nodes.length > 0;
  const isSelected = selectedItem === node.id;

  const handleOpenDeleteModal = useCallback((_nodeId?: string) => setIsDeleteModalOpen(true), []);
  const handleCancelDeleteNode = () => setIsDeleteModalOpen(false);
  const handleConfirmDeleteNode = async () => {
    if (selectedItem === node.id) {
      const prevNodeId = getPreviousVisibleNode(node.id);
      if (prevNodeId) {
        navigate({ to: '/files/$fileId', params: { fileId: prevNodeId } });
      } else {
        navigate({ to: '/' });
      }
    }
    await deleteNode(node.id);
    setIsDeleteModalOpen(false);
  };

  // Context menu handler
  const { handleContextMenu } = useSidebarContextMenu({
    nodeId: node.id,
    onCreateChild: async (nodeId) => {
      const newId = await addNode(nodeId);
      navigate({ to: '/files/$fileId', params: { fileId: newId } });
    },
    onDelete: handleOpenDeleteModal
  });

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = await addNode(node.id);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(node.id);
  };

  useEffect(() => {
    const handleGlobalDeleteRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ nodeId: string }>).detail;
      if (detail?.nodeId === node.id) {
        setIsDeleteModalOpen(true);
      }
    };

    window.addEventListener('sidebar:delete-node', handleGlobalDeleteRequest as EventListener);
    return () => {
      window.removeEventListener('sidebar:delete-node', handleGlobalDeleteRequest as EventListener);
    };
  }, [node.id]);

  const deleteModal = (
    <Modal
      open={isDeleteModalOpen}
      onClose={handleCancelDeleteNode}
      onCancel={handleCancelDeleteNode}
      onConfirm={handleConfirmDeleteNode}
    >
      <div className="flex flex-col gap-(--space-md) p-5">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-sidebar-foreground">
            Delete "{node.name}"?
          </h3>
          <p className="text-sm text-sidebar-foreground/80">
            This will move all the content to trash for 15 days. You can restore it from Trash during that window.
          </p>
        </div>
        <div className="flex items-center justify-end gap-(--space-sm)">
          <button
            type="button"
            onClick={handleCancelDeleteNode}
            className="inline-flex items-center gap-1.5 rounded-md border border-modal-action-border bg-modal-action-bg px-3 py-2 text-sm font-medium text-modal-action-text hover:bg-modal-action-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDeleteNode}
            className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-red-500/70 px-3 py-2 text-sm font-medium text-white/95 shadow-sm hover:bg-red-500/85 transition-colors"
          >
            Move to trash
          </button>
        </div>
      </div>
    </Modal>
  );

  // Root level items
  if (level === 0) {
    return (
      <>
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
              <span className="block truncate select-none">{node.name}</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1 pl-2 overflow-hidden transition-opacity duration-150",
                "opacity-0 max-w-0 pointer-events-none",
                "group-hover/item-row:opacity-100 group-hover/item-row:max-w-22 group-hover/item-row:pointer-events-auto"
              )}
            >
              <Tooltip delayDuration={120}>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <AppTooltipContent label="Add a new file" shortcut={addFileShortcut} />
              </Tooltip>

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
                    addFileShortcut={addFileShortcut}
                  />
                ))
              ) : (
                <div className="text-sidebar-foreground/50 text-xs py-1 px-2 mt-1">No sub notes</div>
              )}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
    {deleteModal}
      </>
    );
  }

  // Nested items
  return (
    <>
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
              <span className="block truncate select-none">{node.name}</span>
            </div>

            <div
              className={cn(
                "flex items-center gap-1 pl-2 overflow-hidden transition-opacity duration-150",
                "opacity-0 max-w-0 pointer-events-none",
                "group-hover/sub-item-row:opacity-100 group-hover/sub-item-row:max-w-22 group-hover/sub-item-row:pointer-events-auto"
              )}
            >
              <Tooltip delayDuration={120}>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <AppTooltipContent label="Add a new file" shortcut={addFileShortcut} />
              </Tooltip>

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
                    addFileShortcut={addFileShortcut}
                  />
                ))
              ) : (
                <div className="text-sidebar-foreground/50 text-xs py-1 px-2 mt-1">No sub notes</div>
              )}
            </SidebarMenuSub>
          )}
        </>
      </SidebarMenuSubItem>
    {deleteModal}
    </>
  );
});

export default Sidebar;
