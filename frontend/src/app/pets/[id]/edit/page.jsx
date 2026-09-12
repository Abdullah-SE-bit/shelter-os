'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPetById } from '@/lib/mock-data/pets';
import { mockShelters } from '@/lib/mock-data/shelters';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/patterns/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect } from '@/components/ui/native-select';

const GENDERS = ['MALE', 'FEMALE', 'UNKNOWN'];
const STATUSES = ['IN_SHELTER', 'FOSTERED', 'LOST', 'ADOPTED', 'DECEASED'];

export default function EditPetPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pet = getPetById(id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: pet?.name || '', gender: pet?.gender || 'UNKNOWN', color: pet?.color || '',
    age_years: pet?.age_years ?? '', age_months: pet?.age_months ?? '',
    current_status: pet?.current_status || 'IN_SHELTER', description: pet?.description || '',
    adoption_fee: pet?.adoption_fee ?? '', adoption_requirements: pet?.adoption_requirements || '',
    is_neutered: !!pet?.is_neutered, is_vaccinated_core: !!pet?.is_vaccinated_core, is_microchipped: !!pet?.is_microchipped,
    is_dewormed: !!pet?.is_dewormed, is_fiv_positive: !!pet?.is_fiv_positive, is_felv_positive: !!pet?.is_felv_positive,
    shelter: pet?.shelter_id || '',
  }));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => { setSaving(false); router.push(`/pets/${id}`); }, 350);
  };

  if (!pet) return <div className="p-8"><div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">Animal not found.</div></div>;

  const chk = (key, label) => (
    <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
      <Checkbox checked={form[key]} onCheckedChange={(v) => set(key, v)} />
      {label}
    </label>
  );

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title={`Edit: ${form.name || 'Animal'}`} backTo={`/pets/${id}`} backLabel="Animal profile" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Basic information</h3>
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="edit-name">Name</Label><Input id="edit-name" value={form.name} onChange={(e) => set('name', e.target.value)} className="mt-1.5" /></div>
              <div>
                <Label htmlFor="edit-gender">Gender</Label>
                <NativeSelect id="edit-gender" value={form.gender} onChange={(e) => set('gender', e.target.value)} className="mt-1.5">
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </NativeSelect>
              </div>
            </div>
            {user?.role === 'SUPER_ADMIN' && (
              <div>
                <Label htmlFor="edit-shelter">Shelter</Label>
                <NativeSelect id="edit-shelter" value={form.shelter} onChange={(e) => set('shelter', e.target.value)} className="mt-1.5">
                  <option value="">No shelter (independent / private owner)</option>
                  {mockShelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </NativeSelect>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="edit-years">Age (years)</Label><Input id="edit-years" type="number" min="0" max="30" value={form.age_years} onChange={(e) => set('age_years', e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="edit-months">Age (months)</Label><Input id="edit-months" type="number" min="0" max="11" value={form.age_months} onChange={(e) => set('age_months', e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="edit-color">Color</Label><Input id="edit-color" value={form.color} onChange={(e) => set('color', e.target.value)} className="mt-1.5" /></div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <NativeSelect id="edit-status" value={form.current_status} onChange={(e) => set('current_status', e.target.value)} className="mt-1.5">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </NativeSelect>
              </div>
            </div>
            <div><Label htmlFor="edit-desc">Description</Label><Textarea id="edit-desc" value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} className="mt-1.5" /></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Health status</h3>
          <div className="grid grid-cols-2 gap-3.5">
            {chk('is_neutered', 'Neutered / spayed')}
            {chk('is_vaccinated_core', 'Core vaccinated')}
            {chk('is_microchipped', 'Microchipped')}
            {chk('is_dewormed', 'Dewormed')}
            {chk('is_fiv_positive', 'FIV positive')}
            {chk('is_felv_positive', 'FeLV positive')}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Adoption details</h3>
          <div className="flex flex-col gap-3.5">
            <div><Label htmlFor="edit-fee">Adoption fee (PKR)</Label><Input id="edit-fee" type="number" min="0" value={form.adoption_fee} onChange={(e) => set('adoption_fee', e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="edit-req">Adoption requirements</Label><Textarea id="edit-req" value={form.adoption_requirements} onChange={(e) => set('adoption_requirements', e.target.value)} rows={3} className="mt-1.5" /></div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push(`/pets/${id}`)} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={saving} className="flex-[2]">{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>
    </div>
  );
}
