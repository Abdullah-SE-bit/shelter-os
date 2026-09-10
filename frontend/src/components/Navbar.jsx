import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useNotifications from '../hooks/useNotifications';
// import NotificationBell from './NotificationBell';

const NAV_CAT_FACTS = [
  '🐾 Cats sleep 12–16 hours a day',
  '🐱 A group of cats is called a clowder',
  '👂 Cats have 32 muscles in each ear',
  '🦴 A cat\'s purr can help heal bones',
  '⚡ Cats can run up to 30 mph',
];

const roleLabel = (role) => {
  const map = {
    SUPER_ADMIN:   '👑 Super Admin',
    SHELTER_ADMIN: '🏠 Shelter Admin',
    VET:           '🩺 Veterinarian',
    VOLUNTEER:     '🙋 Volunteer',
    CAT_OWNER:     '🐱 Cat Owner',
    ADOPTER:       '❤️ Adopter',
  };
  return map[role] || role;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount }  = useNotifications();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catFact, setCatFact]   = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fact = NAV_CAT_FACTS[Math.floor(Math.random() * NAV_CAT_FACTS.length)];
    setCatFact(fact);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header
      style={{
        background: scrolled
          ? 'rgba(251,245,238,0.95)'
          : 'rgba(251,245,238,0.98)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border-default)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'all 0.25s ease',
        boxShadow: scrolled ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
    >
      {/* Cat fact ticker */}
      <div style={{
        background: 'linear-gradient(90deg, var(--cat-terra), var(--cat-rust))',
        color: 'white',
        textAlign: 'center',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '0.25rem 1rem',
        letterSpacing: '0.02em',
      }}>
        {catFact}
      </div>

      <nav style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 2px 8px rgba(201,123,84,0.35)',
          }}>
            🐾
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--cat-brown)', lineHeight: 1.1 }}>
              CatConnect
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              PawTrack OS
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {[
            { path: '/adoption', label: '❤️ Adopt' },
            { path: '/shelters', label: '🏠 Shelters' },
            { path: '/lost-found', label: '🔍 Lost & Found' },
            { path: '/campaigns', label: '💝 Donate' },
          ].map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                textDecoration: 'none',
                color: isActive(path) ? 'var(--cat-terra)' : 'var(--text-secondary)',
                background: isActive(path) ? 'rgba(201,123,84,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              {/* Notifications bell with dropdown */}
              {/* <NotificationBell /> */}

              {/* User pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Link to="/profile" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '999px',
                  background: 'var(--cat-linen)',
                  border: '1px solid var(--border-default)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {user.profile?.profile_photo_url
                      ? <img src={user.profile.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (user.profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || '?')}
                  </div>
                  <div className="hide-mobile">
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      {user.profile?.first_name || user.email?.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--cat-terra)', fontWeight: 600 }}>
                      {roleLabel(user.role)}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.375rem 0.75rem' }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
            </>
          )}

          {/* Hamburger */}
          <button
            className="hide-desktop"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              padding: '0.5rem',
              background: 'var(--cat-linen)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.125rem',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'var(--surface-card)',
          borderTop: '1px solid var(--border-default)',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {[
            { path: '/adoption', label: '❤️ Adopt a Cat' },
            { path: '/shelters', label: '🏠 Shelters' },
            { path: '/lost-found', label: '🔍 Lost & Found' },
            { path: '/campaigns', label: '💝 Donate' },
          ].map(({ path, label }) => (
            <Link key={path} to={path} style={{
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 700,
              textDecoration: 'none',
              color: 'var(--text-primary)',
              background: 'var(--cat-linen)',
            }}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
