'use client';

import Link from 'next/link';
import { Bell, MessageSquare, PawPrint, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import useNotifications from '@/hooks/useNotifications';
import { mockConversations } from '@/lib/mock-data/messaging';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from './ThemeToggle';
import ProfileMenu from './ProfileMenu';
import MobileSidebar from './MobileSidebar';

function IconLink({ to, icon: Icon, count, label }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative text-muted-foreground hover:bg-highlight-mint/30 hover:text-primary"
      aria-label={label}
      asChild
    >
      <Link href={to}>
        <Icon className="size-[18px]" />
        {count > 0 && (
          <Badge
            variant="default"
            className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
          >
            {count > 9 ? '9+' : count}
          </Badge>
        )}
      </Link>
    </Button>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { unreadCount } = useNotifications();
  const unreadMessages = user ? mockConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0) : 0;

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur supports-backdrop-filter:bg-surface/75">
      {user ? (
        <div className="flex items-center gap-2">
          <MobileSidebar />
          <Link href="/dashboard" className="hidden items-center gap-2 font-display text-[15px] font-bold text-foreground sm:flex">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--brand-teal)', color: 'var(--brand-cream)' }}
            >
              <PawPrint className="size-4" />
            </span>
            Shelter OS
          </Link>
        </div>
      ) : (
        <Link href="/adoption" className="font-display text-[15px] font-bold text-foreground">
          Shelter OS
        </Link>
      )}

      <div className="flex flex-1 items-center justify-end gap-2 md:justify-between">
        {user ? (
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="hidden items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover md:flex md:w-72"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl K
            </kbd>
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1">
          {user ? (
            <>
              {!isSuperAdmin && (
                <>
                  <IconLink to="/messages" icon={MessageSquare} count={unreadMessages} label="Messages" />
                  <IconLink to="/notifications" icon={Bell} count={unreadCount} label="Notifications" />
                </>
              )}
              <ThemeToggle />
              <ProfileMenu />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Create account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
