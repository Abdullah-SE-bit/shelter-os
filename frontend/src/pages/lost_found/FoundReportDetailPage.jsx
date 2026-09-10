import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lostFoundApi } from '../../api/lostFoundApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDate, timeAgo } from '../../utils/dateUtils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80';

const STATUS_BADGE = {
  OPEN:      { bg: 'var(--cat-sage-light)', color: '#2E6B24', label: '🔎 Open' },
  MATCHED:   { bg: 'var(--cat-amber-light, rgba(230,180,80,0.18))', color: '#7A4F00', label: '🔗 Matched' },
  REUNITED:  { bg: 'var(--cat-sage-light)', color: '#2E6B24', label: '🎉 Reunited with owner' },
  SHELTERED: { bg: 'var(--cat-blue-light)', color: '#2E5A80', label: '🏠 Taken in by shelter' },
  CLOSED:    { bg: 'var(--cat-linen)', color: 'var(--text-muted)', label: 'Closed' },
};

function scoreColor(pct) {
  return pct >= 80 ? '#2E6B24' : pct >= 55 ? '#7A4F00' : 'var(--text-muted)';
}

export default function FoundReportDetailPage() {
  const { foundId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: report, loading, refetch } = useApi(() => lostFoundApi.getFound(foundId), null, [foundId]);
  const { data: matches, loading: matchesLoading, refetch: refetchMatches } =
    useApi(() => lostFoundApi.foundMatches(foundId), null, [foundId]);

  const [confirmMatchId, setConfirmMatchId] = useState(null);
  const [rejectMatchId, setRejectMatchId] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Manual link
  const [linkOpen, setLinkOpen] = useState(false);
  const [lostOptions, setLostOptions] = useState([]);
  const [selectedLost, setSelectedLost] = useState('');

  useEffect(() => {
    if (linkOpen && lostOptions.length === 0) {
      lostFoundApi.listLost({ status: 'ACTIVE', page_size: 100 })
        .then(res => setLostOptions(res.data?.data?.results || []))
        .catch(() => {});
    }
  }, [linkOpen, lostOptions.length]);

  const matchList = Array.isArray(matches) ? matches : [];
  const isFinder = report && report.reporter === user?.id;
  const isAdmin = user?.role === 'SHELTER_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isResolved = report && ['REUNITED', 'SHELTERED', 'CLOSED'].includes(report.status);

  const doConfirm = async () => {
    setBusy(true);
    try {
      await lostFoundApi.confirmMatch(confirmMatchId);
      setMsg('Match confirmed — the cat has been reunited with its owner. 🎉');
      refetch(); refetchMatches();
    } catch (err) {
      setMsg(err.response?.data?.error?.message || 'Failed to confirm match.');
    }
    setBusy(false); setConfirmMatchId(null);
  };

  const doReject = async () => {
    setBusy(true);
    try {
      await lostFoundApi.rejectMatch(rejectMatchId);
      refetchMatches();
    } catch (err) {
      setMsg(err.response?.data?.error?.message || 'Failed to reject match.');
    }
    setBusy(false); setRejectMatchId(null);
  };

  const doIntake = async () => {
    setBusy(true);
    try {
      const res = await lostFoundApi.intakeFound(foundId);
      const catId = res.data?.data?.cat_id;
      setMsg('This cat has been taken into your shelter. 🏠');
      setIntakeOpen(false);
      refetch(); refetchMatches();
      if (catId) setTimeout(() => navigate(`/cats/${catId}`), 900);
    } catch (err) {
      setMsg(err.response?.data?.error?.message || 'Failed to take cat into shelter.');
      setIntakeOpen(false);
    }
    setBusy(false);
  };

  const doLink = async () => {
    if (!selectedLost) return;
    setBusy(true);
    try {
      await lostFoundApi.linkFound(foundId, { lost_alert: selectedLost });
      setMsg('Linked to the lost report. The owner can now confirm.');
      setLinkOpen(false); setSelectedLost('');
      refetch(); refetchMatches();
    } catch (err) {
      setMsg(err.response?.data?.error?.message || 'Failed to link.');
    }
    setBusy(false);
  };

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" text="Loading found report…" /></div>;
  if (!report) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '4rem' }}>😿</div>
      <h2>Found report not found</h2>
      <Link to="/lost-found/found" className="btn btn-secondary" style={{ marginTop: '1rem' }}>← Back to Found Reports</Link>
    </div>
  );

  const badge = STATUS_BADGE[report.status] || STATUS_BADGE.OPEN;
  const photo = (report.photos && report.photos[0]) || CAT_PLACEHOLDER;

  return (
    <div className="page-container-sm">
      <PageHeader title="🐈 Found Cat Report" subtitle="Compare with lost-cat reports or hand the cat to a shelter" backPath="/lost-found/found" />

      {msg && (
        <div style={{ background: 'var(--cat-sage-light)', color: '#2E6B24', border: '1px solid rgba(123,173,110,0.4)', borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* Report summary */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', padding: '1.25rem' }}>
          <div style={{ width: '160px', height: '160px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'var(--cat-linen)' }}>
            <img src={photo} alt="Found cat" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <span style={{ background: badge.bg, color: badge.color, fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.7rem', borderRadius: '999px' }}>{badge.label}</span>
            <p style={{ margin: '0.75rem 0 0.5rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{report.description}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {report.breed_guess && <span style={{ background: 'var(--cat-linen)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>🦴 {report.breed_guess}</span>}
              {(report.color_tags || []).map(c => <span key={c} style={{ background: 'var(--cat-linen)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>🎨 {c}</span>)}
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span>📅 Found {formatDate(report.found_at)} · reported {timeAgo(report.created_at)}</span>
              {report.reporter_name && <span>🙋 Reported by {report.reporter_name}</span>}
              {report.found_latitude != null && report.found_longitude != null && (
                <a href={`https://maps.google.com/?q=${report.found_latitude},${report.found_longitude}`} target="_blank" rel="noreferrer" style={{ color: 'var(--cat-terra)', textDecoration: 'none', fontWeight: 600 }}>📍 Found location ↗</a>
              )}
              {report.shelter_name && <span>🏠 Taken in by {report.shelter_name}</span>}
            </div>
          </div>
        </div>

        {/* Shelter intake action */}
        {isAdmin && !isResolved && (
          <div style={{ borderTop: '1px solid var(--border-default)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No owner? A shelter can take this cat in.</span>
            <button onClick={() => setIntakeOpen(true)} disabled={busy} className="btn btn-primary btn-sm">🏠 Take into shelter</button>
          </div>
        )}
        {report.resolved_cat && (
          <div style={{ borderTop: '1px solid var(--border-default)', padding: '1rem 1.25rem' }}>
            <Link to={`/cats/${report.resolved_cat}`} className="btn btn-secondary btn-sm">View cat profile →</Link>
          </div>
        )}
      </div>

      {/* Possible owner matches */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>🔗 Possible owner matches</h2>
        {isFinder && !isResolved && (
          <button onClick={() => setLinkOpen(o => !o)} className="btn btn-secondary btn-sm">
            {linkOpen ? 'Cancel' : '+ Link a lost report manually'}
          </button>
        )}
      </div>

      {linkOpen && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <label className="label-base">Choose the lost-cat report you think this matches</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <select value={selectedLost} onChange={e => setSelectedLost(e.target.value)} className="input-base" style={{ flex: 1, minWidth: '200px' }}>
              <option value="">Select a lost-cat report…</option>
              {lostOptions.map(a => <option key={a.id} value={a.id}>{a.title}{a.cat_name ? ` — ${a.cat_name}` : ''}</option>)}
            </select>
            <button onClick={doLink} disabled={busy || !selectedLost} className="btn btn-primary">Link</button>
          </div>
        </div>
      )}

      {matchesLoading && <LoadingSpinner text="Comparing with lost-cat reports…" />}

      {!matchesLoading && matchList.length === 0 && (
        <EmptyState icon="🔍" title="No matching lost reports yet"
          message="We compared this cat against active lost-cat reports and found no strong matches. A shelter can take the cat in, or link a report manually." />
      )}

      {!matchesLoading && matchList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {matchList.map(m => {
            const alert = m.lost_alert || {};
            const pct = m.score_pct ?? Math.round((m.score || 0) * 100);
            const lostPhoto = (alert.photos && alert.photos[0]) || CAT_PLACEHOLDER;
            return (
              <div key={m.id} style={{
                background: 'var(--surface-card)',
                border: `2px solid ${pct >= 80 ? 'rgba(123,173,110,0.5)' : 'var(--border-default)'}`,
                borderRadius: '14px', padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
              }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'var(--cat-linen)' }}>
                  <img src={lostPhoto} alt="Lost cat" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <span style={{ background: pct >= 80 ? 'var(--cat-sage-light)' : 'var(--cat-linen)', color: scoreColor(pct), fontWeight: 900, fontSize: '0.85rem', padding: '0.2rem 0.7rem', borderRadius: '999px' }}>
                      {pct >= 80 ? '🎯' : pct >= 55 ? '🔶' : '🔷'} {pct}% match
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{m.status}</span>
                  </div>
                  <p style={{ margin: '0 0 0.2rem', fontWeight: 800 }}>{alert.title || alert.cat_name || 'Lost cat'}</p>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {(alert.description || '').slice(0, 120)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Reported by {alert.reporter_name || 'someone'}{alert.last_seen_at ? ` · last seen ${formatDate(alert.last_seen_at)}` : ''}
                  </p>

                  {(isFinder || isAdmin) && m.status === 'PENDING' && !isResolved && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setConfirmMatchId(m.id)} className="btn btn-primary btn-sm">✅ Confirm — reunite with owner</button>
                      <button onClick={() => setRejectMatchId(m.id)} className="btn btn-secondary btn-sm">✕ Not a match</button>
                    </div>
                  )}
                  {m.status === 'CONFIRMED' && (
                    <div style={{ marginTop: '0.75rem', color: '#2E6B24', fontWeight: 700, fontSize: '0.85rem' }}>🎉 Confirmed — reunited with the owner.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmMatchId}
        title="Reunite with owner? 🎉"
        message="Confirm this found cat belongs to the lost-cat report. The cat will be returned to the person who reported it lost, and both reports will be closed."
        confirmLabel="Yes, reunite"
        onConfirm={doConfirm}
        onCancel={() => setConfirmMatchId(null)}
      />
      <ConfirmDialog
        open={!!rejectMatchId}
        title="Not a match?"
        message="Dismiss this suggested match. It won't be shown again."
        confirmLabel="Dismiss"
        danger
        onConfirm={doReject}
        onCancel={() => setRejectMatchId(null)}
      />
      <ConfirmDialog
        open={intakeOpen}
        title="Take cat into shelter? 🏠"
        message="This creates a cat profile in your shelter (status: In Shelter) and marks this found report as sheltered."
        confirmLabel="Take in"
        onConfirm={doIntake}
        onCancel={() => setIntakeOpen(false)}
      />
    </div>
  );
}
