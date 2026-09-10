import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Stethoscope, Thermometer, Bandage, Scissors, Smile, FileText, Syringe, Siren, Plus, TriangleAlert, CalendarClock } from 'lucide-react';
import { medicalApi } from '@/api/medicalApi';
import { catsApi } from '@/api/catsApi';
import { wellnessApi } from '@/api/wellnessApi';
import useApi from '@/hooks/useApi';
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
const APPT_TO_RECORD_TYPE = { CHECKUP: 'CHECKUP', VACCINATION: 'VACCINATION', SURGERY: 'SURGERY', FOLLOWUP: 'FOLLOW_UP', EMERGENCY: 'EMERGENCY' };
const RECORD_TYPE_OPTIONS = ['CHECKUP', 'VACCINATION', 'ILLNESS', 'INJURY', 'SURGERY', 'DENTAL', 'EMERGENCY', 'FOLLOW_UP', 'OTHER'];

const pad2 = (n) => String(n).padStart(2, '0');
const toLocalInputValue = (d) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
};

export default function MedicalHistoryPage() {
  const { id: catId } = useParams();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  const { data, loading, refetch } = useApi(() => medicalApi.listRecords(catId), null, [catId]);
  const records = data?.results || data || [];

  const { data: catData } = useApi(() => catsApi.get(catId), null, [catId]);
  const cat = catData?.data || catData;
  const isUntreatable = ['LOST', 'DECEASED'].includes(cat?.current_status);
  const canAdd = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'].includes(user?.role) && !isUntreatable;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Medical history"
        backTo={`/cats/${catId}`}
        backLabel="Cat profile"
        actions={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add record</Button>}
      />

      {isUntreatable && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3.5 text-sm font-medium text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>This cat is marked as <strong>{(cat?.current_status || '').toLowerCase()}</strong>, so new medical records can't be added. Update the cat's status first if this is no longer the case.</span>
        </div>
      )}

      {loading && <LoadingSpinner text="Loading medical records…" />}

      {!loading && records.length === 0 && (
        <EmptyState icon={Stethoscope} title="No medical records" message="No medical records found for this cat. Add the first record!"
          action={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add medical record</Button>} />
      )}

      {!loading && records.length > 0 && (
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
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold tracking-wide text-primary uppercase">{rec.record_type}</span>
                        {rec.appointment_type && (
                          <span className="rounded-full bg-info/10 px-2 py-0.5 text-[11px] font-bold tracking-wide text-info uppercase">{rec.appointment_type.replace(/_/g, ' ')} appointment</span>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDateTime(rec.occurred_at || rec.date)}</span>
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

                    {rec.next_appointment && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <CalendarClock className="size-3.5" />
                        Next: {formatDate(rec.next_appointment)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AddMedicalRecordModal open={addOpen} catId={catId} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); refetch(); }} />
    </div>
  );
}

function AddMedicalRecordModal({ open, catId, onClose, onSaved }) {
  const { user } = useAuth();
  const isVet = user?.role === 'VET';

  const { data: apptData } = useApi(() => wellnessApi.catAppointments(catId), { skip: !isVet }, [catId]);
  const allAppts = Array.isArray(apptData) ? apptData : (apptData?.results || []);
  const myAppts = isVet
    ? allAppts.filter((a) => String(a.vet) === String(user?.id) && a.status !== 'CANCELLED').sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
    : [];

  const [form, setForm] = useState({ cat: catId, appointment: '', record_type: 'CHECKUP', occurred_at: toLocalInputValue(new Date()), description: '', treatment: '', diagnosis: '', vet_name: '', cost: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectedAppt = myAppts.find((a) => a.id === form.appointment) || null;

  useEffect(() => {
    if (isVet && !form.appointment && myAppts.length > 0) {
      const appt = myAppts[0];
      const apptInFuture = new Date(appt.scheduled_at) > new Date();
      setForm((f) => ({ ...f, appointment: appt.id, record_type: APPT_TO_RECORD_TYPE[appt.appointment_type] || f.record_type, occurred_at: apptInFuture ? toLocalInputValue(appt.scheduled_at) : f.occurred_at }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVet, myAppts.length]);

  const onPickAppointment = (id) => {
    const appt = myAppts.find((a) => a.id === id);
    setForm((f) => {
      const next = { ...f, appointment: id };
      if (appt) {
        next.record_type = APPT_TO_RECORD_TYPE[appt.appointment_type] || f.record_type;
        if (!f.occurred_at || new Date(f.occurred_at) < new Date(appt.scheduled_at)) next.occurred_at = toLocalInputValue(appt.scheduled_at);
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (isVet && myAppts.length === 0) { setError("You have no appointment booked with this cat, so you can't add a medical record."); return; }
    if (selectedAppt && form.occurred_at && new Date(form.occurred_at) < new Date(selectedAppt.scheduled_at)) {
      setError(`The record date & time can't be before the appointment time (${formatDateTime(selectedAppt.scheduled_at)}).`);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.occurred_at) payload.occurred_at = new Date(payload.occurred_at).toISOString();
      if (!payload.appointment) delete payload.appointment;
      await medicalApi.createRecord(catId, payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save record. Please try again.');
    }
    setSaving(false);
  };

  const minDateTime = selectedAppt ? toLocalInputValue(selectedAppt.scheduled_at) : undefined;

  return (
    <Modal open={open} onClose={onClose} title="Add medical record" size="md"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="add-medical-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save record'}</Button></>}
    >
      {error && <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
      <form id="add-medical-form" onSubmit={handleSave} className="flex flex-col gap-3.5">
        {isVet && (
          <div>
            <Label>Appointment *</Label>
            {myAppts.length === 0 ? (
              <div className="mt-1.5 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2.5 text-sm font-medium text-warning">You have no appointment booked with this cat, so a record can't be added.</div>
            ) : (
              <>
                <NativeSelect required value={form.appointment} onChange={(e) => onPickAppointment(e.target.value)} className="mt-1.5">
                  {myAppts.map((a) => <option key={a.id} value={a.id}>{(a.appointment_type || '').replace(/_/g, ' ')} — {formatDateTime(a.scheduled_at)} · {a.status}</option>)}
                </NativeSelect>
                {selectedAppt && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Documenting the <strong>{(selectedAppt.appointment_type || '').replace(/_/g, ' ')}</strong> appointment scheduled for <strong>{formatDateTime(selectedAppt.scheduled_at)}</strong>. The record can't be dated before then.</p>
                )}
              </>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Record type</Label>
            <NativeSelect value={form.record_type} onChange={(e) => set('record_type', e.target.value)} className="mt-1.5">
              {RECORD_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label>Date &amp; time *</Label>
            <Input type="datetime-local" required value={form.occurred_at} min={minDateTime} onChange={(e) => set('occurred_at', e.target.value)} className="mt-1.5" />
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
