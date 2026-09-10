import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot Password');
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
    } catch {}
    setSent(true);
    setLoading(false);
  };

  const cardStyle = {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: '24px',
    padding: '3rem 2.5rem',
    maxWidth: '440px',
    width: '100%',
    boxShadow: 'var(--shadow-lg)',
    animation: 'fadeIn 0.35s ease',
    textAlign: sent ? 'center' : 'left',
  };

  const wrapStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--cat-cream)',
    padding: '2rem',
  };

  if (sent) return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pawBounce 2s ease-in-out infinite' }}>✉️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.75rem' }}>Check your email</h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 2rem' }}>
          If <strong>{email}</strong> is registered, a reset link has been sent. It expires in 15 minutes.
        </p>
        <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '0.875rem' }}>
          ← Back to Login
        </Link>
      </div>
    </div>
  );

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔑</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>Forgot password?</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Enter your email and we'll send a reset link.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="label-base">Email address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="input-base" placeholder="you@example.com" id="forgot-email" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
            {loading ? 'Sending…' : '📧 Send Reset Link'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--cat-terra)', fontWeight: 700, textDecoration: 'none' }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
