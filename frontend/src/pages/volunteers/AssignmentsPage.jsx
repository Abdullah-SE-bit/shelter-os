import { useState } from 'react';
import { volunteerApi } from '../../api/volunteersApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { formatDate, timeAgo } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  PENDING:     { bg: 'var(--cat-amber-light)', color: '#7A4F00', label: '⏳ Pending' },
  ACCEPTED:    { bg: 'var(--cat-blue-light)',  color: '#2E5A80', label: '✅ Accepted' },
  IN_PROGRESS: { bg: 'rgba(201,123,84,0.15)', color: 'var(--cat-rust)', label: '🔄 In Progress' },
  COMPLETED:   { bg: 'var(--cat-sage-light)',  color: '#2E6B24', label: '🎉 Completed' },
  REJECTED:    { bg: 'var(--cat-red-light)',   color: '#8B2C2A', label: '❌ Rejected' },
};

export default function AssignmentsPage() {
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(16);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading } = useApi(
    () => volunteerApi.myAssignments({ page, page_size: pageSize, status: statusFilter || undefined }),
    null,
    [page, statusFilter]
  );

  const assignments = data?.results || [];
  const total       = data?.count   || 0;
  const totalPages  = Math.ceil(total / pageSize);

  return (
    <div className="page-container">
      <PageHeader title="🤝 My Assignments" subtitle={`${total} volunteer assignments`} />

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s} onClick={() => { setStatusFilter(s); reset(); }} style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '8px',
              border: `1.5px solid ${statusFilter === s ? 'var(--cat-terra)' : 'var(--border-default)'}`,
              background: statusFilter === s ? 'var(--cat-terra)' : 'var(--surface-card)',
              color: statusFilter === s ? 'white' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}>
              {s ? (cfg?.label || s) : 'All'}
            </button>
          );
        })}
      </div>

      {loading && <LoadingSpinner text="Loading assignments…" />}

      {!loading && assignments.length === 0 && (
        <EmptyState icon="🤝" title="No assignments" message={statusFilter ? `No ${statusFilter.toLowerCase()} assignments.` : 'You have no volunteer assignments yet. Browse rescue reports to get started!'} />
      )}

      {!loading && assignments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {assignments.map(asgn => {
            const cfg = STATUS_CONFIG[asgn.status] || STATUS_CONFIG.PENDING;
            return (
              <div key={asgn.id} style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {asgn.assignment_type?.replace(/_/g, ' ') || 'Assignment'}
                    </span>
                    <h3 style={{ margin: '0.2rem 0 0', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {asgn.rescue_description || asgn.title || 'Task'}
                    </h3>
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '999px', flexShrink: 0 }}>
                    {cfg.label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  {asgn.scheduled_at && <span>📅 {formatDate(asgn.scheduled_at)}</span>}
                  {asgn.shelter_name && <span>🏠 {asgn.shelter_name}</span>}
                </div>

                {asgn.notes && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--cat-linen)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                    {asgn.notes}
                  </p>
                )}

                {asgn.rescue_id && (
                  <Link to={`/rescue/${asgn.rescue_id}`} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                    🚨 View Rescue →
                  </Link>
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