import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lostFoundApi } from '../../api/lostFoundApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDateTime, timeAgo } from '../../utils/dateUtils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80';

const STATUS_BADGE = {
  ACTIVE:   { bg: 'var(--cat-red-light)', color: '#8B2C2A', label: '🔍 Still lost' },
  RESOLVED: { bg: 'var(--cat-sage-light)', color: '#2E6B24', label: '🎉 Resolved — back home' },
  EXPIRED:  { bg: 'var(--cat-linen)', color: 'var(--text-muted)', label: '⏰ Expired' },
};

export default function LostAlertDetailPage() {
  const { alertId } = useParams();
  const { user } = useAuth();
  const { data: alert, loading, refetch } = useApi(() => lostFoundApi.getLost(alertId), null, [alertId]);

  const [selectedImg, setSelectedImg] = useState(0);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const isOwner = alert && alert.reporter === user?.id;
  const isAdmin = user?.role === 'SHELTER_ADMIN' || user?.role === 'SUPER_ADMIN';

  const doResolve = async () => {
    setBusy(true);
    try {
      await lostFoundApi.resolveLost(alertId);
      setMsg('Marked as resolved — glad the cat is safe! 🎉');
      refetch();
    } catch (err) {
      setMsg(err.response?.data?.error?.message || 'Failed to update.');
    }
    setBusy(false); setResolveOpen(false);
  };

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" text="Loading lost cat report…" /></div>;
  if (!alert) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '4rem' }}>😿</div>
      <h2>Lost cat report not found</h2>
      <Link to="/lost-found" className="btn btn-secondary" style={{ marginTop: '1rem' }}>← Back to Lost &amp; Found</Link>
    </div>
  );

  const badge = STATUS_BADGE[alert.status] || STATUS_BADGE.ACTIVE;
  const photos = (alert.photos && alert.photos.length) ? alert.photos : [CAT_PLACEHOLDER];
  const mainPhoto = photos[selectedImg] || CAT_PLACEHOLDER;

  return (
    <div className="page-container-sm">
      <PageHeader title="🐱 Lost Cat Report" subtitle={alert.title} backPath="/lost-found" />

      {msg && (
        <div style={{ background: 'var(--cat-sage-light)', color: '#2E6B24', border: '1px solid rgba(123,173,110,0.4)', borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Photos */}
        <div>
          <div style={{ borderRadius: '16px', overflow: 'hidden', height: '300px', background: 'var(--cat-linen)', boxShadow: 'var(--shadow-md)' }}>
            <img src={mainPhoto} alt={alert.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
          </div>
          {photos.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.625rem' }}>
              {photos.map((p, i) => (
                <div key={i} onClick={() => setSelectedImg(i)} style={{
                  width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                  border: `2px solid ${selectedImg === i ? 'var(--cat-terra)' : 'var(--border-default)'}`,
                }}>
                  <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <span style={{ background: badge.bg, color: badge.color, fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.7rem', borderRadius: '999px' }}>{badge.label}</span>
            <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: '1.4rem', fontWeight: 800 }}>{alert.cat_name || alert.title}</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Posted {timeAgo(alert.created_at)} by {alert.reporter_name || 'someone'}
            </p>
          </div>

          {/* Description */}
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{alert.description}</p>
            {alert.behavioral_notes && (
              <>
                <h3 style={{ margin: '0.875rem 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Behavior</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{alert.behavioral_notes}</p>
              </>
            )}
          </div>

          {/* Facts */}
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {alert.last_seen_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📅 Last seen</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{formatDateTime(alert.last_seen_at)}</span>
              </div>
            )}
            {alert.last_seen_latitude != null && alert.last_seen_longitude != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 Location</span>
                <a href={`https://maps.google.com/?q=${alert.last_seen_latitude},${alert.last_seen_longitude}`} target="_blank" rel="noreferrer" style={{ color: 'var(--cat-terra)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>Open in maps ↗</a>
              </div>
            )}
          </div>

          {/* Contact the owner */}
          {(alert.contact_phone || alert.contact_email) && (
            <div style={{ background: 'var(--cat-blue-light)', border: '1px solid rgba(46,90,128,0.25)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#2E5A80', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Seen this cat? Contact the owner</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {alert.contact_phone && <a href={`tel:${alert.contact_phone}`} style={{ color: '#2E5A80', fontWeight: 700, textDecoration: 'none' }}>📞 {alert.contact_phone}</a>}
                {alert.contact_email && <a href={`mailto:${alert.contact_email}`} style={{ color: '#2E5A80', fontWeight: 700, textDecoration: 'none', wordBreak: 'break-all' }}>✉️ {alert.contact_email}</a>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <Link to={`/lost-found/matches/${alert.id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: '180px' }}>
              🔗 View possible matches{alert.match_count > 0 ? ` (${alert.match_count})` : ''}
            </Link>
            {(isOwner || isAdmin) && alert.status === 'ACTIVE' && (
              <button onClick={() => setResolveOpen(true)} disabled={busy} className="btn btn-secondary">✅ Mark resolved</button>
            )}
          </div>

          {!isOwner && alert.status === 'ACTIVE' && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Think you found this cat?{' '}
              <Link to="/lost-found/found" style={{ color: 'var(--cat-terra)', fontWeight: 700, textDecoration: 'none' }}>Report a found cat →</Link>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={resolveOpen}
        title="Mark as resolved?"
        message="This closes the lost-cat report and any pending match suggestions. Do this once the cat is back safe."
        confirmLabel="Mark resolved"
        onConfirm={doResolve}
        onCancel={() => setResolveOpen(false)}
      />
    </div>
  );
}
