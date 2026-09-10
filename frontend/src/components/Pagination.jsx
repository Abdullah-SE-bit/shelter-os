import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Pagination({ page, totalPages, total, pageSize, onPrev, onNext, onGoTo }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      <Button variant="outline" size="icon" onClick={onPrev} disabled={page === 1} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </Button>

      {start > 1 && (
        <>
          <Button variant="outline" size="sm" onClick={() => onGoTo?.(1)}>1</Button>
          {start > 2 && <span className="px-1 text-sm text-muted-foreground">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={p === page ? 'default' : 'outline'}
          onClick={() => onGoTo?.(p)}
          className={cn('min-w-9', p === page && 'pointer-events-none')}
        >
          {p}
        </Button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-sm text-muted-foreground">…</span>}
          <Button variant="outline" size="sm" onClick={() => onGoTo?.(totalPages)}>{totalPages}</Button>
        </>
      )}

      <Button variant="outline" size="icon" onClick={onNext} disabled={page >= totalPages} aria-label="Next page">
        <ChevronRight className="size-4" />
      </Button>

      {total !== undefined && <span className="ml-2 text-sm text-muted-foreground">{total} results</span>}
    </div>
  );
}
