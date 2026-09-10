import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sheltersApi } from '../../api/sheltersApi';
import PageHeader from '../../components/PageHeader';
import PhoneInput, { isValidPkMobile } from '../../components/PhoneInput';

const INTAKE_REASONS = ['STRAY','SURRENDER','RESCUE','TRANSFER','BORN_IN_SHELTER'];

export default function IntakePage() {
  const { shelterId } = useParams();
  const navigate      = useNavigate();
  const [form, setForm] = useState({
    cat_name: '', reason: 'STRAY', intake_date: new Date().toISOString().split('T')[0],
    condition_on_arrival: '', intake_notes: '', microchip_number: '',
    found_location: '', surrenderer_name: '', surrenderer_phone: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.surrenderer_phone && !isValidPkMobile(form.surrenderer_phone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the phone blank.');
      return;
    }
    setLoading(true); setError('');
    try {
      const sid = shelterId || 'me';
      await sheltersApi.createIntake(sid, form);
      navigate('/shelter/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to record intake.');
    } finally {
      setLoading(false);
    }
  };

  const sec = { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' };
  const ttl = { margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div className="page-container-sm">
      <PageHeader title="📥 Cat Intake" subtitle="Record a new cat arriving at the shelter" backPath="/shelter/dashboard" />

      {/* Reason selector */}
      <div style={{ ...sec, marginBottom: '1.25rem' }}>
        <h3 style={ttl}>Reason for Intake</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
          {INTAKE_REASONS.map(r => (
            <button key={r} type="button" onClick={() => set('reason', r)} style={{
              padding: '0.75rem 0.5rem',
              borderRadius: '10px',
              border: `2px solid ${form.reason === r ? 'var(--cat-terra)' : 'var(--border-default)'}`,
              background: form.reason === r ? 'rgba(201,123,84,0.08)' : 'var(--cat-linen)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: form.reason === r ? 'var(--cat-terra)' : 'var(--text-secondary)',
              textAlign: 'center',
              transition: 'all 0.2s',
            }}>
              {{'STRAY':'🐈 Stray','SURRENDER':'🤲 Surrender','RESCUE':'🚨 Rescue','TRANSFER':'🏠 Transfer','BORN_IN_SHELTER':'🍼 Born Here'}[r]}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🙀 {error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={sec}>
          <h3 style={ttl}>🐱 Cat Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="label-base">Cat Name (or "Unknown")</label>
                <input value={form.cat_name} onChange={e => set('cat_name', e.target.value)} className="input-base" placeholder="Whiskers / Unknown" id="intake-name" />
              </div>
              <div className="form-group">
                <label className="label-base">Intake Date *</label>
                <input required type="date" value={form.intake_date} onChange={e => set('intake_date', e.target.value)} className="input-base" id="intake-date" />
              </div>
            </div>
            <div className="form-group">
              <label className="label-base">Microchip Number</label>
              <input value={form.microchip_number} onChange={e => set('microchip_number', e.target.value)} className="input-base" placeholder="If known" id="intake-chip" />
            </div>
            <div className="form-group">
              <label className="label-base">Condition on Arrival *</label>
              <textarea required value={form.condition_on_arrival} onChange={e => set('condition_on_arrival', e.target.value)}
                className="input-base" rows={3} placeholder="Describe the cat's physical condition when it arrived…" style={{ resize: 'vertical' }} id="intake-condition" />
            </div>
            <div className="form-group">
              <label className="label-base">Intake Notes</label>
              <textarea value={form.intake_notes} onChange={e => set('intake_notes', e.target.value)}
                className="input-base" rows={2} placeholder="Any additional information…" style={{ resize: 'vertical' }} id="intake-notes" />
            </div>
          </div>
        </div>

        {/* Conditional fields based on reason */}
        {form.reason === 'STRAY' && (
          <div style={sec}>
            <h3 style={ttl}>📍 Found Location</h3>
            <div className="form-group">
              <label className="label-base">Where was the cat found?</label>
              <input value={form.found_location} onChange={e => set('found_location', e.target.value)} className="input-base" placeholder="e.g. F-7 Sector, near the park" id="intake-loc" />
            </div>
          </div>
        )}

        {form.reason === 'SURRENDER' && (
          <div style={sec}>
            <h3 style={ttl}>🤲 Surrenderer Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="label-base">Name</label>
                <input value={form.surrenderer_name} onChange={e => set('surrenderer_name', e.target.value)} className="input-base" id="intake-sname" />
              </div>
              <div className="form-group">
                <label className="label-base">Phone</label>
                <PhoneInput value={form.surrenderer_phone} onChange={v => set('surrenderer_phone', v)} id="intake-sphone" />
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '1rem', fontSize: '1rem', width: '100%', borderRadius: '12px' }}>
          {loading ? '📥 Recording…' : '📥 Record Intake'}
        </button>
      </form>
    </div>
  );
}