
import React, { useState, useCallback } from 'react';
import Sidebar, { sampleData } from "../components/sidebar/sidebar";
import Titlebar from "../components/titlebar/titlebar";
import { useLayout } from '@/contexts/LayoutContext';

function EditorLayout({children}: {children?: React.ReactNode}) {
    const [selectedItem, setSelectedItem] = useState<string>('');
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const { layout } = useLayout();
    
    const handleSelectItem = useCallback((item: string) => {
        setSelectedItem(item);
    }, []);

    const sidebarPosition = layout.sidebar_position || 'left';
    const isSidebarLeft = sidebarPosition === 'left';

    return (
        <div className="flex flex-col relative bg-background h-screen w-screen">
            <div className="flex-1 flex">
                {/* Sidebar - Left Position */}
                {isSidebarLeft && (
                    <div className="w-80 m-1.5 flex transition-all duration-500 ease-out">
                        <Sidebar
                            selectedItem={selectedItem}
                            setSelectedItem={handleSelectItem}
                            isOpen={isOpen}
                            setIsOpen={setIsOpen}
                            nodes={sampleData}
                        />
                        <Titlebar />
                    </div>
                )}

                {/* Main Content Area */}
                <div className={`
                    flex-1 border-4xl overflow-hidden
                    transition-all duration-500 ease-out my-0
                `}>
                    {children}
                </div>

                {/* Sidebar - Right Position */}
                {!isSidebarLeft && (
                    <div className="w-80 m-1.5 flex transition-all duration-500 ease-out">
                        <Titlebar />
                        <Sidebar
                            selectedItem={selectedItem}
                            setSelectedItem={handleSelectItem}
                            isOpen={isOpen}
                            setIsOpen={setIsOpen}
                            nodes={sampleData}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default EditorLayout;
