import { Trash2 } from 'lucide-react';

import { Modal } from '@/components/ui/modal';
import { Button } from '../ui/button';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  itemName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  itemName,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const resolvedItemName = itemName?.trim().length ? itemName.trim() : 'this note';
  const actionButtonBaseClasses =
    'justify-start gap-2 px-3 py-2 text-sm font-semibold border-2 transition-colors w-fit';
  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      onCancel={onCancel}
      onConfirm={onConfirm}
      className="border border-modal-surface-border/40 ring-modal-surface-border/40"
      backdropClassName="backdrop-blur-xs bg-sidebar/70"
    >
      <div className="flex flex-col gap-2 p-6 sm:p-8 text-modal-surface-foreground">
        <div className="space-y-5">

          <div className="p-2">
            <div className="absolute -top-8 -right-12 size-32 rounded-full bg-modal-primary-foreground/10 blur-2xl" aria-hidden />
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-modal-primary-foreground/10 text-modal-action-text">
                <Trash2 className="size-5" />
              </div>
              <div className="space-y-3 text-sm leading-relaxed">
                <h3 className="text-2xl font-semibold leading-snug text-modal-surface-foreground">
                  Move{' '}     {resolvedItemName} {' '} 
                 
                  to trash?
                </h3>
              </div>
            </div>
          </div>
        </div>


        <div className="flex flex-col gap-3 border-t border-modal-surface-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-modal-surface-foreground/70">
            You can always bring it back from trash before day 15—no data loss until you confirm.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onCancel}
              className={`${actionButtonBaseClasses} text-sidebar-foreground bg-sidebar-item-hover-bg/60 border-sidebar-border/70 hover:bg-sidebar-item-hover-bg/80`}
            >
              keep it
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onConfirm}
              className={`${actionButtonBaseClasses} text-red-400 border-red-500/30 bg-red-500/15 hover:bg-red-500/20 hover:border-red-500/40 focus-visible:ring-red-500/30`}
            >
              move to trash
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}