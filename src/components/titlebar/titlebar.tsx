function Titlebar() {
    return (
        <div className="h-10 bg-[var(--background-secondary)] border-b border-[var(--border)] flex items-center px-4">
            <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-[var(--foreground)]">
                    Unfold
                </div>
            </div>
        </div>
    );
}

export default Titlebar;
