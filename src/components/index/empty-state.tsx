import { Button } from '../ui/button';

interface EmptyStateProps {
  onCreateFile: () => void;
}

/**
 * Empty state component displayed when there are no files in the workspace
 */
export function EmptyState({ onCreateFile }: EmptyStateProps) {
  return (
    <div className="space-y-1 flex flex-col gap-4 text-left max-w-md w-full">
      <div className="text-xl font-semibold text-foreground select-none">
        start shaping your space
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground select-none">
        add your first note, idea, or wandering thought. <br />
        there&apos;s no wrong way to begin
      </p>
      <Button
        onClick={onCreateFile}
        variant="outline"
        size="lg"
        className="cursor-pointer justify-start gap-2 px-3 py-2 text-sm font-semibold text-sidebar-foreground bg-sidebar-item-hover-bg/60 border-2 border-sidebar-border/70 hover:bg-sidebar-item-hover-bg/80 transition-all duration-200 w-fit"
      >
        add a file
      </Button>
    </div>
  );
}
