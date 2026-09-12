'use client';

import Link from 'next/link';
import {
  Building2,
  Users as UsersIcon,
  UserPlus,
  ShieldCheck,
  Heart,
  HeartHandshake,
  Crown,
  MapPin,
} from 'lucide-react';
import { mockDashboardStats } from '@/lib/mock-data/analytics';
import { mockShelters } from '@/lib/mock-data/shelters';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/patterns/StatCard';
import GreetingBanner from '@/components/patterns/GreetingBanner';

const ROLE_STATS = [
  { role: 'SHELTER_ADMIN', icon: Building2, label: 'Shelter Admins' },
  { role: 'CUSTOMER', icon: Heart, label: 'Customers' },
  { role: 'EMPLOYEE', icon: HeartHandshake, label: 'Employees' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const d = mockDashboardStats;
  const totalUsers = Object.values(d.users_by_role || {}).reduce((sum, n) => sum + n, 0);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <GreetingBanner
        name={user?.profile?.first_name}
        title="Super Dashboard"
        subtitle="Onboard shelters, hand out admin access, and keep an eye on your subscriber count."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Building2} value={d.total_shelters || 0} label="Shelters onboarded" />
        <StatCard icon={ShieldCheck} value={d.users_by_role?.SHELTER_ADMIN || 0} label="Shelter admins" to="/admin/users?role=SHELTER_ADMIN" tone="info" />
        <StatCard icon={UsersIcon} value={totalUsers} label="Total platform users" to="/admin/users" tone="success" />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Users by role
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ROLE_STATS.map(({ role, icon, label }) => (
            <Link
              key={role}
              href={`/admin/users?role=${role}`}
              className="rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-border-strong"
            >
              <UserRoleIcon icon={icon} />
              <div className="mt-1 text-2xl font-bold text-foreground">{d.users_by_role?.[role] || 0}</div>
              <div className="text-xs font-medium text-muted-foreground">{label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/shelters/create"><Building2 className="size-4" />Create Shelter</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/create-shelter-admin"><UserPlus className="size-4" />Create Shelter Admin</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/users"><UsersIcon className="size-4" />View Users</Link>
          </Button>
        </div>
      </section>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Crown className="size-4 text-muted-foreground" />
            Shelters on your platform
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {mockShelters.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-foreground">{s.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {s.city} · Admin: {s.admin_name || 'Unassigned'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Onboarded {formatDate(s.created_at)}</div>
            </div>
          ))}
          {mockShelters.length === 0 && (
            <p className="text-sm text-muted-foreground">No shelters onboarded yet — create your first one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserRoleIcon({ icon: Icon }) {
  return (
    <div className="inline-flex size-8 items-center justify-center rounded-lg bg-highlight-mint/20 text-primary">
      <Icon className="size-4" />
    </div>
  );
}
