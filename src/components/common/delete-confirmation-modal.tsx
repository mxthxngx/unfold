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
  const resolvedItemName = itemName?.trim().length ? itemName.trim() : 'this item';
  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      onCancel={onCancel}
      onConfirm={onConfirm}
      className="bg-sidebar-container-bg border border-sidebar-container-border/80 ring-sidebar-container-border/80 shadow-lg backdrop-blur-2xl backdrop-saturate-150"
      backdropClassName="bg-sidebar/50"
    >
      <div className="flex flex-col gap-4 p-6 sm:p-7 text-modal-surface-foreground select-none lowercase">
        <div className="space-y-2.5">
          <h3 className="text-[18px] font-medium leading-snug text-modal-surface-foreground font-sans-serif">
            send{' '}
            <span className="font-semibold italic">
              {resolvedItemName}
            </span>{' '}
            to trash?
          </h3>
          <p className="text-[12.5px] leading-relaxed text-modal-surface-foreground/62 font-sans">
            it stays in trash for 15 days before it is removed
          </p>

        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3">
          <Button
            type="button"
            variant="outline"
            size="action"
            onClick={onCancel}
            className="text-sidebar-foreground/90 bg-sidebar-item-hover-bg/40 border-sidebar-border/60 hover:bg-sidebar-item-hover-bg/70 transition-all duration-200"
          >
            keep it
          </Button>
          <Button
            type="button"
            variant="error"
            size="action"
            onClick={onConfirm}
            className="bg-button-error-bg/70 border-button-error-border/70 text-button-error-text hover:bg-button-error-hover-bg hover:border-button-error-hover-border"
          >
            move to trash
          </Button>
        </div>
      </div>
    </Modal>
  );
}
