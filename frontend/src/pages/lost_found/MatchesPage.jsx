import { useParams } from 'react-router-dom';
import { lostFoundApi } from '../../api/lostFoundApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useState } from 'react';
import { timeAgo } from '../../utils/dateUtils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

function MatchCard({ match, isOwner, onConfirm, onReject }) {
  const score = Math.round((match.score || 0) * 100);
  const scoreColor = score >= 80 ? '#2E6B24' : score >= 60 ? '#7A4F00' : 'var(--text-muted)';

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: `2px solid ${score >= 80 ? 'rgba(123,173,110,0.5)' : 'var(--border-default)'}`,
      borderRadius: '14px',
      padding: '1.25rem',
      display: 'flex',
      gap: '1.25rem',
      alignItems: 'flex-start',
      boxShadow: score >= 80 ? '0 2px 12px rgba(123,173,110,0.15)' : 'var(--shadow-sm)',
    }}>
      {/* Found cat photo */}
      <div style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'var(--cat-linen)' }}>
        <img
          src={(match.found_report?.photos && match.found_report.photos[0]) || CAT_PLACEHOLDER}
          alt="Found cat"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Score badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{
            background: score >= 80 ? 'var(--cat-sage-light)' : score >= 60 ? 'var(--cat-amber-light)' : 'var(--cat-linen)',
            color: scoreColor,
            fontWeight: 900,
            fontSize: '0.875rem',
            padding: '0.2rem 0.75rem',
            borderRadius: '999px',
          }}>
            {score >= 80 ? '🎯' : score >= 60 ? '🔶' : '🔷'} {score}% Match
          </div>
          <span style={{
            background: match.status === 'CONFIRMED' ? 'var(--cat-sage-light)' : 'var(--cat-linen)',
            color: match.status === 'CONFIRMED' ? '#2E6B24' : 'var(--text-muted)',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: '999px',
          }}>
            {match.status}
          </span>
        </div>

        <p style={{ margin: '0 0 0.375rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {match.found_report?.description?.slice(0, 120) || 'Found cat report'}
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Found by {match.found_report?.reporter_name || 'someone'} · reported {timeAgo(match.found_report?.created_at)}
        </p>
        {match.found_report?.contact_phone && (
          <a href={`tel:${match.found_report.contact_phone}`} style={{ fontSize: '0.78rem', color: 'var(--cat-terra)', fontWeight: 700, textDecoration: 'none' }}>
            📞 {match.found_report.contact_phone}
          </a>
        )}

        {/* Actions */}
        {isOwner && match.status === 'PENDING' && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
            <button onClick={() => onConfirm(match.id)} className="btn btn-primary btn-sm">
              ✅ This is my cat!
            </button>
            <button onClick={() => onReject(match.id)} className="btn btn-secondary btn-sm">
              ✕ Not a match
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const { alertId } = useParams();
  const { user }    = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(null);
  const [rejectOpen,  setRejectOpen]  = useState(null);

  const { data: matches, loading, refetch } = useApi(() => lostFoundApi.getMatches(alertId), null, [alertId]);

  const matchList = Array.isArray(matches) ? matches : [];
  const isAdmin = user?.role === 'SHELTER_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isOwner = matchList[0]?.lost_alert?.reporter === user?.id || isAdmin;

  const handleConfirm = async (matchId) => {
    await lostFoundApi.confirmMatch(matchId);
    refetch();
    setConfirmOpen(null);
  };
  const handleReject = async (matchId) => {
    await lostFoundApi.rejectMatch(matchId);
    refetch();
    setRejectOpen(null);
  };

  return (
    <div className="page-container-sm">
      <PageHeader
        title="🔗 Match Results"
        subtitle={`${matchList.length} potential matches found by our AI`}
        backPath="/lost-found"
      />

      {matchList.length > 0 && (
        <div style={{
          background: 'var(--cat-amber-light)',
          border: '1px solid rgba(232,160,48,0.3)',
          borderRadius: '12px',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#7A4F00',
          fontWeight: 600,
        }}>
          🤖 Our AI scanned {matchList.length} found cat reports and found these potential matches.
          Review each one and confirm if it's your cat!
        </div>
      )}

      {loading && <LoadingSpinner text="Analyzing matches…" />}

      {!loading && matchList.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No matches yet"
          message="Our AI will scan all found cat reports and notify you when a match is found."
        />
      )}

      {!loading && matchList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {matchList
            .sort((a, b) => b.score - a.score)
            .map(match => (
              <MatchCard
                key={match.id}
                match={match}
                isOwner={isOwner}
                onConfirm={id => setConfirmOpen(id)}
                onReject={id => setRejectOpen(id)}
              />
            ))
          }
        </div>
      )}

      <ConfirmDialog
        open={!!confirmOpen}
        title="Confirm Match 🎉"
        message="Are you sure this is your cat? This will mark your lost alert as resolved."
        confirmLabel="Yes, found my cat!"
        onConfirm={() => handleConfirm(confirmOpen)}
        onCancel={() => setConfirmOpen(null)}
      />
      <ConfirmDialog
        open={!!rejectOpen}
        title="Reject Match"
        message="Mark this as not a match? It won't be shown to you again."
        confirmLabel="Not my cat"
        danger
        onConfirm={() => handleReject(rejectOpen)}
        onCancel={() => setRejectOpen(null)}
      />
    </div>
  );
}