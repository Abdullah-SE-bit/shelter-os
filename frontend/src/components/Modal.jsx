import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_WIDTHS = { sm: 'max-w-[400px]', md: 'max-w-[560px]', lg: 'max-w-[760px]', xl: 'max-w-[960px]' };

export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="animate-in fade-in fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full flex-col rounded-xl border border-border bg-card shadow-lg duration-200',
          MAX_WIDTHS[size] || MAX_WIDTHS.md,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md bg-surface-muted text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer && <div className="flex justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
