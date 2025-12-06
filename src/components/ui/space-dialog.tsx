import React, { forwardRef, useRef } from 'react';
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
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

type SpaceDialogRootProps = React.HTMLAttributes<HTMLDivElement>;

export const SpaceDialogRoot = forwardRef<HTMLDivElement, SpaceDialogRootProps>(
  function SpaceDialogRoot({ className, ...props }, ref) {
    return <div ref={ref} className={cn('relative flex-1', className)} {...props} />;
  }
);

type SpaceDialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  isOpen: boolean;
};

export const SpaceDialogTrigger = forwardRef<HTMLButtonElement, SpaceDialogTriggerProps>(
  function SpaceDialogTrigger({ label, isOpen, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          'group w-full rounded-lg text-sidebar-foreground transition-colors px-3 py-2 flex items-center justify-between gap-2',
          isOpen ? 'bg-sidebar-item-hover-bg' : 'hover:bg-sidebar-item-hover-bg/85',
          className
        )}
        {...props}
      >
        <span className="truncate text-sm font-semibold">{label}</span>
        <span className="flex items-center justify-center size-5 transition-colors">
          <ChevronDown
            size={14}
            strokeWidth={3}
            className="text-sidebar-foreground/80 group-hover:text-sidebar-foreground"
          />
        </span>
      </button>
    );
  }
);

type SpaceDialogContentProps = {
  isOpen: boolean;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  children: React.ReactNode;
};

export function SpaceDialogContent({
  isOpen,
  menuRef,
  className,
  children,
}: SpaceDialogContentProps) {
  const internalMenuRef = useRef<HTMLDivElement>(null);
  const assignMenuRef = mergeRefs(menuRef, internalMenuRef);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="space-menu"
          layout
          initial={{ opacity: 0, y: 8, scaleY: 0.96, scaleX: 0.94 }}
          animate={{ opacity: 1, y: 0, scaleY: 1, scaleX: 1.02 }}
          exit={{ opacity: 0, y: 8, scaleY: 0.96, scaleX: 0.94 }}
          transition={{
            type: 'spring',
            visualDuration: 0.2,
            bounce: 0.14,
          }}
          className={cn(
            'absolute left-0 bottom-full mb-2 z-20 w-full max-w-[22rem] min-w-[16rem] rounded-lg border border-sidebar-border/80 bg-sidebar/95 backdrop-blur-3xl shadow-2xl px-2.5 py-1.75 space-y-1 ring-1 ring-sidebar-ring/30 will-change-transform',
            'max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-sidebar-border/70 scrollbar-track-transparent',
            className
          )}
          style={{ transformOrigin: 'bottom center' }}
          ref={assignMenuRef}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type SpaceDialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export function SpaceDialogHeader({ className, children, ...props }: SpaceDialogHeaderProps) {
  return (
    <div
      className={cn('text-xs uppercase tracking-[0.08em] text-sidebar-foreground/60 px-1', className)}
      {...props}
    >
      {children}
    </div>
  );
}

type SpaceDialogListProps = React.HTMLAttributes<HTMLDivElement>;
export function SpaceDialogList({ className, ...props }: SpaceDialogListProps) {
  return <div className={cn('space-y-1', className)} {...props} />;
}

type SpaceDialogItemProps = HTMLMotionProps<'div'> & {
  active?: boolean;
};

export function SpaceDialogItem({ active, className, ...props }: SpaceDialogItemProps) {
  return (
    <motion.div
      layout
      className={cn(
        'group/space flex items-center gap-2 rounded-lg px-2.5 py-1 transition-colors',
        active
          ? 'bg-sidebar-selected-bg text-white border border-sidebar-border/60'
          : 'text-sidebar-foreground hover:bg-sidebar-item-hover-bg/80',
        className
      )}
      {...props}
    />
  );
}

type SpaceDialogActionsProps = React.HTMLAttributes<HTMLDivElement>;
export function SpaceDialogActions({ className, ...props }: SpaceDialogActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 opacity-0 group-hover/space:opacity-100 transition-opacity',
        className
      )}
      {...props}
    />
  );
}

type SpaceDialogAddButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export function SpaceDialogAddButton({ className, children, ...props }: SpaceDialogAddButtonProps) {
  return (
    <button
      className={cn(
        'w-full mt-1 rounded-lg border border-dashed border-sidebar-border text-sidebar-foreground/80 hover:text-sidebar-foreground hover:border-sidebar-ring hover:bg-sidebar-item-hover-bg/70 transition-colors px-2.5 py-2.25 flex items-center gap-2 justify-center text-sm font-medium',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type {
  SpaceDialogRootProps,
  SpaceDialogTriggerProps,
  SpaceDialogContentProps,
  SpaceDialogHeaderProps,
  SpaceDialogListProps,
  SpaceDialogItemProps,
  SpaceDialogActionsProps,
  SpaceDialogAddButtonProps,
};

