import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medicalApi } from '../../api/medicalApi';
import { catsApi } from '../../api/catsApi';
import { wellnessApi } from '../../api/wellnessApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

export default function MedicalHistoryPage() {
  const { id: catId } = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const [addOpen, setAddOpen] = useState(false);

  const { data, loading, refetch } = useApi(() => medicalApi.listRecords(catId), null, [catId]);
  const records = data?.results || data || [];

  // A lost/deceased cat isn't in anyone's care, so medical records can't be added.
  const { data: catData } = useApi(() => catsApi.get(catId), null, [catId]);
  const cat = catData?.data || catData;
  const isUntreatable = ['LOST', 'DECEASED'].includes(cat?.current_status);

  const canAdd = ['SUPER_ADMIN','SHELTER_ADMIN','VET'].includes(user?.role) && !isUntreatable;

  const RECORD_ICONS = {
    CHECKUP:   '🩺',
    ILLNESS:   '🤒',
    INJURY:    '🩹',
    SURGERY:   '⚕️',
    DENTAL:    '🦷',
    OTHER:     '📋',
  };

  return (
    <div className="page-container-sm">
      <PageHeader
        title="🏥 Medical History"
        backPath={`/cats/${catId}`}
        action={canAdd && (
          <button onClick={() => setAddOpen(true)} className="btn btn-primary">
            + Add Record
          </button>
        )}
      />

      {isUntreatable && (
        <div style={{
          background: 'var(--cat-amber-light, rgba(230,180,80,0.15))',
          border: '1px solid rgba(230,180,80,0.5)',
          color: '#8A6D1A',
          borderRadius: '12px',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.25rem',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}>
          ⚠️ This cat is marked as <strong>{(cat?.current_status || '').toLowerCase()}</strong>, so new medical
          records can't be added. Update the cat's status first if this is no longer the case.
        </div>
      )}

      {loading && <LoadingSpinner text="Loading medical records…" />}

      {!loading && records.length === 0 && (
        <EmptyState
          icon="💊"
          title="No medical records"
          message="No medical records found for this cat. Add the first record!"
          action={canAdd && <button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Add Medical Record</button>}
        />
      )}

      {!loading && records.length > 0 && (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute',
            left: '19px',
            top: '20px',
            bottom: '20px',
            width: '2px',
            background: 'linear-gradient(to bottom, var(--cat-terra), transparent)',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {records.map((rec, i) => (
              <div key={rec.id} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                {/* Timeline dot */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: i === 0 ? 'var(--cat-terra)' : 'var(--surface-card)',
                  border: `2px solid ${i === 0 ? 'var(--cat-terra)' : 'var(--border-default)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  {RECORD_ICONS[rec.record_type] || '📋'}
                </div>

                {/* Card */}
                <div style={{
                  flex: 1,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(201,123,84,0.1)',
                        color: 'var(--cat-terra)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>
                        {rec.record_type}
                      </span>
                      {rec.appointment_type && (
                        <span style={{
                          background: 'rgba(122,158,192,0.15)',
                          color: 'var(--cat-blue)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}>
                          📅 {rec.appointment_type.replace(/_/g, ' ')} appointment
                        </span>
                      )}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDateTime(rec.occurred_at || rec.date)}</span>
                    </div>
                    {rec.vet_name && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        🩺 {rec.vet_name}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {rec.description}
                  </p>

                  {rec.treatment && (
                    <div style={{ background: 'var(--cat-linen)', borderRadius: '8px', padding: '0.5rem 0.75rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Treatment: </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{rec.treatment}</span>
                    </div>
                  )}

                  {rec.next_appointment && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--cat-terra)', fontWeight: 600 }}>
                      📅 Next: {formatDate(rec.next_appointment)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      <AddMedicalRecordModal
        open={addOpen}
        catId={catId}
        onClose={() => setAddOpen(false)}
        onSaved={() => { setAddOpen(false); refetch(); }}
      />
    </div>
  );
}

// Maps an appointment type onto the closest medical-record type so the record
// form pre-fills to match the visit the vet is documenting.
const APPT_TO_RECORD_TYPE = {
  CHECKUP: 'CHECKUP',
  VACCINATION: 'VACCINATION',
  SURGERY: 'SURGERY',
  FOLLOWUP: 'FOLLOW_UP',
  EMERGENCY: 'EMERGENCY',
};

const RECORD_TYPE_OPTIONS = ['CHECKUP', 'VACCINATION', 'ILLNESS', 'INJURY', 'SURGERY', 'DENTAL', 'EMERGENCY', 'FOLLOW_UP', 'OTHER'];

const pad2 = (n) => String(n).padStart(2, '0');
// Format an instant into the value a <input type="datetime-local"> expects,
// in the browser's local time (so it lines up with what formatDateTime shows).
const toLocalInputValue = (d) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
};

function AddMedicalRecordModal({ open, catId, onClose, onSaved }) {
  const { user } = useAuth();
  const isVet = user?.role === 'VET';

  // A vet documents a visit against one of their appointments for this cat.
  // Other roles (shelter/super admin) add records directly, with no appointment.
  const { data: apptData } = useApi(() => wellnessApi.catAppointments(catId), { skip: !isVet }, [catId]);
  const allAppts = Array.isArray(apptData) ? apptData : (apptData?.results || []);
  const myAppts = isVet
    ? allAppts
        .filter(a => String(a.vet) === String(user?.id) && a.status !== 'CANCELLED')
        .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
    : [];

  const [form, setForm] = useState({
    cat: catId,
    appointment: '',
    record_type: 'CHECKUP',
    occurred_at: toLocalInputValue(new Date()),
    description: '',
    treatment: '',
    diagnosis: '',
    vet_name: '',
    cost: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedAppt = myAppts.find(a => a.id === form.appointment) || null;

  // Once the vet's appointments load, default to the most recent one and adopt
  // its type + a valid date/time.
  useEffect(() => {
    if (isVet && !form.appointment && myAppts.length > 0) {
      const appt = myAppts[0];
      const apptInFuture = new Date(appt.scheduled_at) > new Date();
      setForm(f => ({
        ...f,
        appointment: appt.id,
        record_type: APPT_TO_RECORD_TYPE[appt.appointment_type] || f.record_type,
        occurred_at: apptInFuture ? toLocalInputValue(appt.scheduled_at) : f.occurred_at,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVet, myAppts.length]);

  const onPickAppointment = (id) => {
    const appt = myAppts.find(a => a.id === id);
    setForm(f => {
      const next = { ...f, appointment: id };
      if (appt) {
        next.record_type = APPT_TO_RECORD_TYPE[appt.appointment_type] || f.record_type;
        // Nudge the date/time forward if it currently precedes the appointment.
        if (!f.occurred_at || new Date(f.occurred_at) < new Date(appt.scheduled_at)) {
          next.occurred_at = toLocalInputValue(appt.scheduled_at);
        }
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (isVet && myAppts.length === 0) {
      setError("You have no appointment booked with this cat, so you can't add a medical record.");
      return;
    }
    // Mirror the server rule: a record can't be dated before its appointment.
    if (selectedAppt && form.occurred_at &&
        new Date(form.occurred_at) < new Date(selectedAppt.scheduled_at)) {
      setError(`The record date & time can't be before the appointment time (${formatDateTime(selectedAppt.scheduled_at)}).`);
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      // Send an absolute (UTC) timestamp so it round-trips correctly and is
      // compared against the appointment time on the same footing.
      if (payload.occurred_at) payload.occurred_at = new Date(payload.occurred_at).toISOString();
      if (!payload.appointment) delete payload.appointment;
      // NOTE: createRecord(catId, data) — catId must be the id, not the form.
      await medicalApi.createRecord(catId, payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save record. Please try again.');
    }
    setSaving(false);
  };

  const minDateTime = selectedAppt ? toLocalInputValue(selectedAppt.scheduled_at) : undefined;

  return (
    <Modal open={open} onClose={onClose} title="🏥 Add Medical Record" size="md"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button form="add-medical-form" type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </>
      }
    >
      {error && <div className="form-error" style={{ marginBottom: '0.75rem' }}>🙀 {error}</div>}
      <form id="add-medical-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {isVet && (
          <div className="form-group">
            <label className="label-base">Appointment *</label>
            {myAppts.length === 0 ? (
              <div style={{
                background: 'var(--cat-amber-light, rgba(230,180,80,0.15))',
                border: '1px solid rgba(230,180,80,0.5)',
                color: '#8A6D1A',
                borderRadius: '8px',
                padding: '0.625rem 0.75rem',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}>
                You have no appointment booked with this cat, so a record can't be added.
              </div>
            ) : (
              <>
                <select required value={form.appointment} onChange={e => onPickAppointment(e.target.value)} className="input-base" id="mrec-appt">
                  {myAppts.map(a => (
                    <option key={a.id} value={a.id}>
                      {(a.appointment_type || '').replace(/_/g, ' ')} — {formatDateTime(a.scheduled_at)} · {a.status}
                    </option>
                  ))}
                </select>
                {selectedAppt && (
                  <p style={{ margin: '0.375rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Documenting the <strong>{(selectedAppt.appointment_type || '').replace(/_/g, ' ')}</strong> appointment
                    scheduled for <strong>{formatDateTime(selectedAppt.scheduled_at)}</strong>. The record can't be dated before then.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="label-base">Record Type</label>
            <select value={form.record_type} onChange={e => set('record_type', e.target.value)} className="input-base" id="mrec-type">
              {RECORD_TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label-base">Date &amp; Time *</label>
            <input
              type="datetime-local"
              required
              value={form.occurred_at}
              min={minDateTime}
              onChange={e => set('occurred_at', e.target.value)}
              className="input-base"
              id="mrec-datetime"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="label-base">Description *</label>
          <textarea required value={form.description} onChange={e => set('description', e.target.value)}
            className="input-base" rows={3} placeholder="What happened? What was observed?" style={{ resize: 'vertical' }} id="mrec-desc" />
        </div>
        <div className="form-group">
          <label className="label-base">Diagnosis</label>
          <input value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} className="input-base" placeholder="Condition diagnosed" id="mrec-diag" />
        </div>
        <div className="form-group">
          <label className="label-base">Treatment</label>
          <input value={form.treatment} onChange={e => set('treatment', e.target.value)} className="input-base" placeholder="Medications, procedures, etc." id="mrec-treat" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="label-base">Vet Name</label>
            <input value={form.vet_name} onChange={e => set('vet_name', e.target.value)} className="input-base" id="mrec-vet" />
          </div>
          <div className="form-group">
            <label className="label-base">Cost (PKR)</label>
            <input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} className="input-base" placeholder="1500" id="mrec-cost" />
          </div>
        </div>
      </form>
    </Modal>
  );
}