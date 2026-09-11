'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Crown, Building2, Stethoscope, Cat, Heart, HeartHandshake, Users as UsersIcon, X } from 'lucide-react';
import { mockUsers } from '@/lib/mock-data/users';
import { mockDashboardStats } from '@/lib/mock-data/analytics';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import { formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const ROLE_META = {
  SUPER_ADMIN: { icon: Crown, label: 'Super Admins' },
  SHELTER_ADMIN: { icon: Building2, label: 'Shelter Admins' },
  VET: { icon: Stethoscope, label: 'Vets' },
  CAT_OWNER: { icon: Cat, label: 'Cat Owners' },
  ADOPTER: { icon: Heart, label: 'Adopters' },
  VOLUNTEER: { icon: HeartHandshake, label: 'Volunteers' },
};

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleFilter = searchParams.get('role') || '';

  const [list, setList] = useState(mockUsers);
  const [busyId, setBusyId] = useState(null);

  const usersByRole = mockDashboardStats.users_by_role || {};
  const filteredList = roleFilter ? list.filter((u) => u.role === roleFilter) : list;

  const setRole = (r) => {
    const params = new URLSearchParams(searchParams);
    if (r) params.set('role', r); else params.delete('role');
    router.push(params.size ? `${pathname}?${params}` : pathname);
  };

  const toggleActive = (u) => {
    setBusyId(u.id);
    setTimeout(() => {
      setList((users) => users.map((x) => (x.id === u.id ? { ...x, is_active: !x.is_active } : x)));
      setBusyId(null);
    }, 300);
  };

  const toggleVerified = (u) => {
    setBusyId(u.id);
    setTimeout(() => {
      setList((users) => users.map((x) => (x.id === u.id ? { ...x, is_email_verified: !x.is_email_verified } : x)));
      setBusyId(null);
    }, 300);
  };

  const lastSeenAt = (u) => u.last_activity_at || u.last_login_at;
  const isOnline = (u) => lastSeenAt(u) && (Date.now() - new Date(lastSeenAt(u)).getTime() < ONLINE_WINDOW_MS);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Users"
        description="All platform users by role"
        actions={
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="size-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(63,143,95,0.2)] dark:shadow-[0_0_0_3px_rgba(92,181,132,0.25)]" />
            Live
          </span>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(ROLE_META).map(([role, meta]) => {
          const count = usersByRole[role] || 0;
          const active = roleFilter === role;
          return (
            <button
              key={role}
              onClick={() => setRole(active ? '' : role)}
              className={cn(
                'rounded-xl border p-4 text-left transition-colors',
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-border-strong',
              )}
            >
              <meta.icon className={cn('mb-1.5 size-5', active ? 'text-primary-foreground' : 'text-primary')} />
              <div className="text-xl font-bold">{count}</div>
              <div className={cn('text-[11px] font-semibold uppercase', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{meta.label}</div>
            </button>
          );
        })}
      </div>

      {roleFilter && (
        <div className="mb-4">
          <Button variant="secondary" size="sm" onClick={() => setRole('')}>
            <X className="size-3.5" />
            Clear filter: {ROLE_META[roleFilter]?.label || roleFilter}
          </Button>
        </div>
      )}

      {filteredList.length === 0 && (
        <EmptyState icon={UsersIcon} title="No users found" message="No users match the current filter." />
      )}

      {filteredList.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email verified</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((u) => {
                const meta = ROLE_META[u.role] || { icon: UsersIcon, label: u.role };
                const name = u.profile ? `${u.profile.first_name} ${u.profile.last_name}`.trim() : '—';
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold text-foreground">{name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <meta.icon className="size-3" />
                        {u.role?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                        u.is_active ? 'bg-success/10 text-success' : 'bg-surface-muted text-muted-foreground',
                      )}>
                        <span className={cn('size-1.5 rounded-full', u.is_active ? (isOnline(u) ? 'bg-success' : 'bg-success/50') : 'bg-muted-foreground')} />
                        {u.is_active ? (isOnline(u) ? 'Online' : 'Offline') : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="text-xs font-semibold text-muted-foreground">Exempt</span>
                      ) : (
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          u.is_email_verified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
                        )}>
                          {u.is_email_verified ? 'Verified' : 'Unverified'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lastSeenAt(u) ? formatDateTime(lastSeenAt(u)) : 'Never'}</TableCell>
                    <TableCell>
                      {u.role !== 'SUPER_ADMIN' && (
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant={u.is_email_verified ? 'secondary' : 'default'} onClick={() => toggleVerified(u)} disabled={busyId === u.id}>
                            {u.is_email_verified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => toggleActive(u)} disabled={busyId === u.id}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
