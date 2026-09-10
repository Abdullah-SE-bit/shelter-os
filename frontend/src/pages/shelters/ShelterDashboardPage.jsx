import { useState } from 'react';
import { sheltersApi } from '../../api/sheltersApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { formatDate, timeAgo } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

export default function ShelterDashboardPage() {
  const { user }   = useAuth();
  const [intakeOpen, setIntakeOpen] = useState(false);

  const { data: dashData, loading } = useApi(() => sheltersApi.myDashboard());
  const d = dashData?.data || dashData || {};

  const stats = [
    { icon: '🐱', label: 'Cats in Shelter', value: d.cats_count, color: 'var(--cat-terra)',   link: '/cats' },
    { icon: '🙋', label: 'Volunteers',       value: d.volunteer_count, color: 'var(--cat-blue)', link: '/volunteers' },
    { icon: '❤️', label: 'Pending Apps',     value: d.pending_applications, color: 'var(--cat-sage)',  link: '/shelter/applications' },
    { icon: '📦', label: 'Low Stock Items',  value: d.low_stock_count, color: 'var(--cat-amber)', link: '/inventory' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-brown), var(--cat-espresso))',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ position: 'absolute', right: '2rem', bottom: '-1rem', fontSize: '7rem', opacity: 0.09 }}>🏠</div>
        <p style={{ color: 'rgba(255,255,255,0.65)', margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
          🏠 Shelter Dashboard
        </p>
        <h1 style={{ color: 'white', margin: '0 0 0.75rem', fontSize: '2rem', fontFamily: 'Playfair Display, serif' }}>
          {d.shelter_name || 'My Shelter'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1.25rem', fontSize: '0.9375rem' }}>
          {d.city ? `📍 ${d.city}` : ''} {d.capacity ? `· Capacity: ${d.capacity}` : ''}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setIntakeOpen(true)} style={{
            background: 'white', color: 'var(--cat-rust)',
            padding: '0.625rem 1.25rem', borderRadius: '10px',
            fontWeight: 800, fontSize: '0.875rem', border: 'none', cursor: 'pointer',
          }}>
            📥 Intake Cat
          </button>
          <Link to="/rescue" style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
            color: 'white', padding: '0.625rem 1.25rem', borderRadius: '10px',
            fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            🚨 Rescue Reports
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading shelter data…" />
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {stats.map(s => (
              <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '14px',
                  padding: '1.25rem 1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '3rem', opacity: 0.1 }}>{s.icon}</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '0.25rem' }}>{s.value ?? '—'}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent intake */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Recent cats */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  🐱 Recent Intake
                </h3>
                <Link to="/cats" style={{ fontSize: '0.8rem', color: 'var(--cat-terra)', textDecoration: 'none', fontWeight: 700 }}>View all →</Link>
              </div>
              {(d.recent_cats || []).slice(0, 5).map(cat => (
                <Link key={cat.id} to={`/cats/${cat.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-default)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--cat-linen)' }}>
                      <img src={cat.primary_photo_url || CAT_PLACEHOLDER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{cat.name || 'Unnamed'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(cat.intake_date)}</div>
                    </div>
                  </div>
                </Link>
              ))}
              {(!d.recent_cats || d.recent_cats.length === 0) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>No recent intake</p>
              )}
            </div>

            {/* Pending applications */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ❤️ Pending Applications
                </h3>
                <Link to="/shelter/applications" style={{ fontSize: '0.8rem', color: 'var(--cat-terra)', textDecoration: 'none', fontWeight: 700 }}>View all →</Link>
              </div>
              {(d.pending_apps || []).slice(0, 5).map(app => (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-default)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{app.applicant_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>for {app.cat_name} · {timeAgo(app.created_at)}</div>
                  </div>
                  <Link to="/shelter/applications" className="btn btn-secondary btn-sm">Review</Link>
                </div>
              ))}
              {(!d.pending_apps || d.pending_apps.length === 0) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>No pending applications</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Intake modal */}
      <Modal open={intakeOpen} onClose={() => setIntakeOpen(false)} title="📥 Intake Cat" size="sm"
        footer={<button onClick={() => setIntakeOpen(false)} className="btn btn-secondary">Close</button>}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          To intake a new cat, first create the cat profile, then it will be automatically linked to your shelter.
        </p>
        <Link to="/cats/create" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '1rem' }}
          onClick={() => setIntakeOpen(false)}>
          🐱 Create New Cat Profile
        </Link>
      </Modal>
    </div>
  );
}