'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HeartHandshake, Heart, Package, Inbox, Siren, PawPrint } from 'lucide-react';
import { mockShelterDashboard } from '@/lib/mock-data/analytics';
import { mockPets } from '@/lib/mock-data/pets';
import { mockAdoptionApplications } from '@/lib/mock-data/adoption';
import { useAuth } from '@/context/AuthContext';
import { getShelterById } from '@/lib/mock-data/shelters';
import Modal from '@/components/Modal';
import { timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/patterns/StatCard';

const PET_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';
const MY_SHELTER_ID = 'shelter-1';

export default function ShelterDashboardPage() {
  const { user } = useAuth();
  const [intakeOpen, setIntakeOpen] = useState(false);
  const shelter = getShelterById(MY_SHELTER_ID);
  const d = mockShelterDashboard;
  const recentPets = mockPets.filter((c) => c.shelter_id === MY_SHELTER_ID).slice(0, 5);
  const pendingApps = mockAdoptionApplications.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED').slice(0, 5);

  const stats = [
    { icon: PawPrint, label: 'Animals in shelter', value: d.pets_in_care, to: '/pets', tone: 'primary' },
    { icon: HeartHandshake, label: 'Employees', value: d.active_employees, to: '/employees', tone: 'info' },
    { icon: Heart, label: 'Pending apps', value: d.pending_applications, to: '/shelter/applications', tone: 'success' },
    { icon: Package, label: 'Low stock items', value: d.low_stock_items, to: '/inventory', tone: 'warning' },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="relative mb-6 overflow-hidden rounded-xl border border-border px-6 py-7 sm:px-8" style={{ background: 'linear-gradient(135deg, var(--brand-rust), var(--brand-ink))' }}>
        <PawPrint className="pointer-events-none absolute -right-4 -bottom-6 size-32 text-white/10" strokeWidth={1.5} />
        <p className="text-sm font-medium text-white/70">Shelter dashboard</p>
        <h1 className="mt-1 font-display text-[26px] font-bold text-white">{shelter?.name || 'My shelter'}</h1>
        <p className="mt-1 text-sm text-white/70">{shelter?.city || ''}{shelter?.capacity ? ` · Capacity: ${shelter.capacity}` : ''}</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button variant="secondary" onClick={() => setIntakeOpen(true)}>
            <Inbox className="size-4" />
            Intake animal
          </Button>
          <Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white" asChild>
            <Link href="/rescue"><Siren className="size-4" />Rescue reports</Link>
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} icon={s.icon} value={s.value ?? '—'} label={s.label} to={s.to} tone={s.tone} />)}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm"><PawPrint className="size-4 text-muted-foreground" />Recent intake</CardTitle>
            <Link href="/pets" className="text-xs font-semibold text-primary">View all</Link>
          </CardHeader>
          <CardContent className="flex flex-col">
            {recentPets.map((pet) => (
              <Link key={pet.id} href={`/pets/${pet.id}`} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
                <img src={pet.primary_photo_url || PET_PLACEHOLDER} alt="" className="size-10 shrink-0 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{pet.name || 'Unnamed'}</div>
                </div>
              </Link>
            ))}
            {recentPets.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No recent intake</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm"><Heart className="size-4 text-muted-foreground" />Pending applications</CardTitle>
            <Link href="/shelter/applications" className="text-xs font-semibold text-primary">View all</Link>
          </CardHeader>
          <CardContent className="flex flex-col">
            {pendingApps.map((app) => (
              <div key={app.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-foreground">{app.applicant_name}</div>
                  <div className="text-xs text-muted-foreground">for {app.pet_name} · {timeAgo(app.created_at)}</div>
                </div>
                <Button size="sm" variant="secondary" asChild><Link href="/shelter/applications">Review</Link></Button>
              </div>
            ))}
            {pendingApps.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No pending applications</p>}
          </CardContent>
        </Card>
      </div>

      <Modal open={intakeOpen} onClose={() => setIntakeOpen(false)} title="Intake animal" size="sm" footer={<Button variant="secondary" onClick={() => setIntakeOpen(false)}>Close</Button>}>
        <p className="text-sm text-muted-foreground">To intake a new animal, first create the animal profile, then it will be automatically linked to your shelter.</p>
        <Button className="mt-4 w-full" asChild onClick={() => setIntakeOpen(false)}>
          <Link href="/pets/create"><PawPrint className="size-4" />Create new animal profile</Link>
        </Button>
      </Modal>
    </div>
  );
}
