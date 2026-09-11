'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Lock, Frown, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// While a vet is awaiting approval, only these paths stay reachable.
const LOCKED_VET_ALLOWED = ['/profile', '/profile/edit'];

function StageRow({ label, status }) {
  const tone = {
    APPROVED: 'text-success bg-success/10',
    REJECTED: 'text-destructive bg-destructive/10',
    PENDING: 'text-warning bg-warning/10',
  }[status] || 'text-warning bg-warning/10';
  const text = { APPROVED: 'Approved', REJECTED: 'Rejected', PENDING: 'Pending' }[status] || 'Pending';

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-3.5 py-2.5">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', tone)}>{text}</span>
    </div>
  );
}

function VetPendingScreen({ vp }) {
  const rejected = vp?.is_rejected;
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-8">
      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card p-9 text-center shadow-md">
        <div className={cn('mx-auto mb-4 flex size-14 items-center justify-center rounded-full', rejected ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning')}>
          {rejected ? <Frown className="size-7" /> : <Lock className="size-7" />}
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          {rejected ? 'Registration declined' : 'Approval pending'}
        </h2>
        <p className="mt-2 mb-6 text-sm leading-relaxed text-muted-foreground">
          {rejected
            ? 'Your veterinarian registration request was declined. You can review the details on your profile.'
            : 'Your veterinarian account is being reviewed. Vet features unlock once a Super Admin and a Shelter Admin both approve your request.'}
        </p>
        <div className="mb-6 flex flex-col gap-2">
          <StageRow label="Super Admin" status={vp?.super_admin_status} />
          <StageRow label="Shelter Admin" status={vp?.shelter_admin_status} />
        </div>
        {rejected && vp?.rejection_reason && (
          <div className="mb-5 rounded-lg bg-destructive/10 p-3 text-left text-sm text-destructive">
            <strong>Reason:</strong> {vp.rejection_reason}
          </div>
        )}
        <Button asChild className="w-full">
          <Link href="/profile">
            <UserRound className="size-4" />
            Go to my profile
          </Link>
        </Button>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your account…" />
      </div>
    );
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Access denied</h2>
        <p className="max-w-[380px] text-sm text-muted-foreground">
          You don't have permission to view this page. Your role is <strong className="text-foreground">{user.role}</strong>.
        </p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  // Vet gating: until both approval stages pass, only the profile pages are
  // reachable. Everything else shows the pending-approval screen.
  const vetLocked = user.role === 'VET' && user.vet_profile && !user.vet_profile.is_fully_approved;
  if (vetLocked && !LOCKED_VET_ALLOWED.includes(pathname)) {
    return <VetPendingScreen vp={user.vet_profile} />;
  }

  return children;
};

export default ProtectedRoute;
