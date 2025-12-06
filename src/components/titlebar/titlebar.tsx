function Titlebar() {
    return (
        <div className=" h-10 border-[var(--border)] flex items-center px-4 " data-tauri-drag-region>
            <div className="flex items-center gap-2">
                <div className="text-xs font-medium text-[var(--foreground)]">
                    
                </div>
            </div>
        </div>
    );
}

export default Titlebar;
