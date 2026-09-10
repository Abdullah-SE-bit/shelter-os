import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function ResetPasswordPage() {
  useDocumentTitle('Reset Password');
  const [searchParams]           = useSearchParams();
  const token                    = searchParams.get('token') || '';
  const navigate                 = useNavigate();
  const [password,  setPassword] = useState('');
  const [confirm,   setConfirm]  = useState('');
  const [error,     setError]    = useState('');
  const [loading,   setLoading]  = useState(false);
  const [showPass,  setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await authApi.resetPassword({ token, new_password: password });
      navigate('/login', { state: { message: 'Password reset successful. Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

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
        animation: 'fadeIn 0.35s ease',
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔐</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>Set new password</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Choose a strong password for your account.</p>
        </div>
        {error && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🙀 {error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'New Password', value: password, onChange: setPassword, id: 'new-pass' },
            { label: 'Confirm Password', value: confirm, onChange: setConfirm, id: 'confirm-pass' },
          ].map(({ label, value, onChange, id }) => (
            <div key={id} className="form-group">
              <label className="label-base">{label}</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} required minLength={8}
                  value={value} onChange={e => onChange(e.target.value)}
                  className="input-base" placeholder="Min 8 characters" id={id}
                  style={{ paddingRight: '3rem' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)', padding: 0 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
            {loading ? 'Saving…' : '🔐 Reset Password'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--cat-terra)', fontWeight: 700, textDecoration: 'none' }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
