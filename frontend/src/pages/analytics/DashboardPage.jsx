import { Link } from 'react-router-dom';
import {
  Cat,
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
import { analyticsApi } from '@/api/analyticsApi';
import useApi from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/dateUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/patterns/StatCard';
import GreetingBanner from '@/components/patterns/GreetingBanner';

const ROLE_STATS = [
  { role: 'SHELTER_ADMIN', icon: Building2, label: 'Shelter Admins' },
  { role: 'VET', icon: Stethoscope, label: 'Vets' },
  { role: 'CAT_OWNER', icon: Cat, label: 'Cat Owners' },
  { role: 'ADOPTER', icon: Heart, label: 'Adopters' },
  { role: 'VOLUNTEER', icon: HeartHandshake, label: 'Volunteers' },
];

const QUICK_ACTIONS = [
  { to: '/rescue/submit', icon: SirenIcon, label: 'Report Rescue' },
  { to: '/lost-found/create', icon: Search, label: 'Lost Alert' },
  { to: '/cats/create', icon: PlusCircle, label: 'Add Cat' },
  { to: '/shelter/intake', icon: Inbox, label: 'Intake Cat' },
  { to: '/shelter/applications', icon: Heart, label: 'Applications' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

const CAT_STATUS_ROWS = [
  { key: 'cats_in_shelter', label: 'In Shelter' },
  { key: 'cats_fostered', label: 'Fostered' },
  { key: 'cats_adopted', label: 'Adopted' },
  { key: 'cats_lost', label: 'Lost' },
  { key: 'cats_deceased', label: 'Deceased' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: overview, loading } = useApi(() => analyticsApi.overview());
  const d = overview || {};

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <GreetingBanner
        name={user?.profile?.first_name}
        title="Super Dashboard"
        subtitle="Here's what's happening across Shelter OS today."
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={Cat} value={d.total_cats || 0} label="Total Cats" to="/cats" />
            <StatCard icon={Building2} value={d.total_shelters || 0} label="Shelters" to="/shelters" tone="info" />
            <StatCard icon={HeartHandshake} value={d.total_volunteers || 0} label="Volunteers" to="/volunteers" tone="success" />
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
                    to={`/admin/users?role=${role}`}
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
                  <Link to={to}>
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
                  <Cat className="size-4 text-muted-foreground" />
                  Cat status breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {CAT_STATUS_ROWS.map(({ key, label }) => {
                  const count = d[key] || 0;
                  const pct = Math.min(100, (count / (d.total_cats || 1)) * 100);
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
        </>
      )}
    </div>
  );
}

function UserRoleIcon({ icon: Icon }) {
  return (
    <div className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="size-4" />
    </div>
  );
}
