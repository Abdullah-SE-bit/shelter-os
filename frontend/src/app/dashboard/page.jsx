'use client';

import Link from 'next/link';
import {
  PawPrint,
  Building2,
  HeartHandshake,
  Siren,
  Heart,
  Search,
  Stethoscope,
  UserRound,
  Zap,
  Siren as SirenIcon,
  PlusCircle,
  Inbox,
  BarChart3,
} from 'lucide-react';
import { mockDashboardStats } from '@/lib/mock-data/analytics';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/patterns/StatCard';
import GreetingBanner from '@/components/patterns/GreetingBanner';

const ROLE_STATS = [
  { role: 'SHELTER_ADMIN', icon: Building2, label: 'Shelter Admins' },
  { role: 'VET', icon: Stethoscope, label: 'Vets' },
  { role: 'PET_OWNER', icon: PawPrint, label: 'Pet Owners' },
  { role: 'ADOPTER', icon: Heart, label: 'Adopters' },
  { role: 'EMPLOYEE', icon: HeartHandshake, label: 'Employees' },
];

const QUICK_ACTIONS = [
  { to: '/rescue/submit', icon: SirenIcon, label: 'Report Rescue' },
  { to: '/lost-found/create', icon: Search, label: 'Lost Alert' },
  { to: '/pets/create', icon: PlusCircle, label: 'Add Pet' },
  { to: '/shelter/intake', icon: Inbox, label: 'Intake Pet' },
  { to: '/shelter/applications', icon: Heart, label: 'Applications' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

const PET_STATUS_ROWS = [
  { key: 'pets_in_shelter', label: 'In Shelter' },
  { key: 'pets_fostered', label: 'Fostered' },
  { key: 'pets_adopted', label: 'Adopted' },
  { key: 'pets_lost', label: 'Lost' },
  { key: 'pets_deceased', label: 'Deceased' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const d = mockDashboardStats;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <GreetingBanner
        name={user?.profile?.first_name}
        title="Super Dashboard"
        subtitle="Here's what's happening across Shelter OS today."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={PawPrint} value={d.total_pets || 0} label="Total Pets" to="/pets" />
        <StatCard icon={Building2} value={d.total_shelters || 0} label="Shelters" to="/shelters" tone="info" />
        <StatCard icon={HeartHandshake} value={d.total_employees || 0} label="Employees" to="/employees" tone="success" />
        <StatCard icon={Siren} value={d.open_rescues || 0} label="Open Rescues" to="/rescue" tone="destructive" />
        <StatCard icon={Heart} value={d.pending_adoptions || 0} label="Pending Adoptions" to="/shelter/applications" tone="warning" />
        <StatCard icon={Search} value={d.active_lost_alerts || 0} label="Lost Alerts" to="/lost-found" tone="warning" />
      </div>

      {user?.role === 'SUPER_ADMIN' && d.users_by_role && (
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
                <div className="mt-1 text-2xl font-bold text-foreground">{d.users_by_role[role] || 0}</div>
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ to, icon: Icon, label }) => (
            <Button key={to} variant="outline" size="sm" asChild>
              <Link href={to}>
                <Icon className="size-4" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <PawPrint className="size-4 text-muted-foreground" />
              Pet status breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {PET_STATUS_ROWS.map(({ key, label }) => {
              const count = d[key] || 0;
              const pct = Math.min(100, (count / (d.total_pets || 1)) * 100);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="w-6 shrink-0 text-right text-sm font-semibold text-foreground">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="size-4 text-muted-foreground" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(d.recent_activity || []).slice(0, 6).map((act, i) => (
              <div key={i} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm text-foreground">{act.description}</p>
                  <span className="text-xs text-muted-foreground">{formatDate(act.timestamp)}</span>
                </div>
              </div>
            ))}
            {(!d.recent_activity || d.recent_activity.length === 0) && (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
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
