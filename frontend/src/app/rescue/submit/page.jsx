'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crosshair, Camera, Siren, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/patterns/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Low', desc: 'Animal is safe but needs help' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Animal needs attention soon' },
  { value: 'HIGH', label: 'High', desc: 'Animal is in danger or injured' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Life-threatening emergency!' },
];

export default function SubmitRescuePage() {
  const router = useRouter();
  const [form, setForm] = useState({ description: '', latitude: '', longitude: '', urgency_level: 'MEDIUM', pet_condition_notes: '' });
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { set('latitude', String(pos.coords.latitude)); set('longitude', String(pos.coords.longitude)); setLocating(false); },
      () => { setError('Could not get location. Please enter manually.'); setLocating(false); },
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) { setError('Please provide a location.'); return; }
    setLoading(true); setError('');
    setTimeout(() => { setLoading(false); router.push('/rescue'); }, 400);
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title="Submit rescue report" description="Help us locate and rescue an animal in need" backTo="/rescue" backLabel="Rescue" />

      <Card className="mb-5">
        <CardHeader><CardTitle>Urgency level</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5">
            {URGENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('urgency_level', opt.value)}
                className={cn(
                  'rounded-lg border-2 p-3.5 text-left transition-colors',
                  form.urgency_level === opt.value ? 'border-primary bg-primary/5' : 'border-border bg-surface-muted',
                )}
              >
                <div className="text-sm font-bold text-foreground">{opt.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card>
          <CardContent className="flex flex-col gap-3.5 pt-6">
            <div>
              <Label htmlFor="rescue-desc">Description *</Label>
              <Textarea id="rescue-desc" required value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the situation: where you found the animal, its condition, any hazards nearby…" rows={4} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="rescue-notes">Condition notes</Label>
              <Textarea id="rescue-notes" value={form.pet_condition_notes} onChange={(e) => set('pet_condition_notes', e.target.value)} placeholder="Injuries, behavior, approximate age…" rows={3} className="mt-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Location</CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={getLocation} disabled={locating}>
              <Crosshair className="size-3.5" />
              {locating ? 'Getting…' : 'Use my location'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="rescue-lat">Latitude *</Label><Input id="rescue-lat" type="number" step="any" required value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="e.g. 33.7294" className="mt-1.5" /></div>
              <div><Label htmlFor="rescue-lng">Longitude *</Label><Input id="rescue-lng" type="number" step="any" required value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="e.g. 73.0931" className="mt-1.5" /></div>
            </div>
            {form.latitude && form.longitude && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="size-3.5" />
                Location set: {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Photos (optional)</CardTitle></CardHeader>
          <CardContent>
            <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-sm font-semibold text-muted-foreground">
              <Camera className="size-6" strokeWidth={1.5} />
              {photos.length > 0 ? `${photos.length} photo(s) selected` : 'Click to add photos'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setPhotos(Array.from(e.target.files))} />
            </label>
            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((p, i) => <div key={i} className="rounded-md bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{p.name.slice(0, 20)}</div>)}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} variant="destructive" className="h-11 w-full">
          <Siren className="size-4" />
          {loading ? 'Submitting…' : 'Submit rescue report'}
        </Button>
      </form>
    </div>
  );
}
