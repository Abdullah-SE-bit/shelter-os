import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PawPrint, Eye, EyeOff, Clock, Mail, Loader2, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { authApi } from '@/api/authApi';
import { tokenUtils } from '@/utils/tokenUtils';
import TermsConsent from '@/components/TermsConsent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLE_ROUTES = {
  SUPER_ADMIN: '/dashboard',
  SHELTER_ADMIN: '/shelter/dashboard',
  VET: '/appointments',
  VOLUNTEER: '/volunteers/assignments',
  CAT_OWNER: '/cats',
  ADOPTER: '/adoption',
};

export default function LoginPage() {
  useDocumentTitle('Sign In');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/adoption';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resend, setResend] = useState({ loading: false, msg: '' });

  const searchParams = new URLSearchParams(location.search);
  const idleLogout = searchParams.get('reason') === 'idle';

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
      const msg = err.response?.data?.error?.message;
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
      setResend({ loading: false, msg: 'Verification email sent. Check your inbox (and spam folder).' });
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
      tokenUtils.setTokens(guestData.access);
      window.location.href = '/adoption';
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to start guest session. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      {/* faint ambient vignette behind the whole page */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 900px 560px at 50% 46%, color-mix(in srgb, var(--brand-rust) 8%, transparent), transparent 70%)' }}
      />

      {/* glow + card */}
      <div className="relative flex w-full max-w-[640px] items-center justify-center py-16">
        {/* ambient glow blob 1 */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2">
          <div
            className="shelteros-glow-anim size-full rounded-full blur-[90px]"
            style={{
              background: 'conic-gradient(from 0deg, var(--brand-rust), var(--brand-amber), var(--brand-gold), var(--brand-rust))',
              animation: 'shelteros-spin 24s linear infinite, shelteros-pulse 7s ease-in-out infinite',
            }}
          />
        </div>

        {/* ambient glow blob 2 (counter-rotating, smaller) */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[400px] -translate-x-1/2 -translate-y-1/2">
          <div
            className="shelteros-glow-anim size-full rounded-full opacity-50 blur-[70px]"
            style={{
              background: 'conic-gradient(from 210deg, var(--brand-amber), var(--brand-gold), var(--brand-rust), var(--brand-amber))',
              animation: 'shelteros-spin-rev 17s linear infinite',
            }}
          />
        </div>

        {/* card */}
        <div
          className="shelteros-glow-anim relative z-10 w-full max-w-[440px] rounded-[20px] border border-border bg-card p-10"
          style={{ animation: 'shelteros-card-glow 5s ease-in-out infinite' }}
        >
          {/* logo */}
          <div className="mb-7 flex flex-col items-center gap-2.5">
            <div
              className="flex size-11 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, var(--brand-rust), var(--brand-amber))' }}
            >
              <PawPrint className="size-5 text-white" />
            </div>
            <div className="font-display text-[17px] font-extrabold tracking-tight text-foreground">Shelter OS</div>
          </div>

          <div className="mb-6 text-center">
            <h1 className="font-display text-[26px] font-bold text-foreground">Sign in to your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary">
                Create one free
              </Link>
            </p>
          </div>

          {idleLogout && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-info/20 bg-info/10 p-4 text-sm text-foreground">
              <Clock className="mt-0.5 size-4 shrink-0 text-info" />
              <div>
                <strong className="font-semibold">Session expired.</strong> You were logged out due to inactivity. Please
                sign in again.
              </div>
            </div>
          )}

          {error && (
            <div className={`rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive ${needsVerification ? 'mb-3' : 'mb-5'}`}>
              {error}
            </div>
          )}

          {needsVerification && (
            <div className="mb-5 rounded-lg border border-warning/25 bg-warning/10 p-4 text-sm text-foreground">
              <div className="mb-2.5 flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-warning" />
                Your email isn't verified yet. Please click the link we emailed you to activate your account.
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleResend} disabled={resend.loading}>
                {resend.loading ? 'Sending…' : 'Resend verification email'}
              </Button>
              {resend.msg && <div className="mt-2 text-xs text-muted-foreground">{resend.msg}</div>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-email">Email address</Label>
              <Input
                id="login-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs font-medium text-primary">
                  Forgot password?
                </Link>
              </div>
            </div>

            <TermsConsent checked={agreed} onChange={setAgreed} id="login-terms" />

            <Button type="submit" disabled={loading || !agreed} className="mt-1 h-11 w-full text-[15px]">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
            <hr className="flex-1 border-border" />
            or continue as guest
            <hr className="flex-1 border-border" />
          </div>

          <Button type="button" variant="outline" onClick={handleGuestAccess} disabled={guestLoading || !agreed} className="w-full">
            {guestLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Starting guest session…
              </>
            ) : (
              <>
                <Search className="size-4" />
                Browse cats without an account
              </>
            )}
          </Button>

          <div className="mt-8 grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface-muted p-5">
            {[
              { value: '500+', label: 'Cats Rescued' },
              { value: '150+', label: 'Adoptions' },
              { value: '80+', label: 'Volunteers' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl font-bold text-primary">{value}</div>
                <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
