import React, { useEffect, useCallback } from 'react';
import Sidebar from "../components/sidebar/sidebar";
import { Toolbar } from "../components/toolbar/toolbar";
import { useLayout } from '@/contexts/LayoutContext';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useGlobalSidebarShortcuts } from '@/hooks/use-global-sidebar-shortcuts';
import { SearchBar } from '@/components/search/search-bar';
import { useFileSystem } from '@/contexts/FileSystemContext';

function LoadingScreen() {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-background">
            <div className="text-center">
                <div className="text-sm text-muted-foreground">Preparing your workspace...</div>
            </div>
        </div>
    );
}

function EditorLayoutContent({children}: {children?: React.ReactNode}) {
    const { layout } = useLayout();

    useGlobalSidebarShortcuts();
    
    const sidebarPosition = layout.sidebar_position || 'left';

    const handleKeydown = useCallback((e: KeyboardEvent) => {
        const isFindShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f';

        if (isFindShortcut) {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('openFindDialogFromEditor'));
            return;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [handleKeydown]);

    return (
        <div
            className="flex flex-col relative bg-background h-screen w-screen"
            data-tauri-drag-region
        >
            {/* Top Toolbar */}
            <Toolbar />
            
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Left Position */}
                {sidebarPosition === 'left' && <Sidebar />}

                {/* Main Content Area */}
                <SidebarInset 
                    className="flex-1 relative"
                >
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-white/10">
                        <div className="w-full max-w-4xl min-h-full px-6 py-8 mx-auto">
                            {children}
                        </div>
                    </div>
                </SidebarInset>

                {/* Sidebar - Right Position */}
                {sidebarPosition === 'right' && <Sidebar />}
            </div>

            <SearchBar />
        </div>
    );
}

function EditorLayout({children}: {children?: React.ReactNode}) {
    const { isLoading } = useFileSystem();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <SidebarProvider defaultOpen={true}>
            <EditorLayoutContent>
                {children}
            </EditorLayoutContent>
        </SidebarProvider>
    );
}

export default EditorLayout;