import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medicalApi } from '../../api/medicalApi';
import PageHeader from '../../components/PageHeader';

const RECORD_TYPES = [
  { id: 'CHECKUP',       icon: '🩺', label: 'Checkup',        desc: 'Routine health examination' },
  { id: 'VACCINATION',   icon: '💉', label: 'Vaccination',    desc: 'Vaccine administration' },
  { id: 'SURGERY',       icon: '⚕️', label: 'Surgery',        desc: 'Surgical procedure' },
  { id: 'TREATMENT',     icon: '💊', label: 'Treatment',      desc: 'Medical treatment / medication' },
  { id: 'DENTAL',        icon: '🦷', label: 'Dental',         desc: 'Dental care procedure' },
  { id: 'DIAGNOSTIC',    icon: '🔬', label: 'Diagnostic',     desc: 'Tests, bloodwork, X-ray' },
  { id: 'EMERGENCY',     icon: '🚨', label: 'Emergency',      desc: 'Emergency care' },
  { id: 'FOLLOW_UP',     icon: '📋', label: 'Follow-up',      desc: 'Post-treatment follow-up' },
];

export default function AddMedicalRecordPage() {
  const { id: catId } = useParams();
  const navigate       = useNavigate();

  const [step,  setStep]  = useState(1);
  const [form,  setForm]  = useState({
    cat: catId, record_type: '', date: new Date().toISOString().split('T')[0],
    vet_name: '', clinic_name: '', diagnosis: '', treatment: '',
    notes: '', follow_up_date: '', cost: '', is_confidential: false,
  });
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.record_type) { setError('Please select a record type.'); setStep(1); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('attachments', f));
      await medicalApi.addRecord(catId, fd);
      navigate(`/cats/${catId}/medical`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add medical record.');
    } finally {
      setLoading(false);
    }
  };

  const sec = { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' };
  const ttl = { margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div className="page-container-sm">
      <PageHeader title="🏥 Add Medical Record" backPath={`/cats/${catId}/medical`} />

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem', alignItems: 'center' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: s < 3 ? 1 : 0 }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: step > s ? 'var(--cat-sage)' : step === s ? 'var(--cat-terra)' : 'var(--cat-linen)',
              border: step >= s ? 'none' : '1.5px solid var(--border-default)',
              color: step >= s ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.875rem', flexShrink: 0, transition: 'all 0.3s',
            }}>
              {step > s ? '✓' : s}
            </div>
            {s < 3 && (
              <div style={{ flex: 1, height: '2px', background: step > s ? 'var(--cat-sage)' : 'var(--border-default)', transition: 'background 0.3s' }} />
            )}
          </div>
        ))}
        <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {['Record Type', 'Clinical Details', 'Attachments'][step - 1]}
        </span>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🙀 {error}</div>}

      <form onSubmit={step < 3 ? (e) => { e.preventDefault(); if (step === 1 && !form.record_type) { setError('Please select a record type.'); return; } setError(''); setStep(s => s + 1); } : handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Step 1 — Record Type */}
        {step === 1 && (
          <div style={sec}>
            <h3 style={ttl}>Choose Record Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {RECORD_TYPES.map(rt => (
                <button key={rt.id} type="button" onClick={() => { set('record_type', rt.id); setError(''); }} style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '12px',
                  border: `2px solid ${form.record_type === rt.id ? 'var(--cat-terra)' : 'var(--border-default)'}`,
                  background: form.record_type === rt.id ? 'rgba(201,123,84,0.07)' : 'var(--cat-linen)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{rt.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: form.record_type === rt.id ? 'var(--cat-terra)' : 'var(--text-primary)' }}>{rt.label}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{rt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Clinical Details */}
        {step === 2 && (
          <>
            <div style={sec}>
              <h3 style={ttl}>📋 Clinical Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="label-base">Date *</label>
                    <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-base" id="mr-date" />
                  </div>
                  <div className="form-group">
                    <label className="label-base">Follow-up Date</label>
                    <input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} className="input-base" id="mr-followup" />
                  </div>
                  <div className="form-group">
                    <label className="label-base">Veterinarian</label>
                    <input value={form.vet_name} onChange={e => set('vet_name', e.target.value)} className="input-base" placeholder="Dr. Ahmed" id="mr-vet" />
                  </div>
                  <div className="form-group">
                    <label className="label-base">Clinic / Hospital</label>
                    <input value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} className="input-base" placeholder="City Vet Clinic" id="mr-clinic" />
                  </div>
                  <div className="form-group">
                    <label className="label-base">Cost (PKR)</label>
                    <input type="number" min="0" value={form.cost} onChange={e => set('cost', e.target.value)} className="input-base" placeholder="0" id="mr-cost" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label-base">Diagnosis</label>
                  <textarea value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)}
                    className="input-base" rows={3} placeholder="What was found / diagnosed?" style={{ resize: 'vertical' }} id="mr-diagnosis" />
                </div>
                <div className="form-group">
                  <label className="label-base">Treatment / Procedure</label>
                  <textarea value={form.treatment} onChange={e => set('treatment', e.target.value)}
                    className="input-base" rows={3} placeholder="What was done / prescribed?" style={{ resize: 'vertical' }} id="mr-treatment" />
                </div>
                <div className="form-group">
                  <label className="label-base">Additional Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    className="input-base" rows={2} placeholder="Any other relevant information…" style={{ resize: 'vertical' }} id="mr-notes" />
                </div>
              </div>
            </div>

            <div style={{ ...sec }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_confidential} onChange={e => set('is_confidential', e.target.checked)}
                  style={{ accentColor: 'var(--cat-terra)', width: '16px', height: '16px' }} id="mr-conf" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔒 Mark as Confidential</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Only admins and vets can view this record</div>
                </div>
              </label>
            </div>
          </>
        )}

        {/* Step 3 — Attachments */}
        {step === 3 && (
          <div style={sec}>
            <h3 style={ttl}>📎 Attachments (Optional)</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Upload lab results, X-rays, prescriptions, or any relevant documents.
            </p>

            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '140px', border: '2px dashed var(--border-default)', borderRadius: '12px',
              cursor: 'pointer', color: 'var(--text-muted)', gap: '0.5rem', transition: 'all 0.2s', padding: '1rem',
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cat-terra)'; e.currentTarget.style.background = 'rgba(201,123,84,0.04)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ fontSize: '3rem' }}>📎</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload files'}
              </span>
              <span style={{ fontSize: '0.78rem' }}>PDF, JPG, PNG — up to 5 files, 10MB each</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple style={{ display: 'none' }}
                onChange={e => setFiles(Array.from(e.target.files).slice(0, 5))} />
            </label>

            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.875rem' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'var(--cat-linen)', borderRadius: '8px', padding: '0.5rem 0.875rem' }}>
                    <span style={{ fontSize: '1rem' }}>{f.type.includes('pdf') ? '📄' : '🖼️'}</span>
                    <span style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                    <button type="button" onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Summary of record before submit */}
            <div style={{ background: 'rgba(201,123,84,0.06)', border: '1px solid rgba(201,123,84,0.2)', borderRadius: '10px', padding: '1rem', marginTop: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.625rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cat-rust)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📋 Record Summary
              </h4>
              {[
                { label: 'Type',        value: RECORD_TYPES.find(r => r.id === form.record_type)?.label },
                { label: 'Date',        value: form.date },
                { label: 'Vet',         value: form.vet_name || '—' },
                { label: 'Clinic',      value: form.clinic_name || '—' },
                { label: 'Confidential', value: form.is_confidential ? 'Yes 🔒' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 700 }}>{label}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn btn-secondary" style={{ flex: 1, padding: '0.875rem' }}>
              ← Back
            </button>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, padding: '0.875rem', fontSize: '1rem' }}>
            {step < 3 ? 'Next →' : loading ? '🏥 Saving…' : '🏥 Add Record'}
          </button>
        </div>
      </form>
    </div>
  );
}