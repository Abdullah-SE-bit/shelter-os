import { useParams } from 'react-router-dom';
import { Package, ScrollText } from 'lucide-react';
import { inventoryApi } from '@/api/inventoryApi';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import { formatDateTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

export default function InventoryHistoryPage() {
  const { id } = useParams();
  const { page, pageSize, nextPage, prevPage, goTo } = usePagination(20);

  const { data: item, loading: itemLoading } = useApi(() => inventoryApi.get(id), null, [id]);
  const { data, loading: histLoading } = useApi(() => inventoryApi.getHistory(id, { page, page_size: pageSize }), null, [id, page]);

  const history = data?.results || [];
  const total = data?.count || 0;
  const totalPages = Math.ceil(total / pageSize);
  const loading = itemLoading || histLoading;
  const itemData = item?.data || item;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader title="Stock history" description={itemData?.name || '—'} backTo="/inventory" backLabel="Inventory" />

      {itemData && (
        <div
          className="relative mb-8 flex flex-wrap items-center gap-8 overflow-hidden rounded-xl px-8 py-6 text-white"
          style={{ background: 'linear-gradient(135deg, var(--brand-ink), var(--brand-rust))' }}
        >
          <Package className="pointer-events-none absolute right-4 -bottom-2 size-20 text-white/10" />
          <div>
            <p className="mb-0.5 text-[13px] font-semibold text-white/70">Current stock</p>
            <div className="text-4xl leading-none font-bold">{itemData.quantity}</div>
            <div className="text-sm text-white/75">{itemData.unit}</div>
          </div>
          <div className="border-l border-white/20 pl-8">
            <p className="mb-0.5 text-[13px] font-semibold text-white/70">Min stock alert</p>
            <div className={cn('text-2xl leading-none font-bold', itemData.quantity <= (itemData.minimum_stock || 0) ? 'text-[#FFB3B0]' : 'text-white')}>
              {itemData.minimum_stock || '—'}
            </div>
          </div>
          {itemData.expiry_date && (
            <div className="border-l border-white/20 pl-8">
              <p className="mb-0.5 text-[13px] font-semibold text-white/70">Expiry date</p>
              <div className="text-lg leading-none font-semibold">{itemData.expiry_date}</div>
            </div>
          )}
        </div>
      )}

      {loading && <LoadingSpinner text="Loading history…" />}

      {!loading && history.length === 0 && (
        <EmptyState icon={ScrollText} title="No history records" message="No stock adjustments recorded for this item yet." />
      )}

      {!loading && history.length > 0 && (
        <div className="mb-6 flex flex-col gap-2.5">
          {history.map((entry, i) => {
            const isAdd = Number(entry.adjustment) > 0;
            return (
              <div key={entry.id || i} className={cn('flex items-center gap-4 rounded-lg border-l-4 border bg-card px-5 py-3.5', isAdd ? 'border-l-success border-success/20' : 'border-l-destructive border-destructive/20')}>
                <div className={cn('w-14 shrink-0 text-center text-base font-bold', isAdd ? 'text-success' : 'text-destructive')}>
                  {isAdd ? '+' : ''}{entry.adjustment}
                </div>
                <div className="flex-1">
                  {entry.notes && <p className="mb-0.5 text-sm font-medium text-muted-foreground">{entry.notes}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>By {entry.adjusted_by_name || 'System'}</span>
                    <span>{formatDateTime(entry.adjusted_at)}</span>
                  </div>
                </div>
                {entry.balance_after !== undefined && (
                  <div className="shrink-0 text-right">
                    <div className="text-base font-bold text-primary">{entry.balance_after}</div>
                    <div className="text-[11px] text-muted-foreground">balance</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}
