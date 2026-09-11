'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import AuthCard from '@/components/patterns/AuthCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    const t = setTimeout(() => setStatus('success'), 500);
    return () => clearTimeout(t);
  }, [token]);

  const config = {
    loading: { Icon: Loader2, title: 'Verifying your email…', text: 'Please wait a moment.', tone: 'text-info bg-info/10', spin: true },
    success: { Icon: CheckCircle2, title: 'Email verified!', text: 'Your account is now active. Welcome to Shelter OS!', tone: 'text-success bg-success/10' },
    error: { Icon: XCircle, title: 'Verification failed', text: 'No verification token was provided.', tone: 'text-destructive bg-destructive/10' },
  }[status];

  return (
    <AuthCard className="text-center">
      <div className={cn('mx-auto mb-5 flex size-16 items-center justify-center rounded-full', config.tone)}>
        <config.Icon className={cn('size-7', config.spin && 'animate-spin')} />
      </div>
      <h1 className="font-display text-2xl font-bold text-foreground">{config.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{config.text}</p>
      {status !== 'loading' && (
        <Button asChild className="mt-6 w-full">
          <Link href="/login">Go to login</Link>
        </Button>
      )}
    </AuthCard>
  );
}
