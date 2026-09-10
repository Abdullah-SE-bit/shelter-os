import { useState } from 'react';
import { fosterApi } from '../../api/fosterApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { formatDate, timeAgo } from '../../utils/dateUtils';

export default function FosterPlacementsPage() {
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(16);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const { data, loading } = useApi(
    () => fosterApi.adminList({ page, page_size: pageSize, status: statusFilter || undefined }),
    null,
    [page, statusFilter]
  );

  const placements = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);

  const STATUS_COLORS = {
    ACTIVE:    { bg: 'var(--cat-sage-light)', color: '#2E6B24' },
    COMPLETED: { bg: 'var(--cat-blue-light)', color: '#2E5A80' },
    RETURNED:  { bg: 'var(--cat-amber-light)', color: '#7A4F00' },
  };

  return (
    <div className="page-container">
      <PageHeader title="🏠 Foster Placements" subtitle={`${total} placements · Manage foster care arrangements`} />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'ACTIVE',    icon: '🏠', label: 'Active Placements',    color: 'var(--cat-sage)' },
          { key: 'COMPLETED', icon: '✅', label: 'Completed',            color: 'var(--cat-blue)' },
          { key: 'RETURNED',  icon: '↩', label: 'Returned to Shelter',  color: 'var(--cat-amber)' },
        ].map(s => (
          <button key={s.key} onClick={() => { setStatusFilter(s.key); reset(); }} style={{
            background: statusFilter === s.key ? 'var(--surface-card)' : 'var(--cat-linen)',
            border: `2px solid ${statusFilter === s.key ? s.color : 'var(--border-default)'}`,
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: statusFilter === s.key ? s.color : 'var(--text-secondary)' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner text="Loading placements…" />}

      {!loading && placements.length === 0 && (
        <EmptyState icon="🏠" title={`No ${statusFilter.toLowerCase()} placements`} message="No foster placements found for the selected filter." />
      )}

      {!loading && placements.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cat</th>
                <th>Foster Parent</th>
                <th>Start Date</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {placements.map(p => {
                const days = Math.floor((new Date() - new Date(p.start_date)) / 86400000);
                const cfg  = STATUS_COLORS[p.status] || STATUS_COLORS.ACTIVE;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'var(--cat-terra)' }}>{p.cat_name}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.foster_name}</div>
                        {p.foster_phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {p.foster_phone}</div>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{formatDate(p.start_date)}</td>
                    <td>
                      <span style={{ fontWeight: 800, color: days > 30 ? 'var(--cat-amber)' : 'var(--text-primary)' }}>
                        {days}d
                      </span>
                    </td>
                    <td>
                      <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {p.last_update_at ? timeAgo(p.last_update_at) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}