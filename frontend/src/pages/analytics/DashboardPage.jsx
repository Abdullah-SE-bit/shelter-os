import { Link } from 'react-router-dom';
import { analyticsApi } from '../../api/analyticsApi';
import { sheltersApi } from '../../api/sheltersApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';

function StatCard({ icon, value, label, color = 'var(--cat-terra)', link }) {
  const inner = (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: '14px',
      padding: '1.25rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      cursor: link ? 'pointer' : 'default',
      transition: 'all 0.2s',
    }}>
      <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '3.5rem', opacity: 0.1 }}>{icon}</div>
      <div style={{ fontSize: '2.25rem', fontWeight: 900, color, lineHeight: 1, marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: '14px',
      padding: '1.25rem',
      flex: '1 1 300px',
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: overview, loading: overviewLoading } = useApi(() => analyticsApi.overview());

  const loading = overviewLoading;

  const d = overview || {};

  const greetHour = new Date().getHours();
  const greet = greetHour < 12 ? 'Good morning' : greetHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-container">
      {/* Greeting */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-espresso), var(--cat-brown))',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ position: 'absolute', right: '2rem', bottom: '-1rem', fontSize: '8rem', opacity: 0.1 }}>🐾</div>
        <div style={{ position: 'absolute', right: '8rem', top: '0.5rem', fontSize: '4rem', opacity: 0.08, transform: 'rotate(15deg)' }}>🐱</div>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 0.375rem', fontSize: '0.875rem', fontWeight: 600 }}>{greet} 👋</p>
        <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '2rem', fontFamily: 'Playfair Display, serif' }}>
          {user?.profile?.first_name || 'Admin'} Dashboard
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: '0.9375rem' }}>
          Here's what's happening at CatConnect today.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading dashboard…" />
      ) : (
        <>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard icon="🐱" value={d.total_cats        || 0}  label="Total Cats"     link="/cats" />
            <StatCard icon="🏠" value={d.total_shelters    || 0}  label="Shelters"        link="/shelters" />
            <StatCard icon="🙋" value={d.total_volunteers  || 0}  label="Volunteers"      link="/volunteers" color="var(--cat-blue)" />
            <StatCard icon="🚨" value={d.open_rescues      || 0}  label="Open Rescues"    link="/rescue"     color="var(--cat-red)" />
            <StatCard icon="❤️" value={d.pending_adoptions || 0}  label="Pending Adoptions" link="/shelter/applications" color="var(--cat-sage)" />
            <StatCard icon="🔍" value={d.active_lost_alerts|| 0}  label="Lost Alerts"     link="/lost-found"  color="var(--cat-amber)" />
          </div>

          {/* Per-role user counters (B2) — super admin only */}
          {user?.role === 'SUPER_ADMIN' && d.users_by_role && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1rem' }}>
                Users by Role
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {[
                  { role: 'SHELTER_ADMIN', icon: '🏠', label: 'Shelter Admins', color: 'var(--cat-terra)' },
                  { role: 'VET',           icon: '🩺', label: 'Vets',           color: 'var(--cat-blue)' },
                  { role: 'CAT_OWNER',     icon: '🐱', label: 'Cat Owners',     color: 'var(--cat-sage)' },
                  { role: 'ADOPTER',       icon: '❤️', label: 'Adopters',       color: 'var(--cat-amber)' },
                  { role: 'VOLUNTEER',     icon: '🙋', label: 'Volunteers',     color: 'var(--cat-brown)' },
                ].map(({ role, icon, label, color }) => (
                  <Link key={role} to={`/admin/users?role=${role}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.1rem 1.25rem', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = color; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{icon}</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color, lineHeight: 1 }}>{d.users_by_role[role] || 0}</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1rem' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { to: '/rescue/submit',  icon: '🚨', label: 'Report Rescue',   color: 'var(--cat-red)' },
                { to: '/lost-found/create', icon: '🔍', label: 'Lost Alert', color: 'var(--cat-amber)' },
                { to: '/cats/create',    icon: '🐱', label: 'Add Cat',         color: 'var(--cat-terra)' },
                { to: '/shelter/intake', icon: '📥', label: 'Intake Cat',       color: 'var(--cat-sage)' },
                { to: '/shelter/applications', icon: '❤️', label: 'Applications', color: 'var(--cat-blue)' },
                { to: '/reports',        icon: '📊', label: 'Reports',          color: 'var(--cat-brown)' },
              ].map(({ to, icon, label, color }) => (
                <Link key={to} to={to} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '10px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-default)',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  <span style={{ fontSize: '1.125rem' }}>{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Section rows */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <SectionCard title="🐱 Cat Status Breakdown">
              {Object.entries({
                'In Shelter': d.cats_in_shelter,
                'Fostered':   d.cats_fostered,
                'Adopted':    d.cats_adopted,
                'Lost':       d.cats_lost,
                'Deceased':   d.cats_deceased,
              }).map(([label, count]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '80px',
                      height: '6px',
                      background: 'var(--cat-linen)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, ((count || 0) / (d.total_cats || 1)) * 100)}%`,
                        background: 'linear-gradient(90deg, var(--cat-terra), var(--cat-tan))',
                        borderRadius: '999px',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--cat-terra)', minWidth: '24px', textAlign: 'right' }}>
                      {count || 0}
                    </span>
                  </div>
                </div>
              ))}
            </SectionCard>

            <SectionCard title="📊 Recent Activity">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(d.recent_activity || []).slice(0, 6).map((act, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--cat-terra)',
                      flexShrink: 0,
                      marginTop: '0.375rem',
                    }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{act.description}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(act.timestamp)}</span>
                    </div>
                  </div>
                ))}
                {(!d.recent_activity || d.recent_activity.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>No recent activity</p>
                )}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}