import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { lostFoundApi } from '../../api/lostFoundApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import PhoneInput, { isValidPkMobile } from '../../components/PhoneInput';
import { timeAgo } from '../../utils/dateUtils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

const STATUS_BADGE = {
  OPEN:      { bg: 'linear-gradient(90deg, var(--cat-sage), #4A8A42)', label: '✅ FOUND' },
  MATCHED:   { bg: 'linear-gradient(90deg, #e0a92e, #c78b1e)', label: '🔗 MATCHED' },
  REUNITED:  { bg: 'linear-gradient(90deg, #7BAD6E, #5A9B50)', label: '🎉 REUNITED' },
  SHELTERED: { bg: 'linear-gradient(90deg, #5B8DB8, #3E6E96)', label: '🏠 SHELTERED' },
  CLOSED:    { bg: 'linear-gradient(90deg, #9a8f86, #6e655d)', label: 'CLOSED' },
};

// Sentinel for the breed dropdown when the finder can't identify the breed.
const BREED_DONT_KNOW = '__DONT_KNOW__';

const EMPTY_FORM = {
  description: '', breed_choice: '', breed_describe: '', color: '',
  found_latitude: '', found_longitude: '', contact_phone: '', contact_email: '',
  is_lost_cat: false, possible_lost_alert: '',
};

export default function FoundReportsPage() {
  const navigate = useNavigate();
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(12);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [lostOptions, setLostOptions] = useState([]);

  const { data, loading, refetch } = useApi(
    () => lostFoundApi.listFound({ page, page_size: pageSize, status: statusFilter, q: search || undefined }),
    null,
    [page, statusFilter, search]
  );
  const reports    = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Breed dropdown options from the shared BREED lookup.
  const { data: breedsData } = useApi(() => lostFoundApi.listBreeds());
  const breeds = Array.isArray(breedsData) ? breedsData : (breedsData?.results || []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Load active lost alerts to offer as a manual link when the finder thinks
  // this is a specific lost cat.
  useEffect(() => {
    if (form.is_lost_cat && lostOptions.length === 0) {
      lostFoundApi.listLost({ status: 'ACTIVE', page_size: 100 })
        .then(res => setLostOptions(res.data?.data?.results || []))
        .catch(() => {});
    }
  }, [form.is_lost_cat, lostOptions.length]);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { set('found_latitude', String(pos.coords.latitude)); set('found_longitude', String(pos.coords.longitude)); setLocating(false); },
      () => setLocating(false)
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.contact_phone && !isValidPkMobile(form.contact_phone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the phone blank.');
      return;
    }
    setSaving(true); setError('');
    try {
      // Resolve breed: a picked breed label, or the free-text description when
      // the finder chose "Don't know".
      const breedGuess = form.breed_choice === BREED_DONT_KNOW
        ? form.breed_describe.trim()
        : form.breed_choice;

      const fd = new FormData();
      fd.append('description', form.description);
      if (breedGuess) fd.append('breed_guess', breedGuess);
      if (form.color) fd.append('color', form.color);
      if (form.found_latitude) fd.append('found_latitude', form.found_latitude);
      if (form.found_longitude) fd.append('found_longitude', form.found_longitude);
      if (form.contact_phone) fd.append('contact_phone', form.contact_phone);
      if (form.contact_email) fd.append('contact_email', form.contact_email);
      fd.append('found_at', new Date().toISOString());
      if (form.is_lost_cat && form.possible_lost_alert) fd.append('possible_lost_alert', form.possible_lost_alert);
      photos.forEach(p => fd.append('photos', p));

      const res = await lostFoundApi.createFound(fd);
      const created = res.data?.data || {};
      setAddOpen(false);
      setForm(EMPTY_FORM);
      setPhotos([]);
      // Take the finder straight to the comparison/matches view.
      if (created.id) navigate(`/lost-found/found/${created.id}`);
      else refetch();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit found report.');
    }
    setSaving(false);
  };

  return (
    <div className="page-container">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-sage), #4A8A42)',
        borderRadius: '20px', padding: '2rem 2.5rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(123,173,110,0.3)',
      }}>
        <div style={{ position: 'absolute', right: '1.5rem', bottom: '-0.5rem', fontSize: '6rem', opacity: 0.1 }}>📋</div>
        <div>
          <h1 style={{ color: 'white', margin: '0 0 0.375rem', fontSize: '1.75rem', fontWeight: 900 }}>📋 Found Cat Reports</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.9375rem' }}>
            Found a cat? Report it — we'll compare it with lost-cat reports, or a shelter can take it in.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/lost-found" style={{ background: 'rgba(255,255,255,0.18)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
            🔍 Lost Cats
          </Link>
          <button onClick={() => setAddOpen(true)} style={{
            background: 'white', color: '#2E6B24', padding: '0.75rem 1.5rem', borderRadius: '10px',
            fontWeight: 800, fontSize: '0.875rem', border: 'none', cursor: 'pointer',
          }}>
            + Report Found Cat
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', padding: '0.875rem 1.25rem', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px' }}>
        <input type="search" value={search} onChange={e => { setSearch(e.target.value); reset(); }}
          placeholder="🔍 Search by description or breed…" className="input-base" style={{ flex: 1, minWidth: '200px' }} />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); reset(); }} className="input-base" style={{ width: 'auto' }}>
          <option value="OPEN">Open</option>
          <option value="MATCHED">Matched</option>
          <option value="REUNITED">Reunited</option>
          <option value="SHELTERED">Sheltered</option>
          <option value="ALL">All</option>
        </select>
      </div>

      {loading && <LoadingSpinner size="lg" text="Loading found reports…" />}

      {!loading && reports.length === 0 && (
        <EmptyState icon="📋" title="No found cat reports"
          message="No one has reported a found cat here yet. If you find one, report it!"
          action={<button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Report Found Cat</button>} />
      )}

      {!loading && reports.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {reports.map(rep => {
            const badge = STATUS_BADGE[rep.status] || STATUS_BADGE.OPEN;
            return (
              <Link key={rep.id} to={`/lost-found/found/${rep.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface-card)', border: '1px solid var(--border-default)',
                  borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s', height: '100%',
                }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                >
                  <div style={{ height: '160px', background: 'var(--cat-linen)', position: 'relative', overflow: 'hidden' }}>
                    <img src={(rep.photos && rep.photos[0]) || CAT_PLACEHOLDER} alt="Found cat"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: badge.bg, color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '999px' }}>
                      {badge.label}
                    </div>
                    {rep.match_count > 0 && (
                      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'var(--cat-amber, #e6b450)', color: '#3d2b1f', fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '999px' }}>
                        🔗 {rep.match_count} match{rep.match_count > 1 ? 'es' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {rep.description?.slice(0, 90)}{rep.description?.length > 90 ? '…' : ''}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {rep.breed_guess && <span style={{ background: 'var(--cat-linen)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>🦴 {rep.breed_guess}</span>}
                      {(rep.color_tags || []).slice(0, 1).map(c => <span key={c} style={{ background: 'var(--cat-linen)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>🎨 {c}</span>)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Reported {timeAgo(rep.created_at)}{rep.reporter_name ? ` by ${rep.reporter_name}` : ''}
                    </div>
                    <span style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--cat-terra)', fontWeight: 700 }}>
                      View &amp; compare →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      {/* Report found cat modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="📋 Report a Found Cat" size="md"
        footer={
          <>
            <button onClick={() => setAddOpen(false)} className="btn btn-secondary">Cancel</button>
            <button form="found-form" type="submit" disabled={saving} className="btn btn-primary" style={{ background: 'var(--cat-sage)' }}>
              {saving ? 'Submitting…' : '✅ Submit & Compare'}
            </button>
          </>
        }
      >
        {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form id="found-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="form-group">
            <label className="label-base">Description *</label>
            <textarea required value={form.description} onChange={e => set('description', e.target.value)}
              className="input-base" rows={3} placeholder="Appearance, markings, behavior, where you found it…" style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Breed (guess)</label>
              <select value={form.breed_choice} onChange={e => set('breed_choice', e.target.value)} className="input-base">
                <option value="">Select breed</option>
                {breeds.map(breed => (
                  <option key={breed.id} value={breed.display_label}>{breed.display_label}</option>
                ))}
                <option value={BREED_DONT_KNOW}>Don't know</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label-base">Color</label>
              <input value={form.color} onChange={e => set('color', e.target.value)} className="input-base" placeholder="e.g. orange tabby" />
            </div>
          </div>

          {form.breed_choice === BREED_DONT_KNOW && (
            <div className="form-group">
              <label className="label-base">Describe the breed / appearance</label>
              <input value={form.breed_describe} onChange={e => set('breed_describe', e.target.value)}
                className="input-base" placeholder="e.g. long grey fur, flat face, medium size" />
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                No worries if you're unsure — describe what the cat looks like and it still helps with matching.
              </p>
            </div>
          )}

          {/* Location */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="label-base" style={{ margin: 0 }}>Where did you find it?</label>
              <button type="button" onClick={getLocation} disabled={locating} className="btn btn-secondary btn-sm">
                {locating ? '⏳ Getting…' : '📡 Use my location'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input value={form.found_latitude} onChange={e => set('found_latitude', e.target.value)} className="input-base" placeholder="Latitude" type="number" step="any" />
              <input value={form.found_longitude} onChange={e => set('found_longitude', e.target.value)} className="input-base" placeholder="Longitude" type="number" step="any" />
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location helps match with nearby lost cats — but it's optional.</p>
          </div>

          {/* Is this a lost cat? */}
          <div style={{ background: 'var(--cat-linen)', borderRadius: '10px', padding: '0.875rem 1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_lost_cat} onChange={e => set('is_lost_cat', e.target.checked)} style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--cat-terra)' }} />
              I think this might be someone's lost cat
            </label>
            {form.is_lost_cat && (
              <div style={{ marginTop: '0.625rem' }}>
                <label className="label-base">Match it to a lost-cat report (optional)</label>
                <select value={form.possible_lost_alert} onChange={e => set('possible_lost_alert', e.target.value)} className="input-base">
                  <option value="">Let the system find matches automatically</option>
                  {lostOptions.map(a => <option key={a.id} value={a.id}>{a.title}{a.cat_name ? ` — ${a.cat_name}` : ''}</option>)}
                </select>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Either way, we'll compare the details and show you likely matches after you submit.
                </p>
              </div>
            )}
          </div>

          {/* Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Your phone</label>
              <PhoneInput value={form.contact_phone} onChange={v => set('contact_phone', v)} />
            </div>
            <div className="form-group">
              <label className="label-base">Your email</label>
              <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className="input-base" />
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="label-base">Photos</label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '80px', border: '2px dashed var(--border-default)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
              <span style={{ fontSize: '1.5rem' }}>📷</span>
              {photos.length > 0 ? `${photos.length} photo(s)` : 'Upload photos'}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => setPhotos(Array.from(e.target.files))} />
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
