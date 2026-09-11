'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Syringe, TriangleAlert, Clock, CheckCircle2, Plus, Circle } from 'lucide-react';
import { mockVaccinations, byPet } from '@/lib/mock-data/medical';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const CORE_VACCINES = ['FVRCP', 'Rabies', 'FeLV', 'FIV'];

const isOverdue = (dt) => dt && new Date(dt) < new Date();
const isDueSoon = (dt) => {
  if (!dt) return false;
  const diff = (new Date(dt) - new Date()) / 86400000;
  return diff >= 0 && diff <= 30;
};

export default function VaccinationsPage() {
  const { id: petId } = useParams();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [vaccinations, setVaccinations] = useState(() => byPet(mockVaccinations, petId));
  const [form, setForm] = useState({ vaccine_name: '', date_given: new Date().toISOString().split('T')[0], next_due_date: '', vet_name: '', batch_number: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const canAdd = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'].includes(user?.role);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setVaccinations((v) => [{ id: `vac-${Date.now()}`, pet: petId, ...form }, ...v]);
      setAddOpen(false);
      setSaving(false);
    }, 350);
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Vaccinations"
        backTo={`/pets/${petId}`}
        backLabel="Animal profile"
        actions={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add</Button>}
      />

      <div className="mb-6 grid grid-cols-4 gap-2.5">
        {CORE_VACCINES.map((v) => {
          const given = vaccinations.find((vac) => vac.vaccine_name?.includes(v));
          return (
            <div key={v} className={cn('rounded-xl border bg-card p-3 text-center', given ? 'border-success/40' : 'border-border')}>
              {given ? <Syringe className="mx-auto mb-1 size-6 text-success" /> : <Circle className="mx-auto mb-1 size-6 text-muted-foreground" strokeWidth={1.5} />}
              <div className={cn('text-xs font-bold', given ? 'text-success' : 'text-muted-foreground')}>{v}</div>
              {given && <div className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(given.date_given)}</div>}
            </div>
          );
        })}
      </div>

      {vaccinations.length === 0 && (
        <EmptyState icon={Syringe} title="No vaccinations recorded" message="Add vaccination records to track this animal's immunization history."
          action={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add vaccination</Button>} />
      )}

      {vaccinations.length > 0 && (
        <div className="flex flex-col gap-3">
          {vaccinations.map((vac) => {
            const overdue = isOverdue(vac.next_due_date);
            const soon = isDueSoon(vac.next_due_date);
            return (
              <div key={vac.id} className={cn('flex items-start gap-4 rounded-xl border bg-card p-5', overdue ? 'border-destructive/30' : soon ? 'border-warning/30' : 'border-border')}>
                <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', overdue ? 'bg-destructive/10' : 'bg-success/10')}>
                  <Syringe className={cn('size-5', overdue ? 'text-destructive' : 'text-success')} />
                </div>
                <div className="flex-1">
                  <h4 className="mb-0.5 text-[15px] font-bold text-foreground">{vac.vaccine_name}</h4>
                  <div className="flex flex-wrap gap-3.5 text-xs text-muted-foreground">
                    <span>Given: {formatDate(vac.date_given)}</span>
                    {vac.vet_name && <span>Dr. {vac.vet_name}</span>}
                    {vac.batch_number && <span>Batch {vac.batch_number}</span>}
                  </div>
                  {vac.next_due_date && (
                    <div className={cn('mt-1.5 flex items-center gap-1.5 text-[13px] font-bold', overdue ? 'text-destructive' : soon ? 'text-warning' : 'text-success')}>
                      {overdue ? <TriangleAlert className="size-3.5" /> : soon ? <Clock className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                      {overdue ? 'Overdue since' : soon ? 'Due soon:' : 'Next due:'} {formatDate(vac.next_due_date)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add vaccination"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button form="vac-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add vaccination'}</Button></>}
      >
        <form id="vac-form" onSubmit={handleSave} className="flex flex-col gap-3.5">
          <div>
            <Label>Vaccine name *</Label>
            <Input required list="vac-list" value={form.vaccine_name} onChange={(e) => set('vaccine_name', e.target.value)} placeholder="e.g. FVRCP, Rabies…" className="mt-1.5" />
            <datalist id="vac-list">{['FVRCP', 'Rabies', 'FeLV', 'FIV', 'Bordetella', 'Calicivirus'].map((v) => <option key={v} value={v} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date given *</Label><Input required type="date" value={form.date_given} onChange={(e) => set('date_given', e.target.value)} className="mt-1.5" /></div>
            <div><Label>Next due date</Label><Input type="date" value={form.next_due_date} onChange={(e) => set('next_due_date', e.target.value)} className="mt-1.5" /></div>
            <div><Label>Vet name</Label><Input value={form.vet_name} onChange={(e) => set('vet_name', e.target.value)} className="mt-1.5" /></div>
            <div><Label>Batch number</Label><Input value={form.batch_number} onChange={(e) => set('batch_number', e.target.value)} placeholder="Optional" className="mt-1.5" /></div>
          </div>
          <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => set('notes', e.target.value)} className="mt-1.5" /></div>
        </form>
      </Modal>
    </div>
  );
}
