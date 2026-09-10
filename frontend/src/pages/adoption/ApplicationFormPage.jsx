import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adoptionApi } from '../../api/adoptionApi';
import useApi from '../../hooks/useApi';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import PhoneInput, { isValidPkMobile } from '../../components/PhoneInput';

const INCOME_OPTS = ['EMPLOYED','SELF_EMPLOYED','STUDENT','RETIRED','UNEMPLOYED','OTHER'];
const HOUSING_OPTS = ['HOUSE','APARTMENT','CONDO','OTHER'];

export default function ApplicationFormPage() {
  const { catId } = useParams();
  const navigate  = useNavigate();
  const [form, setForm] = useState({
    cat: catId,
    motivation: '',
    living_situation: 'HOUSE',
    has_outdoor_access: false,
    has_other_pets: false,
    other_pets_details: '',
    has_children: false,
    children_ages: '',
    experience_with_cats: '',
    employment_status: 'EMPLOYED',
    monthly_income: '',
    vet_reference: '',
    personal_reference: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(1);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Advance a step, validating step 2's emergency-contact phone before leaving it.
  const goNext = (e) => {
    e.preventDefault();
    if (step === 2 && !isValidPkMobile(form.emergency_contact_phone)) {
      setError('Enter a valid Pakistani mobile number for the emergency contact (+92 3XX XXXXXXX).');
      return;
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await adoptionApi.submitApplication(form);
      navigate('/adoption/my-applications');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit application.');
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
      <PageHeader title="❤️ Adoption Application" subtitle="Tell us about yourself and your home" backPath={`/adoption/${catId}`} />

      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem', alignItems: 'center' }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: s < 3 ? 1 : 0 }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: step >= s ? 'var(--cat-terra)' : 'var(--cat-linen)',
              border: step >= s ? 'none' : '1.5px solid var(--border-default)',
              color: step >= s ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
              transition: 'all 0.3s',
            }}>
              {step > s ? '✓' : s}
            </div>
            {s < 3 && <div style={{ flex: 1, height: '2px', background: step > s ? 'var(--cat-terra)' : 'var(--border-default)', transition: 'background 0.3s' }} />}
          </div>
        ))}
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🚨 {error}</div>}

      <form onSubmit={step < 3 ? goNext : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Step 1 — Your Home */}
        {step === 1 && (
          <>
            <div style={sectionStyle}>
              <h3 style={sectionTitle}>🏠 Living Situation</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="form-group">
                  <label className="label-base">Housing Type</label>
                  <select value={form.living_situation} onChange={e => set('living_situation', e.target.value)} className="input-base" id="app-housing">
                    {HOUSING_OPTS.map(o => <option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'has_outdoor_access', label: '🌳 Has outdoor access' },
                    { key: 'has_other_pets',     label: '🐕 Has other pets' },
                    { key: 'has_children',       label: '👶 Has children at home' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                      <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)}
                        style={{ accentColor: 'var(--cat-terra)', width: '16px', height: '16px' }} />
                      {label}
                    </label>
                  ))}
                </div>
                {form.has_other_pets && (
                  <div className="form-group">
                    <label className="label-base">Other Pets Details</label>
                    <input value={form.other_pets_details} onChange={e => set('other_pets_details', e.target.value)}
                      className="input-base" placeholder="e.g. 1 dog (lab, very friendly), 2 cats" id="app-otherpets" />
                  </div>
                )}
                {form.has_children && (
                  <div className="form-group">
                    <label className="label-base">Children's Ages</label>
                    <input value={form.children_ages} onChange={e => set('children_ages', e.target.value)}
                      className="input-base" placeholder="e.g. 5, 8, 12" id="app-childages" />
                  </div>
                )}
              </div>
            </div>
            <div style={sectionStyle}>
              <h3 style={sectionTitle}>🐱 Cat Experience</h3>
              <div className="form-group">
                <label className="label-base">Your Experience with Cats *</label>
                <textarea required value={form.experience_with_cats} onChange={e => set('experience_with_cats', e.target.value)}
                  className="input-base" placeholder="Describe your past experience with cats, any training, etc."
                  rows={3} id="app-experience" style={{ resize: 'vertical' }} />
              </div>
            </div>
          </>
        )}

        {/* Step 2 — About You */}
        {step === 2 && (
          <>
            <div style={sectionStyle}>
              <h3 style={sectionTitle}>💼 Employment &amp; Income</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label-base">Employment Status</label>
                  <select value={form.employment_status} onChange={e => set('employment_status', e.target.value)} className="input-base" id="app-employment">
                    {INCOME_OPTS.map(o => <option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label-base">Monthly Income (PKR)</label>
                  <input type="number" value={form.monthly_income} onChange={e => set('monthly_income', e.target.value)}
                    className="input-base" placeholder="50000" id="app-income" />
                </div>
              </div>
            </div>
            <div style={sectionStyle}>
              <h3 style={sectionTitle}>📋 References</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="form-group">
                  <label className="label-base">Veterinarian Reference</label>
                  <input value={form.vet_reference} onChange={e => set('vet_reference', e.target.value)}
                    className="input-base" placeholder="Vet name and contact number" id="app-vetref" />
                </div>
                <div className="form-group">
                  <label className="label-base">Personal Reference</label>
                  <input value={form.personal_reference} onChange={e => set('personal_reference', e.target.value)}
                    className="input-base" placeholder="Name, relationship, phone" id="app-personalref" />
                </div>
              </div>
            </div>
            <div style={sectionStyle}>
              <h3 style={sectionTitle}>🆘 Emergency Contact</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label-base">Name *</label>
                  <input required value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)}
                    className="input-base" placeholder="Jane Doe" id="app-ecname" />
                </div>
                <div className="form-group">
                  <label className="label-base">Phone *</label>
                  <PhoneInput value={form.emergency_contact_phone} onChange={v => set('emergency_contact_phone', v)} id="app-ecphone" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 3 — Motivation */}
        {step === 3 && (
          <div style={sectionStyle}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem', animation: 'pawBounce 2s ease-in-out infinite' }}>❤️</div>
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Almost there!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tell us why you want to adopt this cat.</p>
            </div>
            <div className="form-group">
              <label className="label-base">Why do you want to adopt? *</label>
              <textarea required value={form.motivation} onChange={e => set('motivation', e.target.value)}
                className="input-base" placeholder="Share your story — why this cat, what kind of home are you offering, what your daily life is like…"
                rows={6} id="app-motivation" style={{ resize: 'vertical' }} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn btn-secondary" style={{ flex: 1, padding: '0.875rem' }}>
              ← Back
            </button>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, padding: '0.875rem' }}>
            {step < 3 ? 'Next →' : loading ? '❤️ Submitting…' : '❤️ Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}