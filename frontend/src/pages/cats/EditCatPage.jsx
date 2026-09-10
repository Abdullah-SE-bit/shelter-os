import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catsApi } from '../../api/catsApi';
import { sheltersApi } from '../../api/sheltersApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';

const GENDERS  = ['MALE','FEMALE','UNKNOWN'];
const STATUSES = ['IN_SHELTER','FOSTERED','LOST','STRAY','ADOPTED','DECEASED'];
const BREEDS   = ['PERSIAN','SIAMESE','MAINE_COON','BENGAL','RAGDOLL','BRITISH_SHORTHAIR','ABYSSINIAN','SCOTTISH_FOLD','SPHYNX','MIXED','OTHER'];

export default function EditCatPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shelters, setShelters] = useState([]);
  const [form,    setForm]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'VET') {
      sheltersApi.list().then(res => {
        setShelters(res.data?.data || res.data?.results || res.data || []);
      }).catch(err => console.error('Failed to load shelters:', err));
    }
  }, [user]);

  useEffect(() => {
    catsApi.get(id).then(r => {
      const c = r.data?.data || r.data;
      setForm({
        name: c.name || '', gender: c.gender || 'UNKNOWN',
        breed: c.breed || 'MIXED', age_years: c.age_years || '',
        age_months: c.age_months || '', color: c.color || '',
        weight_kg: c.weight_kg || '', current_status: c.current_status || 'IN_SHELTER',
        description: c.description || '', microchip_number: c.microchip_number || '',
        intake_date: c.intake_date || '', adoption_fee: c.adoption_fee || '',
        adoption_requirements: c.adoption_requirements || '',
        is_neutered: !!c.is_neutered, is_vaccinated_core: !!c.is_vaccinated_core,
        is_microchipped: !!c.is_microchipped, is_dewormed: !!c.is_dewormed,
        is_fiv_positive: !!c.is_fiv_positive, is_felv_positive: !!c.is_felv_positive,
        shelter: c.shelter || '',
      });
    }).catch(() => setError('Failed to load cat.'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await catsApi.update(id, form);
      navigate(`/cats/${id}`);
    } catch (err) {
      let errorMsg = err.response?.data?.error?.message || 'Failed to save changes.';
      const details = err.response?.data?.error?.details;
      if (details && typeof details === 'object') {
        const fieldErrors = Object.entries(details)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n');
        if (fieldErrors) {
          errorMsg += `:\n${fieldErrors}`;
        }
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" text="Loading cat details…" /></div>;
  if (!form)   return <div className="page-container"><div className="form-error">Cat not found.</div></div>;

  const sec = { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' };
  const ttl = { margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const chk = (key, label) => (
    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
      <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} style={{ accentColor: 'var(--cat-terra)', width: '15px', height: '15px' }} />
      {label}
    </label>
  );

  return (
    <div className="page-container-sm">
      <PageHeader title={`✏️ Edit: ${form.name || 'Cat'}`} backPath={`/cats/${id}`} />

      {error && <div className="form-error" style={{ marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>🙀 {error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Basic Info */}
        <div style={sec}>
          <h3 style={ttl}>📋 Basic Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="label-base">Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} className="input-base" id="edit-name" />
              </div>
              <div className="form-group">
                <label className="label-base">Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} className="input-base" id="edit-gender">
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {(user?.role === 'SUPER_ADMIN' || user?.role === 'VET') && (
              <div className="form-group">
                <label className="label-base">Shelter</label>
                <select value={form.shelter} onChange={e => set('shelter', e.target.value)} className="input-base" id="edit-shelter">
                  <option value="">No shelter (Independent/Private Owner)</option>
                  {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="label-base">Age (Years)</label>
                <input type="number" min="0" max="30" value={form.age_years} onChange={e => set('age_years', e.target.value)} className="input-base" id="edit-years" />
              </div>
              <div className="form-group">
                <label className="label-base">Age (Months)</label>
                <input type="number" min="0" max="11" value={form.age_months} onChange={e => set('age_months', e.target.value)} className="input-base" id="edit-months" />
              </div>
              <div className="form-group">
                <label className="label-base">Breed</label>
                <select value={form.breed} onChange={e => set('breed', e.target.value)} className="input-base" id="edit-breed">
                  {BREEDS.map(b => <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label-base">Color</label>
                <input value={form.color} onChange={e => set('color', e.target.value)} className="input-base" id="edit-color" />
              </div>
              <div className="form-group">
                <label className="label-base">Weight (kg)</label>
                <input type="number" step="0.01" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className="input-base" id="edit-weight" />
              </div>
              <div className="form-group">
                <label className="label-base">Status</label>
                <select value={form.current_status} onChange={e => set('current_status', e.target.value)} className="input-base" id="edit-status">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="label-base">Microchip Number</label>
                <input value={form.microchip_number} onChange={e => set('microchip_number', e.target.value)} className="input-base" id="edit-chip" />
              </div>
            </div>
            <div className="form-group">
              <label className="label-base">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input-base" rows={4} id="edit-desc" style={{ resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Health */}
        <div style={sec}>
          <h3 style={ttl}>💊 Health Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {[
              { key: 'is_neutered',        label: '✂️ Neutered / Spayed' },
              { key: 'is_vaccinated_core', label: '💉 Core Vaccinated' },
              { key: 'is_microchipped',    label: '📡 Microchipped' },
              { key: 'is_dewormed',        label: '💊 Dewormed' },
              { key: 'is_fiv_positive',    label: '⚠️ FIV Positive' },
              { key: 'is_felv_positive',   label: '⚠️ FeLV Positive' },
            ].map(({ key, label }) => chk(key, label))}
          </div>
        </div>

        {/* Adoption */}
        <div style={sec}>
          <h3 style={ttl}>❤️ Adoption Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="label-base">Adoption Fee (PKR)</label>
              <input type="number" min="0" value={form.adoption_fee} onChange={e => set('adoption_fee', e.target.value)} className="input-base" id="edit-fee" />
            </div>
            <div className="form-group">
              <label className="label-base">Adoption Requirements</label>
              <textarea value={form.adoption_requirements} onChange={e => set('adoption_requirements', e.target.value)} className="input-base" rows={3} id="edit-req" style={{ resize: 'vertical' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={() => navigate(`/cats/${id}`)} className="btn btn-secondary" style={{ flex: 1, padding: '0.875rem' }}>Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2, padding: '0.875rem', fontSize: '1rem' }}>
            {saving ? '💾 Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}