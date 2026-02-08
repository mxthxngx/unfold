import { MdDragIndicator } from "react-icons/md";
import { cn } from "@/lib/tiptap-utils";

export const DragHandleButton = () => {
  return (
    <div className={cn(
      "group flex h-full w-4 items-center justify-center rounded-md",
      "bg-drag-handle-bg hover:bg-drag-handle-hover-bg",
      "transition-colors duration-200",
      "cursor-grab active:cursor-grabbing",
      "border border-drag-handle-border"
    )}>
      <MdDragIndicator className="h-4 w-4 text-drag-handle-icon" />
    </div>
  );
};
