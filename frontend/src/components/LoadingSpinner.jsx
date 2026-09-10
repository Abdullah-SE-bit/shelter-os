import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'size-6',
  md: 'size-9',
  lg: 'size-12',
};

export default function LoadingSpinner({ size = 'md', text = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', size === 'lg' ? 'p-16' : 'p-8')}>
      <Loader2 className={cn(SIZES[size] || SIZES.md, 'animate-spin text-primary')} strokeWidth={2} />
      {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
    </div>
  );
}
