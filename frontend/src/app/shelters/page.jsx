'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PawPrint, Building2, MapPin, Search } from 'lucide-react';
import { mockShelters } from '@/lib/mock-data/shelters';
import { mockPets } from '@/lib/mock-data/pets';
import { mockEmployees } from '@/lib/mock-data/users';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ShelterCard({ shelter }) {
  const petCount = mockPets.filter((c) => c.shelter_id === shelter.id).length;
  const employeeCount = mockEmployees.filter((v) => v.shelter_id === shelter.id).length;
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-36 bg-gradient-to-br from-primary to-[var(--brand-ink)]">
        <div className="flex size-full flex-col items-center justify-center gap-1 text-white/70">
          <Building2 className="size-10" strokeWidth={1.5} />
          <div className="text-xs font-semibold">{shelter.city || 'Shelter'}</div>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <PawPrint className="size-3" />
          {petCount} animals
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-[17px] font-bold text-foreground">{shelter.name}</h3>

        {shelter.city && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {shelter.city}
          </p>
        )}

        {shelter.description && (
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
            {shelter.description.slice(0, 100)}{shelter.description.length > 100 ? '…' : ''}
          </p>
        )}

        <div className="mt-1 flex gap-2 rounded-lg bg-surface-muted p-2.5">
          {[
            { label: 'Capacity', value: shelter.capacity || '—' },
            { label: 'Employees', value: employeeCount },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 text-center">
              <div className="text-lg font-bold text-primary">{value}</div>
              <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
            </div>
          ))}
        </div>

        <Button variant="secondary" className="mt-1 w-full" asChild>
          <Link href={`/shelter/${shelter.id}`}>View shelter</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ShelterListPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mockShelters;
    return mockShelters.filter((s) => s.name?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q));
  }, [search]);

  return (
    <div>
      <div className="border-b border-border bg-surface-muted px-6 py-10">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="font-display text-[32px] font-bold text-foreground">Our shelter network</h1>
          <p className="mt-2 mb-5 max-w-[520px] text-[15px] text-muted-foreground">
            {mockShelters.length} shelters across Pakistan providing safe havens for animals in need.
          </p>
          <div className="relative max-w-[380px]">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shelters by name or city…"
              className="h-11 bg-card pl-9"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-10">
        {filtered.length === 0 && (
          <EmptyState icon={Building2} title="No shelters found" message={search ? `No shelters match "${search}"` : 'No shelters registered yet.'} />
        )}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => <ShelterCard key={s.id} shelter={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
