import React, { useEffect, useRef, useCallback } from 'react';
import Sidebar from "../components/sidebar/sidebar";
import { Toolbar } from "../components/toolbar/toolbar";
import { useLayout } from '@/contexts/LayoutContext';
import { useSettings } from '@/hooks/use-settings';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useGlobalSidebarShortcuts } from '@/hooks/use-global-sidebar-shortcuts';
import { useEditorContext } from '@/contexts/EditorContext';
import { SearchBar } from '@/components/search/search-bar';
import { useEditorSearch } from '@/hooks/use-editor-search';

function EditorLayoutContent({children}: {children?: React.ReactNode}) {
    const { layout } = useLayout();
    const { settings } = useSettings();
    const { setOpen, open } = useSidebar();
    const { focusEditor } = useEditorContext();

    const {
        isOpen: isSearchOpen,
        query: searchQuery,
        inputRef: searchInputRef,
        matchesCount,
        activeIndex,
        openSearch,
        closeSearch,
        updateQuery,
        goToNext,
        goToPrev,
    } = useEditorSearch();
    
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

    const handleKeydown = useCallback((e: KeyboardEvent) => {
        const isFindShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f';

        if (isFindShortcut) {
            e.preventDefault();
            openSearch();
            return;
        }

        if (e.key === 'Escape' && isSearchOpen) {
            e.preventDefault();
            closeSearch();
        }
    }, [openSearch, closeSearch, isSearchOpen]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [handleKeydown]);

    return (
        <div
            className="flex flex-col relative bg-background h-screen w-screen backdrop-blur-xl"
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
                    <div
                        onClick={focusEditor}
                        className="flex-1 overflow-y-auto"
                    >
                        <div className="w-full max-w-4xl min-h-full px-6 py-8 mx-auto">
                            {children}
                        </div>
                    </div>
                </SidebarInset>

                {/* Sidebar - Right Position */}
                {sidebarPosition === 'right' && <Sidebar />}
            </div>

            <SearchBar
                isOpen={isSearchOpen}
                value={searchQuery}
                inputRef={searchInputRef}
                matchesCount={matchesCount}
                activeIndex={activeIndex}
                onChange={updateQuery}
                onNext={goToNext}
                onPrev={goToPrev}
                onClose={closeSearch}
            />
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

