import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { sheltersApi } from '../../api/sheltersApi';
import PhoneInput, { isValidPkMobile } from '../../components/PhoneInput';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import TermsConsent from '../../components/TermsConsent';

const ROLES = [
  { value: 'ADOPTER',   emoji: '❤️', label: 'Adopter',       desc: 'I want to adopt a cat' },
  { value: 'CAT_OWNER', emoji: '🐱', label: 'Cat Owner',     desc: 'I already own cats' },
  { value: 'VOLUNTEER', emoji: '🙋', label: 'Volunteer',     desc: 'I want to help rescue cats' },
  { value: 'VET',       emoji: '🩺', label: 'Veterinarian',  desc: 'I provide medical care' },
];

const SKILLS = ['RESCUE', 'TRANSPORT', 'FOSTERING', 'FUNDRAISING', 'MEDICAL_ASSIST', 'EVENT_SUPPORT'];
const HOUSING = ['HOUSE', 'APARTMENT', 'CONDO', 'FARM', 'OTHER'];

// Common feline-veterinary specializations for the multi-select. Vets can also
// add any missing one via the free-text box.
const CAT_VET_SPECIALIZATIONS = [
  'Feline General Medicine',
  'Feline Surgery',
  'Internal Medicine',
  'Dermatology',
  'Dentistry',
  'Cardiology',
  'Ophthalmology',
  'Oncology',
  'Neurology',
  'Nutrition',
  'Behavior',
  'Emergency & Critical Care',
  'Diagnostic Imaging / Radiology',
  'Anesthesiology',
  'Reproduction / Theriogenology',
  'Parasitology',
  'Preventive Care & Vaccination',
  'Infectious Diseases',
];

// A3: only RFC-style format validation; no domain allow-list.
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : 'Please enter a valid email address';
};

export default function RegisterPage() {
  useDocumentTitle('Create Account');
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: basics + role, 2: role details, 3: success
  const [form, setForm] = useState({
    email: '', password: '', first_name: '', last_name: '', dob: '', role: 'ADOPTER',
  });
  const [details, setDetails] = useState({
    shelter_id: '', service_radius_km: 10, bio: '', skills: [],
    // Vet fields
    reg_digits: '', reg_len: 3, practice_type: 'CLINIC',
    clinic_name: '', clinic_location: '', clinic_registration_number: '',
    specializations: [], custom_specialization: '',
    housing_type: 'HOUSE', has_other_pets: false, household_info: '',
    phone: '', address: '', city: '',
  });
  const [shelters, setShelters] = useState([]);
  const [sheltersLoaded, setSheltersLoaded] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFieldErrors(fe => ({ ...fe, [k]: undefined })); };
  const setD = (k, v) => { setDetails(d => ({ ...d, [k]: v })); setFieldErrors(fe => ({ ...fe, [k]: undefined })); };

  // Load shelters when a volunteer, or a shelter-based vet, reaches step 2.
  const needsShelters = form.role === 'VOLUNTEER'
    || (form.role === 'VET' && details.practice_type === 'SHELTER');
  useEffect(() => {
    if (step === 2 && needsShelters && !sheltersLoaded) {
      sheltersApi.list().then(res => {
        const list = res.data?.data?.results || res.data?.data || res.data?.results || res.data || [];
        setShelters(Array.isArray(list) ? list : []);
        setSheltersLoaded(true);
      }).catch(() => setSheltersLoaded(true));
    }
  }, [step, needsShelters, sheltersLoaded]);

  const toggleSpecialization = (spec) => {
    setDetails(d => ({
      ...d,
      specializations: d.specializations.includes(spec)
        ? d.specializations.filter(s => s !== spec)
        : [...d.specializations, spec],
    }));
    setFieldErrors(fe => ({ ...fe, specializations: undefined }));
  };

  const addCustomSpecialization = () => {
    const val = details.custom_specialization.trim();
    if (!val) return;
    setDetails(d => ({
      ...d,
      specializations: d.specializations.includes(val) ? d.specializations : [...d.specializations, val],
      custom_specialization: '',
    }));
    setFieldErrors(fe => ({ ...fe, specializations: undefined }));
  };

  const regNumber = () => (details.reg_digits ? `RVMP${details.reg_digits}` : '');

  const toggleSkill = (skill) => {
    setDetails(d => ({
      ...d,
      skills: d.skills.includes(skill) ? d.skills.filter(s => s !== skill) : [...d.skills, skill],
    }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.';
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.dob) {
      const dob = new Date(form.dob);
      if (dob >= new Date()) errs.dob = 'Date of birth must be in the past.';
    }
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (form.role === 'VOLUNTEER') {
      if (sheltersLoaded && shelters.length === 0) return errs; // blocked message shown instead
      if (!details.shelter_id) errs.shelter_id = 'Please select a shelter to join.';
    } else if (form.role === 'VET') {
      const digits = details.reg_digits.trim();
      if (!digits) {
        errs.registration_number = 'Registration number is required.';
      } else if (digits.length !== Number(details.reg_len) || !/^\d+$/.test(digits)) {
        errs.registration_number = `Enter exactly ${details.reg_len} digits after RVMP.`;
      }
      if (details.practice_type === 'CLINIC') {
        if (!details.clinic_location.trim()) errs.clinic_location = 'Clinic location is required.';
        if (!details.clinic_registration_number.trim()) errs.clinic_registration_number = 'Clinic registration number is required.';
      } else if (details.practice_type === 'SHELTER') {
        if (sheltersLoaded && shelters.length === 0) {
          // allowed: shelter binding is optional if none exist
        } else if (!details.shelter_id) {
          errs.shelter_id = 'Please select the shelter you will work at.';
        }
      }
      if (details.specializations.length === 0) errs.specializations = 'Select at least one specialization.';
    } else if (form.role === 'CAT_OWNER') {
      if (details.phone && !isValidPkMobile(details.phone)) errs.phone = 'Enter a valid Pakistani mobile number.';
    }
    return errs;
  };

  const buildRoleDetails = () => {
    switch (form.role) {
      case 'VOLUNTEER':
        return {
          shelter_id: details.shelter_id,
          service_radius_km: details.service_radius_km,
          bio: details.bio,
          skills: details.skills,
        };
      case 'VET':
        return {
          registration_number: regNumber(),
          practice_type: details.practice_type,
          specializations: details.specializations,
          ...(details.practice_type === 'CLINIC'
            ? {
                clinic_name: details.clinic_name,
                clinic_location: details.clinic_location,
                clinic_registration_number: details.clinic_registration_number,
              }
            : { shelter_id: details.shelter_id }),
        };
      case 'ADOPTER':
        return {
          housing_type: details.housing_type,
          has_other_pets: details.has_other_pets,
          household_info: details.household_info,
        };
      case 'CAT_OWNER':
        return { phone: details.phone, address: details.address, city: details.city };
      default:
        return {};
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length) { setFieldErrors(errs); return; }
      setStep(2);
      return;
    }
    const errs = validateStep2();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    if (!agreed) {
      setError('Please accept the Terms & Conditions and Licensing Agreement to create your account.');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        dob: form.dob || null,
        role: form.role,
        role_details: buildRoleDetails(),
      });
      setStep(3);
    } catch (err) {
      const detail = err.response?.data?.error?.details;
      if (detail && typeof detail === 'object') {
        const mapped = {};
        const flatten = (obj) => {
          Object.entries(obj).forEach(([k, v]) => {
            if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v);
            else mapped[k] = Array.isArray(v) ? v.join(', ') : String(v);
          });
        };
        flatten(detail);
        setFieldErrors(mapped);
        // jump to the step where the error belongs
        if (mapped.email || mapped.password || mapped.first_name || mapped.last_name || mapped.date_of_birth || mapped.dob) {
          setStep(1);
        }
        setError('Please fix the highlighted fields.');
      } else {
        const msg = err.response?.data?.error?.message || '';
        setError(msg.includes('EMAIL_ALREADY_EXISTS')
          ? 'An account with this email already exists.'
          : 'Registration failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 3) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cat-cream)', padding: '2rem' }}>
        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-default)', borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✉️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.75rem' }}>Check your inbox! 🐾</h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 1rem', fontSize: '0.9375rem' }}>
            We sent a verification link to <strong style={{ color: 'var(--cat-terra)' }}>{form.email}</strong>. Click it to activate your account.
          </p>
          {form.role === 'VET' && (
            <div style={{ background: 'var(--cat-linen)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '0.9rem 1rem', margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'left' }}>
              🩺 Your registration request has been sent to a <strong>Super Admin</strong> and then a <strong>Shelter Admin</strong> for approval. After verifying your email you can log in, but vet features stay locked until both approve your request.
            </div>
          )}
          <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '0.875rem' }}>🐾 Go to Login</Link>
        </div>
      </div>
    );
  }

  const errStyle = { color: 'var(--cat-red)', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 600 };
  const fieldBorder = (name) => fieldErrors[name] ? { borderColor: 'var(--cat-red)' } : undefined;
  const volunteersBlocked = form.role === 'VOLUNTEER' && sheltersLoaded && shelters.length === 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cat-cream)', padding: '2rem' }}>
      <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-default)', borderRadius: '24px', padding: '2.5rem', maxWidth: '480px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1rem' }}>🐾</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.375rem' }}>Join CatConnect</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Help us care for every cat 🐱</p>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step >= s ? 'var(--cat-terra)' : 'var(--cat-linen)', border: step >= s ? 'none' : '1.5px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: step >= s ? 'white' : 'var(--text-muted)' }}>{s}</div>
              {s < 2 && <div style={{ width: '40px', height: '2px', background: step > s ? 'var(--cat-terra)' : 'var(--border-default)' }} />}
            </div>
          ))}
        </div>

        {error && <div className="form-error" style={{ marginBottom: '1.25rem' }}>🙀 {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {step === 1 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label-base">First name</label>
                  <input required value={form.first_name} onChange={e => set('first_name', e.target.value)} className="input-base" placeholder="Emma" id="reg-fname" style={fieldBorder('first_name')} />
                  {fieldErrors.first_name && <div style={errStyle}>{fieldErrors.first_name}</div>}
                </div>
                <div className="form-group">
                  <label className="label-base">Last name</label>
                  <input required value={form.last_name} onChange={e => set('last_name', e.target.value)} className="input-base" placeholder="Watson" id="reg-lname" style={fieldBorder('last_name')} />
                  {fieldErrors.last_name && <div style={errStyle}>{fieldErrors.last_name}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="label-base">Email address</label>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className="input-base" placeholder="you@example.com" id="reg-email" style={fieldBorder('email')} />
                {fieldErrors.email
                  ? <div style={errStyle}>{fieldErrors.email}</div>
                  : <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>Any valid email works — school, work, or personal.</small>}
              </div>

              <div className="form-group">
                <label className="label-base">Date of birth</label>
                <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} className="input-base" id="reg-dob" style={fieldBorder('dob')} max={new Date().toISOString().split('T')[0]} />
                {fieldErrors.dob && <div style={errStyle}>{fieldErrors.dob}</div>}
              </div>

              <div className="form-group">
                <label className="label-base">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} required minLength={8} value={form.password} onChange={e => set('password', e.target.value)} className="input-base" placeholder="Min 8 chars, 1 uppercase, 1 number" id="reg-password" style={{ paddingRight: '3rem', ...(fieldBorder('password') || {}) }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)', padding: 0 }}>{showPass ? '🙈' : '👁️'}</button>
                </div>
                {fieldErrors.password && <div style={errStyle}>{fieldErrors.password}</div>}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', margin: '0.5rem 0 0' }}>I am joining as a…</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => set('role', r.value)} style={{ padding: '1rem', borderRadius: '12px', border: `2px solid ${form.role === r.value ? 'var(--cat-terra)' : 'var(--border-default)'}`, background: form.role === r.value ? 'rgba(201,123,84,0.08)' : 'var(--surface-card)', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{r.emoji}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{r.desc}</div>
                  </button>
                ))}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginTop: '0.5rem' }}>Continue → Role details</button>
            </>
          )}

          {step === 2 && (
            <>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', margin: 0 }}>
                {ROLES.find(r => r.value === form.role)?.emoji} {ROLES.find(r => r.value === form.role)?.label} details
              </p>

              {/* VOLUNTEER */}
              {form.role === 'VOLUNTEER' && (
                volunteersBlocked ? (
                  <div className="form-error">
                    No shelters are available to join yet. Volunteer signup requires an active shelter — please check back later or contact an administrator.
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="label-base">Shelter to join *</label>
                      <select value={details.shelter_id} onChange={e => setD('shelter_id', e.target.value)} className="input-base" id="reg-shelter" style={fieldBorder('shelter_id')}>
                        <option value="">{sheltersLoaded ? 'Select a shelter…' : 'Loading shelters…'}</option>
                        {shelters.map(s => <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}</option>)}
                      </select>
                      {fieldErrors.shelter_id && <div style={errStyle}>{fieldErrors.shelter_id}</div>}
                    </div>
                    <div className="form-group">
                      <label className="label-base">Service radius (km)</label>
                      <input type="number" min="1" max="200" value={details.service_radius_km} onChange={e => setD('service_radius_km', e.target.value)} className="input-base" id="reg-radius" />
                    </div>
                    <div className="form-group">
                      <label className="label-base">Skills</label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {SKILLS.map(skill => (
                          <button type="button" key={skill} onClick={() => toggleSkill(skill)} style={{ padding: '0.35rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${details.skills.includes(skill) ? 'var(--cat-terra)' : 'var(--border-default)'}`, background: details.skills.includes(skill) ? 'var(--cat-terra)' : 'var(--surface-card)', color: details.skills.includes(skill) ? 'white' : 'var(--text-secondary)' }}>
                            {skill.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="label-base">Short bio</label>
                      <textarea value={details.bio} onChange={e => setD('bio', e.target.value)} className="input-base" rows={2} placeholder="Tell us a bit about yourself" style={{ resize: 'vertical' }} />
                    </div>
                  </>
                )
              )}

              {/* VET */}
              {form.role === 'VET' && (
                <>
                  {/* Registration number: fixed RVMP prefix + 3/5 digit choice */}
                  <div className="form-group">
                    <label className="label-base">Registration number *</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {[3, 5].map(len => (
                        <label key={len} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', padding: '0.35rem 0.7rem', border: `1.5px solid ${Number(details.reg_len) === len ? 'var(--cat-terra)' : 'var(--border-default)'}`, borderRadius: '999px', background: Number(details.reg_len) === len ? 'rgba(201,123,84,0.08)' : 'var(--surface-card)' }}>
                          <input type="checkbox" checked={Number(details.reg_len) === len} onChange={() => { setD('reg_len', len); setD('reg_digits', ''); }} style={{ width: '1rem', height: '1rem' }} />
                          {len} digits
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                      <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.85rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--cat-terra)', background: 'var(--cat-linen)', border: '1.5px solid var(--border-default)', borderRight: 'none', borderRadius: '10px 0 0 10px' }}>RVMP</span>
                      <input
                        value={details.reg_digits}
                        onChange={e => setD('reg_digits', e.target.value.replace(/\D/g, '').slice(0, Number(details.reg_len)))}
                        className="input-base"
                        inputMode="numeric"
                        placeholder={'0'.repeat(Number(details.reg_len))}
                        style={{ borderRadius: '0 10px 10px 0', ...(fieldBorder('registration_number') || {}) }}
                      />
                    </div>
                    <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Your PVMC number — "RVMP" then {details.reg_len} digits{details.reg_digits ? ` → ${regNumber()}` : ''}.
                    </small>
                    {fieldErrors.registration_number && <div style={errStyle}>{fieldErrors.registration_number}</div>}
                  </div>

                  {/* Practice type */}
                  <div className="form-group">
                    <label className="label-base">Where will you practise? *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {[
                        { value: 'CLINIC', emoji: '🏥', label: 'At a clinic' },
                        { value: 'SHELTER', emoji: '🏠', label: 'At a shelter' },
                      ].map(opt => (
                        <button type="button" key={opt.value} onClick={() => setD('practice_type', opt.value)} style={{ padding: '0.85rem', borderRadius: '12px', border: `2px solid ${details.practice_type === opt.value ? 'var(--cat-terra)' : 'var(--border-default)'}`, background: details.practice_type === opt.value ? 'rgba(201,123,84,0.08)' : 'var(--surface-card)', cursor: 'pointer', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.35rem', marginBottom: '0.2rem' }}>{opt.emoji}</div>
                          <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{opt.label}</div>
                        </button>
                      ))}
                    </div>
                    {fieldErrors.practice_type && <div style={errStyle}>{fieldErrors.practice_type}</div>}
                  </div>

                  {/* Clinic details */}
                  {details.practice_type === 'CLINIC' && (
                    <>
                      <div className="form-group">
                        <label className="label-base">Clinic name</label>
                        <input value={details.clinic_name} onChange={e => setD('clinic_name', e.target.value)} className="input-base" placeholder="Happy Paws Veterinary Clinic" />
                      </div>
                      <div className="form-group">
                        <label className="label-base">Clinic location *</label>
                        <input value={details.clinic_location} onChange={e => setD('clinic_location', e.target.value)} className="input-base" placeholder="Street, area, city" style={fieldBorder('clinic_location')} />
                        {fieldErrors.clinic_location && <div style={errStyle}>{fieldErrors.clinic_location}</div>}
                      </div>
                      <div className="form-group">
                        <label className="label-base">Clinic registration number *</label>
                        <input value={details.clinic_registration_number} onChange={e => setD('clinic_registration_number', e.target.value)} className="input-base" placeholder="Official clinic registration / license no." style={fieldBorder('clinic_registration_number')} />
                        {fieldErrors.clinic_registration_number && <div style={errStyle}>{fieldErrors.clinic_registration_number}</div>}
                      </div>
                    </>
                  )}

                  {/* Shelter selection */}
                  {details.practice_type === 'SHELTER' && (
                    <div className="form-group">
                      <label className="label-base">Shelter you will work at *</label>
                      <select value={details.shelter_id} onChange={e => setD('shelter_id', e.target.value)} className="input-base" style={fieldBorder('shelter_id')}>
                        <option value="">{sheltersLoaded ? 'Select a shelter…' : 'Loading shelters…'}</option>
                        {shelters.map(s => <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}</option>)}
                      </select>
                      {sheltersLoaded && shelters.length === 0 && (
                        <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                          No shelters listed yet — you can still register and be assigned later.
                        </small>
                      )}
                      {fieldErrors.shelter_id && <div style={errStyle}>{fieldErrors.shelter_id}</div>}
                    </div>
                  )}

                  {/* Specializations multi-select */}
                  <div className="form-group">
                    <label className="label-base">Specializations *</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      {CAT_VET_SPECIALIZATIONS.map(spec => {
                        const on = details.specializations.includes(spec);
                        return (
                          <button type="button" key={spec} onClick={() => toggleSpecialization(spec)} style={{ padding: '0.3rem 0.65rem', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${on ? 'var(--cat-terra)' : 'var(--border-default)'}`, background: on ? 'var(--cat-terra)' : 'var(--surface-card)', color: on ? 'white' : 'var(--text-secondary)' }}>
                            {on ? '✓ ' : ''}{spec}
                          </button>
                        );
                      })}
                    </div>
                    {/* Custom specializations not in the list */}
                    {details.specializations.filter(s => !CAT_VET_SPECIALIZATIONS.includes(s)).length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {details.specializations.filter(s => !CAT_VET_SPECIALIZATIONS.includes(s)).map(spec => (
                          <button type="button" key={spec} onClick={() => toggleSpecialization(spec)} style={{ padding: '0.3rem 0.65rem', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', border: '1.5px solid var(--cat-rust)', background: 'var(--cat-rust)', color: 'white' }}>
                            ✕ {spec}
                          </button>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        value={details.custom_specialization}
                        onChange={e => setD('custom_specialization', e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSpecialization(); } }}
                        className="input-base"
                        placeholder="Add another specialization…"
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={addCustomSpecialization} className="btn btn-secondary" style={{ padding: '0 1rem' }}>Add</button>
                    </div>
                    {fieldErrors.specializations && <div style={errStyle}>{fieldErrors.specializations}</div>}
                  </div>

                  <div style={{ background: 'var(--cat-linen)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '0.75rem 0.9rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    🔐 Your request will be reviewed by a <strong>Super Admin</strong> and then a <strong>Shelter Admin</strong>. You can log in right away, but vet features stay locked until both approve.
                  </div>
                </>
              )}

              {/* ADOPTER */}
              {form.role === 'ADOPTER' && (
                <>
                  <div className="form-group">
                    <label className="label-base">Housing type</label>
                    <select value={details.housing_type} onChange={e => setD('housing_type', e.target.value)} className="input-base">
                      {HOUSING.map(h => <option key={h} value={h}>{h.charAt(0) + h.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={details.has_other_pets} onChange={e => setD('has_other_pets', e.target.checked)} style={{ width: '1.1rem', height: '1.1rem' }} />
                    I have other pets at home
                  </label>
                  <div className="form-group">
                    <label className="label-base">Household info</label>
                    <textarea value={details.household_info} onChange={e => setD('household_info', e.target.value)} className="input-base" rows={2} placeholder="Who lives in your home? Any children?" style={{ resize: 'vertical' }} />
                  </div>
                </>
              )}

              {/* CAT_OWNER */}
              {form.role === 'CAT_OWNER' && (
                <>
                  <div className="form-group">
                    <label className="label-base">Phone</label>
                    <PhoneInput value={details.phone} onChange={v => setD('phone', v)} error={fieldErrors.phone} />
                    {fieldErrors.phone && <div style={errStyle}>{fieldErrors.phone}</div>}
                  </div>
                  <div className="form-group">
                    <label className="label-base">Address</label>
                    <input value={details.address} onChange={e => setD('address', e.target.value)} className="input-base" placeholder="Street address" />
                  </div>
                  <div className="form-group">
                    <label className="label-base">City</label>
                    <input value={details.city} onChange={e => setD('city', e.target.value)} className="input-base" placeholder="City" />
                  </div>
                </>
              )}

              {!volunteersBlocked && (
                <div style={{ marginTop: '0.25rem' }}>
                  <TermsConsent checked={agreed} onChange={setAgreed} id="register-terms" />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => { setStep(1); setError(''); }} className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>← Back</button>
                <button type="submit" disabled={loading || volunteersBlocked || !agreed} className="btn btn-primary" style={{ flex: 2, padding: '0.75rem' }}>
                  {loading
                    ? (form.role === 'VET' ? '🐾 Sending request…' : '🐾 Creating account…')
                    : (form.role === 'VET' ? '🩺 Send Registration Request' : '🐾 Create Account')}
                </button>
              </div>
            </>
          )}
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--cat-terra)', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
