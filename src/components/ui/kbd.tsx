import * as React from 'react';

import { cn } from '@/utils/tailwind';

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-md border px-1.5 text-[10px] font-medium',
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
