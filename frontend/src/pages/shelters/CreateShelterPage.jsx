import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sheltersApi } from '../../api/sheltersApi';
import { authApi } from '../../api/authApi';
import { coreApi } from '../../api/coreApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import MapLocationPicker from '../../components/MapLocationPicker';
import PhoneInput, { isValidPkMobile } from '../../components/PhoneInput';
import ShelterPhoneField, { isValidPkPhone } from '../../components/ShelterPhoneField';
import Modal from '../../components/Modal';

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default function CreateShelterPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '' });
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [ownerError, setOwnerError] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [form, setForm] = useState({
    name: '',
    street: '',
    city: '',
    country: 'Pakistan',
    phone: '',
    email: '',
    website: '',
    capacity_total: '',
    admin: '',
    description: '',
    latitude: '',
    longitude: '',
  });

  // Fetch users for admin assignment (only SHELTER_ADMIN or unassigned users)
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useApi(() => 
    authApi.listUsers({ role: 'SHELTER_ADMIN' })
  );
  // Only shelter admins not already managing a shelter can be assigned here.
  const users = (usersData || []).filter(u => !u.assigned_shelter_id);

  // E1: controlled city list.
  const { data: citiesData } = useApi(() => coreApi.getLookup('CITIES'));
  const cities = Array.isArray(citiesData) ? citiesData : (citiesData?.results || []);

  // Centre + radius of the selected city (from lookup metadata) constrains the map.
  const selectedCity = cities.find(c => c.display_label === form.city) || null;
  const cityCenter = selectedCity?.metadata && selectedCity.metadata.lat != null
    ? {
        lat: selectedCity.metadata.lat,
        lng: selectedCity.metadata.lng,
        radius_km: selectedCity.metadata.radius_km || 45,
      }
    : null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    if (!isValidPkMobile(ownerForm.phone)) {
      setOwnerError('Enter a valid Pakistani mobile number for the shelter admin.');
      return;
    }
    setOwnerSaving(true);
    setOwnerError('');
    try {
      const res = await authApi.createAdminUser({ ...ownerForm, role: 'SHELTER_ADMIN' });
      alert('Shelter Admin created successfully!');
      await refetchUsers();
      const newUserId = res.data?.data?.user_id || res.data?.user_id;
      setForm(prev => ({ ...prev, admin: newUserId }));
      setOwnerOpen(false);
      setOwnerForm({ email: '', password: '', first_name: '', last_name: '', phone: '' });
    } catch (err) {
      console.error(err);
      setOwnerError(err.response?.data?.error?.message || 'Failed to create shelter admin.');
    } finally {
      setOwnerSaving(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Shelter name is required.';
    if (!form.city) errs.city = 'Please select a city.';
    const cap = parseInt(form.capacity_total);
    if (!cap || cap <= 0) errs.capacity_total = 'Capacity must be a positive number.';

    // Contact phone: required Pakistani mobile OR landline.
    if (!isValidPkPhone(form.phone)) errs.phone = 'Enter a valid Pakistani mobile or landline number.';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (form.website && !/^https?:\/\/.+/.test(form.website)) errs.website = 'Website must start with http:// or https://';

    // Location is mandatory and must fall inside the selected city.
    if (form.latitude === '' || form.longitude === '' || form.latitude == null || form.longitude == null) {
      errs.location = 'Please pick the shelter location on the map.';
    } else if (cityCenter) {
      const d = distanceKm(cityCenter.lat, cityCenter.lng, parseFloat(form.latitude), parseFloat(form.longitude));
      if (d > cityCenter.radius_km) errs.location = `The selected location must be within ${form.city}.`;
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        capacity_total: parseInt(form.capacity_total) || 0,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        admin: form.admin || null,
      };
      await sheltersApi.create(data);
      navigate('/shelters');
    } catch (error) {
      const detail = error.response?.data?.error?.details;
      if (detail && typeof detail === 'object') {
        const mapped = {};
        Object.entries(detail).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v.join(', ') : String(v); });
        setErrors(mapped);
        setGeneralError('Please fix the highlighted fields.');
      } else {
        setGeneralError(error.response?.data?.error?.message || 'Failed to create shelter. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const errText = { color: 'var(--cat-red)', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 600 };
  const bd = (f) => ({ width: '100%', padding: '0.625rem', borderRadius: '8px', border: `1px solid ${errors[f] ? 'var(--cat-red)' : 'var(--border-default)'}` });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-rust), var(--cat-espresso))',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ position: 'absolute', right: '2rem', bottom: '-0.5rem', fontSize: '6rem', opacity: 0.1 }}>🏠</div>
        <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '2rem', fontFamily: 'Playfair Display, serif' }}>
          Create New Shelter
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9375rem' }}>
          Add a new shelter to the PawTrack OS network
        </p>
      </div>

      {usersLoading ? (
        <LoadingSpinner text="Loading..." />
      ) : (
        <form onSubmit={handleSubmit}>
          {generalError && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🙀 {generalError}</div>}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Basic Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Shelter Name *
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Happy Paws Shelter"
                  style={bd('name')}
                />
                {errors.name && <div style={errText}>{errors.name}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Registration Number
                </label>
                <div style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-default)',
                  background: 'var(--cat-linen)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>
                  🔖 Auto-generated on creation
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  City *
                </label>
                <select
                  required
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  style={bd('city')}
                >
                  <option value="">Select a city…</option>
                  {cities.map(c => <option key={c.id} value={c.display_label}>{c.display_label}</option>)}
                </select>
                {errors.city && <div style={errText}>{errors.city}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Country *
                </label>
                <input
                  required
                  type="text"
                  value={form.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  style={bd('country')}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Street Address
                </label>
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  placeholder="123 Main Street, Block A"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Capacity (Total Cats) *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.capacity_total}
                  onChange={(e) => handleChange('capacity_total', e.target.value)}
                  placeholder="50"
                  style={bd('capacity_total')}
                />
                {errors.capacity_total && <div style={errText}>{errors.capacity_total}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Assign Shelter Admin
                </label>
                <select
                  value={form.admin}
                  onChange={(e) => handleChange('admin', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <option value="">Select admin (optional)</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email} 
                      {user.profile?.first_name && ` - ${user.profile.first_name} ${user.profile.last_name}`}
                    </option>
                  ))}
                </select>
                <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Assign a user with SHELTER_ADMIN role to manage this shelter
                </small>
                <button
                  type="button"
                  onClick={() => setOwnerOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem', display: 'inline-block', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  ➕ Create New Shelter Owner
                </button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Contact Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Phone *
                </label>
                <ShelterPhoneField
                  cityName={form.city}
                  value={form.phone}
                  onChange={(v) => { handleChange('phone', v); setErrors(prev => ({ ...prev, phone: undefined })); }}
                  error={errors.phone}
                />
                {errors.phone && <div style={errText}>{errors.phone}</div>}
                <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Choose Mobile (+92) or Landline — the landline area code is set from the selected city.
                </small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="info@happypaws.org"
                  style={bd('email')}
                />
                {errors.email && <div style={errText}>{errors.email}</div>}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://happypaws.org"
                  style={bd('website')}
                />
                {errors.website && <div style={errText}>{errors.website}</div>}
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Location *
            </h2>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {form.city
                ? `Pin the shelter's exact spot within ${form.city}.`
                : 'Select a city above first, then pin the shelter on the map.'}
            </p>

            <MapLocationPicker
              cityName={form.city}
              cityCenter={cityCenter}
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(loc) => {
                setForm(prev => ({ ...prev, latitude: loc.latitude, longitude: loc.longitude }));
                setErrors(prev => ({ ...prev, location: undefined }));
              }}
            />
            {errors.location && <div style={errText}>{errors.location}</div>}
          </div>

          {/* Description */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Description
            </h2>

            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              placeholder="Tell us about the shelter, its mission, facilities, and services..."
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/shelters')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Creating...' : '🏠 Create Shelter'}
            </button>
          </div>
        </form>
      )}

      {/* Create Shelter Admin Modal */}
      <Modal
        open={ownerOpen}
        onClose={() => setOwnerOpen(false)}
        title="👤 Create Shelter Owner"
        footer={
          <>
            <button onClick={() => setOwnerOpen(false)} className="btn btn-secondary">Cancel</button>
            <button form="owner-form" type="submit" disabled={ownerSaving} className="btn btn-primary">
              {ownerSaving ? 'Creating…' : 'Create Owner'}
            </button>
          </>
        }
      >
        {ownerError && <div className="form-error" style={{ marginBottom: '1rem' }}>🙀 {ownerError}</div>}
        <form id="owner-form" onSubmit={handleCreateOwner} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="form-group">
            <label className="label-base">Email *</label>
            <input
              type="email"
              required
              value={ownerForm.email}
              onChange={e => setOwnerForm(prev => ({ ...prev, email: e.target.value }))}
              className="input-base"
              placeholder="owner@example.com"
            />
          </div>
          <div className="form-group">
            <label className="label-base">Password *</label>
            <input
              type="password"
              required
              value={ownerForm.password}
              onChange={e => setOwnerForm(prev => ({ ...prev, password: e.target.value }))}
              className="input-base"
              placeholder="••••••••"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">First Name *</label>
              <input
                type="text"
                required
                value={ownerForm.first_name}
                onChange={e => setOwnerForm(prev => ({ ...prev, first_name: e.target.value }))}
                className="input-base"
                placeholder="Jane"
              />
            </div>
            <div className="form-group">
              <label className="label-base">Last Name *</label>
              <input
                type="text"
                required
                value={ownerForm.last_name}
                onChange={e => setOwnerForm(prev => ({ ...prev, last_name: e.target.value }))}
                className="input-base"
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label-base">Phone *</label>
            <PhoneInput
              value={ownerForm.phone}
              onChange={v => setOwnerForm(prev => ({ ...prev, phone: v }))}
              error={!!ownerError && !isValidPkMobile(ownerForm.phone)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
