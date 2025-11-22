import { motion } from 'motion/react';
import { memo, useEffect, useState } from 'react';
import { PiPlus } from 'react-icons/pi';
import { Node } from '../../types/sidebar';
import { cn } from '@/lib/tiptap-utils';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = memo(function Sidebar({ isOpen, setIsOpen: _setIsOpen }: SidebarProps) {
  const { fileTree, spaceName, addNode } = useFileSystem();
  const [targetHeight, setTargetHeight] = useState<string | number>('100%');
  const { fileId } = useParams({ strict: false });
  const navigate = useNavigate();

  useEffect(() => {
    setTargetHeight(isOpen ? '100%' : 42);
  }, [isOpen]);

  const handleGlobalAdd = () => {
    // Always add at root level
    const newId = addNode(null);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  const renderSidebarContent = () => (
    <div className="space-y-1">
      {fileTree.map((node) => (
        <SidebarNodes
          key={node.id}
          node={node}
          isOpen={isOpen}
          selectedItem={fileId || null}
          level={0}
        />
      ))}
    </div>
  );

  return (
    <motion.div
      className="h-full relative flex"
      animate={{
        width: isOpen ? '100%' : 0,
        opacity: isOpen ? 1 : 0
      }}
      transition={{
        width: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
        default: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
      }}
      style={{ overflow: 'hidden' }}
    >
      <motion.div
        className="w-full overflow-hidden"
        animate={{
          height: targetHeight,
          opacity: isOpen ? 1 : 0.95
        }}
        transition={{
          height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
          default: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
        }}
      >
        <div
          className={cn(
            'bg-sidebar-container-bg border-sidebar-container-border',
            'backdrop-blur-xl border-r border-b border-l border-t-0 flex flex-col w-full h-full',
            'shadow-lg'
          )}
        >

          <div
            className={cn(
              'overflow-x-hidden',
              isOpen ? 'overflow-y-auto flex-1 pl-4 pb-4 pr-4 pt-3' : 'overflow-y-hidden px-4 py-1'
            )}
            data-tauri-drag-region
          >
            <motion.div
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -2 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.4, 0, 0.2, 1], 
                delay: isOpen ? 0.1 : 0 
              }}
            >
              {isOpen && renderSidebarContent()}
            </motion.div>
          </div>

          {isOpen && (
            <div className="shrink-0 border-t border-sidebar-border px-4 py-3" data-tauri-drag-region>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sidebar-foreground text-sm font-medium truncate min-w-0">{spaceName}</span>
                <button
                  onClick={handleGlobalAdd}
                  className="flex items-center justify-center p-1.5 transition-all duration-200 hover:opacity-70 flex-shrink-0"
                >
                  <PiPlus size={14} className="text-sidebar-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

export const SidebarNodes = memo(({ node, isOpen, selectedItem, level = 0 }: { node: Node, isOpen: boolean, selectedItem: null | string, level?: number }) => {
  const { toggleFolder, addNode } = useFileSystem();
  const navigate = useNavigate();

  const hasChildren = node.nodes && node.nodes.length > 0;
  const isSelected = selectedItem === node.id;

  const handleAddChild = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newId = addNode(node.id);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  const Content = (
    <div 
      className={cn(
        'group relative flex items-center justify-between py-1 px-2 cursor-pointer text-sm transition-colors duration-200 select-none w-full rounded-md',
        isSelected
          ? 'bg-sidebar-selected-bg text-white font-medium '
          : 'text-sidebar-foreground',
        isOpen && 'hover:bg-sidebar-item-hover-bg hover:text-white'
      )}
      style={{ paddingLeft: `${level * 16 + 10}px` }}
    >
      <div className="flex items-center overflow-hidden flex-1 min-w-0">
        <span className="truncate pl-2">{node.name}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          className="p-1 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-sidebar-item-hover-bg"
          onClick={handleAddChild}
        >
          <PiPlus size={14} />
        </button>
        
        {hasChildren && (
          <button
            className="p-1 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-sidebar-item-hover-bg"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFolder(node.id);
            }}
          >
            {node.isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <Link 
        to="/files/$fileId" 
        params={{ fileId: node.id }} 
        className="block"
        activeProps={{ className: "" }}
      >
        {Content}
      </Link>
      
      {node.isOpen && node.nodes && node.nodes.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {node.nodes.map((childNode) => (
            <SidebarNodes
              key={childNode.id}
              node={childNode}
              isOpen={isOpen}
              selectedItem={selectedItem}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
});

export default Sidebar;
