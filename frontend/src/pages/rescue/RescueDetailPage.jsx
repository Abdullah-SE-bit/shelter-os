import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rescueApi } from '../../api/rescueApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { formatDateTime } from '../../utils/dateUtils';
import { URGENCY_CSS } from '../../utils/constants';

const URGENCY_ICONS  = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🟠', CRITICAL: '🔴' };

export default function RescueDetailPage() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [resolveOpen,  setResolveOpen]  = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [suggestOpen,  setSuggestOpen]  = useState(false);
  const [suggestions,  setSuggestions]  = useState(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const { data: report, loading, refetch } = useApi(() => rescueApi.get(id), null, [id]);

  const canAdmin  = ['SUPER_ADMIN', 'SHELTER_ADMIN'].includes(user?.role);
  const canResolve = canAdmin || report?.assigned_volunteer === user?.id;

  const handleResolve = async () => {
    setSaving(true);
    try {
      await rescueApi.resolve(id, { resolution_notes: resolveNotes });
      setResolveOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSuggest = async () => {
    setLoadingSuggest(true);
    setSuggestOpen(true);
    try {
      const { data } = await rescueApi.suggest(id);
      setSuggestions(data.data);
    } catch {}
    setLoadingSuggest(false);
  };

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" text="Loading rescue report…" /></div>;
  if (!report) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '4rem' }}>😿</div>
      <h2>Report not found</h2>
    </div>
  );

  const urgencyCss = URGENCY_CSS[report.urgency_level] || 'urgency-medium';
  const isCritical = report.urgency_level === 'CRITICAL';

  return (
    <div className="page-container-sm">
      <PageHeader
        title="🚨 Rescue Report"
        subtitle={`#${report.id?.slice(0, 8)}`}
        backPath="/rescue"
      />

      {/* Critical banner */}
      {isCritical && (
        <div style={{
          background: 'linear-gradient(90deg, var(--cat-red), #A03B38)',
          color: 'white',
          borderRadius: '12px',
          padding: '0.875rem 1.25rem',
          fontWeight: 700,
          fontSize: '0.9375rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 16px rgba(192,82,78,0.3)',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          🔴 CRITICAL — Immediate response required!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Status card */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '14px',
          padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className={`badge ${urgencyCss}`} style={{ fontSize: '0.8rem' }}>
              {URGENCY_ICONS[report.urgency_level]} {report.urgency_level}
            </span>
            <span style={{
              background: report.status === 'RESOLVED' ? 'var(--cat-sage-light)' :
                          report.status === 'PENDING'  ? 'var(--cat-amber-light)' : 'var(--cat-blue-light)',
              color: report.status === 'RESOLVED' ? '#2E6B24' :
                     report.status === 'PENDING'  ? '#7A4F00' : '#2E5A80',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
            }}>
              {report.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <p style={{ margin: '0 0 1rem', fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {report.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
            {[
              { label: 'Reported by', value: report.reporter_name || 'Anonymous' },
              { label: 'Reported at', value: formatDateTime(report.reported_at) },
              { label: 'Assigned to', value: report.assigned_volunteer_name || '—' },
              { label: 'Shelter',     value: report.assigned_shelter_name || '—' },
              { label: 'Resolved at', value: report.resolved_at ? formatDateTime(report.resolved_at) : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>{label}</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        {report.latitude && (
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              📍 Location
            </h3>
            <div style={{
              height: '200px',
              background: 'linear-gradient(145deg, #d4e8c4, #c8ddb8)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '0.5rem',
              color: '#4a6b3a',
              border: '1px solid rgba(123,173,110,0.3)',
            }}>
              <span style={{ fontSize: '2.5rem' }}>🗺️</span>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>
                {Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}
              </p>
              <a
                href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.25rem' }}
              >
                Open in Google Maps ↗
              </a>
            </div>
          </div>
        )}

        {/* Cat condition notes */}
        {report.cat_condition_notes && (
          <div style={{ background: 'var(--cat-amber-light)', border: '1px solid rgba(232,160,48,0.3)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#7A4F00', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ⚠️ Cat Condition Notes
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#5A3800', lineHeight: 1.6 }}>
              {report.cat_condition_notes}
            </p>
          </div>
        )}

        {/* Resolution notes */}
        {report.resolution_notes && (
          <div style={{ background: 'var(--cat-sage-light)', border: '1px solid rgba(123,173,110,0.3)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#2E6B24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ✅ Resolution Notes
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1A4A14', lineHeight: 1.6 }}>
              {report.resolution_notes}
            </p>
          </div>
        )}

        {/* Actions */}
        {report.status !== 'RESOLVED' && report.status !== 'CANCELLED' && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {canAdmin && (
              <button onClick={handleSuggest} className="btn btn-secondary">
                🤖 Suggest Assignment
              </button>
            )}
            {canResolve && (
              <button onClick={() => setResolveOpen(true)} className="btn btn-primary">
                ✅ Mark as Resolved
              </button>
            )}
          </div>
        )}
      </div>

      {/* Resolve modal */}
      <Modal open={resolveOpen} onClose={() => setResolveOpen(false)} title="✅ Resolve Rescue Report"
        footer={
          <>
            <button onClick={() => setResolveOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleResolve} disabled={saving} className="btn btn-primary">
              {saving ? 'Saving…' : 'Confirm Resolution'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="label-base">Resolution Notes</label>
          <textarea
            value={resolveNotes}
            onChange={e => setResolveNotes(e.target.value)}
            className="input-base"
            placeholder="Describe how the rescue was handled…"
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </div>
      </Modal>

      {/* Suggestions modal */}
      <Modal open={suggestOpen} onClose={() => setSuggestOpen(false)} title="🤖 AI Assignment Suggestions" size="lg">
        {loadingSuggest && <LoadingSpinner text="Calculating best matches…" />}
        {!loadingSuggest && suggestions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🏆 Ranked Volunteers
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(suggestions.ranked_volunteers || []).map((v, i) => (
                  <div key={v.volunteer_id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    background: i === 0 ? 'rgba(201,123,84,0.08)' : 'var(--cat-linen)',
                    border: `1px solid ${i === 0 ? 'rgba(201,123,84,0.3)' : 'var(--border-default)'}`,
                    borderRadius: '10px',
                  }}>
                    <span style={{ fontSize: '1.25rem', width: '28px', textAlign: 'center' }}>
                      {['🥇','🥈','🥉','4️⃣','5️⃣'][i]}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {v.distance_km} km away · {v.active_assignments} active · {v.available_now ? '✅ Available now' : '⏸ Unavailable'}
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--cat-terra)' }}>
                      {Math.round(v.score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📍 Nearest Shelters
              </h4>
              {(suggestions.nearest_shelters || []).map(s => (
                <div key={s.shelter_id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  background: 'var(--cat-linen)',
                  borderRadius: '8px',
                  marginBottom: '0.375rem',
                  fontSize: '0.875rem',
                }}>
                  <span style={{ fontWeight: 600 }}>🏠 {s.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{s.distance_km} km</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}