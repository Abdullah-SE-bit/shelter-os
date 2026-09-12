'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HeartHandshake, Mail, Eye, EyeOff } from 'lucide-react';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import TermsConsent from '@/components/TermsConsent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const HOUSING = ['HOUSE', 'APARTMENT', 'CONDO', 'FARM', 'OTHER'];

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

export default function RegisterPage() {
  useDocumentTitle('Create Account');
  const [step, setStep] = useState(1); // 1: basics, 2: profile details, 3: success
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', dob: '' });
  const [details, setDetails] = useState({
    phone: '', address: '', city: '',
    housing_type: 'HOUSE', has_other_pets: false, household_info: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setFieldErrors((fe) => ({ ...fe, [k]: undefined })); };
  const setD = (k, v) => { setDetails((d) => ({ ...d, [k]: v })); setFieldErrors((fe) => ({ ...fe, [k]: undefined })); };

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
    if (details.phone && !isValidPkMobile(details.phone)) errs.phone = 'Enter a valid Pakistani mobile number.';
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

              <Button type="submit" className="mt-1 h-11 w-full">Continue</Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center text-sm font-semibold text-foreground">A few more details</p>
              <p className="-mt-2 text-center text-xs text-muted-foreground">
                You'll be able to both browse & adopt animals and register your own pets from your account.
              </p>

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

              <TermsConsent checked={agreed} onChange={setAgreed} id="register-terms" />

              <div className="mt-1 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => { setStep(1); setError(''); }} className="flex-1">Back</Button>
                <Button type="submit" disabled={loading || !agreed} className="flex-[2]">
                  {loading ? 'Creating account…' : 'Create account'}
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
