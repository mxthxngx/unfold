import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useNavigate } from '@tanstack/react-router';
import { Ripple } from '@/components/ui/ripple';
import { DialogRoot, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Modal } from '@/components/ui/modal';
import { DeleteConfirmationModal } from '@/components/common/delete-confirmation-modal';
import { Node as SidebarNode } from '../../types/sidebar';
import { cn } from '@/lib/tiptap-utils';
import { findFirstFileId } from '@/lib/file-tree';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { Tooltip, TooltipTrigger, AppTooltipContent } from '@/components/ui/tooltip';
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"
import { ChevronDown, Plus, Trash2, Pencil } from 'lucide-react';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const Sidebar = memo(function Sidebar() {
  const {
    spaces,
    activeSpaceId,
    fileTree,
    pinnedNodes,
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
    setActiveSpace(spaceId);
    setIsSpaceMenuOpen(false);
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
        'bg-sidebar-container-bg border-0',
        'shadow-none',
        'top-10! bottom-auto! h-[calc(100vh-2.5rem)]!',
        'flex flex-col'
      )}
    >
      <SidebarHeader className="px-4 pt-3">
        <div className="h-1" />
      </SidebarHeader>

         <SidebarContent className="px-4 overflow-y-auto">
        {!isLoading && pinnedNodes.length > 0 && (
          <div className="mb-1">
            <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1">
              <span className="text-xs text-sidebar-foreground/50 font-medium tracking-wide font-sans-serif lowercase">
                pinned
              </span>
            </div>
            <SidebarMenu className="space-y-0.5">
              {pinnedNodes.map((node) => (
                <PinnedNodeItem
                  key={node.id}
                  node={node}
                  selectedItem={fileId || null}
                  addFileShortcut={addFileShortcut}
                />
              ))}
            </SidebarMenu>
          </div>
        )}

        <div className={cn(!isLoading && pinnedNodes.length > 0 && 'mt-2')}>
          <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1">
            <span className="text-xs text-sidebar-foreground/50 font-medium tracking-wide font-sans-serif lowercase">
              notes
            </span>
          </div>
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
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-container-border/80 px-4 py-3">
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
              className="max-h-[60vh]"
            >
              <div className="text-[10px] uppercase tracking-[0.08em] text-foreground-muted-secondary font-medium px-2.5 mb-1">
                spaces
              </div>
              <div className="max-h-[48vh] overflow-y-auto overscroll-contain space-y-0.5 pr-1">
                {sortedSpaces.map((space) => {
                  const isActive = space.id === activeSpaceId;
                  const isEditing = editingSpaceId === space.id;

                  return (
                    <div
                      key={space.id}
                      onClick={() => handleSwitchSpace(space.id)}
                      ref={isActive ? activeSpaceItemRef : undefined}
                      className={cn(
                        'group/space flex items-center gap-2 rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all duration-150 border',
                        isActive
                          ? 'bg-sidebar-item-hover-bg/80 text-foreground border-border-elevated'
                  : 'text-foreground/85 hover:bg-hover-bg-subtle hover:text-foreground border-transparent'
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
                          className="w-full rounded-md bg-surface-elevated text-foreground px-2 py-1 text-xs outline-none border border-surface-elevated-border focus:border-surface-elevated-focus transition-all duration-200"
                        />
                      ) : (
                        <button
                          onClick={() => handleSwitchSpace(space.id)}
                          className="flex-1 text-left truncate text-xs font-medium text-inherit"
                        >
                          {space.name}
                        </button>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/space:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSpaceId(space.id);
                              setDraftName(space.name);
                            }}
                            className="rounded-md p-1 hover:bg-surface-elevated-border text-foreground-muted-secondary hover:text-foreground-muted-hover transition-colors duration-200"
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
                              'rounded-md p-1 hover:bg-surface-elevated-border text-foreground-muted-secondary hover:text-foreground-muted-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200'
                            )}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleOpenCreateSpace}
                className="w-full mt-2 rounded-lg px-3 py-2 bg-surface-deeper border border-border-strong text-foreground-muted-tertiary hover:text-foreground-muted-hover hover:bg-hover-bg-subtle hover:border-surface-border-hover transition-all duration-200 ease-out flex items-center gap-2 justify-center text-xs font-medium"
              >
                <Plus size={14} strokeWidth={2} />
                <span>add new space</span>
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
          className="flex flex-col gap-6 p-6"
        >
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-sidebar-title">create space</h3>
            <p className="text-sm text-foreground-muted-tertiary">name your new space to organize your documents.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-[11px] uppercase tracking-[0.08em] text-foreground-muted-secondary font-medium  pointer-events-auto">
              space name
            </label>
            <input
              autoFocus
              value={newSpaceName}
              onChange={(event) => {
                setNewSpaceName(event.target.value);
                if (createSpaceError) setCreateSpaceError('');
              }}
              aria-invalid={!!createSpaceError}
              className="w-full rounded-lg bg-surface-elevated border border-surface-elevated-border text-sidebar-title px-3.5 py-2.5 text-sm outline-none placeholder:text-input-placeholder focus:border-surface-elevated-focus focus:bg-surface-deep transition-all duration-200 pointer-events-auto"
              placeholder="enter a space name"
            />
            <p className="min-h-[1.1rem] text-xs text-error">
              {createSpaceError ? createSpaceError : ''}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseCreateSpace}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-foreground-muted-tertiary hover:text-foreground-muted-hover hover:bg-surface-elevated transition-all duration-200 pointer-events-auto"
            >
              cancel
            </button>
            <Button
            variant={"outline"}
              type="submit"
              className="pointer-events-auto"
            >
              create space
            </Button>
          </div>
        </form>
      </Modal>
      <DeleteConfirmationModal
        isOpen={!!spaceToDelete}
        itemName={spaceToDelete?.name || 'space'}
        onCancel={handleCancelDeleteSpace}
        onConfirm={handleConfirmDeleteSpace}
      />
    </ShadcnSidebar>
  );
});

const PinnedNodeItem = memo(({
  node,
  selectedItem,
  addFileShortcut,
}: {
  node: SidebarNode;
  selectedItem: null | string;
  addFileShortcut: string;
}) => {
  const { addNode, deleteNode, getPreviousVisibleNode, togglePinNode } = useFileSystem();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isSelected = selectedItem === node.id;

  const handleOpenDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);
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

  const handleCreateChild = async () => {
    const newId = await addNode(node.id);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  const handleTogglePin = async () => {
    await togglePinNode(node.id);
  };

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = await addNode(node.id);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  return (
    <>
      <SidebarMenuItem className="px-0">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                'group/pinned-item flex items-center w-full rounded-xl border transition-all text-[13px] font-[450] px-2 py-1',
                isSelected
                  ? 'bg-sidebar-subitem-selected-bg text-foreground/90 font-[450] border-border-elevated'
                  : 'text-sidebar-foreground/90 hover:text-foreground hover:bg-sidebar-item-hover-bg/80 border-transparent'
              )}
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
                <span className="block truncate select-none">{node.name || "new page"}</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 pl-2 overflow-hidden transition-opacity duration-150",
                  "opacity-0 max-w-0 pointer-events-none",
                  "group-hover/pinned-item:opacity-100 group-hover/pinned-item:max-w-22 group-hover/pinned-item:pointer-events-auto"
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
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleCreateChild}>
              Add child
              <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.CREATE_FILE)}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={handleTogglePin}>
              Unpin
              <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.PIN_NOTE)}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => handleOpenDeleteModal()} variant="destructive">
              Delete
              <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.DELETE_NOTE)}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </SidebarMenuItem>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemName={node.name || 'note'}
        onCancel={handleCancelDeleteNode}
        onConfirm={handleConfirmDeleteNode}
      />
    </>
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
  const { toggleFolder, addNode, deleteNode, getPreviousVisibleNode, togglePinNode, isNodePinned } = useFileSystem();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const hasChildren = node.nodes && node.nodes.length > 0;
  const isSelected = selectedItem === node.id;
  const isPinned = isNodePinned(node.id);
  const isOpen = !!node.isOpen;

  const subtreeTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'tween' as const, duration: 0.34, ease: [0.42, 0, 0.58, 1] as const };
  const iconTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 380, damping: 28, mass: 0.35 };

  const handleOpenDeleteModal = useCallback((_nodeId?: string) => {
    setIsDeleteModalOpen(true);
  }, []);
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

  const handleCreateChild = async () => {
    const newId = await addNode(node.id);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  const handleTogglePin = async () => {
    await togglePinNode(node.id);
  };

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
    <DeleteConfirmationModal
      isOpen={isDeleteModalOpen}
      itemName={node.name || 'note'}
      onCancel={handleCancelDeleteNode}
      onConfirm={handleConfirmDeleteNode}
    />
  );

  if (level === 0) {
    return (
      <>
        <SidebarMenuItem className="px-0">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                className={cn(
                  'group/item-row flex items-center w-full min-w-0 rounded-xl border transition-all text-[13px] font-[450] px-2 pr-2 py-1 box-border',
                  isSelected
                    ? 'bg-sidebar-item-hover-bg/80 text-foreground/90 font-[450] border-border-elevated'
                    : 'text-sidebar-foreground/90 hover:text-foreground hover:bg-sidebar-item-hover-bg/80 border-transparent'
                )}
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
                  <span className="block truncate select-none">{node.name || "new page"}</span>
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
                      <motion.span
                        className="inline-flex"
                        initial={false}
                        animate={{ rotate: isOpen ? 0 : -90, opacity: isOpen ? 1 : 0.9 }}
                        transition={iconTransition}
                      >
                        <ChevronDown size={14} strokeWidth={3} />
                      </motion.span>
                    </AnimatedIcon>
                    <Ripple />
                  </button>
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={handleCreateChild}>
                Add child
                <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.CREATE_FILE)}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onSelect={handleTogglePin}>
                {isPinned ? "Unpin" : "Pin"}
                <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.PIN_NOTE)}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => handleOpenDeleteModal()} variant="destructive">
                Delete
                <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.DELETE_NOTE)}</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key={`sub-${node.id}`}
                className="overflow-x-hidden overflow-y-hidden"
                initial={{ height: 0, opacity: 0, y: -4 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -4 }}
                transition={subtreeTransition}
              >
                <SidebarMenuSub 
                  className="ml-2.5 pl-2.5 pt-0 pb-0 gap-1 before:top-1"
                >
                  {hasChildren ? (
                    node.nodes!.map((childNode, index) => (
                      <motion.div
                        key={childNode.id}
                        layout
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={subtreeTransition}
                      >
                        <SidebarNodes
                          node={childNode}
                          selectedItem={selectedItem}
                          level={level + 1}
                          isFirstChild={index === 0}
                          addFileShortcut={addFileShortcut}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-sidebar-foreground/50 text-xs py-1 px-2 mt-1">No sub notes</div>
                  )}
                </SidebarMenuSub>
              </motion.div>
            )}
          </AnimatePresence>
        </SidebarMenuItem>
    {deleteModal}
      </>
    );
  }

  return (
    <>
      <SidebarMenuSubItem className={cn(isFirstChild && 'mt-1', 'px-0')}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                'group/sub-item-row flex items-center w-full min-w-0 rounded-xl border transition-all text-[13px] font-[450] px-2 py-1 box-border',
                isSelected
                  ? 'bg-sidebar-item-hover-bg/80 text-foreground/90 font-[450] border-border-elevated'
                  : 'text-sidebar-foreground/90 hover:text-foreground hover:bg-sidebar-item-hover-bg/70 border-transparent'
              )}
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
                <span className="block truncate select-none">{node.name || "new page"}</span>
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
                    <motion.span
                      className="inline-flex"
                      initial={false}
                      animate={{ rotate: isOpen ? 0 : -90, opacity: isOpen ? 1 : 0.9 }}
                      transition={iconTransition}
                    >
                      <ChevronDown size={14} strokeWidth={3} />
                    </motion.span>
                  </AnimatedIcon>
                  <Ripple />
                </button>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleCreateChild}>
              Add child
              <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.CREATE_FILE)}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={handleTogglePin}>
              {isPinned ? "Unpin" : "Pin"}
              <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.PIN_NOTE)}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => handleOpenDeleteModal()} variant="destructive">
              Delete
              <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.DELETE_NOTE)}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key={`sub-${node.id}`}
                className="overflow-x-hidden overflow-y-hidden"
                initial={{ height: 0, opacity: 0, y: -4 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -4 }}
                transition={subtreeTransition}
              >
                <SidebarMenuSub 
                  className="ml-0 pl-2.5 pt-0 pb-0 gap-1 before:top-1"
                >
                  {hasChildren ? (
                    node.nodes!.map((childNode, index) => (
                      <motion.div
                        key={childNode.id}
                        layout
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={subtreeTransition}
                      >
                        <SidebarNodes
                          node={childNode}
                          selectedItem={selectedItem}
                          level={level + 1}
                          isFirstChild={index === 0}
                          addFileShortcut={addFileShortcut}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-sidebar-foreground/50 text-xs py-1 px-2 mt-1">No sub notes</div>
                  )}
                </SidebarMenuSub>
              </motion.div>
            )}
          </AnimatePresence>
      </SidebarMenuSubItem>
    {deleteModal}
    </>
  );
});

export default Sidebar;
