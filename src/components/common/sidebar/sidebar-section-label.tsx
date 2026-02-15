interface SidebarSectionLabelProps {
  label: string;
}

export function SidebarSectionLabel({ label }: SidebarSectionLabelProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 mb-0.5">
      <span className="text-xs text-sidebar-foreground/50 font-medium tracking-wide font-sans-serif lowercase">
        {label}
      </span>
    </div>
  );
}
