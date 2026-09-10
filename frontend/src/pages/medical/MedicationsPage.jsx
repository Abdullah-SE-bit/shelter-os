import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { medicalApi } from '../../api/medicalApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/dateUtils';

const FREQ_LABELS = {
  ONCE: 'Once',
  DAILY: 'Daily',
  TWICE_DAILY: 'Twice Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  AS_NEEDED: 'As Needed',
};

export default function MedicationsPage() {
  const { id: catId } = useParams();
  const { user }      = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    cat: catId, medication_name: '', dosage: '', frequency: 'DAILY',
    start_date: new Date().toISOString().split('T')[0], end_date: '', reason: '', prescribing_vet: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useApi(() => medicalApi.listMedications(catId), null, [catId]);
  const medications = data?.results || data || [];
  const canAdd = ['SUPER_ADMIN','SHELTER_ADMIN','VET'].includes(user?.role);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await medicalApi.addMedication(form);
      setAddOpen(false);
      refetch();
    } catch {}
    setSaving(false);
  };

  const isActive = (med) => {
    if (!med.end_date) return true;
    return new Date(med.end_date) >= new Date();
  };

  return (
    <div className="page-container-sm">
      <PageHeader
        title="💊 Medications"
        backPath={`/cats/${catId}`}
        action={canAdd && <button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Add</button>}
      />

      {/* Active count */}
      {medications.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.875rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))', borderRadius: '12px', padding: '1rem', color: 'white', textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>{medications.filter(isActive).length}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active</div>
          </div>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '2rem', lineHeight: 1, color: 'var(--text-muted)' }}>{medications.filter(m => !isActive(m)).length}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed</div>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner text="Loading medications…" />}

      {!loading && medications.length === 0 && (
        <EmptyState icon="💊" title="No medications" message="No medications on record for this cat."
          action={canAdd && <button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Add Medication</button>} />
      )}

      {!loading && medications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...medications].sort((a, b) => isActive(b) - isActive(a)).map(med => {
            const active = isActive(med);
            return (
              <div key={med.id} style={{
                background: 'var(--surface-card)',
                border: `1px solid ${active ? 'rgba(201,123,84,0.25)' : 'var(--border-default)'}`,
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                opacity: active ? 1 : 0.65,
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: active ? 'rgba(201,123,84,0.1)' : 'var(--cat-linen)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                  💊
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>{med.medication_name}</h4>
                    <span style={{
                      background: active ? 'rgba(201,123,84,0.12)' : 'var(--cat-linen)',
                      color: active ? 'var(--cat-terra)' : 'var(--text-muted)',
                      fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px',
                    }}>
                      {active ? '● Active' : '✓ Completed'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    {med.dosage     && <span>📏 {med.dosage}</span>}
                    {med.frequency  && <span>🔁 {FREQ_LABELS[med.frequency] || med.frequency}</span>}
                    <span>📅 {formatDate(med.start_date)}{med.end_date ? ` → ${formatDate(med.end_date)}` : ' (ongoing)'}</span>
                    {med.prescribing_vet && <span>🩺 {med.prescribing_vet}</span>}
                  </div>
                  {med.reason && <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Reason: {med.reason}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="💊 Add Medication"
        footer={
          <>
            <button onClick={() => setAddOpen(false)} className="btn btn-secondary">Cancel</button>
            <button form="med-form" type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : 'Add Medication'}</button>
          </>
        }
      >
        <form id="med-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="form-group">
            <label className="label-base">Medication Name *</label>
            <input required value={form.medication_name} onChange={e => set('medication_name', e.target.value)} className="input-base" placeholder="e.g. Amoxicillin, Prednisolone…" id="med-name" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Dosage</label>
              <input value={form.dosage} onChange={e => set('dosage', e.target.value)} className="input-base" placeholder="e.g. 50mg, 2ml" id="med-dose" />
            </div>
            <div className="form-group">
              <label className="label-base">Frequency</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="input-base" id="med-freq">
                {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label-base">Start Date *</label>
              <input required type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="input-base" id="med-start" />
            </div>
            <div className="form-group">
              <label className="label-base">End Date</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="input-base" id="med-end" />
            </div>
            <div className="form-group">
              <label className="label-base">Prescribing Vet</label>
              <input value={form.prescribing_vet} onChange={e => set('prescribing_vet', e.target.value)} className="input-base" id="med-vet" />
            </div>
            <div className="form-group">
              <label className="label-base">Reason</label>
              <input value={form.reason} onChange={e => set('reason', e.target.value)} className="input-base" placeholder="Why is this prescribed?" id="med-reason" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}