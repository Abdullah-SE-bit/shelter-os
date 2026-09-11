'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { HeartHandshake, Eye, EyeOff, Clock, Loader2 } from 'lucide-react';
import { useAuth, ROLE_HOME } from '@/context/AuthContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import TermsConsent from '@/components/TermsConsent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  useDocumentTitle('Sign In');
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idleLogout = searchParams.get('reason') === 'idle';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!agreed) {
      setError('Please accept the Terms & Conditions and Licensing Agreement to sign in.');
      return;
    }
    setLoading(true);
    // Mock "magic" auth: the email field is read as a role key — no
    // password required — and routed straight to that role's dashboard.
    setTimeout(() => {
      const role = login(form.email);
      setLoading(false);
      if (role) {
        router.push(ROLE_HOME[role]);
      } else {
        setError('Unrecognized user. Try "super-admin", "shelter-admin", or "volunteer".');
      }
    }, 300);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 900px 560px at 50% 46%, color-mix(in srgb, var(--brand-rust) 8%, transparent), transparent 70%)' }}
      />

      <div className="relative flex w-full max-w-[640px] items-center justify-center py-16">
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2">
          <div
            className="shelteros-glow-anim size-full rounded-full blur-[90px]"
            style={{
              background: 'conic-gradient(from 0deg, var(--brand-rust), var(--brand-amber), var(--brand-gold), var(--brand-rust))',
              animation: 'shelteros-spin 24s linear infinite, shelteros-pulse 7s ease-in-out infinite',
            }}
          />
        </div>

        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[400px] -translate-x-1/2 -translate-y-1/2">
          <div
            className="shelteros-glow-anim size-full rounded-full opacity-50 blur-[70px]"
            style={{
              background: 'conic-gradient(from 210deg, var(--brand-amber), var(--brand-gold), var(--brand-rust), var(--brand-amber))',
              animation: 'shelteros-spin-rev 17s linear infinite',
            }}
          />
        </div>

        <div
          className="shelteros-glow-anim relative z-10 w-full max-w-[440px] rounded-[20px] border border-border bg-card p-10"
          style={{ animation: 'shelteros-card-glow 5s ease-in-out infinite' }}
        >
          <div className="mb-7 flex flex-col items-center gap-2.5">
            <div
              className="flex size-11 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, var(--brand-rust), var(--brand-amber))' }}
            >
              <HeartHandshake className="size-5 text-white" />
            </div>
            <div className="font-display text-[17px] font-extrabold tracking-tight text-foreground">Shelter OS</div>
          </div>

          <div className="mb-6 text-center">
            <h1 className="font-display text-[26px] font-bold text-foreground">Sign in to your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-primary">
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
            <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <div className="mb-5 rounded-lg border border-info/20 bg-info/10 p-3 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Playground login</strong> — type <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[11px]">super-admin</code>,{' '}
            <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[11px]">shelter-admin</code>, or{' '}
            <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[11px]">volunteer</code> into the email field and sign in — no password needed.
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-email">Email address</Label>
              <Input
                id="login-email"
                type="text"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="super-admin / shelter-admin / volunteer"
                autoComplete="username"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Not required in this playground"
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
                <Link href="/forgot-password" className="text-xs font-medium text-primary">
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
        </div>
      </div>
    </div>
  );
}
