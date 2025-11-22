import { MdDragIndicator } from "react-icons/md";
import { cn } from "@/lib/tiptap-utils";

export const DragHandleButton = () => {
  return (
    <div className={cn(
      "group flex h-full w-4 items-center justify-center rounded-md",
      "bg-zinc-900 hover:bg-zinc-800",
      "transition-colors duration-200",
      "cursor-grab active:cursor-grabbing",
      "border:border-zinc-800/60"
    )}>
      <MdDragIndicator className="h-4 w-4 text-zinc-500" />
    </div>
  );
};
