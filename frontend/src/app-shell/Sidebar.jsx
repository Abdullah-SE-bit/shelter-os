'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, HeartHandshake, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getNavSections } from './navConfig';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

function NavItem({ icon: Icon, label, path, active, collapsed, onNavigate }) {
  const link = (
    <Link
      href={path}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'border-l-2',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={2} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Shared between the desktop rail and the mobile Sheet. */
export function SidebarContent({ collapsed = false, onNavigate, showBrand = true }) {
  const { sections, activePath } = useSidebarSections();

  return (
    <>
      {showBrand && (
        <div className={cn('flex h-14 items-center border-b border-border px-4', collapsed && 'justify-center px-0')}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 font-display text-[15px] font-bold text-foreground">
              <HeartHandshake className="size-5 text-primary" />
              Shelter OS
            </Link>
          )}
          {collapsed && <HeartHandshake className="size-5 text-primary" />}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-4">
          {sections.map((sec, idx) => (
            <div key={sec.section || idx} className="flex flex-col gap-0.5">
              {sec.section && !collapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                  {sec.section}
                </div>
              )}
              {sec.items.map((item) => (
                <NavItem
                  key={item.path}
                  {...item}
                  collapsed={collapsed}
                  active={item.path === activePath}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useLocalStorage('shelter-os-sidebar-collapsed', false);

  if (!user) return null;

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  );
}
