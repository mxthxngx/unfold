import React, { useEffect } from 'react';
import Sidebar from "../components/sidebar/sidebar";
import { Toolbar } from "../components/toolbar/toolbar";
import { useLayout } from '@/contexts/LayoutContext';
import { useSettings } from '@/hooks/use-settings';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useGlobalSidebarShortcuts } from '@/hooks/use-global-sidebar-shortcuts';

import { useEditorContext } from '@/contexts/EditorContext';

function EditorLayoutContent({children}: {children?: React.ReactNode}) {
    const { layout } = useLayout();
    const { settings } = useSettings();
    const { setOpen, open } = useSidebar();
    const { focusEditor } = useEditorContext();
    
    // Register global keyboard shortcuts for sidebar operations
    useGlobalSidebarShortcuts();
    
    const sidebarPosition = layout.sidebar_position || 'left';

    // Keyboard shortcut handler for sidebar toggle
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const binding = settings.keybindings.toggleSidebar.toLowerCase();
            const parts = binding.split('-');
            const requiresMod = parts.includes('mod');
            const key = parts[parts.length - 1];

            if (requiresMod && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
                e.preventDefault();
                setOpen(!open);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, setOpen, settings.keybindings.toggleSidebar]);

    return (
        <div className="flex flex-col relative bg-background h-screen w-screen backdrop-blur-xl" data-tauri-drag-region>
            {/* Top Toolbar */}
            <Toolbar />
            
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Left Position */}
                {sidebarPosition === 'left' && <Sidebar />}

                {/* Main Content Area */}
                <SidebarInset 
                    className="flex-1 overflow-y-auto flex justify-center"
                    onClick={focusEditor}
                >
                    <div className="w-full max-w-4xl min-h-full">
                        {children}
                    </div>
                </SidebarInset>

                {/* Sidebar - Right Position */}
                {sidebarPosition === 'right' && <Sidebar />}
            </div>
        </div>
    );
}

function EditorLayout({children}: {children?: React.ReactNode}) {
    return (
        <SidebarProvider defaultOpen={true}>
            <EditorLayoutContent>
                {children}
            </EditorLayoutContent>
        </SidebarProvider>
    );
}

export default EditorLayout;

