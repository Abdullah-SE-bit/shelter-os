import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import { formatDate } from '../../utils/dateUtils';
import { initials } from '../../utils/formatters';

const roleLabel = (role) => {
  const m = { SUPER_ADMIN:'👑 Super Admin', SHELTER_ADMIN:'🏠 Shelter Admin', VET:'🩺 Veterinarian', VOLUNTEER:'🙋 Volunteer', CAT_OWNER:'🐱 Cat Owner', ADOPTER:'❤️ Adopter' };
  return m[role] || role;
};

function StatusPill({ status }) {
  const meta = {
    APPROVED:     { color: '#2E6B24', bg: 'var(--cat-sage-light)', text: '✅ Approved' },
    REJECTED:     { color: 'var(--cat-red)', bg: '#FBE3E3', text: '❌ Rejected' },
    PENDING:      { color: '#8A6D1A', bg: '#FBEFD3', text: '⏳ Pending' },
    NOT_REQUIRED: { color: 'var(--text-muted)', bg: '#EDE8E3', text: '— Not required' },
  }[status] || { color: '#8A6D1A', bg: '#FBEFD3', text: '⏳ Pending' };
  return (
    <span style={{ fontWeight: 700, fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '999px', color: meta.color, background: meta.bg, whiteSpace: 'nowrap' }}>
      {meta.text}
    </span>
  );
}

function daysLeft(deadline) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function AppealForm({ onSubmitted }) {
  const [explanation, setExplanation] = useState('');
  const [file, setFile]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (explanation.trim().length < 20) { setError('Please explain in detail (at least 20 characters).'); return; }
    if (!file) { setError('Please attach your veterinary proof as a PDF.'); return; }
    if (!file.name.toLowerCase().endsWith('.pdf')) { setError('Only PDF documents are allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('The document must be 10 MB or smaller.'); return; }

    const fd = new FormData();
    fd.append('explanation', explanation.trim());
    fd.append('document', file);
    setLoading(true);
    try {
      await authApi.submitVetAppeal(fd);
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not submit your appeal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label className="label-base">Explain your case in detail *</label>
        <textarea value={explanation} onChange={e => setExplanation(e.target.value)} className="input-base" rows={4}
          placeholder="Explain why your registration should be approved. Address the reason(s) given above."
          style={{ resize: 'vertical' }} />
      </div>
      <div>
        <label className="label-base">Veterinary proof (PDF only) *</label>
        <input type="file" accept="application/pdf,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="input-base" />
        <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
          Attach official documents proving your veterinary credentials. Max 10 MB.
        </small>
      </div>
      {error && <div className="form-error">{error}</div>}
      <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem' }}>
        {loading ? 'Submitting appeal…' : '📎 Submit appeal'}
      </button>
    </form>
  );
}

function ApprovalRow({ label, status, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.7rem 0.9rem', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '10px' }}>
      <div>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{label}</div>
        {hint && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{hint}</div>}
      </div>
      <StatusPill status={status} />
    </div>
  );
}

function VetApprovalCard({ vp, emailVerified, onChanged }) {
  const ls = vp.lifecycle_status;

  const banner = {
    APPROVED: { bg: 'var(--cat-sage-light)', color: '#2E6B24',
      text: '🎉 You are fully approved — all veterinarian features are unlocked.' },
    PENDING: { bg: '#FBEFD3', color: '#8A6D1A',
      text: '🔒 Your account is under review. Only your profile is available until approval.' },
    REJECTED: { bg: '#FBE3E3', color: 'var(--cat-red)',
      text: '🙁 Your registration was rejected. You may submit ONE appeal with additional proof before the deadline below.' },
    APPEAL_UNDER_REVIEW: { bg: '#FBEFD3', color: '#8A6D1A',
      text: '⏳ Your appeal is under review. We will notify you of the decision.' },
    SUPER_FINAL_REVIEW: { bg: '#FBEFD3', color: '#8A6D1A',
      text: '⏳ Your appeal has been escalated to the Super Admin for a final decision.' },
    SUSPENDED: { bg: '#FBE3E3', color: 'var(--cat-red)',
      text: '⛔ Your registration was permanently rejected and your account is suspended.' },
    FLAGGED: { bg: '#FBE3E3', color: 'var(--cat-red)',
      text: '⛔ Your appeal window lapsed. Your account has been flagged and is no longer active.' },
  }[ls] || { bg: '#FBEFD3', color: '#8A6D1A', text: '🔒 Your account is under review.' };

  const shelterHint = vp.shelter_admin_status === 'NOT_REQUIRED'
    ? 'No shelter selected — shelter approval not required'
    : (vp.shelter_admin_status === 'PENDING' ? 'Pending by Shelter Admin' : undefined);

  const remaining = daysLeft(vp.appeal_deadline);

  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        🩺 Verification &amp; Approval
      </h3>

      <div style={{ background: banner.bg, color: banner.color, borderRadius: '10px', padding: '0.7rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
        {banner.text}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <ApprovalRow label="Email Verified" status={emailVerified ? 'APPROVED' : 'PENDING'} />
        <ApprovalRow label="Super Admin" status={vp.super_admin_status}
          hint={vp.super_admin_status === 'PENDING' ? 'Pending by Super Admin' : undefined} />
        <ApprovalRow label="Shelter Admin" status={vp.shelter_admin_status} hint={shelterHint} />
      </div>

      {vp.rejection_reason && ['REJECTED', 'APPEAL_UNDER_REVIEW', 'SUPER_FINAL_REVIEW'].includes(ls) && (
        <div style={{ background: '#FBE3E3', color: 'var(--cat-red)', borderRadius: '10px', padding: '0.7rem 0.9rem', fontSize: '0.85rem', marginTop: '1rem' }}>
          <strong>Reason for rejection:</strong> {vp.rejection_reason}
        </div>
      )}

      {(ls === 'SUSPENDED' || ls === 'FLAGGED') && vp.blocked_reason && (
        <div style={{ background: '#FBE3E3', color: 'var(--cat-red)', borderRadius: '10px', padding: '0.7rem 0.9rem', fontSize: '0.85rem', marginTop: '1rem' }}>
          <strong>Details:</strong> {vp.blocked_reason}
        </div>
      )}

      {/* Appeal window + form */}
      {ls === 'REJECTED' && (
        <div style={{ marginTop: '1rem', border: '1px dashed var(--cat-red)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontWeight: 800, color: 'var(--cat-red)', marginBottom: '0.35rem' }}>
            ⏰ {remaining === 0 ? 'Appeal window closing today' : `${remaining} day${remaining === 1 ? '' : 's'} left to appeal`}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            You have <strong>one</strong> appeal. Explain your case in detail and attach your veterinary
            proof (PDF). If you do not appeal and get re-approved within 5 days of the rejection, your
            account and registration number will be permanently blocked.
          </div>
          {vp.can_appeal
            ? <AppealForm onSubmitted={onChanged} />
            : <div className="form-error" style={{ marginTop: '0.75rem' }}>The appeal window has closed or your appeal has been used.</div>}
        </div>
      )}

      {/* Vet practice details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginTop: '1.25rem' }}>
        <InfoBlock label="Registration No." value={vp.license_number} />
        <InfoBlock label="Practice Type" value={vp.practice_type === 'SHELTER' ? 'Shelter' : 'Clinic'} />
        {vp.practice_type === 'CLINIC' ? (
          <>
            <InfoBlock label="Clinic Name" value={vp.clinic_name} />
            <InfoBlock label="Clinic Location" value={vp.clinic_location} />
            <InfoBlock label="Clinic Reg. No." value={vp.clinic_registration_number} />
          </>
        ) : (
          <InfoBlock label="Shelter" value={vp.target_shelter_name} />
        )}
      </div>
      {Array.isArray(vp.specializations) && vp.specializations.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Specializations</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {vp.specializations.map(s => (
              <span key={s} style={{ background: 'var(--cat-linen)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '999px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value || '—'}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, loading } = useApi(() => authApi.getMe());

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" text="Loading profile…" /></div>;

  const u = profile || user;
  const p = u?.profile || {};

  // B5: "Member since" is derived from the account creation timestamp.
  const memberSince = u?.created_at
    ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="page-container-sm">
      <PageHeader
        title="👤 My Profile"
        action={<Link to="/profile/edit" className="btn btn-primary">✏️ Edit Profile</Link>}
      />

      {/* Profile card */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '1.5rem',
      }}>
        {/* Banner */}
        <div style={{
          height: '120px',
          background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust), var(--cat-brown))',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', right: '1.5rem', bottom: '-1rem', fontSize: '5rem', opacity: 0.12 }}>🐾</div>
        </div>

        {/* Avatar + info */}
        <div style={{ padding: '0 1.5rem 1.5rem', position: 'relative' }}>
          {/* Avatar */}
          <div style={{
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
            border: '4px solid var(--surface-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '2rem',
            fontWeight: 900,
            marginTop: '-44px',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-md)',
          }}>
            {p.profile_photo_url ? (
              <img src={p.profile_photo_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : initials(p.first_name, p.last_name)}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900 }}>
                {p.first_name} {p.last_name}
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(201,123,84,0.12)',
                  color: 'var(--cat-terra)',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                }}>
                  {roleLabel(u?.role)}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{u?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        {[
          { title: 'Personal Info', icon: '👤', fields: [
            { label: 'First Name',   value: p.first_name },
            { label: 'Last Name',    value: p.last_name },
            { label: 'Phone',        value: p.phone },
            { label: 'Date of Birth',value: p.date_of_birth ? formatDate(p.date_of_birth) : null },
          ]},
          { title: 'Account Info', icon: '🔐', fields: [
            { label: 'Email',         value: u?.email },
            { label: 'Role',          value: roleLabel(u?.role) },
            { label: 'Email Verified',value: u?.is_email_verified ? '✅ Yes' : '❌ No' },
            { label: 'Member Since',  value: memberSince },
          ]},
        ].map(({ title, icon, fields }) => (
          <div key={title} style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            padding: '1.25rem',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {icon} {title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {fields.filter(f => f.value).map(f => (
                <InfoBlock key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Vet approval status */}
      {u?.role === 'VET' && u?.vet_profile && (
        <VetApprovalCard vp={u.vet_profile} emailVerified={u?.is_email_verified} onChanged={() => window.location.reload()} />
      )}

      {/* Bio */}
      {p.bio && (
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🐾 Bio</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{p.bio}</p>
        </div>
      )}

      {/* Quick links */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '0.75rem',
      }}>
        {[
          { to: '/adoption/my-applications', icon: '❤️', label: 'My Applications' },
          { to: '/cats',                      icon: '🐱', label: 'My Cats' },
          { to: '/messages',                  icon: '💬', label: 'Messages' },
          { to: '/notifications',             icon: '🔔', label: 'Notifications' },
        ].map(({ to, icon, label }) => (
          <Link key={to} to={to} style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '1rem',
            textDecoration: 'none',
            textAlign: 'center',
            transition: 'all 0.2s',
            display: 'block',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--cat-terra)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{icon}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}