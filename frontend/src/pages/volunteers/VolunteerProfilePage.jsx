import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { volunteerApi } from '../../api/volunteersApi';
import { sheltersApi } from '../../api/sheltersApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import { formatDate } from '../../utils/dateUtils';
import { initials } from '../../utils/formatters';

const SKILL_ICONS = { MEDICAL: '🩺', TRANSPORT: '🚗', SOCIALIZING: '🤝', FOSTERING: '🏠', RESCUE: '🚨', ADMIN: '💼', PHOTOGRAPHY: '📷' };

export default function VolunteerProfilePage() {
  const { id } = useParams();
  const isOwnProfile = !id;
  const { data, loading, refetch } = useApi(
    () => id ? volunteerApi.getProfile(id) : volunteerApi.getMyProfile(),
    null,
    [id]
  );
  const vol = data?.data || data;

  // F1: change-shelter request state (own profile only)
  const [changeOpen, setChangeOpen] = useState(false);
  const [shelters, setShelters] = useState([]);
  const [toShelter, setToShelter] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeMsg, setChangeMsg] = useState('');
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    if (isOwnProfile && changeOpen && shelters.length === 0) {
      sheltersApi.list().then(res => {
        const list = res.data?.data?.results || res.data?.data || res.data?.results || res.data || [];
        setShelters(Array.isArray(list) ? list : []);
      }).catch(() => {});
    }
  }, [isOwnProfile, changeOpen, shelters.length]);

  useEffect(() => {
    if (isOwnProfile) {
      volunteerApi.myShelterChangeRequests()
        .then(res => setMyRequests(res.data?.data || []))
        .catch(() => {});
    }
  }, [isOwnProfile, data]);

  const submitChange = async () => {
    if (!toShelter) { setChangeError('Please select a shelter.'); return; }
    setSaving(true); setChangeError(''); setChangeMsg('');
    try {
      await volunteerApi.requestShelterChange({ to_shelter: toShelter, reason });
      setChangeMsg('Request submitted. A shelter admin will review it.');
      setToShelter(''); setReason('');
      volunteerApi.myShelterChangeRequests().then(res => setMyRequests(res.data?.data || [])).catch(() => {});
      setTimeout(() => setChangeOpen(false), 1200);
    } catch (err) {
      setChangeError(err.response?.data?.error?.message || 'Failed to submit request.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" text="Loading volunteer profile…" /></div>;
  if (!vol) return <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}><div style={{ fontSize: '4rem' }}>😿</div><h2>Volunteer not found</h2></div>;

  const pendingRequest = myRequests.find(r => r.status === 'PENDING');

  const stats = [
    { icon: '🤝', label: 'Completed', value: vol.completed_assignments || 0, color: 'var(--cat-sage)' },
    { icon: '🔄', label: 'Active',    value: vol.active_assignments || 0,    color: 'var(--cat-terra)' },
    { icon: '⭐', label: 'Rating',    value: vol.avg_rating ? `${Number(vol.avg_rating).toFixed(1)}/5` : '—', color: 'var(--cat-amber)' },
  ];

  return (
    <div className="page-container-sm">
      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-espresso), var(--cat-brown))',
        borderRadius: '20px',
        padding: '2rem',
        textAlign: 'center',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ position: 'absolute', right: '1rem', top: '0.5rem', fontSize: '5rem', opacity: 0.08 }}>🐾</div>

        {/* Avatar */}
        <div style={{
          width: '88px', height: '88px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
          border: '4px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: '1.75rem',
          margin: '0 auto 1rem',
          position: 'relative',
          overflow: vol.profile_photo ? 'hidden' : 'visible',
        }}>
          {vol.profile_photo
            ? <img src={vol.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials(vol.first_name, vol.last_name)
          }
          {vol.is_online && (
            <div style={{
              position: 'absolute', bottom: '4px', right: '4px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#2ecc71', border: '2px solid white',
              zIndex: 1,
            }} title="Online now" />
          )}
        </div>

        <h1 style={{ color: 'white', margin: '0 0 0.25rem', fontSize: '1.625rem', fontFamily: 'Playfair Display, serif' }}>
          {vol.first_name} {vol.last_name}
        </h1>
        {vol.city && <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1rem', fontSize: '0.9rem' }}>📍 {vol.city}</p>}

        <div style={{
          background: vol.is_online ? 'rgba(46,204,113,0.25)' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${vol.is_online ? 'rgba(46,204,113,0.5)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: '999px',
          padding: '0.3rem 1rem',
          display: 'inline-block',
          fontSize: '0.8125rem',
          fontWeight: 700,
          color: vol.is_online ? '#A8E6A0' : 'rgba(255,255,255,0.7)',
        }}>
          {vol.is_online ? '🟢 Online' : '⚪ Offline'}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Shelter binding (F1) */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.375rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shelter</h3>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🏠 {vol.shelter_name || 'Not assigned'}</div>
          </div>
          {isOwnProfile && (
            pendingRequest
              ? <span style={{ background: 'var(--cat-amber-light, rgba(230,180,80,0.15))', color: 'var(--cat-amber, #9a6b00)', fontWeight: 700, fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '999px' }}>Change requested — pending</span>
              : <button onClick={() => { setChangeOpen(true); setChangeError(''); setChangeMsg(''); }} className="btn btn-secondary btn-sm">Request shelter change</button>
          )}
        </div>
      </div>

      {/* Skills */}
      {vol.skills && vol.skills.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skills</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {vol.skills.map(s => (
              <span key={s} style={{ background: 'rgba(201,123,84,0.1)', color: 'var(--cat-terra)', fontWeight: 700, fontSize: '0.8125rem', padding: '0.35rem 0.875rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {SKILL_ICONS[s] || '🔧'} {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      {vol.bio && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>About</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.9375rem' }}>{vol.bio}</p>
        </div>
      )}

      {/* Details */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
          {[
            { label: 'Member Since', value: formatDate(vol.joined_at) },
            { label: 'Max Cats (Foster)', value: vol.max_foster_cats ?? '—' },
            { label: 'Emergency Contact', value: vol.emergency_contact_name || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* F1: Request shelter change modal */}
      <Modal open={changeOpen} onClose={() => setChangeOpen(false)} title="🏠 Request Shelter Change"
        footer={
          <>
            <button onClick={() => setChangeOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={submitChange} disabled={saving} className="btn btn-primary">{saving ? 'Submitting…' : 'Submit Request'}</button>
          </>
        }
      >
        {changeError && <div className="form-error" style={{ marginBottom: '1rem' }}>{changeError}</div>}
        {changeMsg && <div style={{ marginBottom: '1rem', color: 'var(--cat-sage)', fontWeight: 600 }}>{changeMsg}</div>}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 0 }}>
          Your request must be approved by the target shelter's admin before it takes effect.
        </p>
        <div className="form-group">
          <label className="label-base">Move to shelter *</label>
          <select value={toShelter} onChange={e => setToShelter(e.target.value)} className="input-base">
            <option value="">Select a shelter…</option>
            {shelters.filter(s => String(s.id) !== String(vol.shelter)).map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="label-base">Reason (optional)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} className="input-base" rows={3} placeholder="Why do you want to change shelters?" style={{ resize: 'vertical' }} />
        </div>
      </Modal>
    </div>
  );
}