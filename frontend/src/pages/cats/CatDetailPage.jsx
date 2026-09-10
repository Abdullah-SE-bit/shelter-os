import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, X, Heart, Stethoscope, Frown, Scissors, Syringe, Radio, TriangleAlert } from 'lucide-react';
import { catsApi } from '@/api/catsApi';
import useApi from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/patterns/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate, formatCatAge, statusLabel, catGenderLabel } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80';

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
  { id: 'medical', label: 'Medical', link: (id) => `/cats/${id}/medical` },
  { id: 'vaccines', label: 'Vaccines', link: (id) => `/cats/${id}/vaccinations` },
  { id: 'weight', label: 'Weight', link: (id) => `/cats/${id}/weight` },
];

export default function CatDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedImg, setSelectedImg] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: cat, loading, error } = useApi(() => catsApi.get(id), null, [id]);

  const canEdit = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'].includes(user?.role);
  const canDelete = ['SUPER_ADMIN', 'SHELTER_ADMIN'].includes(user?.role);
  const canRemove = user?.role === 'CAT_OWNER' && cat?.owner_id === user?.id;

  const handleDelete = async () => {
    try {
      await catsApi.delete(id);
      navigate('/cats');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete cat');
    }
  };

  if (loading) return <div className="p-8"><LoadingSpinner size="lg" text="Loading cat profile…" /></div>;
  if (error || !cat) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Cat not found</h2>
      <Button variant="secondary" asChild><Link to="/cats">Back to cats</Link></Button>
    </div>
  );

  const photos = cat.photos?.length ? cat.photos : [null];
  const healthChips = [
    { ok: cat.is_neutered, icon: Scissors, label: 'Neutered' },
    { ok: cat.is_vaccinated_core, icon: Syringe, label: 'Core vaccinated' },
    { ok: cat.is_microchipped, icon: Radio, label: 'Microchipped' },
    { ok: cat.is_fiv_positive, icon: TriangleAlert, label: 'FIV+', danger: true },
    { ok: cat.is_felv_positive, icon: TriangleAlert, label: 'FeLV+', danger: true },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title={cat.name || 'Unnamed cat'}
        description={`${cat.breed_label || 'Mixed breed'} · ${catGenderLabel(cat.gender)} · ${formatCatAge(cat.age_years, cat.age_months)}`}
        backTo="/cats"
        backLabel="Cats"
        actions={
          (canEdit || canDelete || canRemove) && (
            <div className="flex gap-2.5">
              {canEdit && <Button variant="secondary" asChild><Link to={`/cats/${id}/edit`}><Pencil className="size-4" />Edit</Link></Button>}
              {canDelete && <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />Delete</Button>}
              {canRemove && <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}><X className="size-4" />Remove from my cats</Button>}
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <div className="mb-3 h-80 overflow-hidden rounded-xl bg-surface-muted shadow-md">
            <img
              src={photos[selectedImg]?.photo_url || CAT_PLACEHOLDER}
              alt={cat.name}
              className="size-full object-cover"
              onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }}
            />
          </div>

          {photos.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setSelectedImg(i)} className={cn('size-16 shrink-0 overflow-hidden rounded-lg border-2', selectedImg === i ? 'border-primary' : 'border-border')}>
                  <img src={p?.photo_url || CAT_PLACEHOLDER} alt="" className="size-full object-cover" onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Current status</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_TONE[cat.current_status] || STATUS_TONE.UNKNOWN)}>{statusLabel(cat.current_status)}</span>
            </div>
            {cat.shelter_name && <p className="text-sm text-muted-foreground">{cat.shelter_name}</p>}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {cat.current_status === 'IN_SHELTER' && (
              <Button className="w-full" asChild><Link to={`/adoption/${id}`}><Heart className="size-4" />View adoption listing</Link></Button>
            )}
            <Button variant="secondary" className="w-full" asChild><Link to={`/cats/${id}/medical`}><Stethoscope className="size-4" />Medical history</Link></Button>
          </div>
        </div>

        <div>
          <div className="mb-6 flex gap-1 border-b border-border">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                to={tab.link ? tab.link(id) : '#'}
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
                <InfoRow label="Name" value={cat.name} />
                <InfoRow label="Gender" value={catGenderLabel(cat.gender)} />
                <InfoRow label="Age" value={formatCatAge(cat.age_years, cat.age_months)} />
                <InfoRow label="Breed" value={cat.breed_label || 'Mixed'} />
                <InfoRow label="Color" value={cat.color} />
                <InfoRow label="Weight" value={cat.weight_kg ? `${cat.weight_kg} kg` : undefined} />
                <InfoRow label="Intake date" value={formatDate(cat.intake_date)} />
                <InfoRow label="Microchip" value={cat.microchip_id} />
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

            {cat.description && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">About</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{cat.description}</p>
              </div>
            )}

            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Added: {formatDate(cat.created_at)}</span>
              {cat.updated_at && <span>· Updated: {formatDate(cat.updated_at)}</span>}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={canRemove ? 'Remove cat?' : 'Delete cat?'}
        message={canRemove
          ? `Remove ${cat.name || 'this cat'} from your cats? The cat will remain in the system but no longer be linked to your account.`
          : `Are you sure you want to delete ${cat.name || 'this cat'}? This action cannot be undone.`}
        danger={!canRemove}
        confirmLabel={canRemove ? 'Remove cat' : 'Delete cat'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
