'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PawPrint, Heart, HeartHandshake, Stethoscope, Mail, Eye, EyeOff, Check, X, Lock } from 'lucide-react';
import { mockShelters } from '@/lib/mock-data/shelters';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import TermsConsent from '@/components/TermsConsent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const ROLES = [
  { value: 'ADOPTER', icon: Heart, label: 'Adopter', desc: 'I want to adopt an animal' },
  { value: 'PET_OWNER', icon: PawPrint, label: 'Pet Owner', desc: 'I already own pets' },
  { value: 'EMPLOYEE', icon: HeartHandshake, label: 'Employee', desc: 'I want to help rescue animals' },
  { value: 'VET', icon: Stethoscope, label: 'Veterinarian', desc: 'I provide medical care' },
];

const SKILLS = ['RESCUE', 'TRANSPORT', 'FOSTERING', 'FUNDRAISING', 'MEDICAL_ASSIST', 'EVENT_SUPPORT'];
const HOUSING = ['HOUSE', 'APARTMENT', 'CONDO', 'FARM', 'OTHER'];

const SPECIALIZATIONS = [
  'General Medicine', 'Surgery', 'Internal Medicine', 'Dermatology', 'Dentistry',
  'Cardiology', 'Ophthalmology', 'Oncology', 'Neurology', 'Nutrition', 'Behavior',
  'Emergency & Critical Care', 'Diagnostic Imaging / Radiology', 'Anesthesiology',
  'Reproduction / Theriogenology', 'Parasitology', 'Preventive Care & Vaccination', 'Infectious Diseases',
];

const validateEmail = (email) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'Please enter a valid email address');

const selectClass = cn(
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none',
  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  'dark:bg-input/30',
);

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

export default function RegisterPage() {
  useDocumentTitle('Create Account');
  const [step, setStep] = useState(1); // 1: basics + role, 2: role details, 3: success
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', dob: '', role: 'ADOPTER' });
  const [details, setDetails] = useState({
    shelter_id: '', service_radius_km: 10, bio: '', skills: [],
    reg_digits: '', reg_len: 3, practice_type: 'CLINIC',
    clinic_name: '', clinic_location: '', clinic_registration_number: '',
    specializations: [], custom_specialization: '',
    housing_type: 'HOUSE', has_other_pets: false, household_info: '',
    phone: '', address: '', city: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setFieldErrors((fe) => ({ ...fe, [k]: undefined })); };
  const setD = (k, v) => { setDetails((d) => ({ ...d, [k]: v })); setFieldErrors((fe) => ({ ...fe, [k]: undefined })); };

  const shelters = mockShelters;

  const toggleSpecialization = (spec) => {
    setDetails((d) => ({
      ...d,
      specializations: d.specializations.includes(spec) ? d.specializations.filter((s) => s !== spec) : [...d.specializations, spec],
    }));
    setFieldErrors((fe) => ({ ...fe, specializations: undefined }));
  };

  const addCustomSpecialization = () => {
    const val = details.custom_specialization.trim();
    if (!val) return;
    setDetails((d) => ({
      ...d,
      specializations: d.specializations.includes(val) ? d.specializations : [...d.specializations, val],
      custom_specialization: '',
    }));
    setFieldErrors((fe) => ({ ...fe, specializations: undefined }));
  };

  const regNumber = () => (details.reg_digits ? `RVMP${details.reg_digits}` : '');
  const toggleSkill = (skill) => {
    setDetails((d) => ({ ...d, skills: d.skills.includes(skill) ? d.skills.filter((s) => s !== skill) : [...d.skills, skill] }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.';
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.dob) {
      const dob = new Date(form.dob);
      if (dob >= new Date()) errs.dob = 'Date of birth must be in the past.';
    }
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (form.role === 'EMPLOYEE') {
      if (!details.shelter_id) errs.shelter_id = 'Please select a shelter to join.';
    } else if (form.role === 'VET') {
      const digits = details.reg_digits.trim();
      if (!digits) errs.registration_number = 'Registration number is required.';
      else if (digits.length !== Number(details.reg_len) || !/^\d+$/.test(digits)) errs.registration_number = `Enter exactly ${details.reg_len} digits after RVMP.`;
      if (details.practice_type === 'CLINIC') {
        if (!details.clinic_location.trim()) errs.clinic_location = 'Clinic location is required.';
        if (!details.clinic_registration_number.trim()) errs.clinic_registration_number = 'Clinic registration number is required.';
      } else if (details.practice_type === 'SHELTER' && !details.shelter_id) {
        errs.shelter_id = 'Please select the shelter you will work at.';
      }
      if (details.specializations.length === 0) errs.specializations = 'Select at least one specialization.';
    } else if (form.role === 'PET_OWNER') {
      if (details.phone && !isValidPkMobile(details.phone)) errs.phone = 'Enter a valid Pakistani mobile number.';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length) { setFieldErrors(errs); return; }
      setStep(2);
      return;
    }
    const errs = validateStep2();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    if (!agreed) { setError('Please accept the Terms & Conditions and Licensing Agreement to create your account.'); return; }

    // Pure UI playground — no backend, so "registering" just advances to the
    // confirmation screen after a brief, realistic pause.
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(3); }, 400);
  };

  if (step === 3) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-highlight-mint/20 text-primary">
            <Mail className="size-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Check your inbox!</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We sent a verification link to <strong className="text-primary">{form.email}</strong>. Click it to activate your account.
          </p>
          {form.role === 'VET' && (
            <div className="mt-4 rounded-lg border border-border bg-surface-muted p-4 text-left text-sm leading-relaxed text-muted-foreground">
              <Stethoscope className="mb-1.5 size-4 text-primary" />
              Your registration request has been sent to a <strong className="text-foreground">Super Admin</strong> and
              then a <strong className="text-foreground">Shelter Admin</strong> for approval. After verifying your
              email you can log in, but vet features stay locked until both approve your request.
            </div>
          )}
          <Button asChild className="mt-6 w-full">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-[500px] rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HeartHandshake className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Join Shelter OS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Help us care for every animal</p>
        </div>

        <div className="mb-7 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn('flex size-7 items-center justify-center rounded-full text-xs font-bold', step >= s ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface-muted text-muted-foreground')}>{s}</div>
              {s < 2 && <div className={cn('h-0.5 w-10', step > s ? 'bg-primary' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="reg-fname">First name</Label>
                  <Input id="reg-fname" required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="Emma" className="mt-1.5" aria-invalid={!!fieldErrors.first_name} />
                  <FieldError>{fieldErrors.first_name}</FieldError>
                </div>
                <div>
                  <Label htmlFor="reg-lname">Last name</Label>
                  <Input id="reg-lname" required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="Watson" className="mt-1.5" aria-invalid={!!fieldErrors.last_name} />
                  <FieldError>{fieldErrors.last_name}</FieldError>
                </div>
              </div>

              <div>
                <Label htmlFor="reg-email">Email address</Label>
                <Input id="reg-email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" className="mt-1.5" aria-invalid={!!fieldErrors.email} />
                {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : <p className="mt-1 text-xs text-muted-foreground">Any valid email works — school, work, or personal.</p>}
              </div>

              <div>
                <Label htmlFor="reg-dob">Date of birth</Label>
                <Input id="reg-dob" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} className="mt-1.5" max={new Date().toISOString().split('T')[0]} aria-invalid={!!fieldErrors.dob} />
                <FieldError>{fieldErrors.dob}</FieldError>
              </div>

              <div>
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative mt-1.5">
                  <Input id="reg-password" type={showPass ? 'text' : 'password'} required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number" className="pr-10" aria-invalid={!!fieldErrors.password} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FieldError>{fieldErrors.password}</FieldError>
              </div>

              <p className="mt-1 text-sm font-semibold text-foreground">I am joining as a…</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button key={r.value} type="button" onClick={() => set('role', r.value)} className={cn('rounded-xl border-2 p-3.5 text-left transition-colors', form.role === r.value ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-border-strong')}>
                    <r.icon className={cn('mb-1.5 size-5', form.role === r.value ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="text-sm font-bold text-foreground">{r.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{r.desc}</div>
                  </button>
                ))}
              </div>

              <Button type="submit" className="mt-1 h-11 w-full">Continue to role details</Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center text-sm font-semibold text-foreground">{ROLES.find((r) => r.value === form.role)?.label} details</p>

              {form.role === 'EMPLOYEE' && (
                <>
                  <div>
                    <Label>Shelter to join *</Label>
                    <select value={details.shelter_id} onChange={(e) => setD('shelter_id', e.target.value)} className={cn(selectClass, 'mt-1.5')}>
                      <option value="">Select a shelter…</option>
                      {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}</option>)}
                    </select>
                    <FieldError>{fieldErrors.shelter_id}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="reg-radius">Service radius (km)</Label>
                    <Input id="reg-radius" type="number" min="1" max="200" value={details.service_radius_km} onChange={(e) => setD('service_radius_km', e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Skills</Label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {SKILLS.map((skill) => <Pill key={skill} active={details.skills.includes(skill)} onClick={() => toggleSkill(skill)}>{skill.replace(/_/g, ' ')}</Pill>)}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reg-bio">Short bio</Label>
                    <Textarea id="reg-bio" value={details.bio} onChange={(e) => setD('bio', e.target.value)} rows={2} placeholder="Tell us a bit about yourself" className="mt-1.5" />
                  </div>
                </>
              )}

              {form.role === 'VET' && (
                <>
                  <div>
                    <Label>Registration number *</Label>
                    <div className="mt-1.5 mb-2 flex gap-2">
                      {[3, 5].map((len) => (
                        <label key={len} className={cn('flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', Number(details.reg_len) === len ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground')}>
                          <input type="radio" checked={Number(details.reg_len) === len} onChange={() => { setD('reg_len', len); setD('reg_digits', ''); }} className="size-3.5" />
                          {len} digits
                        </label>
                      ))}
                    </div>
                    <div className="flex items-stretch">
                      <span className="flex items-center rounded-l-md border border-r-0 border-input bg-surface-muted px-3 text-sm font-bold tracking-wide text-primary">RVMP</span>
                      <Input value={details.reg_digits} onChange={(e) => setD('reg_digits', e.target.value.replace(/\D/g, '').slice(0, Number(details.reg_len)))} inputMode="numeric" placeholder={'0'.repeat(Number(details.reg_len))} className="rounded-l-none" aria-invalid={!!fieldErrors.registration_number} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Your registration number — "RVMP" then {details.reg_len} digits{details.reg_digits ? ` → ${regNumber()}` : ''}.</p>
                    <FieldError>{fieldErrors.registration_number}</FieldError>
                  </div>

                  <div>
                    <Label>Where will you practise? *</Label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {[{ value: 'CLINIC', label: 'At a clinic' }, { value: 'SHELTER', label: 'At a shelter' }].map((opt) => (
                        <button type="button" key={opt.value} onClick={() => setD('practice_type', opt.value)} className={cn('rounded-xl border-2 py-3 text-center text-sm font-bold transition-colors', details.practice_type === opt.value ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-border-strong')}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {details.practice_type === 'CLINIC' && (
                    <>
                      <div>
                        <Label htmlFor="reg-clinic-name">Clinic name</Label>
                        <Input id="reg-clinic-name" value={details.clinic_name} onChange={(e) => setD('clinic_name', e.target.value)} placeholder="Happy Paws Veterinary Clinic" className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="reg-clinic-loc">Clinic location *</Label>
                        <Input id="reg-clinic-loc" value={details.clinic_location} onChange={(e) => setD('clinic_location', e.target.value)} placeholder="Street, area, city" className="mt-1.5" aria-invalid={!!fieldErrors.clinic_location} />
                        <FieldError>{fieldErrors.clinic_location}</FieldError>
                      </div>
                      <div>
                        <Label htmlFor="reg-clinic-reg">Clinic registration number *</Label>
                        <Input id="reg-clinic-reg" value={details.clinic_registration_number} onChange={(e) => setD('clinic_registration_number', e.target.value)} placeholder="Official clinic registration / license no." className="mt-1.5" aria-invalid={!!fieldErrors.clinic_registration_number} />
                        <FieldError>{fieldErrors.clinic_registration_number}</FieldError>
                      </div>
                    </>
                  )}

                  {details.practice_type === 'SHELTER' && (
                    <div>
                      <Label>Shelter you will work at *</Label>
                      <select value={details.shelter_id} onChange={(e) => setD('shelter_id', e.target.value)} className={cn(selectClass, 'mt-1.5')}>
                        <option value="">Select a shelter…</option>
                        {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}</option>)}
                      </select>
                      <FieldError>{fieldErrors.shelter_id}</FieldError>
                    </div>
                  )}

                  <div>
                    <Label>Specializations *</Label>
                    <div className="mt-1.5 mb-2 flex flex-wrap gap-1.5">
                      {SPECIALIZATIONS.map((spec) => {
                        const on = details.specializations.includes(spec);
                        return (
                          <button type="button" key={spec} onClick={() => toggleSpecialization(spec)} className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-border-strong')}>
                            {on && <Check className="size-3" />}
                            {spec}
                          </button>
                        );
                      })}
                    </div>
                    {details.specializations.filter((s) => !SPECIALIZATIONS.includes(s)).length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {details.specializations.filter((s) => !SPECIALIZATIONS.includes(s)).map((spec) => (
                          <button type="button" key={spec} onClick={() => toggleSpecialization(spec)} className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                            <X className="size-3" />
                            {spec}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input value={details.custom_specialization} onChange={(e) => setD('custom_specialization', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSpecialization(); } }} placeholder="Add another specialization…" className="flex-1" />
                      <Button type="button" variant="secondary" onClick={addCustomSpecialization}>Add</Button>
                    </div>
                    <FieldError>{fieldErrors.specializations}</FieldError>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-muted p-3 text-xs leading-relaxed text-muted-foreground">
                    <Lock className="mt-0.5 size-3.5 shrink-0" />
                    Your request will be reviewed by a <strong className="text-foreground">&nbsp;Super Admin&nbsp;</strong> and then a
                    <strong className="text-foreground">&nbsp;Shelter Admin</strong>. You can log in right away, but vet features stay locked until both approve.
                  </div>
                </>
              )}

              {form.role === 'ADOPTER' && (
                <>
                  <div>
                    <Label>Housing type</Label>
                    <select value={details.housing_type} onChange={(e) => setD('housing_type', e.target.value)} className={cn(selectClass, 'mt-1.5')}>
                      {HOUSING.map((h) => <option key={h} value={h}>{h.charAt(0) + h.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                    <Checkbox checked={details.has_other_pets} onCheckedChange={(v) => setD('has_other_pets', v)} />
                    I have other pets at home
                  </label>
                  <div>
                    <Label htmlFor="reg-household">Household info</Label>
                    <Textarea id="reg-household" value={details.household_info} onChange={(e) => setD('household_info', e.target.value)} rows={2} placeholder="Who lives in your home? Any children?" className="mt-1.5" />
                  </div>
                </>
              )}

              {form.role === 'PET_OWNER' && (
                <>
                  <div>
                    <Label>Phone</Label>
                    <div className="mt-1.5"><PhoneInput value={details.phone} onChange={(v) => setD('phone', v)} error={fieldErrors.phone} /></div>
                    <FieldError>{fieldErrors.phone}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="reg-address">Address</Label>
                    <Input id="reg-address" value={details.address} onChange={(e) => setD('address', e.target.value)} placeholder="Street address" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="reg-city">City</Label>
                    <Input id="reg-city" value={details.city} onChange={(e) => setD('city', e.target.value)} placeholder="City" className="mt-1.5" />
                  </div>
                </>
              )}

              <TermsConsent checked={agreed} onChange={setAgreed} id="register-terms" />

              <div className="mt-1 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => { setStep(1); setError(''); }} className="flex-1">Back</Button>
                <Button type="submit" disabled={loading || !agreed} className="flex-[2]">
                  {loading ? (form.role === 'VET' ? 'Sending request…' : 'Creating account…') : (form.role === 'VET' ? 'Send registration request' : 'Create account')}
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="font-semibold text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
