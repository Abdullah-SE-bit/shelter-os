import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Crown, Building2, Stethoscope, Cat, Heart, HeartHandshake, Users as UsersIcon, RefreshCw, X } from 'lucide-react';
import { authApi } from '@/api/authApi';
import { analyticsApi } from '@/api/analyticsApi';
import LoadingSpinner from '@/components/LoadingSpinner';
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

// "Online" if the user recorded activity within this window.
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get('role') || '';

  const [list, setList] = useState([]);
  const [usersByRole, setUsersByRole] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const POLL_MS = 15000;

  // Fetch users + role counts. `silent` skips the full-page spinner so live
  // background refreshes update presence in place without hiding the table.
  const loadData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const [usersRes, overviewRes] = await Promise.all([
        authApi.listUsers({ role: roleFilter || undefined, _: Date.now() }),
        analyticsApi.overview(),
      ]);
      const usersData = usersRes.data?.data ?? usersRes.data;
      setList(Array.isArray(usersData) ? usersData : (usersData?.results || []));
      const overviewData = overviewRes.data?.data ?? overviewRes.data;
      setUsersByRole(overviewData?.users_by_role || {});
    } catch {
      // Keep the last good data if a background poll fails transiently.
    } finally {
      if (silent) setRefreshing(false); else setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { loadData(false); }, [loadData]);

  // Live presence: silently re-fetch on an interval. No spinner, the table
  // stays in place, and the online/offline dots update on their own.
  useEffect(() => {
    const id = setInterval(() => loadData(true), POLL_MS);
    return () => clearInterval(id);
  }, [loadData]);

  const setRole = (r) => {
    const next = new URLSearchParams(searchParams);
    if (r) next.set('role', r); else next.delete('role');
    setSearchParams(next);
  };

  const toggleActive = async (u) => {
    setBusyId(u.id);
    try {
      await authApi.setStatus(u.id, !u.is_active);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update status.');
      setBusyId(null);
    }
  };

  const toggleVerified = async (u) => {
    setBusyId(u.id);
    try {
      await authApi.verifyUser(u.id, !u.is_email_verified);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update verification.');
      setBusyId(null);
    }
  };

  // Prefer real activity (updated on every request); fall back to login time.
  const lastSeenAt = (u) => u.last_activity_at || u.last_login_at;
  const isOnline = (u) => lastSeenAt(u) && (Date.now() - new Date(lastSeenAt(u)).getTime() < ONLINE_WINDOW_MS);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Users"
        description="All platform users by role, with live online status"
        actions={
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground" title={`Auto-refreshing every ${POLL_MS / 1000}s`}>
              <span className="size-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(63,143,95,0.2)] dark:shadow-[0_0_0_3px_rgba(92,181,132,0.25)]" />
              {refreshing ? 'Updating…' : 'Live'}
            </span>
            <Button variant="secondary" size="sm" onClick={() => loadData(true)} disabled={refreshing}>
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
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

      {loading && <LoadingSpinner text="Loading users…" />}

      {!loading && list.length === 0 && (
        <EmptyState icon={UsersIcon} title="No users found" message="No users match the current filter." />
      )}

      {!loading && list.length > 0 && (
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
              {list.map((u) => {
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
