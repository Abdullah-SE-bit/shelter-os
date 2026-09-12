'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getNavSections } from './navConfig';
import { cn } from '@/lib/utils';

function useActivePath(items) {
  const pathname = usePathname();
  return useMemo(() => {
    const matches = items
      .map((i) => i.path)
      .filter((p) => pathname === p || pathname.startsWith(p + '/'))
      .sort((a, b) => b.length - a.length);
    return matches[0];
  }, [items, pathname]);
}

/** The user's nav sections, accounting for the vet-pending lockdown. */
export function useSidebarSections() {
  const { user } = useAuth();
  const vetLocked = user?.role === 'VET' && user.vet_profile && !user.vet_profile.is_fully_approved;
  const sections = !user
    ? []
    : vetLocked
      ? [{ section: null, items: [{ icon: UserCircle, label: 'Profile', path: '/profile' }] }]
      : getNavSections(user.role);
  const flatItems = sections.flatMap((s) => s.items);
  const activePath = useActivePath(flatItems);
  return { sections, activePath };
}

function NavItem({ icon: Icon, label, path, active, onNavigate }) {
  return (
    <Link
      href={path}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'border-l-2',
        active
          ? 'border-primary bg-highlight-mint/40 text-primary'
          : 'border-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground',
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={2} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/** Nav list rendered inside the slide-in/out drawer (see MobileSidebar). */
export function SidebarContent({ onNavigate }) {
  const { sections, activePath } = useSidebarSections();

  return (
    <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-3">
      <div className="flex flex-col gap-4">
        {sections.map((sec, idx) => (
          <div key={sec.section || idx} className="flex flex-col gap-0.5">
            {sec.section && (
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                {sec.section}
              </div>
            )}
            {sec.items.map((item) => (
              <NavItem key={item.path} {...item} active={item.path === activePath} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
