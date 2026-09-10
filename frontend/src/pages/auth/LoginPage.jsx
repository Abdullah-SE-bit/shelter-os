import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { authApi } from '../../api/authApi';
import { tokenUtils } from '../../utils/tokenUtils';
import TermsConsent from '../../components/TermsConsent';

const CAT_IMAGES = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&q=80',
  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&q=80',
];
const randomCat = CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];

const ROLE_ROUTES = {
  SUPER_ADMIN:   '/dashboard',
  SHELTER_ADMIN: '/shelter/dashboard',
  VET:           '/appointments',
  VOLUNTEER:     '/volunteers/assignments',
  CAT_OWNER:     '/cats',
  ADOPTER:       '/adoption',
};

export default function LoginPage() {
  useDocumentTitle('Sign In');
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/adoption';

  const [form,     setForm]     = useState({ email: '', password: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed,   setAgreed]   = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resend,   setResend]   = useState({ loading: false, msg: '' });

  // Check for idle timeout message in URL
  const searchParams = new URLSearchParams(location.search);
  const idleLogout = searchParams.get('reason') === 'idle';

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResend({ loading: false, msg: '' });
    if (!agreed) {
      setError('Please accept the Terms & Conditions and Licensing Agreement to sign in.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      navigate(ROLE_ROUTES[result.role] || from, { replace: true });
    } catch (err) {
      const code = err.response?.data?.error?.code;
      const msg  = err.response?.data?.error?.message;
      if (code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
        setError(msg || 'Please verify your email before logging in.');
      } else {
        setError(msg || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResend({ loading: true, msg: '' });
    try {
      await authApi.resendVerification(form.email);
      setResend({ loading: false, msg: '✅ Verification email sent. Check your inbox (and spam folder).' });
    } catch (err) {
      setResend({ loading: false, msg: err.response?.data?.error?.message || 'Could not resend right now. Try again shortly.' });
    }
  };

  const handleGuestAccess = async () => {
    setError('');
    if (!agreed) {
      setError('Please accept the Terms & Conditions and Licensing Agreement to continue.');
      return;
    }
    setGuestLoading(true);
    try {
      const res = await authApi.guestSession();
      const guestData = res.data.data || res.data;
      
      // Store guest token using tokenUtils
      tokenUtils.setTokens(guestData.access);
      
      // Navigate to adoption page
      window.location.href = '/adoption';
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to start guest session. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--cat-cream)',
    }}>
      {/* Left panel — cat image */}
      <div
        className="hide-mobile"
        style={{
          flex: '0 0 48%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img
          src={randomCat}
          alt="A beautiful cat"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        {/* Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(61,43,31,0.55) 0%, rgba(139,69,19,0.3) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '3rem',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 'auto', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                border: '1px solid rgba(255,255,255,0.3)',
              }}>
                🐾
              </div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.5rem', color: 'white' }}>
                  CatConnect
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  PawTrack OS
                </div>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.2)',
            maxWidth: '380px',
          }}>
            <p style={{ color: 'white', fontSize: '1.125rem', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 0.75rem', fontFamily: 'Playfair Display, serif' }}>
              "Every cat deserves a loving home. Help us make that happen."
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', opacity: 0.8 }}>
              {['🐱','🐾','❤️'].map((e, i) => (
                <span key={i} style={{ fontSize: '1.125rem' }}>{e}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeIn 0.4s ease' }}>
          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(201,123,84,0.1)',
              border: '1px solid rgba(201,123,84,0.25)',
              borderRadius: '999px',
              padding: '0.375rem 1rem',
              marginBottom: '1.25rem',
            }}>
              <span>🐾</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cat-terra)' }}>Welcome back</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
              Sign in to your account
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--cat-terra)', fontWeight: 700, textDecoration: 'none' }}>
                Create one free →
              </Link>
            </p>
          </div>

          {/* Info message for idle logout */}
          {idleLogout && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '1rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>⏰</span>
              <div>
                <strong>Session expired</strong><br />
                You were logged out due to inactivity. Please sign in again.
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="form-error" style={{ marginBottom: needsVerification ? '0.75rem' : '1.25rem' }}>
              🙀 {error}
            </div>
          )}

          {/* Email not verified — offer a resend */}
          {needsVerification && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '1rem 1.25rem',
              background: 'rgba(230,180,80,0.12)',
              border: '1px solid rgba(230,180,80,0.4)',
              borderRadius: '12px',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
            }}>
              <div style={{ marginBottom: '0.625rem' }}>
                📧 Your email isn't verified yet. Please click the link we emailed you to activate your account.
              </div>
              <button type="button" onClick={handleResend} disabled={resend.loading} className="btn btn-secondary btn-sm">
                {resend.loading ? 'Sending…' : '✉️ Resend verification email'}
              </button>
              {resend.msg && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{resend.msg}</div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="label-base">Email address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="input-base"
                placeholder="you@example.com"
                autoComplete="email"
                id="login-email"
              />
            </div>

            <div className="form-group">
              <label className="label-base">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  id="login-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--text-muted)',
                    padding: 0,
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <Link to="/forgot-password" style={{
                  fontSize: '0.8125rem',
                  color: 'var(--cat-terra)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <div style={{ marginTop: '0.25rem' }}>
              <TermsConsent checked={agreed} onChange={setAgreed} id="login-terms" />
            </div>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '1rem',
                marginTop: '0.5rem',
                borderRadius: '12px',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  Signing in…
                </span>
              ) : (
                '🐾 Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1.75rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
          }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-default)' }} />
            or continue as guest
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-default)' }} />
          </div>

          <button 
            type="button"
            onClick={handleGuestAccess}
            disabled={guestLoading || !agreed}
            className="btn btn-secondary" 
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            {guestLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span style={{
                  width: '14px', height: '14px',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderTopColor: 'var(--text-primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }} />
                Starting Guest Session…
              </span>
            ) : (
              '🔍 Browse Cats Without Account'
            )}
          </button>

          {/* Stats strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginTop: '2rem',
            padding: '1.25rem',
            background: 'var(--cat-linen)',
            borderRadius: '12px',
            border: '1px solid var(--border-default)',
          }}>
            {[
              { value: '500+', label: 'Cats Rescued' },
              { value: '150+', label: 'Adoptions' },
              { value: '80+', label: 'Volunteers' },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--cat-terra)' }}>{value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
