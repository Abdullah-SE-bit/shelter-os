import { useState } from 'react';
import { adoptionApi } from '../../api/adoptionApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { formatDate, timeAgo } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

// Display config for every stored application status (must match backend
// AdoptionApplication.STATUS_CHOICES so WITHDRAWN etc. render correctly — G2).
const STATUS_CONFIG = {
  SUBMITTED:           { bg: 'var(--cat-blue-light)',  color: '#2E5A80', label: '📬 Submitted' },
  UNDER_REVIEW:        { bg: 'var(--cat-amber-light)', color: '#7A4F00', label: '🔍 Under Review' },
  INTERVIEW_SCHEDULED: { bg: 'rgba(201,123,84,0.15)',  color: 'var(--cat-rust)', label: '📅 Interview Scheduled' },
  APPROVED:            { bg: 'var(--cat-sage-light)',  color: '#2E6B24', label: '✅ Approved' },
  REJECTED:            { bg: 'var(--cat-red-light)',   color: '#8B2C2A', label: '❌ Rejected' },
  WITHDRAWN:           { bg: '#EDE8E3',                color: 'var(--text-muted)', label: '↩️ Withdrawn' },
};

// Filterable statuses shown as buttons.
const FILTER_STATUSES = ['', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED', 'WITHDRAWN'];

// Actions a shelter admin can trigger via the review endpoint (input values the
// backend MoveToReviewView accepts).
const REVIEW_OPTIONS = [
  { value: 'UNDER_REVIEW', label: '🔍 Move to Under Review' },
  { value: 'INTERVIEW',    label: '📅 Schedule Interview' },
  { value: 'APPROVED',     label: '✅ Approve' },
  { value: 'REJECTED',     label: '❌ Reject' },
];

export default function AdminApplicationsPage() {
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(15);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected,     setSelected]     = useState(null);
  const [reviewForm,   setReviewForm]   = useState({ status: '', notes: '' });
  const [saving,       setSaving]       = useState(false);

  const { data, loading, refetch } = useApi(
    () => adoptionApi.allApplications({ page, page_size: pageSize, status: statusFilter || undefined }),
    null,
    [page, statusFilter]
  );

  const applications = data?.results || [];
  const total        = data?.count   || 0;
  const totalPages   = Math.ceil(total / pageSize);

  const handleReview = async () => {
    setSaving(true);
    try {
      await adoptionApi.review(selected.id, reviewForm);
      setSelected(null);
      refetch();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="page-container">
      <PageHeader title="❤️ Adoption Applications" subtitle={`${total} total applications`}
        action={<button onClick={refetch} className="btn btn-secondary btn-sm" disabled={loading}>🔄 Refresh</button>} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {FILTER_STATUSES.map(s => (
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
            {s ? (STATUS_CONFIG[s]?.label || s) : 'All'}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner text="Loading applications…" />}

      {!loading && applications.length === 0 && (
        <EmptyState icon="❤️" title="No applications found" message="No adoption applications match your filter." />
      )}

      {!loading && applications.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Cat</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => {
                const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.SUBMITTED;
                return (
                  <tr key={app.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700 }}>{app.applicant_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.applicant_email}</div>
                      </div>
                    </td>
                    <td>
                      <Link to={`/cats/${app.cat}`} style={{ color: 'var(--cat-terra)', fontWeight: 700, textDecoration: 'none' }}>
                        {app.cat_name}
                      </Link>
                    </td>
                    <td>
                      <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '999px' }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{timeAgo(app.created_at)}</td>
                    <td>
                      {app.compatibility_score && (
                        <span style={{ fontWeight: 800, color: 'var(--cat-terra)' }}>
                          {Math.round(app.compatibility_score * 100)}%
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelected(app); setReviewForm({ status: 'UNDER_REVIEW', notes: '' }); }}
                        className="btn btn-secondary btn-sm"
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      {/* Review modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Review: ${selected?.applicant_name}`} size="md"
        footer={
          <>
            <button onClick={() => setSelected(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleReview} disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : 'Save Review'}</button>
          </>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span>Cat: <strong style={{ color: 'var(--text-primary)' }}>{selected.cat_name}</strong></span>
              <span>Applied: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(selected.created_at)}</strong></span>
            </div>

            {selected.motivation && (
              <div style={{ background: 'var(--cat-linen)', borderRadius: '10px', padding: '0.875rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Motivation</div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.motivation}</p>
              </div>
            )}

            <div className="form-group">
              <label className="label-base">Update Status</label>
              <select value={reviewForm.status} onChange={e => setReviewForm(f => ({ ...f, status: e.target.value }))} className="input-base" id="review-status">
                {REVIEW_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {reviewForm.status === 'INTERVIEW' && (
              <div className="form-group">
                <label className="label-base">Interview Date &amp; Time</label>
                <input type="datetime-local" className="input-base" id="review-interview"
                  value={reviewForm.interview_scheduled_at || ''}
                  onChange={e => setReviewForm(f => ({ ...f, interview_scheduled_at: e.target.value }))} />
              </div>
            )}

            {reviewForm.status === 'REJECTED' && (
              <div className="form-group">
                <label className="label-base">Rejection Reason</label>
                <textarea value={reviewForm.rejection_reason || ''} onChange={e => setReviewForm(f => ({ ...f, rejection_reason: e.target.value }))}
                  className="input-base" rows={2} style={{ resize: 'vertical' }} placeholder="Brief reason for rejection…" id="review-reject-reason" />
              </div>
            )}

            <div className="form-group">
              <label className="label-base">Internal Notes</label>
              <textarea value={reviewForm.notes} onChange={e => setReviewForm(f => ({ ...f, notes: e.target.value }))}
                className="input-base" rows={3} style={{ resize: 'vertical' }}
                placeholder="Notes visible only to shelter staff…" id="review-notes" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}