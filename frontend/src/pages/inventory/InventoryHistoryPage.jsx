import { useParams } from 'react-router-dom';
import { inventoryApi } from '../../api/inventoryApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { formatDateTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

export default function InventoryHistoryPage() {
  const { id } = useParams();
  const { page, pageSize, nextPage, prevPage, goTo } = usePagination(20);

  const { data: item, loading: itemLoading } = useApi(() => inventoryApi.get(id), null, [id]);
  const { data, loading: histLoading } = useApi(() => inventoryApi.getHistory(id, { page, page_size: pageSize }), null, [id, page]);

  const history    = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);
  const loading    = itemLoading || histLoading;

  const itemData = item?.data || item;

  return (
    <div className="page-container-sm">
      <PageHeader
        title="📋 Stock History"
        subtitle={itemData?.name || '—'}
        backPath="/inventory"
      />

      {/* Current stock card */}
      {itemData && (
        <div style={{
          background: 'linear-gradient(135deg, var(--cat-espresso), var(--cat-brown))',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          color: 'white',
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '1rem', bottom: '-0.5rem', fontSize: '5rem', opacity: 0.1 }}>📦</div>
          <div>
            <p style={{ margin: '0 0 0.2rem', opacity: 0.7, fontSize: '0.8125rem', fontWeight: 600 }}>Current Stock</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{itemData.quantity}</div>
            <div style={{ opacity: 0.75, fontSize: '0.875rem' }}>{itemData.unit}</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '2rem' }}>
            <p style={{ margin: '0 0 0.2rem', opacity: 0.7, fontSize: '0.8125rem', fontWeight: 600 }}>Min Stock Alert</p>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1, color: itemData.quantity <= (itemData.minimum_stock || 0) ? '#FFB3B0' : 'white' }}>
              {itemData.minimum_stock || '—'}
            </div>
          </div>
          {itemData.expiry_date && (
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '2rem' }}>
              <p style={{ margin: '0 0 0.2rem', opacity: 0.7, fontSize: '0.8125rem', fontWeight: 600 }}>Expiry Date</p>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>{itemData.expiry_date}</div>
            </div>
          )}
        </div>
      )}

      {loading && <LoadingSpinner text="Loading history…" />}

      {!loading && history.length === 0 && (
        <EmptyState icon="📋" title="No history records" message="No stock adjustments recorded for this item yet." />
      )}

      {!loading && history.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
          {history.map((entry, i) => {
            const isAdd = Number(entry.adjustment) > 0;
            return (
              <div key={entry.id || i} style={{
                background: 'var(--surface-card)',
                border: `1px solid ${isAdd ? 'rgba(123,173,110,0.25)' : 'rgba(192,82,78,0.2)'}`,
                borderLeft: `4px solid ${isAdd ? 'var(--cat-sage)' : 'var(--cat-red)'}`,
                borderRadius: '10px',
                padding: '0.875rem 1.25rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
              }}>
                {/* Delta pill */}
                <div style={{
                  width: '56px',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: '1rem',
                  color: isAdd ? 'var(--cat-sage)' : 'var(--cat-red)',
                  flexShrink: 0,
                }}>
                  {isAdd ? '+' : ''}{entry.adjustment}
                </div>

                <div style={{ flex: 1 }}>
                  {entry.notes && (
                    <p style={{ margin: '0 0 0.2rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{entry.notes}</p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>By {entry.adjusted_by_name || 'System'}</span>
                    <span>{formatDateTime(entry.adjusted_at)}</span>
                  </div>
                </div>

                {/* Balance after */}
                {entry.balance_after !== undefined && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, color: 'var(--cat-terra)', fontSize: '1rem' }}>{entry.balance_after}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>balance</div>
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