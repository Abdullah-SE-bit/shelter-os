import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Radio } from 'lucide-react';
import { catsApi } from '@/api/catsApi';
import { sheltersApi } from '@/api/sheltersApi';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/patterns/PageHeader';
import StepIndicator from '@/components/patterns/StepIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const GENDERS = ['MALE', 'FEMALE', 'UNKNOWN'];
const STATUSES = ['IN_SHELTER', 'FOSTERED', 'LOST'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const STEP_LABELS = ['Basic info', 'Health & care', 'Photos & adoption'];

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{children}</p>;
}

export default function CreateCatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shelters, setShelters] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [form, setForm] = useState({
    name: '', gender: 'UNKNOWN', breed: '', age_years: '', age_months: '',
    color: '', weight_kg: '', current_status: 'IN_SHELTER', description: '',
    intake_date: new Date().toISOString().split('T')[0],
    is_neutered: false, is_vaccinated_core: false, is_dewormed: false, is_fiv_positive: false, is_felv_positive: false,
    adoption_fee: '', adoption_requirements: '', shelter: '',
  });
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setFieldErrors((fe) => ({ ...fe, [k]: undefined })); };

  useEffect(() => {
    catsApi.listBreeds().then((res) => {
      const list = res.data?.data || res.data?.results || res.data || [];
      setBreeds(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) setForm((f) => ({ ...f, breed: f.breed || list[0].id }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'VET') {
      sheltersApi.list().then((res) => {
        const list = res.data?.data || res.data?.results || res.data || [];
        setShelters(list);
        if (list.length > 0) setForm((f) => ({ ...f, shelter: list[0].id }));
      }).catch(() => {});
    }
  }, [user]);

  const addPhotos = (files) => {
    setFieldErrors((fe) => ({ ...fe, photos: undefined }));
    const valid = [];
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) { setFieldErrors((fe) => ({ ...fe, photos: 'Only JPEG or PNG images are allowed.' })); continue; }
      if (f.size > MAX_PHOTO_BYTES) { setFieldErrors((fe) => ({ ...fe, photos: 'Each image must be 5MB or smaller.' })); continue; }
      valid.push(f);
    }
    setPhotos(valid.slice(0, 5));
  };

  const validateAll = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.breed) errs.breed = 'Please select a breed.';
    if ((user?.role === 'SUPER_ADMIN' || user?.role === 'VET') && !form.shelter) errs.shelter = 'Please select a shelter.';
    if (photos.length === 0) errs.photos = 'At least one photo is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAll();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      if (errs.name || errs.breed || errs.shelter) setStep(1);
      else if (errs.photos) setStep(3);
      return;
    }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.breed) fd.append('breed', form.breed);
      fd.append('gender', form.gender);
      fd.append('age_years', parseInt(form.age_years) || 0);
      fd.append('age_months', parseInt(form.age_months) || 0);
      fd.append('color', form.color || '');
      fd.append('is_neutered', form.is_neutered);
      fd.append('is_vaccinated_core', form.is_vaccinated_core);
      fd.append('behavioral_notes', form.description || '');
      fd.append('adoption_fee', parseFloat(form.adoption_fee) || 0);
      fd.append('adoption_requirements', form.adoption_requirements || '');
      if (form.intake_date) fd.append('intake_date', form.intake_date);
      if (form.shelter) fd.append('shelter', form.shelter);
      fd.append('add_to_shelter', 'true');
      photos.forEach((p) => fd.append('photos', p));
      const { data } = await catsApi.create(fd);
      navigate(`/cats/${data?.data?.id || data?.id || ''}`);
    } catch (err) {
      const details = err.response?.data?.error?.details;
      if (details && typeof details === 'object') {
        const mapped = {};
        Object.entries(details).forEach(([field, msgs]) => { mapped[field] = Array.isArray(msgs) ? msgs.join(', ') : String(msgs); });
        setFieldErrors(mapped);
        setError('Please fix the highlighted fields.');
        setStep(mapped.photos ? 3 : 1);
      } else {
        setError(err.response?.data?.error?.message || 'Failed to create cat profile.');
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkRow = (key, label) => (
    <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
      <Checkbox checked={form[key]} onCheckedChange={(v) => set(key, v)} />
      {label}
    </label>
  );

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title="Add new cat" description={user?.role === 'VOLUNTEER' ? 'Add a cat to your shelter' : 'Create a cat profile in the system'} backTo="/cats" backLabel="Cats" />
      <StepIndicator step={step} labels={STEP_LABELS} />

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium whitespace-pre-line text-destructive">{error}</div>}

      <form onSubmit={step < 3 ? (e) => { e.preventDefault(); setStep((s) => s + 1); } : handleSubmit} className="flex flex-col gap-5">
        {step === 1 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Basic information</h3>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cat-name">Name *</Label>
                  <Input id="cat-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Whiskers" className="mt-1.5" aria-invalid={!!fieldErrors.name} />
                  <FieldError>{fieldErrors.name}</FieldError>
                </div>
                <div>
                  <Label htmlFor="cat-gender">Gender</Label>
                  <NativeSelect id="cat-gender" value={form.gender} onChange={(e) => set('gender', e.target.value)} className="mt-1.5">
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </NativeSelect>
                </div>
              </div>

              {(user?.role === 'SUPER_ADMIN' || user?.role === 'VET') && (
                <div>
                  <Label htmlFor="cat-shelter">Shelter *</Label>
                  <NativeSelect id="cat-shelter" value={form.shelter} onChange={(e) => set('shelter', e.target.value)} className="mt-1.5" aria-invalid={!!fieldErrors.shelter}>
                    <option value="">Select a shelter</option>
                    {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </NativeSelect>
                  <FieldError>{fieldErrors.shelter}</FieldError>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cat-years">Age (years)</Label>
                  <Input id="cat-years" type="number" min="0" max="30" value={form.age_years} onChange={(e) => set('age_years', e.target.value)} placeholder="2" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="cat-months">Age (months)</Label>
                  <Input id="cat-months" type="number" min="0" max="11" value={form.age_months} onChange={(e) => set('age_months', e.target.value)} placeholder="6" className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cat-breed">Breed *</Label>
                  <NativeSelect id="cat-breed" value={form.breed} onChange={(e) => set('breed', e.target.value)} className="mt-1.5" aria-invalid={!!fieldErrors.breed}>
                    <option value="">Select breed</option>
                    {breeds.map((b) => <option key={b.id} value={b.id}>{b.display_label}</option>)}
                  </NativeSelect>
                  <FieldError>{fieldErrors.breed}</FieldError>
                </div>
                <div>
                  <Label htmlFor="cat-color">Color / markings</Label>
                  <Input id="cat-color" value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="Orange tabby" className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cat-weight">Weight (kg)</Label>
                  <Input id="cat-weight" type="number" step="0.01" min="0.1" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} placeholder="4.2" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="cat-status">Status</Label>
                  <NativeSelect id="cat-status" value={form.current_status} onChange={(e) => set('current_status', e.target.value)} className="mt-1.5">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </NativeSelect>
                </div>
              </div>
              <div>
                <Label htmlFor="cat-intake">Intake date</Label>
                <Input id="cat-intake" type="date" value={form.intake_date} onChange={(e) => set('intake_date', e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="cat-desc">Description / personality</Label>
                <Textarea id="cat-desc" value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Describe this cat's personality, habits, and any special needs…" className="mt-1.5" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Health & care status</h3>
            <div className="grid grid-cols-2 gap-3.5">
              {checkRow('is_neutered', 'Neutered / spayed')}
              {checkRow('is_vaccinated_core', 'Core vaccines given')}
              {checkRow('is_dewormed', 'Dewormed')}
              {checkRow('is_fiv_positive', 'FIV positive')}
              {checkRow('is_felv_positive', 'FeLV positive')}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface-muted p-3 text-xs leading-relaxed text-muted-foreground">
              <Radio className="mt-0.5 size-3.5 shrink-0" />
              A unique 15-digit ISO 11784/11785 microchip number is generated and assigned automatically by the system when this shelter cat is created.
            </div>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Photos *</h3>
              <label className={cn(
                'flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground',
                fieldErrors.photos ? 'border-destructive' : 'border-border',
              )}>
                <Camera className="size-8" strokeWidth={1.5} />
                <span className="text-sm font-semibold">{photos.length > 0 ? `${photos.length} photo(s) selected` : 'Click to upload cat photos (required)'}</span>
                <span className="text-xs text-muted-foreground">JPG, PNG — up to 5 files, 5MB each</span>
                <input type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={(e) => addPhotos(Array.from(e.target.files))} />
              </label>
              <FieldError>{fieldErrors.photos}</FieldError>
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="rounded-md bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">{p.name.slice(0, 20)}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Adoption details</h3>
              <div className="flex flex-col gap-3.5">
                <div>
                  <Label htmlFor="cat-fee">Adoption fee (PKR)</Label>
                  <Input id="cat-fee" type="number" min="0" value={form.adoption_fee} onChange={(e) => set('adoption_fee', e.target.value)} placeholder="0 for free" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="cat-req">Adoption requirements</Label>
                  <Textarea id="cat-req" value={form.adoption_requirements} onChange={(e) => set('adoption_requirements', e.target.value)} rows={3} placeholder="Minimum requirements for adopting this cat…" className="mt-1.5" />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3">
          {step > 1 && <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)} className="flex-1">Back</Button>}
          <Button type="submit" disabled={loading} className="flex-[2]">
            {step < 3 ? 'Next' : loading ? 'Creating…' : 'Create cat profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
