'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Search } from 'lucide-react';
import { mockBreeds } from '@/lib/mock-data/cats';
import PageHeader from '@/components/patterns/PageHeader';
import LocationPicker from '@/components/LocationPicker';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';

const MAX_PHOTOS = 5;

export default function CreateLostAlertPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', cat_name: '', breed: '', color: '', description: '', last_seen_at: '', last_seen_latitude: '',
    last_seen_longitude: '', behavioral_notes: '', contact_phone: '', contact_email: '',
  });
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addPhotos = (files) => {
    setError('');
    const nextFiles = [...photos];
    const nextPreviews = [...previews];
    for (const f of files) {
      if (nextFiles.length >= MAX_PHOTOS) break;
      nextFiles.push(f);
      nextPreviews.push(URL.createObjectURL(f));
    }
    setPhotos(nextFiles);
    setPreviews(nextPreviews);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.contact_phone && !isValidPkMobile(form.contact_phone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the phone blank.');
      return;
    }
    setLoading(true); setError('');
    setTimeout(() => { setLoading(false); router.push('/lost-found'); }, 400);
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title="Report lost animal" description="Help us find your missing companion" backTo="/lost-found" backLabel="Lost & Found" />

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Camera className="size-4" />Photos</CardTitle></CardHeader>
          <CardContent>
            <p className="-mt-2 mb-4 text-[13px] text-muted-foreground">A clear photo greatly improves the chance of a match. Add up to {MAX_PHOTOS} (JPG or PNG, 5MB each).</p>

            {previews.length > 0 && (
              <div className="mb-3.5 flex flex-wrap gap-2.5">
                {previews.map((src, i) => (
                  <div key={i} className="relative size-[92px] overflow-hidden rounded-lg border border-border">
                    <img src={src} alt={`preview ${i + 1}`} className="size-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 flex size-[22px] items-center justify-center rounded-full bg-black/70 text-white">
                      <X className="size-3" />
                    </button>
                    {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[10px] font-bold text-white">PRIMARY</span>}
                  </div>
                ))}
              </div>
            )}

            {photos.length < MAX_PHOTOS && (
              <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-destructive/30 bg-gradient-to-br from-destructive/5 to-surface-muted text-center text-muted-foreground">
                <Search className="size-8" strokeWidth={1.5} />
                <span className="text-sm font-bold text-foreground">Click to upload photos</span>
                <span className="text-xs">Don't panic — a photo helps us find your pet</span>
                <input type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={(e) => { addPhotos(Array.from(e.target.files || [])); e.target.value = ''; }} />
              </label>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Alert information</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3.5">
            <div><Label>Alert title *</Label><Input required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Lost orange tabby near Park Road" className="mt-1.5" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.cat_name} onChange={(e) => set('cat_name', e.target.value)} placeholder="e.g. Whiskers" className="mt-1.5" /></div>
              <div>
                <Label>Breed</Label>
                <NativeSelect value={form.breed} onChange={(e) => set('breed', e.target.value)} className="mt-1.5">
                  <option value="">Select breed</option>
                  {mockBreeds.map((breed) => <option key={breed.id} value={breed.id}>{breed.display_label}</option>)}
                </NativeSelect>
              </div>
            </div>
            <div><Label>Color / markings</Label><Input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="e.g. orange tabby, white paws" className="mt-1.5" /></div>
            <div><Label>Description *</Label><Textarea required value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe your pet: color, markings, size, collar…" rows={4} className="mt-1.5" /></div>
            <div><Label>Behavioral notes</Label><Textarea value={form.behavioral_notes} onChange={(e) => set('behavioral_notes', e.target.value)} placeholder="Is your pet shy, friendly, responds to name…" rows={2} className="mt-1.5" /></div>
            <div><Label>Last seen date/time</Label><Input type="datetime-local" value={form.last_seen_at} onChange={(e) => set('last_seen_at', e.target.value)} className="mt-1.5" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Last seen location</CardTitle></CardHeader>
          <CardContent>
            <LocationPicker
              latitude={form.last_seen_latitude}
              longitude={form.last_seen_longitude}
              city=""
              onChange={(location) => {
                set('last_seen_latitude', location.latitude ? String(location.latitude) : '');
                set('last_seen_longitude', location.longitude ? String(location.longitude) : '');
              }}
              label="Last seen coordinates"
              required={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact info</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div><Label>Phone number</Label><div className="mt-1.5"><PhoneInput value={form.contact_phone} onChange={(v) => set('contact_phone', v)} /></div></div>
            <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="you@example.com" className="mt-1.5" /></div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} size="lg" className="h-12 text-base">{loading ? 'Submitting…' : 'Create lost alert'}</Button>
      </form>
    </div>
  );
}
