'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Pill, Plus } from 'lucide-react';
import { mockMedications, byCat } from '@/lib/mock-data/medical';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const FREQ_LABELS = { ONCE: 'Once', DAILY: 'Daily', TWICE_DAILY: 'Twice daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', AS_NEEDED: 'As needed' };

const isActive = (med) => !med.end_date || new Date(med.end_date) >= new Date();

export default function MedicationsPage() {
  const { id: catId } = useParams();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [medications, setMedications] = useState(() => byCat(mockMedications, catId));
  const [form, setForm] = useState({ medication_name: '', dosage: '', frequency: 'DAILY', start_date: new Date().toISOString().split('T')[0], end_date: '', reason: '', prescribing_vet: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const canAdd = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'].includes(user?.role);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setMedications((m) => [{ id: `med-${Date.now()}`, cat: catId, ...form }, ...m]);
      setAddOpen(false);
      setSaving(false);
    }, 350);
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Medications"
        backTo={`/cats/${catId}`}
        backLabel="Animal profile"
        actions={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add</Button>}
      />

      {medications.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3.5">
          <div className="rounded-xl bg-gradient-to-br from-[var(--brand-rust)] to-[var(--brand-ink)] p-4 text-center text-white">
            <div className="text-[32px] leading-none font-black">{medications.filter(isActive).length}</div>
            <div className="mt-1 text-xs font-bold tracking-wide uppercase opacity-85">Active</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-[32px] leading-none font-black text-muted-foreground">{medications.filter((m) => !isActive(m)).length}</div>
            <div className="mt-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">Completed</div>
          </div>
        </div>
      )}

      {medications.length === 0 && (
        <EmptyState icon={Pill} title="No medications" message="No medications on record for this animal."
          action={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add medication</Button>} />
      )}

      {medications.length > 0 && (
        <div className="flex flex-col gap-3">
          {[...medications].sort((a, b) => isActive(b) - isActive(a)).map((med) => {
            const active = isActive(med);
            return (
              <div key={med.id} className={cn('flex items-start gap-4 rounded-xl border bg-card p-5', active ? 'border-primary/25' : 'border-border opacity-65')}>
                <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', active ? 'bg-primary/10' : 'bg-surface-muted')}>
                  <Pill className={cn('size-5', active ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2.5">
                    <h4 className="text-[15px] font-bold text-foreground">{med.medication_name}</h4>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', active ? 'bg-primary/10 text-primary' : 'bg-surface-muted text-muted-foreground')}>{active ? 'Active' : 'Completed'}</span>
                  </div>
                  <div className="flex flex-wrap gap-3.5 text-xs text-muted-foreground">
                    {med.dosage && <span>{med.dosage}</span>}
                    {med.frequency && <span>{FREQ_LABELS[med.frequency] || med.frequency}</span>}
                    <span>{formatDate(med.start_date)}{med.end_date ? ` → ${formatDate(med.end_date)}` : ' (ongoing)'}</span>
                    {med.prescribing_vet && <span>Dr. {med.prescribing_vet}</span>}
                  </div>
                  {med.reason && <p className="mt-1.5 text-sm text-muted-foreground">Reason: {med.reason}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add medication"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button form="med-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add medication'}</Button></>}
      >
        <form id="med-form" onSubmit={handleSave} className="flex flex-col gap-3.5">
          <div><Label>Medication name *</Label><Input required value={form.medication_name} onChange={(e) => set('medication_name', e.target.value)} placeholder="e.g. Amoxicillin, Prednisolone…" className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Dosage</Label><Input value={form.dosage} onChange={(e) => set('dosage', e.target.value)} placeholder="e.g. 50mg, 2ml" className="mt-1.5" /></div>
            <div>
              <Label>Frequency</Label>
              <NativeSelect value={form.frequency} onChange={(e) => set('frequency', e.target.value)} className="mt-1.5">
                {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
            </div>
            <div><Label>Start date *</Label><Input required type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className="mt-1.5" /></div>
            <div><Label>End date</Label><Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} className="mt-1.5" /></div>
            <div><Label>Prescribing vet</Label><Input value={form.prescribing_vet} onChange={(e) => set('prescribing_vet', e.target.value)} className="mt-1.5" /></div>
            <div><Label>Reason</Label><Input value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Why is this prescribed?" className="mt-1.5" /></div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
