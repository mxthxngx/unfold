import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, CornerUpLeft, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/tiptap-utils';

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  onCancel?: (event?: KeyboardEvent | MouseEvent | React.FormEvent) => void;
  onConfirm?: (event?: KeyboardEvent | MouseEvent | React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  containerClassName?: string;
  showClose?: boolean;
  enableEscapeShortcut?: boolean;
  enableEnterShortcut?: boolean;
  showKeyboardHints?: boolean;
  keyboardHints?: React.ReactNode;
  onBackdropClick?: () => void;
};

export function Modal({
  open,
  onClose,
  onCancel,
  onConfirm,
  children,
  className,
  backdropClassName,
  containerClassName,
  showClose = true,
  enableEscapeShortcut = true,
  enableEnterShortcut = true,
  showKeyboardHints = false,
  keyboardHints,
  onBackdropClick,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (enableEscapeShortcut && event.key === 'Escape') {
        event.preventDefault();
        onCancel?.(event);
        onClose?.();
      }
      if (enableEnterShortcut && event.key === 'Enter') {
        event.preventDefault();
        onConfirm?.(event);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [enableEnterShortcut, enableEscapeShortcut, onCancel, onClose, onConfirm, open]);

  if (typeof document === 'undefined') return null;

  const defaultKeyboardHints = (
    <div className="flex items-center justify-end gap-3 text-xs text-sidebar-foreground/70 px-5 pb-4 pt-2">
      <span className="inline-flex items-center gap-1">
        <span className="rounded-md border border-sidebar-border bg-sidebar-accent px-1.5 py-0.5 leading-none text-[11px] font-semibold uppercase">
          Esc
        </span>
        <span className="inline-flex items-center gap-1">
          <CornerUpLeft size={12} />
          Cancel
        </span>
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="rounded-md border border-sidebar-border bg-sidebar-accent px-1.5 py-0.5 leading-none text-[11px] font-semibold uppercase">
          Enter
        </span>
        <span className="inline-flex items-center gap-1">
          <CornerDownLeft size={12} />
          Confirm
        </span>
      </span>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="modal-overlay"
          data-slot="modal-overlay"
          className={cn(
            'fixed inset-0 z-900 flex items-center justify-center px-4 sm:px-6 ',
            containerClassName
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close modal"
            onClick={() => {
              onCancel?.();
              onClose?.();
            }}
            className="sr-only"
          />
          <motion.div
            key="modal-backdrop"
            data-slot="modal-backdrop"
            className={cn(
              'absolute inset-0 bg-sidebar/60',
              backdropClassName
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              onBackdropClick?.();
              onCancel?.();
              onClose?.();
            }}
          />

          <motion.div
            key="modal-content"
            data-slot="modal-content"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className={cn(
              'relative w-full max-w-md min-h-0 overflow-hidden rounded-xl border',
              'border-modal-surface-border ring-1 ring-modal-surface-border',
              'bg-modal-surface text-modal-surface-foreground shadow-2xl',
              'max-h-[82vh]',
              className
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {showClose && (
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => {
                  onCancel?.();
                  onClose?.();
                }}
                className="absolute top-4 right-4 z-10 inline-flex size-8 items-center justify-center rounded-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-icon-hover-bg/95 transition-colors pointer-events-auto"
              >
                <X size={16} />
              </button>
            )}
            <div className="h-full max-h-[82vh] overflow-y-auto">{children}</div>
            {showKeyboardHints && (keyboardHints ?? defaultKeyboardHints)}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
