'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cat, HandHeart, Siren, Building2, Baby, Inbox } from 'lucide-react';
import PageHeader from '@/components/patterns/PageHeader';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const INTAKE_REASONS = [
  { value: 'STRAY', icon: Cat, label: 'Stray' },
  { value: 'SURRENDER', icon: HandHeart, label: 'Surrender' },
  { value: 'RESCUE', icon: Siren, label: 'Rescue' },
  { value: 'TRANSFER', icon: Building2, label: 'Transfer' },
  { value: 'BORN_IN_SHELTER', icon: Baby, label: 'Born here' },
];

export default function IntakePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    cat_name: '', reason: 'STRAY', intake_date: new Date().toISOString().split('T')[0],
    condition_on_arrival: '', intake_notes: '', microchip_number: '',
    found_location: '', surrenderer_name: '', surrenderer_phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.surrenderer_phone && !isValidPkMobile(form.surrenderer_phone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the phone blank.');
      return;
    }
    setLoading(true); setError('');
    setTimeout(() => { setLoading(false); router.push('/shelter/dashboard'); }, 350);
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title="Animal intake" description="Record a new animal arriving at the shelter" backTo="/shelter/dashboard" backLabel="Dashboard" />

      <Card className="mb-5">
        <CardHeader><CardTitle>Reason for intake</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2.5">
            {INTAKE_REASONS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('reason', value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-xs font-semibold transition-colors',
                  form.reason === value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface-muted text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card>
          <CardHeader><CardTitle>Animal information</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="intake-name">Name (or "Unknown")</Label><Input id="intake-name" value={form.cat_name} onChange={(e) => set('cat_name', e.target.value)} placeholder="Whiskers / Unknown" className="mt-1.5" /></div>
              <div><Label htmlFor="intake-date">Intake date *</Label><Input id="intake-date" required type="date" value={form.intake_date} onChange={(e) => set('intake_date', e.target.value)} className="mt-1.5" /></div>
            </div>
            <div><Label htmlFor="intake-chip">Microchip number</Label><Input id="intake-chip" value={form.microchip_number} onChange={(e) => set('microchip_number', e.target.value)} placeholder="If known" className="mt-1.5" /></div>
            <div><Label htmlFor="intake-condition">Condition on arrival *</Label><Textarea id="intake-condition" required value={form.condition_on_arrival} onChange={(e) => set('condition_on_arrival', e.target.value)} rows={3} placeholder="Describe the animal's physical condition when it arrived…" className="mt-1.5" /></div>
            <div><Label htmlFor="intake-notes">Intake notes</Label><Textarea id="intake-notes" value={form.intake_notes} onChange={(e) => set('intake_notes', e.target.value)} rows={2} placeholder="Any additional information…" className="mt-1.5" /></div>
          </CardContent>
        </Card>

        {form.reason === 'STRAY' && (
          <Card>
            <CardHeader><CardTitle>Found location</CardTitle></CardHeader>
            <CardContent>
              <Label htmlFor="intake-loc">Where was the animal found?</Label>
              <Input id="intake-loc" value={form.found_location} onChange={(e) => set('found_location', e.target.value)} placeholder="e.g. F-7 Sector, near the park" className="mt-1.5" />
            </CardContent>
          </Card>
        )}

        {form.reason === 'SURRENDER' && (
          <Card>
            <CardHeader><CardTitle>Surrenderer details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="intake-sname">Name</Label><Input id="intake-sname" value={form.surrenderer_name} onChange={(e) => set('surrenderer_name', e.target.value)} className="mt-1.5" /></div>
              <div><Label>Phone</Label><div className="mt-1.5"><PhoneInput value={form.surrenderer_phone} onChange={(v) => set('surrenderer_phone', v)} /></div></div>
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={loading} className="h-11 w-full">
          <Inbox className="size-4" />
          {loading ? 'Recording…' : 'Record intake'}
        </Button>
      </form>
    </div>
  );
}
