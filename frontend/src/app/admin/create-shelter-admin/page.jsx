'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Building2, CheckCircle2 } from 'lucide-react';
import { mockShelters } from '@/lib/mock-data/shelters';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import PageHeader from '@/components/patterns/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{children}</p>;
}

export default function CreateShelterAdminPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    shelter: '', email: '', password: '', first_name: '', last_name: '', phone: '',
  });

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.shelter) errs.shelter = 'Select which shelter this admin manages.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.';
    if (!isValidPkMobile(form.phone)) errs.phone = 'Enter a valid Pakistani mobile number.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setTimeout(() => {
      const shelter = mockShelters.find((s) => s.id === form.shelter);
      setDone({ ...form, shelter_name: shelter?.name });
      setSaving(false);
    }, 400);
  };

  const startAnother = () => {
    setDone(null);
    setForm({ shelter: '', email: '', password: '', first_name: '', last_name: '', phone: '' });
  };

  if (done) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-7" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Shelter admin account created</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">{done.first_name} {done.last_name}</strong> can now sign in as the admin for{' '}
              <strong className="text-foreground">{done.shelter_name}</strong> using <strong className="text-foreground">{done.email}</strong>.
              Hand these credentials over once their subscription is set up.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.push('/admin/users')}>View all users</Button>
            <Button onClick={startAnother}><UserPlus className="size-4" />Create another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Create shelter admin"
        description="Set up the admin login for a shelter you've onboarded"
        backTo="/dashboard"
        backLabel="Dashboard"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="size-4 text-primary" />Shelter admin details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="csa-shelter">Shelter *</Label>
              <NativeSelect id="csa-shelter" required value={form.shelter} onChange={(e) => set('shelter', e.target.value)} className="mt-1.5" aria-invalid={!!errors.shelter}>
                <option value="">Select a shelter…</option>
                {mockShelters.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
              </NativeSelect>
              <FieldError>{errors.shelter}</FieldError>
              <p className="mt-1 text-xs text-muted-foreground">Don't see the shelter yet? <a href="/shelters/create" className="font-semibold text-primary">Create it first</a>.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="csa-fname">First name *</Label>
                <Input id="csa-fname" required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="Jordan" className="mt-1.5" aria-invalid={!!errors.first_name} />
                <FieldError>{errors.first_name}</FieldError>
              </div>
              <div>
                <Label htmlFor="csa-lname">Last name *</Label>
                <Input id="csa-lname" required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="Blake" className="mt-1.5" aria-invalid={!!errors.last_name} />
                <FieldError>{errors.last_name}</FieldError>
              </div>
            </div>

            <div>
              <Label htmlFor="csa-email">Email *</Label>
              <Input id="csa-email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="admin@shelter.org" className="mt-1.5" aria-invalid={!!errors.email} />
              <FieldError>{errors.email}</FieldError>
            </div>

            <div>
              <Label htmlFor="csa-password">Temporary password *</Label>
              <Input id="csa-password" type="password" required value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" className="mt-1.5" aria-invalid={!!errors.password} />
              <FieldError>{errors.password}</FieldError>
              <p className="mt-1 text-xs text-muted-foreground">Share this with the shelter so they can sign in and change it.</p>
            </div>

            <div>
              <Label>Phone *</Label>
              <div className="mt-1.5">
                <PhoneInput value={form.phone} onChange={(v) => set('phone', v)} error={!!errors.phone} />
              </div>
              <FieldError>{errors.phone}</FieldError>
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => router.push('/dashboard')}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                <UserPlus className="size-4" />
                {saving ? 'Creating…' : 'Create shelter admin'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
