'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff } from 'lucide-react';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/patterns/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  useDocumentTitle('Reset Password');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    setTimeout(() => { setLoading(false); router.push('/login'); }, 350);
  };

  return (
    <AuthCard>
      <div className="mb-7">
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="size-5" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Set new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>
      </div>
      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { label: 'New password', value: password, onChange: setPassword, id: 'new-pass' },
          { label: 'Confirm password', value: confirm, onChange: setConfirm, id: 'confirm-pass' },
        ].map(({ label, value, onChange, id }) => (
          <div key={id}>
            <Label htmlFor={id}>{label}</Label>
            <div className="relative mt-1.5">
              <Input id={id} type={showPass ? 'text' : 'password'} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Min 8 characters" className="pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        ))}
        <Button type="submit" disabled={loading} className="h-11 w-full">
          {loading ? 'Saving…' : 'Reset password'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-primary">Back to login</Link>
      </p>
    </AuthCard>
  );
}
