import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lostFoundApi } from '../../api/lostFoundApi';
import useApi from '../../hooks/useApi';
import PageHeader from '../../components/PageHeader';
import LocationPicker from '../../components/LocationPicker';
import PhoneInput, { isValidPkMobile } from '../../components/PhoneInput';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_PHOTOS = 5;

export default function CreateLostAlertPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    cat_name: '',
    breed: '',
    color: '',
    description: '',
    last_seen_at: '',
    last_seen_latitude: '',
    last_seen_longitude: '',
    behavioral_notes: '',
    contact_phone: '',
    contact_email: '',
  });
  const [photos,   setPhotos]   = useState([]);   // File[]
  const [previews, setPreviews] = useState([]);   // object URLs
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Breed dropdown options from the shared BREED lookup. useApi unwraps
  // res.data.data, so breedsData is the array of {id, value, display_label}.
  const { data: breedsData } = useApi(() => lostFoundApi.listBreeds());
  const breeds = Array.isArray(breedsData) ? breedsData : (breedsData?.results || []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addPhotos = (files) => {
    setError('');
    const nextFiles = [...photos];
    const nextPreviews = [...previews];
    for (const f of files) {
      if (nextFiles.length >= MAX_PHOTOS) break;
      if (!ALLOWED_TYPES.includes(f.type)) { setError('Only JPEG or PNG images are allowed.'); continue; }
      if (f.size > MAX_PHOTO_BYTES) { setError('Each image must be 5MB or smaller.'); continue; }
      nextFiles.push(f);
      nextPreviews.push(URL.createObjectURL(f));
    }
    setPhotos(nextFiles);
    setPreviews(nextPreviews);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.contact_phone && !isValidPkMobile(form.contact_phone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the phone blank.');
      return;
    }
    setLoading(true); setError('');
    try {
      // Multipart so uploaded photos come through; only send non-empty fields.
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      photos.forEach(p => fd.append('photos', p));

      const { data } = await lostFoundApi.createLost(fd);
      const created = data?.data;
      if (created?.id) navigate(`/lost-found/matches/${created.id}`);
      else navigate('/lost-found');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create lost alert.');
    } finally {
      setLoading(false);
    }
  };

  const sectionStyle = {
    background: 'var(--surface-card)',
    border: '1px solid var(--border-default)',
    borderRadius: '14px',
    padding: '1.25rem',
  };
  const sectionTitle = {
    margin: '0 0 1rem',
    fontSize: '0.875rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  return (
    <div className="page-container-sm">
      <PageHeader title="🔍 Report Lost Cat" subtitle="Help us find your missing companion" backPath="/lost-found" />

      {error && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🚨 {error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Photos */}
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>📸 Photos of your cat</h3>
          <p style={{ margin: '-0.5rem 0 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            A clear photo greatly improves the chance of a match. Add up to {MAX_PHOTOS} (JPG or PNG, 5MB each).
          </p>

          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: '92px', height: '92px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                  <img src={src} alt={`preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removePhoto(i)} aria-label="Remove photo" style={{
                    position: 'absolute', top: '2px', right: '2px', width: '22px', height: '22px',
                    borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'rgba(61,43,31,0.75)', color: 'white', fontSize: '0.75rem', lineHeight: 1,
                  }}>✕</button>
                  {i === 0 && (
                    <span style={{ position: 'absolute', bottom: 0, insetInline: 0, textAlign: 'center', background: 'rgba(61,43,31,0.7)', color: 'white', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem' }}>PRIMARY</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {photos.length < MAX_PHOTOS && (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '120px', border: '2px dashed var(--cat-rose, var(--border-default))', borderRadius: '12px',
              cursor: 'pointer', color: 'var(--text-muted)', gap: '0.4rem',
              background: 'linear-gradient(135deg, var(--cat-blush), var(--cat-linen))',
            }}>
              <span style={{ fontSize: '2.25rem' }}>😿</span>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Click to upload photos</span>
              <span style={{ fontSize: '0.75rem' }}>Don't panic — a photo helps us find your cat</span>
              <input type="file" accept="image/jpeg,image/png" multiple style={{ display: 'none' }}
                onChange={e => { addPhotos(Array.from(e.target.files || [])); e.target.value = ''; }} />
            </label>
          )}
        </div>

        {/* Basic info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>📋 Alert Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="label-base">Alert Title *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                className="input-base" placeholder="e.g. Lost orange tabby near Park Road" id="lost-title" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="label-base">Cat's Name</label>
                <input value={form.cat_name} onChange={e => set('cat_name', e.target.value)}
                  className="input-base" placeholder="e.g. Whiskers" id="lost-catname" />
              </div>
              <div className="form-group">
                <label className="label-base">Breed</label>
                <select value={form.breed} onChange={e => set('breed', e.target.value)}
                  className="input-base" id="lost-breed">
                  <option value="">Select breed</option>
                  {breeds.map(breed => (
                    <option key={breed.id} value={breed.id}>{breed.display_label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label-base">Color / Markings</label>
              <input value={form.color} onChange={e => set('color', e.target.value)}
                className="input-base" placeholder="e.g. orange tabby, white paws" id="lost-color" />
            </div>
            <div className="form-group">
              <label className="label-base">Description *</label>
              <textarea required value={form.description} onChange={e => set('description', e.target.value)}
                className="input-base" placeholder="Describe your cat: color, markings, size, collar…"
                rows={4} id="lost-desc" style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="label-base">Behavioral Notes</label>
              <textarea value={form.behavioral_notes} onChange={e => set('behavioral_notes', e.target.value)}
                className="input-base" placeholder="Is your cat shy, friendly, responds to name…"
                rows={2} id="lost-behavior" style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="label-base">Last Seen Date/Time</label>
              <input type="datetime-local" value={form.last_seen_at} onChange={e => set('last_seen_at', e.target.value)}
                className="input-base" id="lost-lastseen" />
            </div>
          </div>
        </div>

        {/* Location */}
        <div style={sectionStyle}>
          <h3 style={{ ...sectionTitle, marginBottom: '0.5rem' }}>📍 Last Seen Location</h3>
          <LocationPicker
            latitude={form.last_seen_latitude}
            longitude={form.last_seen_longitude}
            city=""
            onChange={(location) => {
              set('last_seen_latitude', location.latitude ? String(location.latitude) : '');
              set('last_seen_longitude', location.longitude ? String(location.longitude) : '');
            }}
            label="Last Seen Coordinates"
            required={false}
          />
        </div>

        {/* Contact */}
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>📞 Contact Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Phone Number</label>
              <PhoneInput value={form.contact_phone} onChange={v => set('contact_phone', v)} id="lost-phone" />
            </div>
            <div className="form-group">
              <label className="label-base">Email</label>
              <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                className="input-base" placeholder="you@example.com" id="lost-email" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '1rem', fontSize: '1rem', width: '100%', borderRadius: '12px' }}>
          {loading ? '🔍 Submitting…' : '🔍 Create Lost Alert'}
        </button>
      </form>
    </div>
  );
}
