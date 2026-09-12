'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import Navbar from './Navbar';
import ShellFooter from './ShellFooter';
import Footer from '@/components/Footer';
import CommandPalette from './CommandPalette';

const FULL_SCREEN_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/terms'];
const PUBLIC_PATHS = ['/adoption', '/shelters', '/lost-found', '/campaigns'];
// Full-height "workspace" screens manage their own scroll — no footer.
const NO_FOOTER_PATHS = ['/messages'];

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

    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="min-w-0 flex-1">{children}</main>
        {!hideFooter && <ShellFooter />}
      </div>
    );
  }
}
