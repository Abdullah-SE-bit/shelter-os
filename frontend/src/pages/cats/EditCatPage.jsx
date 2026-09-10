import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catsApi } from '@/api/catsApi';
import { sheltersApi } from '@/api/sheltersApi';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/patterns/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect } from '@/components/ui/native-select';

const GENDERS = ['MALE', 'FEMALE', 'UNKNOWN'];
const STATUSES = ['IN_SHELTER', 'FOSTERED', 'LOST', 'STRAY', 'ADOPTED', 'DECEASED'];
const BREEDS = ['PERSIAN', 'SIAMESE', 'MAINE_COON', 'BENGAL', 'RAGDOLL', 'BRITISH_SHORTHAIR', 'ABYSSINIAN', 'SCOTTISH_FOLD', 'SPHYNX', 'MIXED', 'OTHER'];

export default function EditCatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shelters, setShelters] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'VET') {
      sheltersApi.list().then((res) => setShelters(res.data?.data || res.data?.results || res.data || [])).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    catsApi.get(id).then((r) => {
      const c = r.data?.data || r.data;
      setForm({
        name: c.name || '', gender: c.gender || 'UNKNOWN', breed: c.breed || 'MIXED',
        age_years: c.age_years || '', age_months: c.age_months || '', color: c.color || '',
        weight_kg: c.weight_kg || '', current_status: c.current_status || 'IN_SHELTER',
        description: c.description || '', microchip_number: c.microchip_number || '',
        intake_date: c.intake_date || '', adoption_fee: c.adoption_fee || '', adoption_requirements: c.adoption_requirements || '',
        is_neutered: !!c.is_neutered, is_vaccinated_core: !!c.is_vaccinated_core, is_microchipped: !!c.is_microchipped,
        is_dewormed: !!c.is_dewormed, is_fiv_positive: !!c.is_fiv_positive, is_felv_positive: !!c.is_felv_positive,
        shelter: c.shelter || '',
      });
    }).catch(() => setError('Failed to load cat.')).finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await catsApi.update(id, form);
      navigate(`/cats/${id}`);
    } catch (err) {
      let errorMsg = err.response?.data?.error?.message || 'Failed to save changes.';
      const details = err.response?.data?.error?.details;
      if (details && typeof details === 'object') {
        const fe = Object.entries(details).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('\n');
        if (fe) errorMsg += `:\n${fe}`;
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><LoadingSpinner size="lg" text="Loading cat details…" /></div>;
  if (!form) return <div className="p-8"><div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">Cat not found.</div></div>;

  const chk = (key, label) => (
    <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
      <Checkbox checked={form[key]} onCheckedChange={(v) => set(key, v)} />
      {label}
    </label>
  );

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title={`Edit: ${form.name || 'Cat'}`} backTo={`/cats/${id}`} backLabel="Cat profile" />

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium whitespace-pre-line text-destructive">{error}</div>}

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
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'VET') && (
              <div>
                <Label htmlFor="edit-shelter">Shelter</Label>
                <NativeSelect id="edit-shelter" value={form.shelter} onChange={(e) => set('shelter', e.target.value)} className="mt-1.5">
                  <option value="">No shelter (independent / private owner)</option>
                  {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </NativeSelect>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="edit-years">Age (years)</Label><Input id="edit-years" type="number" min="0" max="30" value={form.age_years} onChange={(e) => set('age_years', e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="edit-months">Age (months)</Label><Input id="edit-months" type="number" min="0" max="11" value={form.age_months} onChange={(e) => set('age_months', e.target.value)} className="mt-1.5" /></div>
              <div>
                <Label htmlFor="edit-breed">Breed</Label>
                <NativeSelect id="edit-breed" value={form.breed} onChange={(e) => set('breed', e.target.value)} className="mt-1.5">
                  {BREEDS.map((b) => <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>)}
                </NativeSelect>
              </div>
              <div><Label htmlFor="edit-color">Color</Label><Input id="edit-color" value={form.color} onChange={(e) => set('color', e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="edit-weight">Weight (kg)</Label><Input id="edit-weight" type="number" step="0.01" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} className="mt-1.5" /></div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <NativeSelect id="edit-status" value={form.current_status} onChange={(e) => set('current_status', e.target.value)} className="mt-1.5">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </NativeSelect>
              </div>
              <div className="col-span-2"><Label htmlFor="edit-chip">Microchip number</Label><Input id="edit-chip" value={form.microchip_number} onChange={(e) => set('microchip_number', e.target.value)} className="mt-1.5" /></div>
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
          <Button type="button" variant="secondary" onClick={() => navigate(`/cats/${id}`)} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={saving} className="flex-[2]">{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>
    </div>
  );
}
