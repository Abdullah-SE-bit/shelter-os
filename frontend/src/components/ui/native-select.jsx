import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A plain <select> styled to match Input/Button. Reserved for simple,
 * short option lists (a handful of cities, statuses, etc.) where the
 * richer Radix `Select` component would be unnecessary overhead — native
 * selects are simpler, fully accessible by default, and work fine on
 * mobile without extra work.
 */
const NativeSelect = React.forwardRef(function NativeSelect({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          'disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
});

export { NativeSelect };
