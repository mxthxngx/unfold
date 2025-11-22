import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Sidebar from "../components/sidebar/sidebar";
import { Toolbar } from "../components/toolbar/toolbar";
import { useLayout } from '@/contexts/LayoutContext';
import { useSettings } from '@/hooks/use-settings';

function EditorLayout({children}: {children?: React.ReactNode}) {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const { layout } = useLayout();
    const { settings } = useSettings();
    
    const sidebarPosition = layout.sidebar_position || 'left';
    const isSidebarLeft = sidebarPosition === 'left';

    // Keyboard shortcut handler for sidebar toggle
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const binding = settings.keybindings.toggleSidebar.toLowerCase();
            const parts = binding.split('-');
            const requiresMod = parts.includes('mod');
            const key = parts[parts.length - 1];

            if (requiresMod && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, setIsOpen, settings.keybindings.toggleSidebar]);

    return (
        <div className="flex flex-col relative bg-background h-screen w-screen backdrop-blur-xl"  data-tauri-drag-region>
            {/* Top Toolbar */}
            <Toolbar 
                isSidebarOpen={isOpen}
                onToggleSidebar={() => setIsOpen(!isOpen)}
            />
            
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Left Position */}
                {isSidebarLeft && (
                    <motion.div 
                        className="flex"
                        animate={{
                            width: isOpen ? 240 : 0
                        }}
                        transition={{
                            duration: 0.25,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                        style={{ overflow: 'hidden' }}
                    >
                        <Sidebar
                            isOpen={isOpen}
                            setIsOpen={setIsOpen}
                        />
                    </motion.div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto flex justify-center">
                    <div className="w-full max-w-4xl min-h-full">
                        {children}
                    </div>
                </div>

                {/* Sidebar - Right Position */}
                {!isSidebarLeft && (
                    <motion.div 
                        className="flex"
                        animate={{
                            width: isOpen ? 240 : 0
                        }}
                        transition={{
                            duration: 0.25,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                        style={{ overflow: 'hidden' }}
                    >
                        <Sidebar
                            isOpen={isOpen}
                            setIsOpen={setIsOpen}
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default EditorLayout;
