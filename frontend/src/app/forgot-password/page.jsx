'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Mail } from 'lucide-react';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/patterns/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot Password');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 350);
  };

  if (sent) {
    return (
      <AuthCard className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-highlight-mint/20 text-primary">
          <Mail className="size-7" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          If <strong className="text-foreground">{email}</strong> is registered, a reset link has been sent. It expires in 15 minutes.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/login">Back to login</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="mb-7">
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-highlight-mint/20 text-primary">
          <KeyRound className="size-5" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Forgot password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="forgot-email">Email address</Label>
          <Input id="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" />
        </div>
        <Button type="submit" disabled={loading} className="h-11 w-full">
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-primary">Back to login</Link>
      </p>
    </AuthCard>
  );
}
