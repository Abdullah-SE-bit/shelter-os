'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2, X, Heart, Stethoscope, Frown, Scissors, Syringe, Radio, TriangleAlert } from 'lucide-react';
import { getPetById } from '@/lib/mock-data/pets';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/patterns/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate, formatPetAge, statusLabel, petGenderLabel } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PET_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80';

const STATUS_TONE = {
  IN_SHELTER: 'bg-success/10 text-success', FOSTERED: 'bg-info/10 text-info', ADOPTED: 'bg-primary/10 text-primary',
  LOST: 'bg-destructive/10 text-destructive', DECEASED: 'bg-surface-muted text-muted-foreground', UNKNOWN: 'bg-warning/10 text-warning',
};

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-[15px] font-medium text-foreground">{value}</span>
    </div>
  );
}

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'medical', label: 'Medical', link: (id) => `/pets/${id}/medical` },
  { id: 'vaccines', label: 'Vaccines', link: (id) => `/pets/${id}/vaccinations` },
  { id: 'weight', label: 'Weight', link: (id) => `/pets/${id}/weight` },
];

export default function PetDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedImg, setSelectedImg] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const pet = getPetById(id);

  const canEdit = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'].includes(user?.role);
  const canDelete = ['SUPER_ADMIN', 'SHELTER_ADMIN'].includes(user?.role);

  const handleDelete = () => {
    setDeleteOpen(false);
    router.push('/pets');
  };

  if (!pet) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Animal not found</h2>
      <Button variant="secondary" asChild><Link href="/pets">Back to animals</Link></Button>
    </div>
  );

  const photos = pet.photos?.length ? pet.photos : [null];
  const healthChips = [
    { ok: pet.is_neutered, icon: Scissors, label: 'Neutered' },
    { ok: pet.is_vaccinated_core, icon: Syringe, label: 'Core vaccinated' },
    { ok: pet.is_microchipped, icon: Radio, label: 'Microchipped' },
    { ok: pet.is_fiv_positive, icon: TriangleAlert, label: 'FIV+', danger: true },
    { ok: pet.is_felv_positive, icon: TriangleAlert, label: 'FeLV+', danger: true },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title={pet.name || 'Unnamed animal'}
        description={`${pet.breed_label || 'Mixed breed'} · ${petGenderLabel(pet.gender)} · ${formatPetAge(pet.age_years, pet.age_months)}`}
        backTo="/pets"
        backLabel="Animals"
        actions={
          (canEdit || canDelete) && (
            <div className="flex gap-2.5">
              {canEdit && <Button variant="secondary" asChild><Link href={`/pets/${id}/edit`}><Pencil className="size-4" />Edit</Link></Button>}
              {canDelete && <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />Delete</Button>}
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <div className="mb-3 h-80 overflow-hidden rounded-xl bg-surface-muted shadow-md">
            <img
              src={photos[selectedImg] || pet.primary_photo_url || PET_PLACEHOLDER}
              alt={pet.name}
              className="size-full object-cover"
              onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }}
            />
          </div>

          {photos.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setSelectedImg(i)} className={cn('size-16 shrink-0 overflow-hidden rounded-lg border-2', selectedImg === i ? 'border-primary' : 'border-border')}>
                  <img src={p || PET_PLACEHOLDER} alt="" className="size-full object-cover" onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }} />
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Current status</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_TONE[pet.current_status] || STATUS_TONE.UNKNOWN)}>{statusLabel(pet.current_status)}</span>
            </div>
            {pet.shelter_name && <p className="text-sm text-muted-foreground">{pet.shelter_name}</p>}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {pet.current_status === 'IN_SHELTER' && (
              <Button className="w-full" asChild><Link href={`/adoption/${id}`}><Heart className="size-4" />View adoption listing</Link></Button>
            )}
            <Button variant="secondary" className="w-full" asChild><Link href={`/pets/${id}/medical`}><Stethoscope className="size-4" />Medical history</Link></Button>
          </div>
        </div>

        <div>
          <div className="mb-6 flex gap-1 border-b border-border">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                href={tab.link ? tab.link(id) : '#'}
                className={cn(
                  '-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold',
                  tab.id === 'info' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Basic information</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Name" value={pet.name} />
                <InfoRow label="Gender" value={petGenderLabel(pet.gender)} />
                <InfoRow label="Age" value={formatPetAge(pet.age_years, pet.age_months)} />
                <InfoRow label="Breed" value={pet.breed_label || 'Mixed'} />
                <InfoRow label="Color" value={pet.color} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Health & care</h3>
              <div className="flex flex-wrap gap-2">
                {healthChips.map(({ ok, icon: Icon, label, danger }) => ok !== undefined && (
                  <span key={label} className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                    ok ? (danger ? 'border-transparent bg-warning/10 text-warning' : 'border-transparent bg-success/10 text-success') : 'border-border text-muted-foreground line-through',
                  )}>
                    <Icon className="size-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {pet.description && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">About</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{pet.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete animal?"
        message={`Are you sure you want to delete ${pet.name || 'this animal'}? This action cannot be undone.`}
        danger
        confirmLabel="Delete animal"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
