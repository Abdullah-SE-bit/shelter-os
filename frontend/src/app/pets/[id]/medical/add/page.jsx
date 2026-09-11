'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Stethoscope, Syringe, Scissors, Pill, Smile, FlaskConical, Siren, ClipboardList, Paperclip, FileText, Image as ImageIcon, Lock, X } from 'lucide-react';
import PageHeader from '@/components/patterns/PageHeader';
import StepIndicator from '@/components/patterns/StepIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const RECORD_TYPES = [
  { id: 'CHECKUP', icon: Stethoscope, label: 'Checkup', desc: 'Routine health examination' },
  { id: 'VACCINATION', icon: Syringe, label: 'Vaccination', desc: 'Vaccine administration' },
  { id: 'SURGERY', icon: Scissors, label: 'Surgery', desc: 'Surgical procedure' },
  { id: 'TREATMENT', icon: Pill, label: 'Treatment', desc: 'Medical treatment / medication' },
  { id: 'DENTAL', icon: Smile, label: 'Dental', desc: 'Dental care procedure' },
  { id: 'DIAGNOSTIC', icon: FlaskConical, label: 'Diagnostic', desc: 'Tests, bloodwork, X-ray' },
  { id: 'EMERGENCY', icon: Siren, label: 'Emergency', desc: 'Emergency care' },
  { id: 'FOLLOW_UP', icon: ClipboardList, label: 'Follow-up', desc: 'Post-treatment follow-up' },
];

export default function AddMedicalRecordPage() {
  const { id: petId } = useParams();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ record_type: '', date: new Date().toISOString().split('T')[0], vet_name: '', clinic_name: '', diagnosis: '', treatment: '', notes: '', follow_up_date: '', cost: '', is_confidential: false });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.record_type) { setError('Please select a record type.'); setStep(1); return; }
    setLoading(true); setError('');
    setTimeout(() => { setLoading(false); router.push(`/pets/${petId}/medical`); }, 400);
  };

  const selectedType = RECORD_TYPES.find((r) => r.id === form.record_type);

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title="Add medical record" backTo={`/pets/${petId}/medical`} backLabel="Medical history" />

      <StepIndicator step={step} labels={['Record type', 'Clinical details', 'Attachments']} />

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}

      <form
        onSubmit={step < 3 ? (e) => { e.preventDefault(); if (step === 1 && !form.record_type) { setError('Please select a record type.'); return; } setError(''); setStep((s) => s + 1); } : handleSubmit}
        className="flex flex-col gap-5"
      >
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Choose record type</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {RECORD_TYPES.map((rt) => (
                  <button
                    key={rt.id}
                    type="button"
                    onClick={() => { set('record_type', rt.id); setError(''); }}
                    className={cn('flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors', form.record_type === rt.id ? 'border-primary bg-primary/5' : 'border-border bg-surface-muted')}
                  >
                    <rt.icon className={cn('size-6 shrink-0', form.record_type === rt.id ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.75} />
                    <div>
                      <div className={cn('text-sm font-bold', form.record_type === rt.id ? 'text-primary' : 'text-foreground')}>{rt.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{rt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <>
            <Card>
              <CardHeader><CardTitle>Clinical details</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Date *</Label><Input required type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="mt-1.5" /></div>
                  <div><Label>Follow-up date</Label><Input type="date" value={form.follow_up_date} onChange={(e) => set('follow_up_date', e.target.value)} className="mt-1.5" /></div>
                  <div><Label>Veterinarian</Label><Input value={form.vet_name} onChange={(e) => set('vet_name', e.target.value)} placeholder="Dr. Ahmed" className="mt-1.5" /></div>
                  <div><Label>Clinic / hospital</Label><Input value={form.clinic_name} onChange={(e) => set('clinic_name', e.target.value)} placeholder="City Vet Clinic" className="mt-1.5" /></div>
                  <div><Label>Cost (PKR)</Label><Input type="number" min="0" value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="0" className="mt-1.5" /></div>
                </div>
                <div><Label>Diagnosis</Label><Textarea value={form.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} rows={3} placeholder="What was found / diagnosed?" className="mt-1.5" /></div>
                <div><Label>Treatment / procedure</Label><Textarea value={form.treatment} onChange={(e) => set('treatment', e.target.value)} rows={3} placeholder="What was done / prescribed?" className="mt-1.5" /></div>
                <div><Label>Additional notes</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Any other relevant information…" className="mt-1.5" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox checked={form.is_confidential} onCheckedChange={(v) => set('is_confidential', !!v)} className="mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Lock className="size-3.5" />Mark as confidential</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Only admins and vets can view this record</div>
                  </div>
                </label>
              </CardContent>
            </Card>
          </>
        )}

        {step === 3 && (
          <Card>
            <CardHeader><CardTitle>Attachments (optional)</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">Upload lab results, X-rays, prescriptions, or any relevant documents.</p>

              <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 text-center text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5">
                <Paperclip className="size-8" strokeWidth={1.5} />
                <span className="text-sm font-bold text-foreground">{files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload files'}</span>
                <span className="text-xs">PDF, JPG, PNG — up to 5 files, 10MB each</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))} />
              </label>

              {files.length > 0 && (
                <div className="mt-3.5 flex flex-col gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-lg bg-surface-muted px-3.5 py-2">
                      {f.type.includes('pdf') ? <FileText className="size-4 shrink-0 text-muted-foreground" /> : <ImageIcon className="size-4 shrink-0 text-muted-foreground" />}
                      <span className="flex-1 truncate text-[13px] font-semibold text-foreground">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <h4 className="mb-2.5 text-xs font-bold tracking-wide text-primary uppercase">Record summary</h4>
                {[
                  { label: 'Type', value: selectedType?.label },
                  { label: 'Date', value: form.date },
                  { label: 'Vet', value: form.vet_name || '—' },
                  { label: 'Clinic', value: form.clinic_name || '—' },
                  { label: 'Confidential', value: form.is_confidential ? 'Yes' : 'No' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-0.5 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{label}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          {step > 1 && <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)} className="h-11 flex-1">Back</Button>}
          <Button type="submit" disabled={loading} className="h-11 flex-[2]">{step < 3 ? 'Next' : loading ? 'Saving…' : 'Add record'}</Button>
        </div>
      </form>
    </div>
  );
}
