import { motion } from 'motion/react';
import { memo, useEffect, useState } from 'react';
import { PiSidebarSimple } from "react-icons/pi";
import { Node } from '../../types/sidebar';
import { cn } from '@/lib/tiptap-utils';
import ControlIconsSpace from '../common/control-icons-space';
export const sampleData: Node[] = [
  {
    name: "System Design",
    nodes: [
      {
        name: "Hashmaps",
        nodes: [
          { name: "Hash Functions" },
          { name: "Collision Resolution" }
        ]
      },
      {
        name: "Databases",
        nodes: [
          { name: "SQL Basics" },
          { name: "NoSQL" }
        ]
      },
    ]
  }
];

interface SidebarProps {
  nodes: Node[];
  selectedItem: null | string;
  setSelectedItem: (item: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = memo(({ nodes, selectedItem, setSelectedItem, isOpen, setIsOpen }: SidebarProps) => {
  const [targetHeight, setTargetHeight] = useState<string | number>("100%");

  useEffect(() => {
    if (isOpen) {
      setTargetHeight("100%");
    } else {
      setTargetHeight(40);
    }
  }, [isOpen, selectedItem]);

  const renderSidebarContent = () => (
    <div className="space-y-1">
      {nodes.map((node) => (
        <SidebarNodes
          key={node.name}
          node={node}
          isOpen={isOpen}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          level={0}
        />
      ))}
    </div>
  );

  const renderCollapsedContent = () => (
    <div className="flex justify-end">
      <span className='text-sidebar-foreground-active text-sm font-medium truncate'>
        {selectedItem}
      </span>
    </div>
  );

  return (
    <div className="w-full h-full relative flex mt-0.25 ">
      <motion.div
        className="w-full overflow-hidden"
        animate={{
          height: targetHeight,
          opacity: isOpen ? 1 : 0.95
        }}

        transition={{
          duration: 0.7,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        <div
          className={cn(
            "bg-sidebar-container-bg border-sidebar-container-border",
            "backdrop-blur-xl border rounded-3xl flex flex-col w-full h-full",
            "shadow-lg"
          )}
        >
          <div className="flex items-center justify-between px-4 py-0.5" data-tauri-drag-region>
            <ControlIconsSpace />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: !isOpen && selectedItem ? 1 : 0,
                y: !isOpen && selectedItem ? 0 : 10
              }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
                delay: !isOpen && selectedItem ? 0.15 : 0
              }}
            >
              {!isOpen && selectedItem && renderCollapsedContent()}
            </motion.div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "relative flex items-center justify-center",
                "w-8 h-8 rounded-full",
                "bg-sidebar-container-bg hover:bg-icon-hover",
                "border border-sidebar-container-border",
                "shadow-md",
                "transition-all duration-500 ease-[0.4,0,0.2,1]"
              )}
            >
              <motion.div
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <PiSidebarSimple
                  size={18}
                  className="icon-interactive"
                />
              </motion.div>
            </button>
          </div>

          <div className={cn(
            "overflow-x-hidden",
            isOpen ? "overflow-y-auto flex-1 pl-5 pb-4 pr-4" : "overflow-y-hidden px-4 py-1"
          )}>
            <motion.div
              initial={{ opacity: 0, y: -2}}
              animate={{
                opacity: isOpen ? 1 : 0,
                y: isOpen ? 0:-2
              }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
                delay: isOpen ? 0.2 : 0
              }}
            >
              {isOpen && renderSidebarContent()}
            </motion.div>

          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isOpen ? 1 : 0,
              y: isOpen ? 0 : 10
            }}
            transition={{
              duration: 0.4,
              ease: "easeInOut",
              delay: isOpen ? 0.3 : 0
            }}
          >
            {isOpen && (
              <div className="flex-shrink-0 border-t border-white/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sidebar-accent-foreground text-sm font-medium">Footer Content</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});

export const SidebarNodes = ({ node, isOpen, selectedItem, setSelectedItem, level = 0 }: { node: Node, isOpen: boolean, selectedItem: null | string, setSelectedItem: (item: string) => void, level?: number }) => {
  return (
    <motion.div
      key={node.name}
      initial={{ opacity: 0, x: -20 }}
      animate={{
        opacity: 1,
        x: 0
      }}
      transition={{
        duration: .3,
        ease: "easeOut",
        delay: level * 0.05
      }}
    >
      <span
        className={cn(
          'flex items-center gap-2 py-1 text-sidebar-foreground cursor-pointer text-sm transition-colors duration-200',
          isOpen && 'hover:text-sidebar-accent-foreground hover:scale-[1.01]',
          selectedItem === node.name && 'text-sidebar-foreground-active font-medium'
        )}
        onClick={() => setSelectedItem(node.name)}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        {node.name}
      </span>
      {
        node.nodes && node.nodes.length > 0 && node.nodes.map((childNode) => (
          <SidebarNodes
            key={childNode.name}
            node={childNode}
            isOpen={isOpen}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            level={level + 1}
          />
        ))
      }
    </motion.div>
  )
}


export default Sidebar;
