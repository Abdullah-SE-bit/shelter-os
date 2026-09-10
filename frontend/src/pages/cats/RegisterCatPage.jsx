import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, PawPrint } from 'lucide-react';
import { catsApi } from '@/api/catsApi';
import useApi from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/patterns/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect } from '@/components/ui/native-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MICROCHIP_RE = /^\d{15}$/;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{children}</p>;
}

export default function RegisterCatPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [form, setForm] = useState({
    name: '', breed: '', age_years: '', age_months: '', gender: 'MALE', color: '',
    is_microchipped: false, microchip_id: '', is_vaccinated_core: false, is_neutered: false, behavioral_notes: '',
  });

  const { data: breedsData, loading: breedsLoading } = useApi(() => catsApi.listBreeds());
  const breeds = Array.isArray(breedsData) ? breedsData : (breedsData?.results || []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePhoto = (file) => {
    setFieldErrors((prev) => ({ ...prev, photo: undefined }));
    if (!file) { setPhoto(null); setPhotoPreview(''); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { setFieldErrors((prev) => ({ ...prev, photo: 'Only JPEG or PNG images are allowed.' })); return; }
    if (file.size > MAX_PHOTO_BYTES) { setFieldErrors((prev) => ({ ...prev, photo: 'Image must be 5MB or smaller.' })); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Cat name is required.';
    if (!form.breed) errs.breed = 'Please select a breed.';
    if (!photo) errs.photo = 'A cat photo is required.';
    if ((form.is_microchipped || form.microchip_id) && !MICROCHIP_RE.test(form.microchip_id)) {
      errs.microchip_id = 'Microchip number must be exactly 15 digits.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.breed) fd.append('breed', form.breed);
      fd.append('age_years', parseInt(form.age_years) || 0);
      fd.append('age_months', parseInt(form.age_months) || 0);
      fd.append('gender', form.gender);
      fd.append('color', form.color);
      fd.append('is_microchipped', form.is_microchipped);
      if (form.microchip_id) fd.append('microchip_id', form.microchip_id);
      fd.append('is_vaccinated_core', form.is_vaccinated_core);
      fd.append('is_neutered', form.is_neutered);
      fd.append('behavioral_notes', form.behavioral_notes || '');
      fd.append('photos', photo);
      await catsApi.create(fd);
      navigate('/cats');
    } catch (err) {
      const details = err.response?.data?.error?.details;
      if (details && typeof details === 'object') {
        const mapped = {};
        Object.entries(details).forEach(([field, msgs]) => { mapped[field] = Array.isArray(msgs) ? msgs.join(', ') : String(msgs); });
        setFieldErrors(mapped);
        setError('Please fix the highlighted fields.');
      } else {
        setError(err.response?.data?.error?.message || 'Failed to register cat. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (breedsLoading) return <LoadingSpinner text="Loading…" />;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader title="Register your cat" description="Add your cat to Shelter OS to manage their health and records" />

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card>
          <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label>Cat photo *</Label>
              <label className={cn(
                'mt-1.5 flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed text-muted-foreground',
                fieldErrors.photo ? 'border-destructive' : 'border-border',
              )}>
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="max-h-44 max-w-full rounded-lg" />
                ) : (
                  <>
                    <Camera className="size-8" strokeWidth={1.5} />
                    <span className="text-sm font-semibold">Click to upload a photo (required)</span>
                    <span className="text-xs">JPG or PNG, up to 5MB</span>
                  </>
                )}
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
              </label>
              <FieldError>{fieldErrors.photo}</FieldError>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="rc-name">Cat name *</Label>
                <Input id="rc-name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Whiskers" className="mt-1.5" aria-invalid={!!fieldErrors.name} />
                <FieldError>{fieldErrors.name}</FieldError>
              </div>
              <div>
                <Label htmlFor="rc-breed">Breed *</Label>
                <NativeSelect id="rc-breed" value={form.breed} onChange={(e) => handleChange('breed', e.target.value)} className="mt-1.5" aria-invalid={!!fieldErrors.breed}>
                  <option value="">Select breed</option>
                  {breeds.map((b) => <option key={b.id} value={b.id}>{b.display_label}</option>)}
                </NativeSelect>
                <FieldError>{fieldErrors.breed}</FieldError>
              </div>
              <div>
                <Label htmlFor="rc-years">Age (years)</Label>
                <Input id="rc-years" type="number" min="0" max="30" value={form.age_years} onChange={(e) => handleChange('age_years', e.target.value)} placeholder="2" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="rc-months">Age (months)</Label>
                <Input id="rc-months" type="number" min="0" max="11" value={form.age_months} onChange={(e) => handleChange('age_months', e.target.value)} placeholder="6" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="rc-gender">Gender *</Label>
                <NativeSelect id="rc-gender" required value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className="mt-1.5">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="UNKNOWN">Unknown</option>
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="rc-color">Color / markings</Label>
                <Input id="rc-color" value={form.color} onChange={(e) => handleChange('color', e.target.value)} placeholder="Orange tabby with white paws" className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                  <Checkbox checked={form.is_microchipped} onCheckedChange={(v) => handleChange('is_microchipped', v)} />
                  This cat is microchipped
                </label>
                {form.is_microchipped && (
                  <>
                    <Input inputMode="numeric" maxLength={15} value={form.microchip_id} onChange={(e) => handleChange('microchip_id', e.target.value.replace(/\D/g, ''))} placeholder="15-digit microchip number" aria-invalid={!!fieldErrors.microchip_id} />
                    {fieldErrors.microchip_id ? <FieldError>{fieldErrors.microchip_id}</FieldError> : <p className="mt-1 text-xs text-muted-foreground">Enter the 15-digit ISO 11784/11785 microchip number</p>}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Health & notes</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <Checkbox checked={form.is_vaccinated_core} onCheckedChange={(v) => handleChange('is_vaccinated_core', v)} />
                Core vaccines given
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <Checkbox checked={form.is_neutered} onCheckedChange={(v) => handleChange('is_neutered', v)} />
                Spayed / neutered
              </label>
            </div>
            <div>
              <Label htmlFor="rc-notes">Behavioral notes</Label>
              <Textarea id="rc-notes" value={form.behavioral_notes} onChange={(e) => handleChange('behavioral_notes', e.target.value)} rows={4} placeholder="Describe your cat's personality, temperament, likes, dislikes, etc." className="mt-1.5" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/cats')}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            <PawPrint className="size-4" />
            {saving ? 'Registering…' : 'Register cat'}
          </Button>
        </div>
      </form>
    </div>
  );
}
