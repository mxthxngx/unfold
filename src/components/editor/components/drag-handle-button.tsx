import { MdDragIndicator } from "react-icons/md";
import { cn } from "@/lib/tiptap-utils";

export const DragHandleButton = () => {
  return (
    <div className={cn(
      "group flex h-full w-4 items-center justify-center rounded-md",
      "bg-surface-elevated hover:bg-surface-elevated-border",
      "transition-colors duration-200",
      "cursor-grab active:cursor-grabbing",
      "border border-border"
    )}>
      <MdDragIndicator className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};
