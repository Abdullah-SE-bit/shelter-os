'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { Button } from '@/components/ui/button';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
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

  return children;
};

export default ProtectedRoute;
