'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import PageHeader from '@/components/patterns/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const SKILLS = ['RESCUE', 'TRANSPORT', 'FOSTERING', 'FUNDRAISING', 'MEDICAL_ASSIST', 'EVENT_SUPPORT'];

const validateEmail = (email) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'Please enter a valid email address');

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{children}</p>;
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-border-strong',
      )}
    >
      {children}
    </button>
  );
}

export default function CreateEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', phone: '',
    service_radius_km: 10, bio: '', skills: [],
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setFieldErrors((fe) => ({ ...fe, [k]: undefined })); };
  const toggleSkill = (skill) => {
    setForm((f) => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill] }));
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.';
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.phone && !isValidPkMobile(form.phone)) errs.phone = 'Enter a valid Pakistani mobile number.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    // Pure UI playground — no backend, so "creating" the employee just
    // confirms and returns to the roster after a brief, realistic pause.
    setLoading(true);
    setTimeout(() => { setLoading(false); router.push('/employees'); }, 400);
  };

  return (
    <div className="mx-auto max-w-[560px] px-4 py-6 sm:px-6">
      <PageHeader title="Add employee" description="Create an account for a new employee at your shelter" backTo="/employees" backLabel="Employees" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="emp-fname">First name</Label>
            <Input id="emp-fname" required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="Hamza" className="mt-1.5" aria-invalid={!!fieldErrors.first_name} />
            <FieldError>{fieldErrors.first_name}</FieldError>
          </div>
          <div>
            <Label htmlFor="emp-lname">Last name</Label>
            <Input id="emp-lname" required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="Farooq" className="mt-1.5" aria-invalid={!!fieldErrors.last_name} />
            <FieldError>{fieldErrors.last_name}</FieldError>
          </div>
        </div>

        <div>
          <Label htmlFor="emp-email">Email address</Label>
          <Input id="emp-email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="hamza.farooq@shelteros.mock" className="mt-1.5" aria-invalid={!!fieldErrors.email} />
          <FieldError>{fieldErrors.email}</FieldError>
        </div>

        <div>
          <Label htmlFor="emp-password">Set a password</Label>
          <div className="relative mt-1.5">
            <Input id="emp-password" type={showPass ? 'text' : 'password'} required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number" className="pr-10" aria-invalid={!!fieldErrors.password} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">The employee signs in with this email and password — they can change it later from their profile.</p>
          <FieldError>{fieldErrors.password}</FieldError>
        </div>

        <div>
          <Label>Phone</Label>
          <div className="mt-1.5"><PhoneInput value={form.phone} onChange={(v) => set('phone', v)} error={fieldErrors.phone} /></div>
          <FieldError>{fieldErrors.phone}</FieldError>
        </div>

        <div>
          <Label htmlFor="emp-radius">Service radius (km)</Label>
          <Input id="emp-radius" type="number" min="1" max="200" value={form.service_radius_km} onChange={(e) => set('service_radius_km', e.target.value)} className="mt-1.5" />
        </div>

        <div>
          <Label>Skills</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SKILLS.map((skill) => <Pill key={skill} active={form.skills.includes(skill)} onClick={() => toggleSkill(skill)}>{skill.replace(/_/g, ' ')}</Pill>)}
          </div>
        </div>

        <div>
          <Label htmlFor="emp-bio">Short bio</Label>
          <Textarea id="emp-bio" value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={2} placeholder="A note about this employee's role" className="mt-1.5" />
        </div>

        <Button type="submit" disabled={loading} className="mt-1 h-11 w-full">
          {loading ? 'Creating…' : 'Create employee account'}
        </Button>
      </form>
    </div>
  );
}
