import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sidebarSections = {
  SUPER_ADMIN: [
    { icon: '📊', label: 'Dashboard',    path: '/dashboard' },
    { icon: '👥', label: 'Users',        path: '/admin/users' },
    { icon: '🩺', label: 'Vet Approvals', path: '/admin/vet-approvals' },
    { icon: '🐱', label: 'Cats',         path: '/cats' },
    { icon: '🏠', label: 'Shelters',     path: '/shelters' },
    { icon: '➕', label: 'Create Shelter', path: '/shelters/create' },
    { icon: '🙋', label: 'Volunteers',   path: '/volunteers' },
    { icon: '🚨', label: 'Rescues',      path: '/rescue' },
    { icon: '🔍', label: 'Lost & Found', path: '/lost-found' },
    { icon: '💝', label: 'Donations',    path: '/finance/donations' },
    { icon: '➕', label: 'Register Donation', path: '/finance/donations/record' },
    { icon: '🗺️', label: 'Map',          path: '/maps' },
    { icon: '🔔', label: 'Notifications',path: '/notifications' },
    { icon: '💬', label: 'Messages',     path: '/messages' },
    { icon: '📋', label: 'Audit Logs',   path: '/audit' },
  ],
  SHELTER_ADMIN: [
    { icon: '📊', label: 'Dashboard',    path: '/shelter/dashboard' },
    { icon: '🩺', label: 'Vet Approvals', path: '/admin/vet-approvals' },
    { icon: '🐱', label: 'Cats',         path: '/cats' },
    { icon: '📥', label: 'Intake',       path: '/shelter/intake' },
    { icon: '📤', label: 'Discharge',    path: '/shelter/discharge' },
    { icon: '🙋', label: 'Volunteers',   path: '/volunteers' },
    { icon: '🤝', label: 'Foster',       path: '/foster' },
    { icon: '📅', label: 'Appointments', path: '/appointments' },
    { icon: '❤️', label: 'Adoptions',    path: '/shelter/applications' },
    { icon: '📦', label: 'Inventory',    path: '/inventory' },
    { icon: '💝', label: 'Finance',      path: '/finance/donations' },
    { icon: '➕', label: 'Register Donation', path: '/finance/donations/record' },
    { icon: '📈', label: 'Reports',      path: '/reports' },
    { icon: '🚨', label: 'Rescues',      path: '/rescue' },
    { icon: '🗺️', label: 'Map',          path: '/maps' },
    { icon: '🔔', label: 'Notifications',path: '/notifications' },
    { icon: '💬', label: 'Messages',     path: '/messages' },
  ],
  VET: [
    { icon: '👤', label: 'Profile',      path: '/profile' },
    { icon: '📅', label: 'Appointments', path: '/appointments' },
    { icon: '🚨', label: 'Health Alerts',path: '/health-alerts' },
    { icon: '🗺️', label: 'Map',          path: '/maps' },
    { icon: '🔔', label: 'Notifications',path: '/notifications' },
    { icon: '💬', label: 'Messages',     path: '/messages' },
  ],
  VOLUNTEER: [
    { icon: '📋', label: 'Assignments',  path: '/volunteers/assignments' },
    { icon: '👤', label: 'Profile',      path: '/profile' },
    { icon: '🐱', label: 'Cats',         path: '/cats' },
    { icon: '➕', label: 'Register My Cat', path: '/cats/register' },
    { icon: '🏠', label: 'Add Shelter Cat', path: '/cats/create' },
    { icon: '📅', label: 'Appointments', path: '/appointments' },
    { icon: '🚨', label: 'Rescues',      path: '/rescue' },
    { icon: '🗺️', label: 'Map',          path: '/maps' },
    { icon: '🔔', label: 'Notifications',path: '/notifications' },
    { icon: '💬', label: 'Messages',     path: '/messages' },
  ],
  CAT_OWNER: [
    { icon: '🐱', label: 'My Cats',      path: '/cats' },
    { icon: '➕', label: 'Register Cat',  path: '/cats/register' },
    { icon: '📅', label: 'Appointments', path: '/appointments' },
    { icon: '🔍', label: 'Lost & Found', path: '/lost-found' },
    { icon: '🗺️', label: 'Map',          path: '/maps' },
    { icon: '🔔', label: 'Notifications',path: '/notifications' },
    { icon: '💬', label: 'Messages',     path: '/messages' },
    { icon: '👤', label: 'Profile',      path: '/profile' },
  ],
  ADOPTER: [
    { icon: '❤️', label: 'Browse Cats',  path: '/adoption' },
    { icon: '📋', label: 'My Applications',path: '/adoption/my-applications' },
    { icon: '🐱', label: 'My Cats',      path: '/cats' },
    { icon: '➕', label: 'Register Cat',  path: '/cats/register' },
    { icon: '📅', label: 'Appointments', path: '/appointments' },
    { icon: '🔍', label: 'Lost & Found', path: '/lost-found' },
    { icon: '🗺️', label: 'Map',          path: '/maps' },
    { icon: '🔔', label: 'Notifications',path: '/notifications' },
    { icon: '💬', label: 'Messages',     path: '/messages' },
    { icon: '👤', label: 'Profile',      path: '/profile' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();

  if (!user) return null;

  // A vet awaiting approval only gets their profile — every other option is
  // locked until both a Super Admin and a Shelter Admin approve the request.
  const vetLocked = user.role === 'VET' && user.vet_profile && !user.vet_profile.is_fully_approved;
  const items = vetLocked
    ? [{ icon: '👤', label: 'Profile', path: '/profile' }]
    : (sidebarSections[user.role] || []);

  // Highlight only the most specific matching item, so e.g. "/shelters/create"
  // activates "Create Shelter" but NOT the parent "Shelters" (/shelters).
  const activePath = items
    .map(i => i.path)
    .filter(p => location.pathname === p || location.pathname.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length)[0];

  const isActive = (path) => path === activePath;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'var(--surface-card)',
      borderRight: '1.5px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: '0',
      flexShrink: 0,
      zIndex: 50,
    }}>
      {/* User card */}
      <div style={{
        padding: '1.25rem',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--cat-linen)',
            transition: 'background 0.2s',
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1rem',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {user.profile?.profile_photo_url
                ? <img src={user.profile.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user.profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || '?')}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.profile?.first_name || 'User'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--cat-terra)', fontWeight: 600 }}>
                {user.role?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          {items.map(({ icon, label, path }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: active ? 700 : 600,
                  textDecoration: 'none',
                  color: active ? 'var(--cat-terra)' : 'var(--text-secondary)',
                  background: active ? 'rgba(201,123,84,0.1)' : 'transparent',
                  borderLeft: active ? '3px solid var(--cat-terra)' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Decorative paw + logout */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '2rem',
          opacity: 0.15,
          letterSpacing: '0.25rem',
          lineHeight: 1,
        }}>
          🐾🐾🐾
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: 'var(--cat-linen)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--cat-red)',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
