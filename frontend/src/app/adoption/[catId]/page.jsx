'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Frown, Heart, Syringe, Cake, VenusAndMars, Palette, Bone, Home, ArrowRight } from 'lucide-react';
import { getAdoptionListing } from '@/lib/mock-data/adoption';
import { getCatById } from '@/lib/mock-data/cats';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatCatAge, catGenderLabel } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80';

export default function CatAdoptionDetailPage() {
  const { catId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [faving, setFaving] = useState(false);
  const [isFav, setIsFav] = useState(false);

  const listing = getAdoptionListing(catId);
  const cat = getCatById(catId) || listing;

  const handleFavorite = () => {
    if (!user) { router.push('/login'); return; }
    setFaving(true);
    setTimeout(() => { setIsFav((v) => !v); setFaving(false); }, 200);
  };

  if (!cat) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Animal not found</h2>
      <Button variant="secondary" asChild><Link href="/adoption">Back to adoption</Link></Button>
    </div>
  );

  const photos = (cat.photos || []).filter(Boolean);
  const mainPhoto = photos[0] || cat.primary_photo_url || CAT_PLACEHOLDER;
  const canApply = user?.role === 'ADOPTER' || !user;

  const healthBadges = [
    { ok: cat.is_neutered, label: 'Neutered/spayed' },
    { ok: cat.is_vaccinated_core, label: 'Core vaccinations' },
    { ok: cat.is_microchipped, label: 'Microchipped' },
    { ok: cat.is_dewormed, label: 'Dewormed' },
    { ok: !cat.is_fiv_positive, label: 'FIV negative' },
    { ok: !cat.is_felv_positive, label: 'FeLV negative' },
  ];

  const quickFacts = [
    { Icon: Cake, label: 'Age', value: formatCatAge(cat.age_years, cat.age_months) },
    { Icon: VenusAndMars, label: 'Gender', value: catGenderLabel(cat.gender) },
    { Icon: Palette, label: 'Color', value: cat.color },
    { Icon: Bone, label: 'Breed', value: cat.breed_label || 'Mixed' },
    { Icon: Home, label: 'Shelter', value: cat.shelter_name },
  ].filter((f) => f.value);

  return (
    <div>
      <div className="relative h-[380px] overflow-hidden bg-surface-muted">
        <img src={mainPhoto} alt={cat.name} className="size-full object-cover" onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent to-50%" />
        <div className="absolute right-8 bottom-8 left-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display mb-1 text-[2.5rem] font-bold text-white">{cat.name}</h1>
            <p className="text-[17px] text-white/85">{cat.breed_label || 'Mixed breed'} · {catGenderLabel(cat.gender)} · {formatCatAge(cat.age_years, cat.age_months)}</p>
          </div>
          <div className="text-right">
            <div className="text-[28px] font-black text-white">{cat.adoption_fee > 0 ? formatCurrency(cat.adoption_fee) : 'Free'}</div>
            <div className="text-[13px] text-white/70">adoption fee</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap gap-3">
          {canApply && <Button size="lg" className="h-12 flex-1 text-base" asChild><Link href={user ? `/adoption/apply/${catId}` : '/login'}><Heart className="size-4" />Apply to adopt {cat.name}</Link></Button>}
          <Button size="lg" variant="secondary" className="h-12 shrink-0" onClick={handleFavorite} disabled={faving}>
            <Heart className={cn('size-4', isFav && 'fill-current text-destructive')} />{isFav ? 'Saved' : 'Save'}
          </Button>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-5">
            {cat.description && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-3 text-[17px] font-bold text-foreground">About {cat.name}</h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{cat.description}</p>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-3.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Health status</h2>
              <div className="flex flex-wrap gap-2">
                {healthBadges.map(({ ok, label }) => (
                  <span key={label} className={cn('rounded-full px-3.5 py-1 text-[13px] font-bold', ok ? 'bg-success/10 text-success' : 'bg-surface-muted text-muted-foreground')}>
                    {ok ? '✓' : '✗'} {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-3.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Quick facts</h2>
              <div className="flex flex-col gap-3">
                {quickFacts.map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Icon className="size-3.5" />{label}</span>
                    <span className="text-sm font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {cat.adoption_requirements && (
              <div className="rounded-xl border border-warning/25 bg-warning/10 p-4">
                <h3 className="mb-1.5 text-xs font-bold tracking-wide text-warning uppercase">Requirements</h3>
                <p className="text-sm leading-relaxed text-foreground">{cat.adoption_requirements}</p>
              </div>
            )}

            <div className="rounded-xl bg-gradient-to-br from-[var(--brand-rust)] to-[var(--brand-ink)] p-5 text-center text-white">
              <Home className="mx-auto mb-2 size-8" strokeWidth={1.5} />
              <p className="mb-3 text-[15px] font-bold">{cat.shelter_name || 'Shelter'}</p>
              {canApply && (
                <Button variant="secondary" asChild><Link href={user ? `/adoption/apply/${catId}` : '/login'}>Apply now<ArrowRight className="size-3.5" /></Link></Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
