'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { SUPER_ADMIN_ALLOWED_PATHS } from './navConfig';
import Navbar from './Navbar';
import ShellFooter from './ShellFooter';
import Footer from '@/components/Footer';
import CommandPalette from './CommandPalette';

const FULL_SCREEN_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/terms'];
const PUBLIC_PATHS = ['/adoption', '/shelters', '/lost-found', '/campaigns'];
// Full-height "workspace" screens manage their own scroll — no footer.
const NO_FOOTER_PATHS = ['/messages'];

function isAllowedForSuperAdmin(pathname) {
  return SUPER_ADMIN_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function SuperAdminAccessDenied() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-8" />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground">Page not available</h2>
      <p className="max-w-[380px] text-sm text-muted-foreground">
        As the platform's Super Admin, your account is scoped to onboarding — the Dashboard, Users, and creating
        shelters and shelter admins. Shelter-operational pages belong to shelter admins.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

export default function AppShell({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const isFullScreen = FULL_SCREEN_PATHS.some((p) => pathname.startsWith(p));
  const isPublicPage = !user && PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const hideFooter = NO_FOOTER_PATHS.some((p) => pathname.startsWith(p));

  return (
    <TooltipProvider delayDuration={300}>
      {user && <CommandPalette />}
      <Toaster position="top-right" richColors closeButton />
      {renderBody()}
    </TooltipProvider>
  );

  function renderBody() {
    if (isFullScreen) {
      return <>{children}</>;
    }

    if (isPublicPage || !user) {
      return (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1">{children}</main>
          {!hideFooter && <Footer />}
        </div>
      );
    }

    const blocked = user.role === 'SUPER_ADMIN' && !isAllowedForSuperAdmin(pathname);

    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="min-w-0 flex-1">{blocked ? <SuperAdminAccessDenied /> : children}</main>
        {!hideFooter && <ShellFooter />}
      </div>
    );
  }
}
