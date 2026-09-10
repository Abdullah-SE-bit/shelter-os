import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StepIndicator({ step, labels }) {
  return (
    <div className="mb-7 flex items-center gap-1.5">
      {labels.map((label, i) => {
        const s = i + 1;
        return (
          <div key={label} className={cn('flex items-center gap-1.5', s < labels.length && 'flex-1')}>
            <div className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
              step > s ? 'bg-success text-success-foreground' : step === s ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface-muted text-muted-foreground',
            )}>
              {step > s ? <Check className="size-3.5" /> : s}
            </div>
            {s < labels.length && <div className={cn('h-0.5 flex-1 transition-colors', step > s ? 'bg-success' : 'bg-border')} />}
          </div>
        );
      })}
      <span className="ml-3 shrink-0 text-xs font-semibold text-muted-foreground">{labels[step - 1]}</span>
    </div>
  );
}
