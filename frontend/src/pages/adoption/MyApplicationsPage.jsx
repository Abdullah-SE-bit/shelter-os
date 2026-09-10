import { adoptionApi } from '../../api/adoptionApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { formatDate } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  SUBMITTED:   { bg: 'var(--cat-blue-light)',  color: '#2E5A80', label: '📬 Submitted' },
  UNDER_REVIEW:{ bg: 'var(--cat-amber-light)', color: '#7A4F00', label: '🔍 Under Review' },
  INTERVIEW:   { bg: 'rgba(201,123,84,0.15)',  color: 'var(--cat-rust)', label: '📅 Interview' },
  APPROVED:    { bg: 'var(--cat-sage-light)',  color: '#2E6B24', label: '✅ Approved' },
  REJECTED:    { bg: 'var(--cat-red-light)',   color: '#8B2C2A', label: '❌ Rejected' },
  WITHDRAWN:   { bg: '#EDE8E3',               color: 'var(--text-muted)', label: '↩ Withdrawn' },
};

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

export default function MyApplicationsPage() {
  const { data, loading, refetch } = useApi(() => adoptionApi.myApplications());
  const applications = data?.results || data || [];

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this application?')) return;
    await adoptionApi.withdraw(id);
    refetch();
  };

  return (
    <div className="page-container-sm">
      <PageHeader title="❤️ My Applications" subtitle={`${applications.length} adoption application${applications.length !== 1 ? 's' : ''}`} />

      {loading && <LoadingSpinner text="Loading applications…" />}

      {!loading && applications.length === 0 && (
        <EmptyState
          icon="❤️"
          title="No applications yet"
          message="Browse cats available for adoption and apply to give one a forever home."
          action={<Link to="/adoption" className="btn btn-primary">❤️ Browse Cats</Link>}
        />
      )}

      {!loading && applications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map(app => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.SUBMITTED;
            return (
              <div key={app.id} style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Cat photo */}
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'var(--cat-linen)' }}>
                    <img
                      src={app.cat_photo || CAT_PLACEHOLDER}
                      alt={app.cat_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {app.cat_name || 'Cat'}
                      </h3>
                      <span style={{
                        background: cfg.bg,
                        color: cfg.color,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        flexShrink: 0,
                      }}>
                        {cfg.label}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      🏠 {app.shelter_name || 'Shelter'} · Applied {formatDate(app.created_at)}
                    </p>

                    {/* Status timeline */}
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {['SUBMITTED','UNDER_REVIEW','INTERVIEW','APPROVED'].map((s, i, arr) => {
                        const statuses = Object.keys(STATUS_CONFIG);
                        const currentIdx = statuses.indexOf(app.status);
                        const itemIdx = statuses.indexOf(s);
                        const reached = currentIdx >= itemIdx;
                        return (
                          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ color: reached ? 'var(--cat-terra)' : 'var(--border-default)', fontWeight: reached ? 700 : 400 }}>
                              {reached ? '●' : '○'} {STATUS_CONFIG[s]?.label.split(' ')[1]}
                            </span>
                            {i < arr.length - 1 && <span>→</span>}
                          </span>
                        );
                      })}
                    </div>

                    {/* Interview details */}
                    {app.interview_scheduled_at && (
                      <div style={{
                        marginTop: '0.75rem',
                        background: 'rgba(201,123,84,0.08)',
                        border: '1px solid rgba(201,123,84,0.2)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.875rem',
                        fontSize: '0.8125rem',
                        color: 'var(--cat-rust)',
                        fontWeight: 600,
                      }}>
                        📅 Interview: {formatDate(app.interview_scheduled_at)}
                        {app.interview_format && ` · ${app.interview_format}`}
                      </div>
                    )}

                    {/* Rejection reason */}
                    {app.status === 'REJECTED' && app.rejection_reason && (
                      <div style={{
                        marginTop: '0.75rem',
                        background: 'var(--cat-red-light)',
                        border: '1px solid rgba(192,82,78,0.2)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.875rem',
                        fontSize: '0.8125rem',
                        color: '#8B2C2A',
                      }}>
                        Reason: {app.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                {['SUBMITTED','UNDER_REVIEW'].includes(app.status) && (
                  <div style={{
                    borderTop: '1px solid var(--border-default)',
                    padding: '0.75rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    background: 'var(--cat-linen)',
                  }}>
                    <button onClick={() => handleWithdraw(app.id)} className="btn btn-secondary btn-sm">
                      ↩ Withdraw
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}