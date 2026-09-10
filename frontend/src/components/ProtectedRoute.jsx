import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

// While a vet is awaiting approval, only these paths stay reachable.
const LOCKED_VET_ALLOWED = ['/profile', '/profile/edit'];

function StageRow({ label, status }) {
  const meta = {
    APPROVED: { color: '#2E6B24', bg: 'var(--cat-sage-light)', text: '✅ Approved' },
    REJECTED: { color: 'var(--cat-red)', bg: '#FBE3E3', text: '❌ Rejected' },
    PENDING:  { color: '#8A6D1A', bg: '#FBEFD3', text: '⏳ Pending' },
  }[status] || { color: '#8A6D1A', bg: '#FBEFD3', text: '⏳ Pending' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.6rem 0.85rem', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '10px' }}>
      <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '999px', color: meta.color, background: meta.bg }}>{meta.text}</span>
    </div>
  );
}

function VetPendingScreen({ vp }) {
  const rejected = vp?.is_rejected;
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '460px', width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border-default)', borderRadius: '20px', padding: '2.25rem', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>{rejected ? '🙁' : '🔒'}</div>
        <h2 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
          {rejected ? 'Registration declined' : 'Approval pending'}
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 1.5rem', fontSize: '0.92rem' }}>
          {rejected
            ? 'Your veterinarian registration request was declined. You can review the details on your profile.'
            : 'Your veterinarian account is being reviewed. Vet features unlock once a Super Admin and a Shelter Admin both approve your request.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <StageRow label="Super Admin" status={vp?.super_admin_status} />
          <StageRow label="Shelter Admin" status={vp?.shelter_admin_status} />
        </div>
        {rejected && vp?.rejection_reason && (
          <div style={{ background: '#FBE3E3', color: 'var(--cat-red)', borderRadius: '10px', padding: '0.7rem 0.9rem', fontSize: '0.85rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            <strong>Reason:</strong> {vp.rejection_reason}
          </div>
        )}
        <Link to="/profile" className="btn btn-primary" style={{ display: 'block', padding: '0.8rem' }}>👤 Go to my profile</Link>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location          = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" text="Loading your account…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div style={{ fontSize: '4rem' }}>🙀</div>
        <h2 style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '380px' }}>
          You don't have permission to view this page. Your role is <strong>{user.role}</strong>.
        </p>
        <a href="/" className="btn btn-primary">Go Home</a>
      </div>
    );
  }

  // Vet gating: until both approval stages pass, only the profile pages are
  // reachable. Everything else shows the pending-approval screen.
  const vetLocked = user.role === 'VET' && user.vet_profile && !user.vet_profile.is_fully_approved;
  if (vetLocked && !LOCKED_VET_ALLOWED.includes(location.pathname)) {
    return <VetPendingScreen vp={user.vet_profile} />;
  }

  return children;
};

export default ProtectedRoute;
