'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, Home as HomeIcon, Cat, Briefcase, ClipboardList, LifeBuoy } from 'lucide-react';
import PageHeader from '@/components/patterns/PageHeader';
import StepIndicator from '@/components/patterns/StepIndicator';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect } from '@/components/ui/native-select';

const INCOME_OPTS = ['EMPLOYED', 'SELF_EMPLOYED', 'STUDENT', 'RETIRED', 'UNEMPLOYED', 'OTHER'];
const HOUSING_OPTS = ['HOUSE', 'APARTMENT', 'CONDO', 'OTHER'];

export default function ApplicationFormPage() {
  const { catId } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    cat: catId, motivation: '', living_situation: 'HOUSE', has_outdoor_access: false, has_other_pets: false,
    other_pets_details: '', has_children: false, children_ages: '', experience_with_cats: '', employment_status: 'EMPLOYED',
    monthly_income: '', vet_reference: '', personal_reference: '', emergency_contact_name: '', emergency_contact_phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const goNext = (e) => {
    e.preventDefault();
    if (step === 2 && !isValidPkMobile(form.emergency_contact_phone)) {
      setError('Enter a valid Pakistani mobile number for the emergency contact (+92 3XX XXXXXXX).');
      return;
    }
    setError('');
    setStep((s) => s + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    setTimeout(() => { setLoading(false); router.push('/adoption/my-applications'); }, 400);
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title="Adoption application" description="Tell us about yourself and your home" backTo={`/adoption/${catId}`} backLabel="Animal profile" />

      <StepIndicator step={step} labels={['Your home', 'About you', 'Motivation']} />

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}

      <form onSubmit={step < 3 ? goNext : handleSubmit} className="flex flex-col gap-5">
        {step === 1 && (
          <>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><HomeIcon className="size-4" />Living situation</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <div>
                  <Label>Housing type</Label>
                  <NativeSelect value={form.living_situation} onChange={(e) => set('living_situation', e.target.value)} className="mt-1.5">
                    {HOUSING_OPTS.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                  </NativeSelect>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[{ key: 'has_outdoor_access', label: 'Has outdoor access' }, { key: 'has_other_pets', label: 'Has other pets' }, { key: 'has_children', label: 'Has children at home' }].map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
                      <Checkbox checked={form[key]} onCheckedChange={(v) => set(key, !!v)} />
                      {label}
                    </label>
                  ))}
                </div>
                {form.has_other_pets && (
                  <div><Label>Other pets details</Label><Input value={form.other_pets_details} onChange={(e) => set('other_pets_details', e.target.value)} placeholder="e.g. 1 dog (lab, very friendly), 2 cats" className="mt-1.5" /></div>
                )}
                {form.has_children && (
                  <div><Label>Children's ages</Label><Input value={form.children_ages} onChange={(e) => set('children_ages', e.target.value)} placeholder="e.g. 5, 8, 12" className="mt-1.5" /></div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Cat className="size-4" />Animal experience</CardTitle></CardHeader>
              <CardContent>
                <Label>Your experience with animals *</Label>
                <Textarea required value={form.experience_with_cats} onChange={(e) => set('experience_with_cats', e.target.value)} placeholder="Describe your past experience with pets, any training, etc." rows={3} className="mt-1.5" />
              </CardContent>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="size-4" />Employment &amp; income</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Employment status</Label>
                  <NativeSelect value={form.employment_status} onChange={(e) => set('employment_status', e.target.value)} className="mt-1.5">
                    {INCOME_OPTS.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                  </NativeSelect>
                </div>
                <div><Label>Monthly income (PKR)</Label><Input type="number" value={form.monthly_income} onChange={(e) => set('monthly_income', e.target.value)} placeholder="50000" className="mt-1.5" /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="size-4" />References</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <div><Label>Veterinarian reference</Label><Input value={form.vet_reference} onChange={(e) => set('vet_reference', e.target.value)} placeholder="Vet name and contact number" className="mt-1.5" /></div>
                <div><Label>Personal reference</Label><Input value={form.personal_reference} onChange={(e) => set('personal_reference', e.target.value)} placeholder="Name, relationship, phone" className="mt-1.5" /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="size-4" />Emergency contact</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div><Label>Name *</Label><Input required value={form.emergency_contact_name} onChange={(e) => set('emergency_contact_name', e.target.value)} placeholder="Jane Doe" className="mt-1.5" /></div>
                <div><Label>Phone *</Label><div className="mt-1.5"><PhoneInput value={form.emergency_contact_phone} onChange={(v) => set('emergency_contact_phone', v)} /></div></div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6 text-center">
                <Heart className="mx-auto mb-2 size-10 text-primary" />
                <h3 className="mb-1 text-lg font-bold text-foreground">Almost there!</h3>
                <p className="text-sm text-muted-foreground">Tell us why you want to adopt this animal.</p>
              </div>
              <Label>Why do you want to adopt? *</Label>
              <Textarea required value={form.motivation} onChange={(e) => set('motivation', e.target.value)} placeholder="Share your story — why this animal, what kind of home are you offering, what your daily life is like…" rows={6} className="mt-1.5" />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          {step > 1 && <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)} className="h-11 flex-1">Back</Button>}
          <Button type="submit" disabled={loading} className="h-11 flex-[2]">{step < 3 ? 'Next' : loading ? 'Submitting…' : 'Submit application'}</Button>
        </div>
      </form>
    </div>
  );
}
