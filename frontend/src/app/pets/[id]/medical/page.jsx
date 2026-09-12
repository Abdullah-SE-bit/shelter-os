'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Stethoscope, Thermometer, Bandage, Scissors, Smile, FileText, Syringe, Siren, Plus, TriangleAlert, CalendarClock } from 'lucide-react';
import { mockMedicalRecords, byPet } from '@/lib/mock-data/medical';
import { getPetById } from '@/lib/mock-data/pets';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';

const RECORD_ICONS = { CHECKUP: Stethoscope, ILLNESS: Thermometer, INJURY: Bandage, SURGERY: Scissors, DENTAL: Smile, VACCINATION: Syringe, EMERGENCY: Siren, FOLLOW_UP: CalendarClock, OTHER: FileText };
const RECORD_TYPE_OPTIONS = ['CHECKUP', 'VACCINATION', 'ILLNESS', 'INJURY', 'SURGERY', 'DENTAL', 'EMERGENCY', 'FOLLOW_UP', 'OTHER'];

const pad2 = (n) => String(n).padStart(2, '0');
const toLocalInputValue = (d) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
};

export default function MedicalHistoryPage() {
  const { id: petId } = useParams();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [records, setRecords] = useState(() => byPet(mockMedicalRecords, petId));

  const pet = getPetById(petId);
  const isUntreatable = ['LOST', 'DECEASED'].includes(pet?.current_status);
  const canAdd = ['SUPER_ADMIN', 'SHELTER_ADMIN'].includes(user?.role) && !isUntreatable;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Medical history"
        backTo={`/pets/${petId}`}
        backLabel="Animal profile"
        actions={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add record</Button>}
      />

      {isUntreatable && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3.5 text-sm font-medium text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>This animal is marked as <strong>{(pet?.current_status || '').toLowerCase()}</strong>, so new medical records can't be added.</span>
        </div>
      )}

      {records.length === 0 && (
        <EmptyState icon={Stethoscope} title="No medical records" message="No medical records found for this animal. Add the first record!"
          action={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add medical record</Button>} />
      )}

      {records.length > 0 && (
        <div className="relative">
          <div className="absolute top-5 bottom-5 left-[19px] w-px bg-gradient-to-b from-primary/40 to-transparent" />
          <div className="flex flex-col gap-4">
            {records.map((rec, i) => {
              const Icon = RECORD_ICONS[rec.record_type] || FileText;
              return (
                <div key={rec.id} className="flex items-start gap-5">
                  <div className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 shadow-sm ${i === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}>
                    <Icon className="size-4.5" />
                  </div>
                  <div className="flex-1 rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-highlight-mint/20 px-2 py-0.5 text-[11px] font-bold tracking-wide text-primary uppercase">{rec.record_type}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(rec.occurred_at)}</span>
                      </div>
                      {rec.vet_name && <span className="shrink-0 text-xs text-muted-foreground">Dr. {rec.vet_name}</span>}
                    </div>

                    <p className="mb-2 text-[15px] leading-relaxed text-foreground">{rec.description}</p>

                    {rec.treatment && (
                      <div className="mt-2 rounded-lg bg-surface-muted px-3 py-2">
                        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Treatment: </span>
                        <span className="text-sm text-foreground">{rec.treatment}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AddMedicalRecordModal open={addOpen} petId={petId} onClose={() => setAddOpen(false)} onSaved={(rec) => { setAddOpen(false); setRecords((r) => [rec, ...r]); }} />
    </div>
  );
}

function AddMedicalRecordModal({ open, petId, onClose, onSaved }) {
  const [form, setForm] = useState({ record_type: 'CHECKUP', occurred_at: toLocalInputValue(new Date()), description: '', treatment: '', diagnosis: '', vet_name: '', cost: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSaved({ id: `mr-${Date.now()}`, pet: petId, ...form, occurred_at: new Date(form.occurred_at).toISOString() });
      setSaving(false);
    }, 350);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add medical record" size="md"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="add-medical-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save record'}</Button></>}
    >
      <form id="add-medical-form" onSubmit={handleSave} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Record type</Label>
            <NativeSelect value={form.record_type} onChange={(e) => set('record_type', e.target.value)} className="mt-1.5">
              {RECORD_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label>Date &amp; time *</Label>
            <Input type="datetime-local" required value={form.occurred_at} onChange={(e) => set('occurred_at', e.target.value)} className="mt-1.5" />
          </div>
        </div>
        <div>
          <Label>Description *</Label>
          <Textarea required value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="What happened? What was observed?" className="mt-1.5" />
        </div>
        <div>
          <Label>Diagnosis</Label>
          <Input value={form.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} placeholder="Condition diagnosed" className="mt-1.5" />
        </div>
        <div>
          <Label>Treatment</Label>
          <Input value={form.treatment} onChange={(e) => set('treatment', e.target.value)} placeholder="Medications, procedures, etc." className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Vet name</Label>
            <Input value={form.vet_name} onChange={(e) => set('vet_name', e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Cost (PKR)</Label>
            <Input type="number" value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="1500" className="mt-1.5" />
          </div>
        </div>
      </form>
    </Modal>
  );
}
