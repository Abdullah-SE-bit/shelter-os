'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PawPrint, Package, CircleCheck, HeartHandshake, CalendarDays, Phone, Mail, MapPin, Globe, Heart, Pencil, Frown, ArrowRight } from 'lucide-react';
import { getShelterById } from '@/lib/mock-data/shelters';
import { mockPets } from '@/lib/mock-data/pets';
import { mockUsers } from '@/lib/mock-data/users';
import { mockEmployees } from '@/lib/mock-data/users';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import ShelterPhoneField, { isValidPkPhone } from '@/components/ShelterPhoneField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';

const PET_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

export default function ShelterDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const shelter = getShelterById(id);
  const pets = mockPets.filter((c) => c.shelter_id === id).slice(0, 8);
  const employeeCount = mockEmployees.filter((v) => v.shelter_id === id).length;
  const admins = mockUsers.filter((u) => u.role === 'SHELTER_ADMIN');

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', street: '', city: '', country: 'Pakistan', phone: '', email: '', website: '', capacity: '', admin: '', description: '',
  });

  useEffect(() => {
    if (shelter) {
      setForm({
        name: shelter.name || '', street: shelter.address || '', city: shelter.city || '', country: 'Pakistan',
        phone: shelter.phone || '', email: shelter.email || '', website: '', capacity: shelter.capacity || '',
        admin: '', description: shelter.description || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditSaving(true);
    setTimeout(() => { setEditSaving(false); setEditOpen(false); }, 350);
  };

  if (!shelter) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Shelter not found</h2>
      <Button variant="secondary" asChild><Link href="/shelters">Back to shelters</Link></Button>
    </div>
  );

  const details = [
    { icon: PawPrint, label: 'Animals (occupancy)', value: shelter.current_occupancy ?? '—' },
    { icon: Package, label: 'Capacity', value: shelter.capacity ?? '—' },
    { icon: CircleCheck, label: 'Available', value: shelter.capacity ? shelter.capacity - shelter.current_occupancy : '—' },
    { icon: HeartHandshake, label: 'Employees', value: employeeCount },
    { icon: CalendarDays, label: 'Established', value: shelter.created_at ? `Since ${new Date(shelter.created_at).getFullYear()}` : '—' },
  ];

  return (
    <div>
      <div
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: 'linear-gradient(135deg, var(--brand-teal), var(--brand-ink))' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-8 bottom-6 flex flex-wrap items-end gap-5">
          <div className="flex-1">
            <h1 className="font-display text-[32px] font-bold text-white">{shelter.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-[15px] text-white/80">
              <MapPin className="size-4" />
              {shelter.city}
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
                  <PawPrint className="size-4 text-primary" />
                  Animals in shelter
                </h2>
                <Link href={`/pets?shelter=${id}`} className="flex items-center gap-1 text-xs font-semibold text-primary">
                  See all <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {pets.map((pet) => (
                  <Link key={pet.id} href={`/pets/${pet.id}`} className="group relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
                    <img
                      src={pet.primary_photo_url || PET_PLACEHOLDER}
                      alt={pet.name}
                      className="size-full object-cover"
                      onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 py-1.5">
                      <p className="truncate text-xs font-semibold text-white">{pet.name || '?'}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {pets.length === 0 && <p className="text-center text-sm text-muted-foreground">No animals currently listed</p>}
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
                {(shelter.address || shelter.city) && <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-3.5" />{shelter.address}</p>}
              </div>
            </div>

            {(user?.role === 'SUPER_ADMIN' || user?.role === 'SHELTER_ADMIN') && (
              <Button variant="secondary" className="w-full" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit shelter info
              </Button>
            )}

            <div className="rounded-xl bg-primary p-5 text-center text-primary-foreground">
              <Heart className="mx-auto mb-2 size-6" />
              <p className="mb-3 font-semibold">Adopt from this shelter</p>
              <Button asChild>
                <Link href={`/adoption?shelter=${id}`}>View available animals</Link>
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
        <form id="edit-shelter-form" onSubmit={handleEditSubmit} className="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto no-scrollbar pr-1">
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
              <Label htmlFor="es-cap">Capacity (total animals) *</Label>
              <Input id="es-cap" type="number" required min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} className="mt-1.5" />
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
                <ShelterPhoneField cityName={form.city} value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} error={!isValidPkPhone(form.phone)} />
              </div>
            </div>
            <div>
              <Label htmlFor="es-email">Email</Label>
              <Input id="es-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="mt-1.5" />
            </div>
          </div>
          {user?.role === 'SUPER_ADMIN' && (
            <div>
              <Label htmlFor="es-admin">Assign shelter owner / manager</Label>
              <NativeSelect id="es-admin" value={form.admin || ''} onChange={(e) => setForm((p) => ({ ...p, admin: e.target.value }))} className="mt-1.5">
                <option value="">No manager assigned</option>
                {admins.map((adm) => (
                  <option key={adm.id} value={adm.id}>{adm.email} ({adm.profile.first_name} {adm.profile.last_name})</option>
                ))}
              </NativeSelect>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
