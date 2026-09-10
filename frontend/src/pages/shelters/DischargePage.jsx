import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sheltersApi } from '../../api/sheltersApi';
import { adoptionApi } from '../../api/adoptionApi';
import useApi from '../../hooks/useApi';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import PhoneInput, { isValidPkMobile } from '../../components/PhoneInput';

const DISCHARGE_REASONS = ['ADOPTED', 'TRANSFERRED', 'DECEASED', 'ESCAPED', 'RETURNED_TO_OWNER', 'OTHER'];
// An adoption request that can still be finalized into an adoption.
const ACTIVE_APP_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'APPROVED'];

const REASON_INFO = {
  ADOPTED:           { icon: '❤️', label: 'Adopted', color: 'var(--cat-sage)' },
  TRANSFERRED:       { icon: '🏠', label: 'Transferred', color: 'var(--cat-blue)' },
  DECEASED:          { icon: '🕊️', label: 'Deceased', color: 'var(--text-muted)' },
  ESCAPED:           { icon: '🐾', label: 'Escaped', color: 'var(--cat-amber)' },
  RETURNED_TO_OWNER: { icon: '🤗', label: 'Returned to Owner', color: 'var(--cat-terra)' },
  OTHER:             { icon: '📋', label: 'Other', color: 'var(--text-secondary)' },
};

export default function DischargePage() {
  const navigate = useNavigate();
  const [reason, setReason] = useState('ADOPTED');
  const [selectedApp, setSelectedApp] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [feePaid, setFeePaid] = useState('');
  const [notes, setNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [shelterId, setShelterId] = useState(null);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    sheltersApi.myDashboard()
      .then(res => setShelterId(res.data?.data?.shelter_id || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (shelterId) {
      sheltersApi.getCats(shelterId, { status: 'IN_SHELTER' })
        .then(res => setCats(res.data?.data?.results || res.data?.data || []))
        .catch(() => {});
    }
  }, [shelterId]);

  // Adoption requests for this shelter (drives the ADOPTED discharge).
  const { data: appsData, loading: appsLoading } = useApi(() => adoptionApi.listApplications(), null, []);
  const applications = (Array.isArray(appsData) ? appsData : (appsData?.results || []))
    .filter(a => ACTIVE_APP_STATUSES.includes(a.status));

  const set = (fn) => (e) => { fn(e.target.value); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (reason === 'ADOPTED' && !selectedApp) {
      setError('Select the adopter\'s request — a cat can only be discharged as adopted through an adoption request.');
      return;
    }
    if (reason !== 'ADOPTED' && !selectedCat) {
      setError('Please select a cat to discharge.');
      return;
    }
    if (reason !== 'ADOPTED' && recipientPhone && !isValidPkMobile(recipientPhone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the recipient phone blank.');
      return;
    }
    setSaving(true);
    try {
      const payload = { reason, discharge_notes: notes };
      if (reason === 'ADOPTED') {
        payload.application = selectedApp;
        if (feePaid) payload.adoption_fee_paid = feePaid;
      } else {
        payload.cat_id = selectedCat;
        payload.recipient_name = recipientName;
        payload.recipient_phone = recipientPhone;
      }
      await sheltersApi.createDischarge('me', payload);
      navigate('/shelter/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to record discharge.');
    } finally {
      setSaving(false);
    }
  };

  const sec = { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' };
  const ttl = { margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div className="page-container-sm">
      <PageHeader title="📤 Cat Discharge" subtitle="Record a cat leaving the shelter" backPath="/shelter/dashboard" />

      {/* Reason picker */}
      <div style={{ ...sec, marginBottom: '1.25rem' }}>
        <h3 style={ttl}>Reason for Discharge</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
          {DISCHARGE_REASONS.map(r => {
            const info = REASON_INFO[r];
            return (
              <button key={r} type="button" onClick={() => { setReason(r); setError(''); }} style={{
                padding: '0.875rem 0.5rem',
                borderRadius: '10px',
                border: `2px solid ${reason === r ? info.color : 'var(--border-default)'}`,
                background: reason === r ? 'rgba(201,123,84,0.06)' : 'var(--cat-linen)',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                color: reason === r ? info.color : 'var(--text-secondary)',
                textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
              }}>
                <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
                {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🙀 {error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* ADOPTED — driven by an adoption request */}
        {reason === 'ADOPTED' && (
          <div style={sec}>
            <h3 style={ttl}>❤️ Adoption Request</h3>
            <div style={{ background: 'var(--cat-blue-light)', border: '1px solid rgba(46,90,128,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#2E5A80' }}>
              A cat can only be discharged as adopted through a registered adopter's request. Pick the request below — confirming finalizes the adoption and hands the cat to that adopter.
            </div>

            {appsLoading && <LoadingSpinner text="Loading adoption requests…" />}

            {!appsLoading && applications.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ margin: '0 0 0.75rem', fontWeight: 600 }}>No adoption requests yet.</p>
                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem' }}>
                  A registered adopter must apply for a cat before you can discharge it as adopted.
                  Their requests appear here automatically.
                </p>
                <Link to="/shelter/applications" className="btn btn-secondary btn-sm">View adoption applications →</Link>
              </div>
            )}

            {!appsLoading && applications.length > 0 && (
              <>
                <div className="form-group">
                  <label className="label-base">Select the adopter's request *</label>
                  <select value={selectedApp} onChange={set(setSelectedApp)} className="input-base" id="dis-app">
                    <option value="">Choose a cat and adopter…</option>
                    {applications.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.cat_name || 'Cat'} → {a.applicant_name || a.applicant_email} ({a.status.replace(/_/g, ' ').toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label-base">Adoption fee paid (optional)</label>
                  <input type="number" min="0" step="0.01" value={feePaid} onChange={set(setFeePaid)} className="input-base" placeholder="0" id="dis-fee" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Non-adoption — select an in-shelter cat */}
        {reason !== 'ADOPTED' && (
          <div style={sec}>
            <h3 style={ttl}>🐱 Cat &amp; Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="label-base">Cat (in shelter) *</label>
                <select value={selectedCat} onChange={set(setSelectedCat)} className="input-base" id="dis-cat">
                  <option value="">Select a cat…</option>
                  {cats.map(c => (
                    <option key={c.id} value={c.id}>{c.name || 'Unnamed'}{c.breed_label ? ` — ${c.breed_label}` : ''}</option>
                  ))}
                </select>
                {cats.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>No cats are currently in your shelter.</div>}
              </div>

              {['TRANSFERRED', 'RETURNED_TO_OWNER'].includes(reason) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="label-base">{reason === 'TRANSFERRED' ? 'Destination / recipient' : 'Owner name'}</label>
                    <input value={recipientName} onChange={set(setRecipientName)} className="input-base" id="dis-rname" />
                  </div>
                  <div className="form-group">
                    <label className="label-base">Phone</label>
                    <PhoneInput value={recipientPhone} onChange={v => { setRecipientPhone(v); setError(''); }} id="dis-rphone" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={sec}>
          <h3 style={ttl}>📝 Notes</h3>
          <textarea value={notes} onChange={set(setNotes)} className="input-base" rows={3}
            placeholder="Any notes about this discharge…" style={{ resize: 'vertical' }} id="dis-notes" />
        </div>

        <button type="submit" disabled={saving || (reason === 'ADOPTED' && applications.length === 0)}
          className="btn btn-primary" style={{ padding: '1rem', fontSize: '1rem', width: '100%', borderRadius: '12px' }}>
          {saving ? '📤 Recording…' : (reason === 'ADOPTED' ? '❤️ Finalize Adoption & Discharge' : '📤 Record Discharge')}
        </button>
      </form>
    </div>
  );
}
