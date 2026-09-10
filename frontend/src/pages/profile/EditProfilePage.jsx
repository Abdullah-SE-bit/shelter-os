import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import PhoneInput, { isValidPkMobile } from '../../components/PhoneInput';
import { initials } from '../../utils/formatters';

export default function EditProfilePage() {
  const { user, loadUser } = useAuth();
  const navigate           = useNavigate();
  const p = user?.profile || {};

  const [form, setForm] = useState({
    first_name:        p.first_name    || '',
    last_name:         p.last_name     || '',
    email:             user?.email     || '',
    phone:             p.phone         || '',
    bio:               p.bio           || '',
    date_of_birth:     p.date_of_birth || '',
  });
  const [photo,   setPhoto]   = useState(null);
  const [preview, setPreview] = useState(p.profile_photo_url || null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone && !isValidPkMobile(form.phone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the phone blank.');
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('first_name', form.first_name);
      fd.append('last_name', form.last_name);
      fd.append('phone', form.phone || '');
      fd.append('bio', form.bio || '');
      if (form.date_of_birth) fd.append('date_of_birth', form.date_of_birth);
      if (photo) fd.append('profile_photo', photo);
      await authApi.updateProfile(fd);
      // B6: refresh the global auth user so name/photo update everywhere.
      if (loadUser) await loadUser();
      setSuccess('Profile updated successfully! 🐾');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const sec = { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' };
  const ttl = { margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div className="page-container-sm">
      <PageHeader title="✏️ Edit Profile" backPath="/profile" />

      {error   && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🙀 {error}</div>}
      {success && (
        <div style={{ background: 'var(--cat-sage-light)', border: '1px solid rgba(123,173,110,0.4)', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', color: '#2E6B24', fontWeight: 700 }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Avatar section */}
        <div style={{ ...sec, textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: 900,
              margin: '0 auto',
              border: '4px solid var(--cat-linen)',
            }}>
              {preview
                ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials(form.first_name, form.last_name) || '🐾'
              }
            </div>
            <label htmlFor="photo-upload" style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--cat-terra)',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}>
              📷
            </label>
            <input id="photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Click the camera icon to change your photo
          </p>
        </div>

        {/* Personal info */}
        <div style={sec}>
          <h3 style={ttl}>👤 Personal Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="label-base">First Name</label>
                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} className="input-base" id="ep-fname" />
              </div>
              <div className="form-group">
                <label className="label-base">Last Name</label>
                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} className="input-base" id="ep-lname" />
              </div>
            </div>
            <div className="form-group">
              <label className="label-base">Email</label>
              <input type="email" value={form.email} className="input-base" id="ep-email" disabled title="Email cannot be changed here" style={{ opacity: 0.7 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="label-base">Phone</label>
                <PhoneInput value={form.phone} onChange={v => set('phone', v)} id="ep-phone" />
              </div>
              <div className="form-group">
                <label className="label-base">Date of Birth</label>
                <input type="date" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} className="input-base" id="ep-dob" max={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            <div className="form-group">
              <label className="label-base">Bio</label>
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)} className="input-base" rows={3} placeholder="Tell us a bit about yourself and your love for cats…" style={{ resize: 'vertical' }} id="ep-bio" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div style={sec}>
          <h3 style={ttl}>🔔 Notification Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { key: 'notification_email', label: '✉️ Email Notifications', desc: 'Receive updates via email' },
              { key: 'notification_push',  label: '📱 Push Notifications',  desc: 'Alerts in the browser / app' },
              { key: 'notification_sms',   label: '💬 SMS Notifications',   desc: 'Text alerts to your phone' },
            ].map(({ key, label, desc }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.75rem 1rem', background: 'var(--cat-linen)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
                {/* Toggle switch */}
                <div style={{ position: 'relative', width: '44px', height: '24px', flexShrink: 0 }}
                  onClick={() => set(key, !form[key])}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '999px', background: form[key] ? 'var(--cat-terra)' : 'var(--border-default)', transition: 'background 0.2s' }} />
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: form[key] ? '22px' : '3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={() => navigate('/profile')} className="btn btn-secondary" style={{ flex: 1, padding: '0.875rem' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, padding: '0.875rem', fontSize: '1rem' }}>
            {loading ? <><span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: '0.5rem' }} />Saving…</> : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}