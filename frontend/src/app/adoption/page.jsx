'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PawPrint, Home, Heart, Syringe, Radio, Scissors } from 'lucide-react';
import { mockAdoptionListings } from '@/lib/mock-data/adoption';
import usePagination from '@/hooks/usePagination';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { formatCurrency, formatPetAge } from '@/utils/formatters';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';

function PetCard({ pet }) {
  return (
    <Link href={`/adoption/${pet.pet}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-[220px] overflow-hidden bg-surface-muted">
        {pet.primary_photo_url ? (
          <img src={pet.primary_photo_url} alt={pet.name} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-surface-muted to-primary/10">
            <PawPrint className="size-16 text-muted-foreground" strokeWidth={1} />
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-full bg-success/90 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">Available</span>
        {pet.is_neutered && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-info/90 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
            <Scissors className="size-3" />Neutered
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[17px] font-extrabold text-foreground">{pet.name || 'Unnamed'}</h3>
          <span className="shrink-0 text-[15px] font-extrabold text-primary">{pet.adoption_fee > 0 ? formatCurrency(pet.adoption_fee) : 'Free'}</span>
        </div>
        <p className="text-[13px] font-semibold text-muted-foreground">{pet.breed_label || 'Mixed breed'} · {pet.gender} · {formatPetAge(pet.age_years, pet.age_months)}</p>
        {pet.shelter_name && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Home className="size-3" />{pet.shelter_name}</p>}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {pet.is_vaccinated_core && <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success"><Syringe className="size-3" />Vaccinated</span>}
          {pet.is_microchipped && <span className="flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[11px] font-bold text-info"><Radio className="size-3" />Microchipped</span>}
        </div>
      </div>
    </Link>
  );
}

export default function BrowsePage() {
  const { user } = useAuth();
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(12);
  const [gender, setGender] = useState('');
  const [neutered, setNeutered] = useState('');

  const filtered = mockAdoptionListings.filter((c) => (!gender || c.gender === gender) && (!neutered || String(c.is_neutered) === neutered));
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const listings = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleFilterChange = (setter, value) => { setter(value); reset(); };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-ink)] via-[var(--brand-teal)] to-[var(--brand-amber)] px-6 pt-16 pb-20">
        <div className="relative mx-auto max-w-[1200px]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-[13px] font-bold text-white/90 backdrop-blur-sm">
            <PawPrint className="size-4" />Find your perfect companion
          </div>
          <h1 className="font-display mb-4 max-w-[640px] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.1] font-bold text-white">
            Adopt an animal,<br />change a life
          </h1>
          <p className="mb-8 max-w-[540px] text-[17px] leading-relaxed text-white/75">
            {total > 0 ? `${total} animals are waiting for their forever home. ` : 'Animals are waiting for their forever home. '}
            Give a shelter pet the love they deserve.
          </p>
          <div className="flex flex-wrap gap-8">
            {[{ Icon: PawPrint, label: `${total || '—'} animals available` }, { Icon: Home, label: 'Verified shelters' }, { Icon: Heart, label: 'Happy adoptions' }].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/85">
                <Icon className="size-[18px]" />
                <span className="text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute right-0 bottom-[-1px] left-0 h-[50px] bg-background" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <span className="mr-1 text-[13px] font-bold text-muted-foreground">Filter:</span>
          <NativeSelect value={gender} onChange={(e) => handleFilterChange(setGender, e.target.value)} className="w-auto">
            <option value="">Any gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </NativeSelect>
          <NativeSelect value={neutered} onChange={(e) => handleFilterChange(setNeutered, e.target.value)} className="w-auto">
            <option value="">Any</option>
            <option value="true">Neutered</option>
            <option value="false">Not neutered</option>
          </NativeSelect>
          <div className="ml-auto text-sm font-semibold text-muted-foreground">{total} animals found</div>
        </div>

        {listings.length === 0 && (
          <EmptyState icon={Home} title="No animals available right now" message="Check back soon — shelters are regularly adding new animals ready for adoption."
            action={!user && <Button asChild><Link href="/register">Create account to get notified</Link></Button>} />
        )}

        {listings.length > 0 && (
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((pet) => <PetCard key={pet.pet} pet={pet} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

        {!user && listings.length > 0 && (
          <div className="relative mt-12 flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-teal)] to-[var(--brand-ink)] p-10">
            <PawPrint className="pointer-events-none absolute -right-4 -bottom-4 size-32 text-white opacity-10" />
            <div>
              <h2 className="mb-1.5 text-2xl font-bold text-white">Ready to adopt?</h2>
              <p className="text-[15px] text-white/80">Create a free account to apply, save favorites, and track your applications.</p>
            </div>
            <Button size="lg" asChild><Link href="/register">Create free account</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
