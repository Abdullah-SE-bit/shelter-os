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

export default function VaccinationsPage() {
  const { id: catId } = useParams();
  const { user }      = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ cat: catId, vaccine_name: '', date_given: new Date().toISOString().split('T')[0], next_due_date: '', vet_name: '', batch_number: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useApi(() => medicalApi.listVaccinations(catId), null, [catId]);
  const vaccinations = data?.results || data || [];
  const canAdd = ['SUPER_ADMIN','SHELTER_ADMIN','VET'].includes(user?.role);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await medicalApi.addVaccination(form);
      setAddOpen(false);
      refetch();
    } catch {}
    setSaving(false);
  };

  const CORE_VACCINES = ['FVRCP', 'Rabies', 'FeLV', 'FIV'];

  const isOverdue = (dt) => dt && new Date(dt) < new Date();
  const isDueSoon = (dt) => {
    if (!dt) return false;
    const diff = (new Date(dt) - new Date()) / 86400000;
    return diff >= 0 && diff <= 30;
  };

  return (
    <div className="page-container-sm">
      <PageHeader
        title="💉 Vaccinations"
        backPath={`/cats/${catId}`}
        action={canAdd && <button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Add</button>}
      />

      {/* Quick status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {CORE_VACCINES.map(v => {
          const given = vaccinations.find(vac => vac.vaccine_name?.includes(v));
          return (
            <div key={v} style={{
              background: 'var(--surface-card)',
              border: `1px solid ${given ? 'rgba(123,173,110,0.4)' : 'var(--border-default)'}`,
              borderRadius: '10px',
              padding: '0.75rem 0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{given ? '💉' : '○'}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: given ? '#2E6B24' : 'var(--text-muted)' }}>{v}</div>
              {given && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{formatDate(given.date_given)}</div>}
            </div>
          );
        })}
      </div>

      {loading && <LoadingSpinner text="Loading vaccinations…" />}

      {!loading && vaccinations.length === 0 && (
        <EmptyState icon="💉" title="No vaccinations recorded" message="Add vaccination records to track this cat's immunization history."
          action={canAdd && <button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Add Vaccination</button>} />
      )}

      {!loading && vaccinations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {vaccinations.map(vac => {
            const overdue = isOverdue(vac.next_due_date);
            const soon    = isDueSoon(vac.next_due_date);
            return (
              <div key={vac.id} style={{
                background: 'var(--surface-card)',
                border: `1px solid ${overdue ? 'rgba(192,82,78,0.3)' : soon ? 'rgba(232,160,48,0.3)' : 'var(--border-default)'}`,
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: overdue ? 'var(--cat-red-light)' : 'var(--cat-sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem', flexShrink: 0 }}>
                  💉
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>{vac.vaccine_name}</h4>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>📅 Given: {formatDate(vac.date_given)}</span>
                    {vac.vet_name && <span>🩺 {vac.vet_name}</span>}
                    {vac.batch_number && <span>🏷 {vac.batch_number}</span>}
                  </div>
                  {vac.next_due_date && (
                    <div style={{ marginTop: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: overdue ? 'var(--cat-red)' : soon ? 'var(--cat-amber)' : 'var(--cat-sage)' }}>
                      {overdue ? '⚠️ Overdue since' : soon ? '⏰ Due soon:' : '✅ Next due:'} {formatDate(vac.next_due_date)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="💉 Add Vaccination"
        footer={
          <>
            <button onClick={() => setAddOpen(false)} className="btn btn-secondary">Cancel</button>
            <button form="vac-form" type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : 'Add Vaccination'}</button>
          </>
        }
      >
        <form id="vac-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="form-group">
            <label className="label-base">Vaccine Name *</label>
            <input required list="vac-list" value={form.vaccine_name} onChange={e => set('vaccine_name', e.target.value)} className="input-base" placeholder="e.g. FVRCP, Rabies…" id="vac-name" />
            <datalist id="vac-list">
              {['FVRCP','Rabies','FeLV','FIV','Bordetella','Calicivirus'].map(v => <option key={v} value={v} />)}
            </datalist>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Date Given *</label>
              <input required type="date" value={form.date_given} onChange={e => set('date_given', e.target.value)} className="input-base" id="vac-given" />
            </div>
            <div className="form-group">
              <label className="label-base">Next Due Date</label>
              <input type="date" value={form.next_due_date} onChange={e => set('next_due_date', e.target.value)} className="input-base" id="vac-due" />
            </div>
            <div className="form-group">
              <label className="label-base">Vet Name</label>
              <input value={form.vet_name} onChange={e => set('vet_name', e.target.value)} className="input-base" id="vac-vet" />
            </div>
            <div className="form-group">
              <label className="label-base">Batch Number</label>
              <input value={form.batch_number} onChange={e => set('batch_number', e.target.value)} className="input-base" placeholder="Optional" id="vac-batch" />
            </div>
          </div>
          <div className="form-group">
            <label className="label-base">Notes</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} className="input-base" id="vac-notes" />
          </div>
        </form>
      </Modal>
    </div>
  );
}