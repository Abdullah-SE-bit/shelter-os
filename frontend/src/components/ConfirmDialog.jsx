import { useEffect } from 'react';
import { TriangleAlert, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false, confirmLabel = 'Confirm' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div onClick={onCancel} className="animate-in fade-in fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 duration-150">
      <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in zoom-in-95 w-full max-w-[420px] rounded-xl border border-border bg-card p-8 shadow-lg duration-200">
        <div className={`mb-5 flex size-14 items-center justify-center rounded-full ${danger ? 'bg-destructive/10 text-destructive' : 'bg-highlight-mint/20 text-primary'}`}>
          {danger ? <TriangleAlert className="size-6" /> : <PawPrint className="size-6" />}
        </div>

        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 mb-7 text-sm leading-relaxed text-muted-foreground">{message}</p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'destructive' : 'default'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
