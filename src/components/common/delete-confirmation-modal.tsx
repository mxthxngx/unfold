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
  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-[#e0e0e5]">
            delete "{itemName}"?
          </h3>
          <p className="text-sm text-[#8a8a8b] leading-relaxed">
            this will move all the content to trash for 15 days. you can restore it from trash during that window.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-[#7c7c7d] hover:text-[#808085] hover:bg-[#18181a] transition-all duration-200 pointer-events-auto"
          >
            cancel
          </button>
          <Button
            type="button"
            variant="outline_destructive"
            onClick={onConfirm}
            className='pointer-events-auto'
          >
            move to trash
          </Button>
        </div>
      </div>
    </Modal>
  );
}