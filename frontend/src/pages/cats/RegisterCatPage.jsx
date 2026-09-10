import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catsApi } from '../../api/catsApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const MICROCHIP_RE = /^\d{15}$/;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' };
const inputBase = { width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border-default)' };
const errText = { color: 'var(--cat-red)', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 600 };

export default function RegisterCatPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [form, setForm] = useState({
    name: '',
    breed: '',
    age_years: '',
    age_months: '',
    gender: 'MALE',
    color: '',
    is_microchipped: false,
    microchip_id: '',
    is_vaccinated_core: false,
    is_neutered: false,
    behavioral_notes: '',
  });

  // C2: Fetch breeds for dropdown. useApi already unwraps `res.data.data`,
  // so breedsData is the array of {id, value, display_label}.
  const { data: breedsData, loading: breedsLoading } = useApi(() => catsApi.listBreeds());
  const breeds = Array.isArray(breedsData) ? breedsData : (breedsData?.results || []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handlePhoto = (file) => {
    setFieldErrors(prev => ({ ...prev, photo: undefined }));
    if (!file) { setPhoto(null); setPhotoPreview(''); return; }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFieldErrors(prev => ({ ...prev, photo: 'Only JPEG or PNG images are allowed.' }));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFieldErrors(prev => ({ ...prev, photo: 'Image must be 5MB or smaller.' }));
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Cat name is required.';
    if (!form.breed) errs.breed = 'Please select a breed.';
    if (!photo) errs.photo = 'A cat photo is required.';
    if (form.is_microchipped || form.microchip_id) {
      if (!MICROCHIP_RE.test(form.microchip_id)) {
        errs.microchip_id = 'Microchip number must be exactly 15 digits.';
      }
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.breed) fd.append('breed', form.breed);
      fd.append('age_years', parseInt(form.age_years) || 0);
      fd.append('age_months', parseInt(form.age_months) || 0);
      fd.append('gender', form.gender);
      fd.append('color', form.color);
      fd.append('is_microchipped', form.is_microchipped);
      if (form.microchip_id) fd.append('microchip_id', form.microchip_id);
      fd.append('is_vaccinated_core', form.is_vaccinated_core);
      fd.append('is_neutered', form.is_neutered);
      fd.append('behavioral_notes', form.behavioral_notes || '');
      fd.append('photos', photo);

      await catsApi.create(fd);
      navigate('/cats');
    } catch (err) {
      const details = err.response?.data?.error?.details;
      if (details && typeof details === 'object') {
        const mapped = {};
        Object.entries(details).forEach(([field, msgs]) => {
          mapped[field] = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
        });
        setFieldErrors(mapped);
        setError('Please fix the highlighted fields.');
      } else {
        setError(err.response?.data?.error?.message || 'Failed to register cat. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (breedsLoading) {
    return <LoadingSpinner text="Loading..." />;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-sage), var(--cat-mint))',
        borderRadius: '20px', padding: '2rem 2.5rem', marginBottom: '2rem',
        position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ position: 'absolute', right: '2rem', bottom: '-0.5rem', fontSize: '6rem', opacity: 0.1 }}>🐱</div>
        <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '2rem', fontFamily: 'Playfair Display, serif' }}>
          Register Your Cat
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9375rem' }}>
          Add your cat to PawTrack OS to manage their health and records
        </p>
      </div>

      {error && (
        <div style={{
          background: 'var(--cat-red-light)', border: '1px solid var(--cat-red)', borderRadius: '12px',
          padding: '1rem', marginBottom: '1.5rem', color: 'var(--cat-red)', fontSize: '0.9375rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.125rem', fontWeight: 700 }}>Basic Information</h2>

          {/* Required photo */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Cat Photo *</label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '150px', border: `2px dashed ${fieldErrors.photo ? 'var(--cat-red)' : 'var(--border-default)'}`,
              borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)', gap: '0.5rem', overflow: 'hidden',
            }}>
              {photoPreview ? (
                <img src={photoPreview} alt="preview" style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '8px' }} />
              ) : (
                <>
                  <span style={{ fontSize: '2.5rem' }}>📸</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Click to upload a photo (required)</span>
                  <span style={{ fontSize: '0.75rem' }}>JPG or PNG, up to 5MB</span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }}
                onChange={e => handlePhoto(e.target.files?.[0])} />
            </label>
            {fieldErrors.photo && <div style={errText}>{fieldErrors.photo}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Cat Name *</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Whiskers"
                style={{ ...inputBase, borderColor: fieldErrors.name ? 'var(--cat-red)' : 'var(--border-default)' }} />
              {fieldErrors.name && <div style={errText}>{fieldErrors.name}</div>}
            </div>

            <div>
              <label style={labelStyle}>Breed *</label>
              <select value={form.breed} onChange={(e) => handleChange('breed', e.target.value)}
                style={{ ...inputBase, borderColor: fieldErrors.breed ? 'var(--cat-red)' : 'var(--border-default)' }}>
                <option value="">Select breed</option>
                {breeds.map(breed => (
                  <option key={breed.id} value={breed.id}>{breed.display_label}</option>
                ))}
              </select>
              {fieldErrors.breed && <div style={errText}>{fieldErrors.breed}</div>}
            </div>

            <div>
              <label style={labelStyle}>Age (Years)</label>
              <input type="number" min="0" max="30" value={form.age_years}
                onChange={(e) => handleChange('age_years', e.target.value)} placeholder="2" style={inputBase} />
            </div>

            <div>
              <label style={labelStyle}>Age (Months)</label>
              <input type="number" min="0" max="11" value={form.age_months}
                onChange={(e) => handleChange('age_months', e.target.value)} placeholder="6" style={inputBase} />
            </div>

            <div>
              <label style={labelStyle}>Gender *</label>
              <select required value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} style={inputBase}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Color/Markings</label>
              <input type="text" value={form.color} onChange={(e) => handleChange('color', e.target.value)}
                placeholder="Orange tabby with white paws" style={inputBase} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                <input type="checkbox" checked={form.is_microchipped}
                  onChange={(e) => handleChange('is_microchipped', e.target.checked)}
                  style={{ width: '1.1rem', height: '1.1rem' }} />
                This cat is microchipped
              </label>
              {form.is_microchipped && (
                <>
                  <input type="text" inputMode="numeric" maxLength={15} value={form.microchip_id}
                    onChange={(e) => handleChange('microchip_id', e.target.value.replace(/\D/g, ''))}
                    placeholder="15-digit microchip number"
                    style={{ ...inputBase, borderColor: fieldErrors.microchip_id ? 'var(--cat-red)' : 'var(--border-default)' }} />
                  {fieldErrors.microchip_id
                    ? <div style={errText}>{fieldErrors.microchip_id}</div>
                    : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Enter the 15-digit ISO 11784/11785 microchip number</div>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Health & Notes */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.125rem', fontWeight: 700 }}>Health &amp; Notes</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_vaccinated_core}
                onChange={(e) => handleChange('is_vaccinated_core', e.target.checked)} style={{ width: '1.1rem', height: '1.1rem' }} />
              Core vaccines given
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_neutered}
                onChange={(e) => handleChange('is_neutered', e.target.checked)} style={{ width: '1.1rem', height: '1.1rem' }} />
              Spayed / Neutered
            </label>
          </div>
          <label style={labelStyle}>Behavioral Notes</label>
          <textarea value={form.behavioral_notes} onChange={(e) => handleChange('behavioral_notes', e.target.value)}
            rows={4} placeholder="Describe your cat's personality, temperament, likes, dislikes, etc."
            style={{ ...inputBase, resize: 'vertical' }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/cats')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Registering...' : '🐱 Register Cat'}
          </button>
        </div>
      </form>
    </div>
  );
}
