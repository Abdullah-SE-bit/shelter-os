import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token          = searchParams.get('token');
  const [status, setStatus]   = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token provided.'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Token is invalid or expired.');
      });
  }, [token]);

  const config = {
    loading: { icon: '⏳', title: 'Verifying your email…', text: 'Please wait a moment.', color: 'var(--cat-amber)' },
    success: { icon: '✅', title: 'Email Verified!', text: 'Your account is now active. Welcome to CatConnect!', color: 'var(--cat-sage)' },
    error:   { icon: '❌', title: 'Verification Failed', text: message || 'Something went wrong.', color: 'var(--cat-red)' },
  }[status];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cat-cream)', padding: '2rem' }}>
      <div style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: '24px',
        padding: '3rem 2.5rem',
        maxWidth: '440px',
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
        animation: 'fadeIn 0.35s ease',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: config.color + '20',
          border: `2px solid ${config.color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 1.5rem',
          animation: status === 'loading' ? 'pulse 1.5s ease-in-out infinite' : 'fadeIn 0.3s ease',
        }}>
          {config.icon}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.75rem' }}>
          {config.title}
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 2rem', fontSize: '0.9375rem' }}>
          {config.text}
        </p>
        {status !== 'loading' && (
          <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '0.875rem' }}>
            🐾 Go to Login
          </Link>
        )}
      </div>
    </div>
  );
}
