
import Titlebar from "../components/titlebar/titlebar";
import Sidebar from "../components/sidebar/sidebar";

function EditorLayout({children}: {children?: React.ReactNode}) {
    return (
        <div className="h-screen w-screen flex flex-col bg-[var(--background)]">
            {/* Titlebar */}
            <Titlebar />
            
            {/* Main content area */}
            <div className="flex-1 flex">
                {/* Sidebar - 3/12 width */}
                <div className="w-3/12">
                    <Sidebar />
                </div>
                
                {/* Spacer - 1/12 width */}
                <div className="w-1/12 bg-[var(--background)]">
                </div>
                
                {/* Main editor area - 8/12 width */}
                <div className="w-8/12">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default EditorLayout;