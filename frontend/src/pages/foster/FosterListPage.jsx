import { useState } from 'react';
import { fosterApi } from '../../api/fosterApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { formatDate, timeAgo } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

const STATUS_CONFIG = {
  ACTIVE:    { bg: 'var(--cat-sage-light)',  color: '#2E6B24', label: '🏠 Active' },
  COMPLETED: { bg: 'var(--cat-blue-light)',  color: '#2E5A80', label: '✅ Completed' },
  RETURNED:  { bg: 'var(--cat-amber-light)', color: '#7A4F00', label: '↩ Returned' },
};

export default function FosterListPage() {
  const { page, pageSize, nextPage, prevPage, goTo } = usePagination(12);
  const [updateOpen, setUpdateOpen] = useState(null);
  const [updateNotes, setUpdateNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useApi(() => fosterApi.list({ page, page_size: pageSize }), null, [page]);
  const placements = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await fosterApi.submitUpdate(updateOpen.id, { notes: updateNotes });
      setUpdateOpen(null);
      setUpdateNotes('');
      refetch();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="page-container">
      <PageHeader title="🏠 Foster Care" subtitle={`${total} placements`} />

      {/* Info banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,123,84,0.1), rgba(201,123,84,0.05))',
        border: '1px solid rgba(201,123,84,0.2)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        fontSize: '0.875rem',
        color: 'var(--cat-rust)',
        fontWeight: 600,
      }}>
        <span style={{ fontSize: '1.25rem' }}>🐾</span>
        Foster parents provide temporary loving homes for cats awaiting adoption. Thank you for your dedication!
      </div>

      {loading && <LoadingSpinner size="lg" text="Loading foster placements…" />}

      {!loading && placements.length === 0 && (
        <EmptyState icon="🏠" title="No foster placements" message="No active foster care arrangements found." />
      )}

      {!loading && placements.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {placements.map(p => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.ACTIVE;
            const days = Math.floor((new Date() - new Date(p.start_date)) / 86400000);
            return (
              <div key={p.id} style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {/* Cat photo strip */}
                <div style={{ height: '120px', background: 'var(--cat-linen)', position: 'relative', overflow: 'hidden' }}>
                  <img src={p.cat_photo || CAT_PLACEHOLDER} alt={p.cat_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,43,31,0.6), transparent)' }} />
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '0.625rem', left: '0.875rem' }}>
                    <Link to={`/cats/${p.cat}`} style={{ color: 'white', fontWeight: 800, fontSize: '1rem', textDecoration: 'none' }}>{p.cat_name}</Link>
                  </div>
                </div>

                <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <span>🙋 {p.foster_name || 'Foster Parent'}</span>
                    <span>🗓 {days}d in care</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>📅 Start: {formatDate(p.start_date)}</span>
                    {p.end_date && <span>📅 End: {formatDate(p.end_date)}</span>}
                  </div>

                  {p.status === 'ACTIVE' && (
                    <button onClick={() => { setUpdateOpen(p); setUpdateNotes(''); }} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                      📋 Submit Update
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      <Modal open={!!updateOpen} onClose={() => setUpdateOpen(null)} title={`📋 Foster Update: ${updateOpen?.cat_name}`}
        footer={
          <>
            <button onClick={() => setUpdateOpen(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleUpdate} disabled={saving} className="btn btn-primary">
              {saving ? 'Submitting…' : 'Submit Update'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="label-base">Update Notes</label>
          <textarea value={updateNotes} onChange={e => setUpdateNotes(e.target.value)}
            className="input-base" rows={4} placeholder="How is the cat doing? Any health concerns, behavioral changes…" style={{ resize: 'vertical' }} id="foster-update-notes" />
        </div>
      </Modal>
    </div>
  );
}