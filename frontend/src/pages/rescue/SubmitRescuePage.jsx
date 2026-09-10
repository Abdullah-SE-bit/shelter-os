import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rescueApi } from '../../api/rescueApi';
import PageHeader from '../../components/PageHeader';

const URGENCY_OPTIONS = [
  { value: 'LOW',      emoji: '🟢', label: 'Low',      desc: 'Cat is safe but needs help' },
  { value: 'MEDIUM',   emoji: '🟡', label: 'Medium',   desc: 'Cat needs attention soon' },
  { value: 'HIGH',     emoji: '🟠', label: 'High',     desc: 'Cat is in danger or injured' },
  { value: 'CRITICAL', emoji: '🔴', label: 'Critical', desc: 'Life-threatening emergency!' },
];

export default function SubmitRescuePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    description: '',
    latitude: '',
    longitude: '',
    urgency_level: 'MEDIUM',
    cat_condition_notes: '',
  });
  const [photos,   setPhotos]   = useState([]);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [locating, setLocating] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const getLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('latitude',  String(pos.coords.latitude));
        set('longitude', String(pos.coords.longitude));
        setLocating(false);
      },
      () => { setError('Could not get location. Please enter manually.'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) { setError('Please provide a location.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      photos.forEach(p => fd.append('photos', p));
      const { data } = await rescueApi.submit(fd);
      navigate(`/rescue/${data.data?.id || ''}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit rescue report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container-sm">
      <PageHeader title="🚨 Submit Rescue Report" subtitle="Help us locate and rescue a cat in need" backPath="/rescue" />

      {/* Urgency selector */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '14px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Urgency Level
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
          {URGENCY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('urgency_level', opt.value)}
              style={{
                padding: '0.875rem',
                borderRadius: '10px',
                border: `2px solid ${form.urgency_level === opt.value ? 'var(--cat-terra)' : 'var(--border-default)'}`,
                background: form.urgency_level === opt.value ? 'rgba(201,123,84,0.08)' : 'var(--cat-linen)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{opt.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{opt.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🚨 {error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Description */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
          <div className="form-group">
            <label className="label-base">Description *</label>
            <textarea
              required
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="input-base"
              placeholder="Describe the situation: where you found the cat, its condition, any hazards nearby…"
              rows={4}
              id="rescue-desc"
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="label-base">Cat Condition Notes</label>
            <textarea
              value={form.cat_condition_notes}
              onChange={e => set('cat_condition_notes', e.target.value)}
              className="input-base"
              placeholder="Injuries, behavior, approximate age, color…"
              rows={3}
              id="rescue-notes"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Location */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              📍 Location
            </h3>
            <button
              type="button"
              onClick={getLocation}
              disabled={locating}
              className="btn btn-secondary btn-sm"
            >
              {locating ? '⏳ Getting…' : '📡 Use My Location'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Latitude *</label>
              <input
                type="number"
                step="any"
                required
                value={form.latitude}
                onChange={e => set('latitude', e.target.value)}
                className="input-base"
                placeholder="e.g. 33.7294"
                id="rescue-lat"
              />
            </div>
            <div className="form-group">
              <label className="label-base">Longitude *</label>
              <input
                type="number"
                step="any"
                required
                value={form.longitude}
                onChange={e => set('longitude', e.target.value)}
                className="input-base"
                placeholder="e.g. 73.0931"
                id="rescue-lng"
              />
            </div>
          </div>
          {form.latitude && form.longitude && (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem', color: 'var(--cat-sage)', fontWeight: 600 }}>
              ✅ Location set: {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
            </p>
          )}
        </div>

        {/* Photos */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📷 Photos (optional)
          </h3>
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100px',
            border: '2px dashed var(--border-default)',
            borderRadius: '10px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            gap: '0.375rem',
          }}>
            <span style={{ fontSize: '1.75rem' }}>📸</span>
            {photos.length > 0 ? `${photos.length} photo(s) selected` : 'Click to add photos'}
            <input type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => setPhotos(Array.from(e.target.files))} />
          </label>
          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {photos.map((p, i) => (
                <div key={i} style={{
                  background: 'var(--cat-linen)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.625rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}>
                  📷 {p.name.slice(0, 20)}
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn btn-danger" style={{ padding: '1rem', fontSize: '1rem', width: '100%', borderRadius: '12px' }}>
          {loading ? '🚨 Submitting…' : '🚨 Submit Rescue Report'}
        </button>
      </form>
    </div>
  );
}