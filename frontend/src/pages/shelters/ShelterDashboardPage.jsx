import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cat, HeartHandshake, Heart, Package, Inbox, Siren, PawPrint } from 'lucide-react';
import { sheltersApi } from '@/api/sheltersApi';
import useApi from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import { timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/patterns/StatCard';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

export default function ShelterDashboardPage() {
  const { user } = useAuth();
  const [intakeOpen, setIntakeOpen] = useState(false);

  const { data: dashData, loading } = useApi(() => sheltersApi.myDashboard());
  const d = dashData?.data || dashData || {};

  const stats = [
    { icon: Cat, label: 'Cats in shelter', value: d.cats_count, to: '/cats', tone: 'primary' },
    { icon: HeartHandshake, label: 'Volunteers', value: d.volunteer_count, to: '/volunteers', tone: 'info' },
    { icon: Heart, label: 'Pending apps', value: d.pending_applications, to: '/shelter/applications', tone: 'success' },
    { icon: Package, label: 'Low stock items', value: d.low_stock_count, to: '/inventory', tone: 'warning' },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="relative mb-6 overflow-hidden rounded-xl border border-border px-6 py-7 sm:px-8" style={{ background: 'linear-gradient(135deg, var(--brand-rust), var(--brand-ink))' }}>
        <PawPrint className="pointer-events-none absolute -right-4 -bottom-6 size-32 text-white/10" strokeWidth={1.5} />
        <p className="text-sm font-medium text-white/70">Shelter dashboard</p>
        <h1 className="mt-1 font-display text-[26px] font-bold text-white">{d.shelter_name || 'My shelter'}</h1>
        <p className="mt-1 text-sm text-white/70">{d.city || ''}{d.capacity ? ` · Capacity: ${d.capacity}` : ''}</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button variant="secondary" onClick={() => setIntakeOpen(true)}>
            <Inbox className="size-4" />
            Intake cat
          </Button>
          <Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white" asChild>
            <Link to="/rescue"><Siren className="size-4" />Rescue reports</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading shelter data…" />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => <StatCard key={s.label} icon={s.icon} value={s.value ?? '—'} label={s.label} to={s.to} tone={s.tone} />)}
          </div>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm"><Cat className="size-4 text-muted-foreground" />Recent intake</CardTitle>
                <Link to="/cats" className="text-xs font-semibold text-primary">View all</Link>
              </CardHeader>
              <CardContent className="flex flex-col">
                {(d.recent_cats || []).slice(0, 5).map((cat) => (
                  <Link key={cat.id} to={`/cats/${cat.id}`} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
                    <img src={cat.primary_photo_url || CAT_PLACEHOLDER} alt="" className="size-10 shrink-0 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{cat.name || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(cat.intake_date)}</div>
                    </div>
                  </Link>
                ))}
                {(!d.recent_cats || d.recent_cats.length === 0) && <p className="py-4 text-center text-sm text-muted-foreground">No recent intake</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm"><Heart className="size-4 text-muted-foreground" />Pending applications</CardTitle>
                <Link to="/shelter/applications" className="text-xs font-semibold text-primary">View all</Link>
              </CardHeader>
              <CardContent className="flex flex-col">
                {(d.pending_apps || []).slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{app.applicant_name}</div>
                      <div className="text-xs text-muted-foreground">for {app.cat_name} · {timeAgo(app.created_at)}</div>
                    </div>
                    <Button size="sm" variant="secondary" asChild><Link to="/shelter/applications">Review</Link></Button>
                  </div>
                ))}
                {(!d.pending_apps || d.pending_apps.length === 0) && <p className="py-4 text-center text-sm text-muted-foreground">No pending applications</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Modal open={intakeOpen} onClose={() => setIntakeOpen(false)} title="Intake cat" size="sm" footer={<Button variant="secondary" onClick={() => setIntakeOpen(false)}>Close</Button>}>
        <p className="text-sm text-muted-foreground">To intake a new cat, first create the cat profile, then it will be automatically linked to your shelter.</p>
        <Button className="mt-4 w-full" asChild onClick={() => setIntakeOpen(false)}>
          <Link to="/cats/create"><Cat className="size-4" />Create new cat profile</Link>
        </Button>
      </Modal>
    </div>
  );
}
