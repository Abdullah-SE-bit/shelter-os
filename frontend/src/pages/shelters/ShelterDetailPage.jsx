import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Cat, Package, CircleCheck, HeartHandshake, CalendarDays, Phone, Mail, MapPin, Globe, Heart, Pencil, Frown, ArrowRight } from 'lucide-react';
import { sheltersApi } from '@/api/sheltersApi';
import { authApi } from '@/api/authApi';
import { useAuth } from '@/context/AuthContext';
import useApi from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import ShelterPhoneField, { isValidPkPhone } from '@/components/ShelterPhoneField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

export default function ShelterDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, refetch } = useApi(() => sheltersApi.get(id), null, [id]);
  const { data: catsData, loading: catsLoading } = useApi(() => sheltersApi.getCats(id, { page_size: 8 }), null, [id]);

  const shelter = data?.data || data;
  const cats = catsData?.results || [];

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({
    name: '', registration_number: '', street: '', city: '', country: 'Pakistan',
    phone: '', email: '', website: '', capacity_total: '', admin: '', description: '',
  });

  useEffect(() => {
    if (shelter) {
      setForm({
        name: shelter.name || '', registration_number: shelter.registration_number || '',
        street: shelter.street || '', city: shelter.city || '', country: shelter.country || 'Pakistan',
        phone: shelter.phone || '', email: shelter.email || '', website: shelter.website || '',
        capacity_total: shelter.capacity_total || '', admin: shelter.admin || '', description: shelter.description || '',
      });
    }
  }, [shelter]);

  useEffect(() => {
    if (editOpen && (user?.role === 'SUPER_ADMIN' || user?.role === 'SHELTER_ADMIN')) {
      authApi.listUsers({ role: 'SHELTER_ADMIN' }).then((res) => setAdmins(res.data?.data || [])).catch(() => {});
    }
  }, [editOpen, user]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPkPhone(form.phone)) {
      setEditError('Enter a valid Pakistani mobile (+92 3XX XXXXXXX) or landline number.');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      await sheltersApi.update(id, { ...form, capacity_total: parseInt(form.capacity_total) || 0, admin: form.admin || null });
      setEditOpen(false);
      refetch();
    } catch (err) {
      setEditError(err.response?.data?.error?.message || 'Failed to update shelter.');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <div className="p-8"><LoadingSpinner size="lg" text="Loading shelter…" /></div>;
  if (!shelter) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Shelter not found</h2>
      <Button variant="secondary" asChild><Link to="/shelters">Back to shelters</Link></Button>
    </div>
  );

  const details = [
    { icon: Cat, label: 'Cats (occupancy)', value: shelter.current_occupancy ?? '—' },
    { icon: Package, label: 'Capacity', value: shelter.capacity_total ?? '—' },
    { icon: CircleCheck, label: 'Available', value: shelter.available_slots ?? '—' },
    { icon: HeartHandshake, label: 'Volunteers', value: shelter.volunteer_count ?? '—' },
    { icon: CalendarDays, label: 'Established', value: shelter.created_at ? `Since ${new Date(shelter.created_at).getFullYear()}` : '—' },
  ];

  return (
    <div>
      <div
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: shelter.logo_url ? `url(${shelter.logo_url})` : 'linear-gradient(135deg, var(--brand-rust), var(--brand-ink))' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-8 bottom-6 flex flex-wrap items-end gap-5">
          {shelter.logo_url && (
            <div className="size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white">
              <img src={shelter.logo_url} alt="" className="size-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-display text-[32px] font-bold text-white">{shelter.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-[15px] text-white/80">
              <MapPin className="size-4" />
              {[shelter.city, shelter.country].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-5">
            {shelter.description && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-3 text-sm font-bold text-foreground">About</h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{shelter.description}</p>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Cat className="size-4 text-primary" />
                  Cats in shelter
                </h2>
                <Link to={`/cats?shelter=${id}`} className="flex items-center gap-1 text-xs font-semibold text-primary">
                  See all <ArrowRight className="size-3" />
                </Link>
              </div>
              {catsLoading && <LoadingSpinner text="Loading cats…" />}
              <div className="grid grid-cols-4 gap-3">
                {cats.map((cat) => (
                  <Link key={cat.id} to={`/cats/${cat.id}`} className="group relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
                    <img
                      src={cat.primary_photo_url || CAT_PLACEHOLDER}
                      alt={cat.name}
                      className="size-full object-cover"
                      onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 py-1.5">
                      <p className="truncate text-xs font-semibold text-white">{cat.name || '?'}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {cats.length === 0 && !catsLoading && <p className="text-center text-sm text-muted-foreground">No cats currently listed</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Details</h3>
              <div className="flex flex-col gap-3">
                {details.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Icon className="size-3.5" />
                      {label}
                    </span>
                    <span className="font-bold text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contact</h3>
              <div className="flex flex-col gap-2.5 text-sm">
                {shelter.phone && <a href={`tel:${shelter.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="size-3.5" />{shelter.phone}</a>}
                {shelter.email && <a href={`mailto:${shelter.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Mail className="size-3.5" />{shelter.email}</a>}
                {(shelter.street || shelter.city) && <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-3.5" />{[shelter.street, shelter.city, shelter.country].filter(Boolean).join(', ')}</p>}
                {shelter.website && <a href={shelter.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary"><Globe className="size-3.5" />Website</a>}
              </div>
            </div>

            {(user?.role === 'SUPER_ADMIN' || (user?.role === 'SHELTER_ADMIN' && shelter.admin === user.id)) && (
              <Button variant="secondary" className="w-full" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit shelter info
              </Button>
            )}

            <div className="rounded-xl bg-primary p-5 text-center text-primary-foreground">
              <Heart className="mx-auto mb-2 size-6" />
              <p className="mb-3 font-semibold">Adopt a cat from this shelter</p>
              <Button variant="secondary" asChild>
                <Link to={`/adoption?shelter=${id}`}>View available cats</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit shelter info"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button form="edit-shelter-form" type="submit" disabled={editSaving}>{editSaving ? 'Saving…' : 'Save changes'}</Button>
          </>
        }
      >
        {editError && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{editError}</div>}
        <form id="edit-shelter-form" onSubmit={handleEditSubmit} className="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto pr-1">
          <div>
            <Label htmlFor="es-name">Shelter name *</Label>
            <Input id="es-name" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="es-desc">Description</Label>
            <Textarea id="es-desc" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="es-cap">Capacity (total cats) *</Label>
              <Input id="es-cap" type="number" required min="1" value={form.capacity_total} onChange={(e) => setForm((p) => ({ ...p, capacity_total: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="es-city">City *</Label>
              <Input id="es-city" required value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="es-street">Street address</Label>
            <Input id="es-street" value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone *</Label>
              <div className="mt-1.5">
                <ShelterPhoneField cityName={form.city} value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} error={!!editError && !isValidPkPhone(form.phone)} />
              </div>
            </div>
            <div>
              <Label htmlFor="es-email">Email</Label>
              <Input id="es-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="es-website">Website</Label>
            <Input id="es-website" type="url" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://example.com" className="mt-1.5" />
          </div>
          {user?.role === 'SUPER_ADMIN' && (
            <div>
              <Label htmlFor="es-admin">Assign shelter owner / manager</Label>
              <NativeSelect id="es-admin" value={form.admin || ''} onChange={(e) => setForm((p) => ({ ...p, admin: e.target.value }))} className="mt-1.5">
                <option value="">No manager assigned</option>
                {admins
                  .filter((adm) => !adm.assigned_shelter_id || String(adm.assigned_shelter_id) === String(shelter.id))
                  .map((adm) => (
                    <option key={adm.id} value={adm.id}>{adm.email} {adm.profile ? `(${adm.profile.first_name} ${adm.profile.last_name})` : ''}</option>
                  ))}
              </NativeSelect>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
