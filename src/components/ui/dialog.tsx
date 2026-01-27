import React, { forwardRef, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/tiptap-utils';

const mergeRefs = <T,>(...refs: Array<React.RefObject<T | null> | undefined>) => {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (ref) {
        ref.current = value;
      }
    });
  };
};

type DialogRootProps = React.HTMLAttributes<HTMLDivElement>;

export const DialogRoot = forwardRef<HTMLDivElement, DialogRootProps>(
  function DialogRoot({ className, ...props }, ref) {
    return <div ref={ref} className={cn('relative flex-1', className)} {...props} />;
  }
);

type DialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  isOpen: boolean;
};

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  function DialogTrigger({ label, isOpen, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          'group w-full rounded-2xl px-3 py-2 flex items-center justify-between gap-2',
          'bg-sidebar-item-hover-bg/50 border border-[#1f1f21]',
          'transition-all duration-300 ease-out',
          isOpen 
            ? 'bg-sidebar-item-hover-bg/80 border-[#1f1f21]' 
            : 'hover:bg-sidebar-item-hover-bg/80 hover:border-[#232325]',
          className
        )}
        {...props}
      >
        <span className="truncate text-sm font-medium text-[#c0c0c5]">{label}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={cn(
            'text-[#75757a] transition-transform duration-300 ease-out',
            isOpen && 'rotate-180'
          )}
        />
      </button>
    );
  }
);

type DialogContentProps = {
  isOpen: boolean;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  children: React.ReactNode;
};

export function DialogContent({
  isOpen,
  menuRef,
  className,
  children,
}: DialogContentProps) {
  const internalMenuRef = useRef<HTMLDivElement>(null);
  const assignMenuRef = mergeRefs(menuRef, internalMenuRef);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="dialog-menu"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn(
            'absolute left-0 bottom-full mb-2 z-20 w-full min-w-[16rem] rounded-xl',
            'bg-[#0a0a0a] border border-sidebar-container-border/80',
            'shadow-lg backdrop-blur-2xl backdrop-saturate-150',
            'max-h-[60vh] overflow-hidden p-1.5',
            className
          )}
          style={{ transformOrigin: 'bottom center' }}
          ref={assignMenuRef}
        >
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-[#2a2a2d] scrollbar-track-transparent">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export function DialogHeader({ className, children, ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn(
        'text-[10px] uppercase tracking-[0.08em] text-[#75757a] font-medium px-1 mb-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type DialogListProps = React.HTMLAttributes<HTMLDivElement>;
export function DialogList({ className, ...props }: DialogListProps) {
  return <div className={cn('space-y-1', className)} {...props} />;
}

type DialogItemProps = React.HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
};

export function DialogItem({ active, className, ...props }: DialogItemProps) {
  return (
    <div
      className={cn(
        'group/space flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150',
        active
          ? 'bg-white/4 text-white'
          : 'text-white/85 hover:bg-white/4 hover:text-white hover:shadow-[inset_0_0_8px_rgba(255,255,255,0.02)]',
        className
      )}
      {...props}
    />
  );
}

type DialogActionsProps = React.HTMLAttributes<HTMLDivElement>;
export function DialogActions({ className, ...props }: DialogActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 opacity-0 group-hover/space:opacity-100 transition-opacity duration-200',
        className
      )}
      {...props}
    />
  );
}

type DialogAddButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export function DialogAddButton({ className, children, ...props }: DialogAddButtonProps) {
  return (
    <button
      className={cn(
        'w-full mt-2 rounded-lg px-3 py-2.5',
        'bg-[#18181a] border border-[#232325]',
        'text-[#85858a] hover:text-[#a5a5aa]',
        'hover:bg-[#1a1a1c] hover:border-[#282829]',
        'transition-all duration-200 ease-out',
        'flex items-center gap-2 justify-center text-xs font-medium',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type {
  DialogRootProps,
  DialogTriggerProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogListProps,
  DialogItemProps,
  DialogActionsProps,
  DialogAddButtonProps,
};