import { memo, useEffect, useRef } from 'react';

import { useParams, useNavigate } from '@tanstack/react-router';
import { Ripple } from '@/components/ui/ripple';
import { Node } from '../../types/sidebar';
import { cn } from '@/lib/tiptap-utils';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useSidebarContextMenu } from '@/hooks/use-sidebar-context-menu';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { AnimatedIcon } from '@/components/ui/animated-icon';


const Sidebar = memo(function Sidebar() {
  const { fileTree, spaceName, addNode, getNodePath, toggleFolder } = useFileSystem();
  const { fileId } = useParams({ strict: false });
  const navigate = useNavigate();
  const lastExpandedFileId = useRef<string | null>(null);

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

  const handleGlobalAdd = () => {
    const newId = addNode(null);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  return (
    <ShadcnSidebar 
      variant="sidebar"
      collapsible="offcanvas"
      className={cn(
        'bg-sidebar-container-bg border-sidebar-container-border',
        'backdrop-blur-xl border-r border-b border-l border-t-0',
        'shadow-lg',
        'top-10! bottom-auto! h-[calc(100vh-2.5rem)]!',
        'flex flex-col'
      )}
    >
      <SidebarHeader className="px-4 pt-3">
        {/* Empty header, just for spacing */}
      </SidebarHeader>

      <SidebarContent className="px-4 overflow-y-auto">
        <SidebarMenu>
          {fileTree.map((node) => (
            <SidebarNodes key={node.id} node={node} selectedItem={fileId || null} level={0} />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-sidebar-foreground text-sm font-medium truncate min-w-0">
            {spaceName}
          </span>
          <button
            onClick={handleGlobalAdd}
            title={`Create Child Note ${getShortcutDisplay(KEYBOARD_SHORTCUTS.CREATE_CHILD_NOTE)}`}
            className="flex items-center justify-center hover:opacity-70 shrink-0 relative overflow-hidden rounded-md size-7"
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
  node: Node;
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
      <SidebarMenuItem>
        <div 
          className="group/item-row flex items-center w-full gap-1"
          onContextMenu={handleContextMenu}
        >
          <div
            onClick={() => navigate({ to: '/files/$fileId', params: { fileId: node.id } })}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <SidebarMenuButton
              isActive={isSelected}
              size="sm"
              className={cn(
                'w-full rounded-md',
                isSelected
                  ? 'bg-sidebar-selected-bg text-white font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-item-hover-bg hover:text-white'
              )}
            >
              <span className="truncate pl-2">{node.name}</span>
            </SidebarMenuButton>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover/item-row:opacity-100 shrink-0">
            <button
              onClick={handleAddChild}
              className="rounded hover:bg-sidebar-item-hover-bg relative overflow-hidden size-6 flex items-center justify-center"
            >
              <AnimatedIcon className="w-full h-full flex items-center justify-center">
                <Plus size={14} strokeWidth={3}/>
              </AnimatedIcon>
              <Ripple />
            </button>

            <button
              onClick={handleToggle}
              className="rounded hover:bg-sidebar-item-hover-bg relative overflow-hidden size-6 flex items-center justify-center"
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
    <SidebarMenuSubItem className={cn(isFirstChild && 'mt-1')}>
      <>
        <div 
          className="group/sub-item-row flex items-center w-full gap-1"
          onContextMenu={handleContextMenu}
        >
          <div
  onClick={() => navigate({ to: '/files/$fileId', params: { fileId: node.id } })}
  className="flex-1 min-w-0 cursor-pointer"
>
    <SidebarMenuSubButton
      isActive={isSelected}
      size="sm"
      className={cn(
        'w-full rounded-md',
        isSelected
          ? 'bg-sidebar-selected-bg text-white font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-item-hover-bg hover:text-white'
      )}
    >
      <span className="truncate pl-2 text-xs">{node.name}</span>
    </SidebarMenuSubButton>
</div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover/sub-item-row:opacity-100 shrink-0">
            <button
              onClick={handleAddChild}
              className="rounded hover:bg-sidebar-item-hover-bg relative overflow-hidden size-6 flex items-center justify-center"
            >
              <AnimatedIcon className="w-full h-full flex items-center justify-center">
                <Plus size={14} strokeWidth={3} />
              </AnimatedIcon>
              <Ripple />
            </button>

            <button
              onClick={handleToggle}
              className="rounded hover:bg-sidebar-item-hover-bg relative overflow-hidden size-6 flex items-center justify-center"
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
