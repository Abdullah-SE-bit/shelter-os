import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catsApi } from '../../api/catsApi';
import { sheltersApi } from '../../api/sheltersApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';

const GENDERS  = ['MALE','FEMALE','UNKNOWN'];
const STATUSES = ['IN_SHELTER','FOSTERED','LOST'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export default function CreateCatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shelters, setShelters] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [form, setForm] = useState({
    name: '', gender: 'UNKNOWN', breed: '', age_years: '', age_months: '',
    color: '', weight_kg: '', current_status: 'IN_SHELTER', description: '',
    intake_date: new Date().toISOString().split('T')[0],
    is_neutered: false, is_vaccinated_core: false,
    is_dewormed: false, is_fiv_positive: false, is_felv_positive: false,
    adoption_fee: '', adoption_requirements: '',
    shelter: '',
  });
  const [photos,  setPhotos]  = useState([]);
  const [error,   setError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(1);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFieldErrors(fe => ({ ...fe, [k]: undefined })); };

  // C2: load breeds for the dropdown from the seeded lookup table.
  useEffect(() => {
    catsApi.listBreeds().then(res => {
      const list = res.data?.data || res.data?.results || res.data || [];
      setBreeds(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        setForm(f => ({ ...f, breed: f.breed || list[0].id }));
      }
    }).catch(err => console.error('Failed to load breeds:', err));
  }, []);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'VET') {
      sheltersApi.list().then(res => {
        const list = res.data?.data || res.data?.results || res.data || [];
        setShelters(list);
        if (list.length > 0) {
          setForm(f => ({ ...f, shelter: list[0].id }));
        }
      }).catch(err => console.error('Failed to load shelters:', err));
    }
  }, [user]);

  const addPhotos = (files) => {
    setFieldErrors(fe => ({ ...fe, photos: undefined }));
    const valid = [];
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) { setFieldErrors(fe => ({ ...fe, photos: 'Only JPEG or PNG images are allowed.' })); continue; }
      if (f.size > MAX_PHOTO_BYTES) { setFieldErrors(fe => ({ ...fe, photos: 'Each image must be 5MB or smaller.' })); continue; }
      valid.push(f);
    }
    setPhotos(valid.slice(0, 5));
  };

  const validateAll = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.breed) errs.breed = 'Please select a breed.';
    if ((user?.role === 'SUPER_ADMIN' || user?.role === 'VET') && !form.shelter) errs.shelter = 'Please select a shelter.';
    if (photos.length === 0) errs.photos = 'At least one photo is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAll();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      // jump back to the step containing the first error
      if (errs.name || errs.breed || errs.shelter) setStep(1);
      else if (errs.photos) setStep(3);
      return;
    }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.breed) fd.append('breed', form.breed);
      fd.append('gender', form.gender);
      fd.append('age_years', parseInt(form.age_years) || 0);
      fd.append('age_months', parseInt(form.age_months) || 0);
      fd.append('color', form.color || '');
      fd.append('is_neutered', form.is_neutered);
      fd.append('is_vaccinated_core', form.is_vaccinated_core);
      fd.append('behavioral_notes', form.description || '');
      fd.append('adoption_fee', parseFloat(form.adoption_fee) || 0);
      fd.append('adoption_requirements', form.adoption_requirements || '');
      if (form.intake_date) fd.append('intake_date', form.intake_date);
      if (form.shelter) fd.append('shelter', form.shelter);
      // Marks this as a shelter add-cat submission. Shelter admins / super
      // admins / vets are handled by role on the backend; for a shelter
      // volunteer this flag routes the cat to their own shelter.
      fd.append('add_to_shelter', 'true');
      photos.forEach(p => fd.append('photos', p));
      const { data } = await catsApi.create(fd);
      navigate(`/cats/${data?.data?.id || data?.id || ''}`);
    } catch (err) {
      const details = err.response?.data?.error?.details;
      if (details && typeof details === 'object') {
        const mapped = {};
        Object.entries(details).forEach(([field, msgs]) => {
          mapped[field] = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
        });
        setFieldErrors(mapped);
        setError('Please fix the highlighted fields.');
        if (mapped.photos) setStep(3); else setStep(1);
      } else {
        setError(err.response?.data?.error?.message || 'Failed to create cat profile.');
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const sectionStyle = { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' };
  const sectionTitle = { margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const checkRow = (key, label) => (
    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
      <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} style={{ accentColor: 'var(--cat-terra)', width: '16px', height: '16px' }} />
      {label}
    </label>
  );

  return (
    <div className="page-container-sm">
      <PageHeader title="🐱 Add New Cat" subtitle={user?.role === 'VOLUNTEER' ? 'Add a cat to your shelter' : 'Create a cat profile in the system'} backPath="/cats" />

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem', alignItems: 'center' }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: s < 3 ? 1 : 0 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: step > s ? 'var(--cat-sage)' : step === s ? 'var(--cat-terra)' : 'var(--cat-linen)',
              border: step >= s ? 'none' : '1.5px solid var(--border-default)',
              color: step >= s ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, transition: 'all 0.3s',
            }}>
              {step > s ? '✓' : s}
            </div>
            {s < 3 && <div style={{ flex: 1, height: '2px', background: step > s ? 'var(--cat-sage)' : 'var(--border-default)', transition: 'background 0.3s' }} />}
          </div>
        ))}
        <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {['Basic Info','Health & Care','Photos & Adoption'][step - 1]}
        </span>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>🙀 {error}</div>}

      <form onSubmit={step < 3 ? (e) => { e.preventDefault(); setStep(s => s + 1); } : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <>
            <div style={sectionStyle}>
              <h3 style={sectionTitle}>📋 Basic Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="label-base">Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      className="input-base" placeholder="Whiskers" id="cat-name"
                      style={fieldErrors.name ? { borderColor: 'var(--cat-red)' } : undefined} />
                    {fieldErrors.name && <div className="form-error">{fieldErrors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="label-base">Gender</label>
                    <select value={form.gender} onChange={e => set('gender', e.target.value)} className="input-base" id="cat-gender">
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                {(user?.role === 'SUPER_ADMIN' || user?.role === 'VET') && (
                  <div className="form-group">
                    <label className="label-base">Shelter *</label>
                    <select value={form.shelter} onChange={e => set('shelter', e.target.value)} className="input-base" id="cat-shelter"
                      style={fieldErrors.shelter ? { borderColor: 'var(--cat-red)' } : undefined}>
                      <option value="">Select a shelter</option>
                      {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {fieldErrors.shelter && <div className="form-error">{fieldErrors.shelter}</div>}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="label-base">Age (Years)</label>
                    <input type="number" min="0" max="30" value={form.age_years} onChange={e => set('age_years', e.target.value)} className="input-base" placeholder="2" id="cat-years" />
                  </div>
                  <div className="form-group">
                    <label className="label-base">Age (Months)</label>
                    <input type="number" min="0" max="11" value={form.age_months} onChange={e => set('age_months', e.target.value)} className="input-base" placeholder="6" id="cat-months" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="label-base">Breed *</label>
                    <select value={form.breed} onChange={e => set('breed', e.target.value)} className="input-base" id="cat-breed"
                      style={fieldErrors.breed ? { borderColor: 'var(--cat-red)' } : undefined}>
                      <option value="">Select breed</option>
                      {breeds.map(b => <option key={b.id} value={b.id}>{b.display_label}</option>)}
                    </select>
                    {fieldErrors.breed && <div className="form-error">{fieldErrors.breed}</div>}
                  </div>
                  <div className="form-group">
                    <label className="label-base">Color / Markings</label>
                    <input value={form.color} onChange={e => set('color', e.target.value)} className="input-base" placeholder="Orange tabby" id="cat-color" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="label-base">Weight (kg)</label>
                    <input type="number" step="0.01" min="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className="input-base" placeholder="4.2" id="cat-weight" />
                  </div>
                  <div className="form-group">
                    <label className="label-base">Status</label>
                    <select value={form.current_status} onChange={e => set('current_status', e.target.value)} className="input-base" id="cat-status">
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label-base">Intake Date</label>
                  <input type="date" value={form.intake_date} onChange={e => set('intake_date', e.target.value)} className="input-base" id="cat-intake" />
                </div>
                <div className="form-group">
                  <label className="label-base">Description / Personality</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input-base" rows={3} placeholder="Describe this cat's personality, habits, and any special needs…" id="cat-desc" style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2 — Health */}
        {step === 2 && (
          <div style={sectionStyle}>
            <h3 style={sectionTitle}>💊 Health &amp; Care Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { key: 'is_neutered',        label: '✂️ Neutered / Spayed' },
                { key: 'is_vaccinated_core', label: '💉 Core Vaccines Given' },
                { key: 'is_dewormed',        label: '💊 Dewormed' },
                { key: 'is_fiv_positive',    label: '⚠️ FIV Positive' },
                { key: 'is_felv_positive',   label: '⚠️ FeLV Positive' },
              ].map(({ key, label }) => checkRow(key, label))}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--cat-linen)', borderRadius: '10px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              📡 A unique 15-digit ISO 11784/11785 microchip number is generated and assigned automatically by the system when this shelter cat is created.
            </div>
          </div>
        )}

        {/* Step 3 — Photos & Adoption */}
        {step === 3 && (
          <>
            <div style={sectionStyle}>
              <h3 style={sectionTitle}>📷 Photos *</h3>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '120px', border: `2px dashed ${fieldErrors.photos ? 'var(--cat-red)' : 'var(--border-default)'}`, borderRadius: '10px',
                cursor: 'pointer', color: 'var(--text-muted)', gap: '0.5rem', transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: '2.5rem' }}>📸</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {photos.length > 0 ? `${photos.length} photo(s) selected` : 'Click to upload cat photos (required)'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG — up to 5 files, 5MB each</span>
                <input type="file" accept="image/jpeg,image/png" multiple style={{ display: 'none' }} onChange={e => addPhotos(Array.from(e.target.files))} />
              </label>
              {fieldErrors.photos && <div className="form-error" style={{ marginTop: '0.5rem' }}>{fieldErrors.photos}</div>}
              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ background: 'var(--cat-sage-light)', borderRadius: '6px', padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 600, color: '#2E6B24' }}>
                      📷 {p.name.slice(0, 20)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitle}>❤️ Adoption Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="form-group">
                  <label className="label-base">Adoption Fee (PKR)</label>
                  <input type="number" min="0" value={form.adoption_fee} onChange={e => set('adoption_fee', e.target.value)} className="input-base" placeholder="0 for free" id="cat-fee" />
                </div>
                <div className="form-group">
                  <label className="label-base">Adoption Requirements</label>
                  <textarea value={form.adoption_requirements} onChange={e => set('adoption_requirements', e.target.value)} className="input-base" rows={3} placeholder="Minimum requirements for adopting this cat…" id="cat-req" style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn btn-secondary" style={{ flex: 1, padding: '0.875rem' }}>← Back</button>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, padding: '0.875rem', fontSize: '1rem' }}>
            {step < 3 ? 'Next →' : loading ? '🐱 Creating…' : '🐱 Create Cat Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}