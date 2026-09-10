import { useState } from 'react';
import { Link } from 'react-router-dom';
import { lostFoundApi } from '../../api/lostFoundApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { formatDate, timeAgo } from '../../utils/dateUtils';
import { truncate } from '../../utils/formatters';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

const STATUS_PILL = {
  ACTIVE:   { bg: 'linear-gradient(90deg, #C0524E, #A03B38)', label: '🔍 LOST' },
  RESOLVED: { bg: 'linear-gradient(90deg, #7BAD6E, #5A9B50)', label: '✅ RESOLVED' },
  EXPIRED:  { bg: 'linear-gradient(90deg, #9a8f86, #6e655d)', label: '⏰ EXPIRED' },
};

const FOUND_STATUS = {
  OPEN:      { bg: 'var(--cat-sage-light)', color: '#2E6B24', label: '✅ FOUND' },
  MATCHED:   { bg: 'var(--cat-amber-light, rgba(230,180,80,0.18))', color: '#7A4F00', label: '🔗 MATCHED' },
  REUNITED:  { bg: 'var(--cat-sage-light)', color: '#2E6B24', label: '🎉 REUNITED' },
  SHELTERED: { bg: 'var(--cat-blue-light)', color: '#2E5A80', label: '🏠 SHELTERED' },
  CLOSED:    { bg: 'var(--cat-linen)', color: 'var(--text-muted)', label: 'CLOSED' },
};

function LostAlertCard({ alert }) {
  const pill = STATUS_PILL[alert.status] || STATUS_PILL.ACTIVE;
  return (
    <Link to={`/lost-found/lost/${alert.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
      >
        {/* Photo */}
        <div style={{ height: '180px', background: 'var(--cat-linen)', position: 'relative', overflow: 'hidden' }}>
          <img
            src={(alert.photos && alert.photos[0]) || CAT_PLACEHOLDER}
            alt={alert.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }}
          />
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            background: pill.bg,
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.25rem 0.625rem',
            borderRadius: '999px',
            letterSpacing: '0.04em',
          }}>
            {pill.label}
          </div>
          {alert.match_count > 0 && (
            <div style={{
              position: 'absolute', top: '0.75rem', right: '0.75rem',
              background: 'var(--cat-amber, #e6b450)', color: '#3d2b1f',
              fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '999px',
            }}>
              🔗 {alert.match_count} match{alert.match_count > 1 ? 'es' : ''}
            </div>
          )}
          <div style={{
            position: 'absolute',
            bottom: 0,
            insetInline: 0,
            background: 'linear-gradient(to top, rgba(61,43,31,0.7), transparent)',
            padding: '1.5rem 0.875rem 0.625rem',
          }}>
            <p style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '1rem' }}>{alert.cat_name || alert.title}</p>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '0.875rem 1rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {truncate(alert.description, 80)}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            {alert.last_seen_at && <span>📅 Last seen {formatDate(alert.last_seen_at)}</span>}
            {alert.contact_phone && <span>📞 {alert.contact_phone}</span>}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Posted {timeAgo(alert.created_at)} by {alert.reporter_name || 'Anonymous'}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '0.5rem', fontSize: '0.8rem', color: 'var(--cat-terra)', fontWeight: 700 }}>
            View full report &amp; matches →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function LostAlertsPage() {
  const { user } = useAuth();
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(12);
  const [tab, setTab] = useState('lost'); // lost | found
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const { data: lostData, loading: lostLoading } = useApi(
    () => lostFoundApi.listLost({ page, page_size: pageSize, q: search || undefined, status: statusFilter }),
    null,
    [page, tab, search, statusFilter]
  );
  const { data: foundData, loading: foundLoading } = useApi(
    () => lostFoundApi.listFound({ page, page_size: pageSize, q: search || undefined }),
    null,
    [page, tab, search]
  );

  const loading    = tab === 'lost' ? lostLoading  : foundLoading;
  const data       = tab === 'lost' ? lostData     : foundData;
  const items      = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-espresso), #5A3A25)',
        padding: '3rem 2rem 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '2rem', bottom: '-1rem', fontSize: '8rem', opacity: 0.08 }}>🔍</div>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontFamily: 'Playfair Display, serif' }}>
            Lost &amp; Found 🐾
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 1.5rem', fontSize: '1rem', maxWidth: '480px' }}>
            Help reunite lost cats with their families. Browse alerts or report a found cat.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {user && (
              <Link to="/lost-found/create" style={{
                background: 'white',
                color: 'var(--cat-rust)',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}>
                + Report Lost Cat
              </Link>
            )}
            <Link to="/lost-found/found" style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              📋 Found Cat Reports
            </Link>
          </div>
        </div>
        <div style={{
          position: 'absolute',
          bottom: '-1px',
          left: 0,
          right: 0,
          height: '50px',
          background: 'var(--cat-cream)',
          clipPath: 'ellipse(55% 100% at 50% 100%)',
        }} />
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[
            { id: 'lost',  label: '🔍 Lost Cats',   count: lostData?.count },
            { id: 'found', label: '📋 Found Reports', count: foundData?.count },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); reset(); }} style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '10px',
              border: `2px solid ${tab === t.id ? 'var(--cat-terra)' : 'var(--border-default)'}`,
              background: tab === t.id ? 'var(--cat-terra)' : 'var(--surface-card)',
              color: tab === t.id ? 'white' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}>
              {t.label}
              {t.count !== undefined && (
                <span style={{
                  background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'var(--cat-linen)',
                  color: tab === t.id ? 'white' : 'var(--text-muted)',
                  borderRadius: '999px',
                  padding: '0.1rem 0.5rem',
                  fontSize: '0.75rem',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter bar (J1) */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', padding: '0.875rem 1.25rem', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px' }}>
          <input type="search" value={search} onChange={e => { setSearch(e.target.value); reset(); }}
            placeholder="🔍 Search by name, description, breed…" className="input-base" style={{ flex: 1, minWidth: '200px' }} />
          {tab === 'lost' && (
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); reset(); }} className="input-base" style={{ width: 'auto' }}>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
              <option value="EXPIRED">Expired</option>
              <option value="ALL">All statuses</option>
            </select>
          )}
        </div>

        {loading && <LoadingSpinner size="lg" text="Loading alerts…" />}

        {!loading && items.length === 0 && (
          <EmptyState
            icon={tab === 'lost' ? '🔍' : '📋'}
            title={tab === 'lost' ? 'No active lost alerts' : 'No found cat reports'}
            message="Check back later or be the first to report."
            action={user && tab === 'lost' && (
              <Link to="/lost-found/create" className="btn btn-primary">+ Report Lost Cat</Link>
            )}
          />
        )}

        {!loading && items.length > 0 && tab === 'lost' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            {items.map(alert => <LostAlertCard key={alert.id} alert={alert} />)}
          </div>
        )}

        {!loading && items.length > 0 && tab === 'found' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {items.map(report => {
              const fb = FOUND_STATUS[report.status] || FOUND_STATUS.OPEN;
              return (
                <Link key={report.id} to={`/lost-found/found/${report.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    transition: 'all 0.2s',
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cat-terra)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                  >
                    <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'var(--cat-linen)' }}>
                      <img
                        src={(report.photos && report.photos[0]) || CAT_PLACEHOLDER}
                        alt="Found cat"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ background: fb.bg, color: fb.color, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                          {fb.label}
                        </span>
                        {report.match_count > 0 && (
                          <span style={{ background: 'var(--cat-amber-light, rgba(230,180,80,0.18))', color: '#7A4F00', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                            🔗 {report.match_count} match{report.match_count > 1 ? 'es' : ''}
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{timeAgo(report.created_at)}</span>
                      </div>
                      <p style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {truncate(report.description, 100)}
                      </p>
                      {report.breed_guess && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Breed guess: {report.breed_guess}</span>
                      )}
                      <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--cat-terra)', fontWeight: 700 }}>View &amp; compare →</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize}
          onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
      </div>
    </div>
  );
}