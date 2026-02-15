import React from 'react';

import { AnimatedIcon } from '@/components/ui/animated-icon';
import { cn } from '@/lib/tiptap-utils';

interface SidebarActionButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

export function SidebarActionButton({
  onClick,
  className,
  ariaLabel,
  children,
}: SidebarActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'sidebar-icon-button rounded-md hover:bg-sidebar-icon-hover-bg/75 transition-colors duration-150 size-5 flex items-center justify-center',
        className,
      )}
    >
      <AnimatedIcon className="w-full h-full flex items-center justify-center">{children}</AnimatedIcon>
    </button>
  );
}
