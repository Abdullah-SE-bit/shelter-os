import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sheltersApi } from '../../api/sheltersApi';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import ShelterPhoneField, { isValidPkPhone } from '../../components/ShelterPhoneField';
import { formatDate } from '../../utils/dateUtils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

export default function ShelterDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, refetch } = useApi(() => sheltersApi.get(id), null, [id]);
  const { data: catsData, loading: catsLoading } = useApi(() => sheltersApi.getCats(id, { page_size: 8 }), null, [id]);

  const shelter = data?.data || data;
  const cats    = catsData?.results || [];

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({
    name: '', registration_number: '', street: '', city: '', country: 'Pakistan',
    phone: '', email: '', website: '', capacity_total: '', admin: '', description: ''
  });

  useEffect(() => {
    if (shelter) {
      setForm({
        name: shelter.name || '',
        registration_number: shelter.registration_number || '',
        street: shelter.street || '',
        city: shelter.city || '',
        country: shelter.country || 'Pakistan',
        phone: shelter.phone || '',
        email: shelter.email || '',
        website: shelter.website || '',
        capacity_total: shelter.capacity_total || '',
        admin: shelter.admin || '',
        description: shelter.description || '',
      });
    }
  }, [shelter]);

  useEffect(() => {
    if (editOpen && (user?.role === 'SUPER_ADMIN' || user?.role === 'SHELTER_ADMIN')) {
      authApi.listUsers({ role: 'SHELTER_ADMIN' }).then(res => {
        setAdmins(res.data?.data || []);
      }).catch(err => console.error('Failed to load admins:', err));
    }
  }, [editOpen, user]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPkPhone(form.phone)) {
      setEditError('Enter a valid Pakistani mobile (+92 3XX XXXXXXX) or landline number.');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      const payload = {
        ...form,
        capacity_total: parseInt(form.capacity_total) || 0,
        admin: form.admin || null,
      };
      await sheltersApi.update(id, payload);
      alert('Shelter updated successfully! 🎉');
      setEditOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.error?.message || 'Failed to update shelter.');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" text="Loading shelter…" /></div>;
  if (!shelter) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '4rem' }}>😿</div>
      <h2>Shelter not found</h2>
      <Link to="/shelters" className="btn btn-secondary" style={{ marginTop: '1rem' }}>← Back to Shelters</Link>
    </div>
  );

  return (
    <div>
      {/* Hero */}
      <div style={{
        height: '280px',
        background: shelter.logo_url
          ? `url(${shelter.logo_url}) center/cover`
          : 'linear-gradient(135deg, var(--cat-brown), var(--cat-espresso))',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,43,31,0.8) 0%, rgba(61,43,31,0.2) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '2rem', left: '2.5rem', right: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
            {shelter.logo_url && (
              <div style={{ width: '80px', height: '80px', borderRadius: '16px', overflow: 'hidden', border: '3px solid white', flexShrink: 0 }}>
                <img src={shelter.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ color: 'white', margin: '0 0 0.375rem', fontSize: '2rem', fontFamily: 'Playfair Display, serif' }}>{shelter.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9375rem' }}>
                {shelter.city ? `📍 ${shelter.city}` : ''}{shelter.country ? `, ${shelter.country}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* About */}
            {shelter.description && (
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
                <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800 }}>About 🏠</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.9375rem' }}>{shelter.description}</p>
              </div>
            )}

            {/* Cats */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>🐱 Cats in Shelter</h2>
                <Link to={`/cats?shelter=${id}`} style={{ fontSize: '0.8rem', color: 'var(--cat-terra)', textDecoration: 'none', fontWeight: 700 }}>See all →</Link>
              </div>
              {catsLoading && <LoadingSpinner text="Loading cats…" />}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {cats.map(cat => (
                  <Link key={cat.id} to={`/cats/${cat.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ borderRadius: '10px', overflow: 'hidden', background: 'var(--cat-linen)', aspectRatio: '1/1', position: 'relative' }}>
                      <img
                        src={cat.primary_photo_url || CAT_PLACEHOLDER}
                        alt={cat.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '80px' }}
                        onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }}
                      />
                      <div style={{ position: 'absolute', bottom: 0, insetInline: 0, padding: '0.375rem 0.5rem', background: 'linear-gradient(to top, rgba(61,43,31,0.8), transparent)' }}>
                        <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name || '?'}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {cats.length === 0 && !catsLoading && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No cats currently listed</p>
              )}
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Stats */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { icon: '🐱', label: 'Cats (occupancy)', value: shelter.current_occupancy ?? '—' },
                  { icon: '📦', label: 'Capacity',  value: shelter.capacity_total ?? '—' },
                  { icon: '🆓', label: 'Available', value: shelter.available_slots ?? '—' },
                  { icon: '🙋', label: 'Volunteers',value: shelter.volunteer_count ?? '—' },
                  { icon: '📅', label: 'Established',value: shelter.created_at ? `Since ${new Date(shelter.created_at).getFullYear()}` : '—' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', gap: '0.375rem' }}>
                      <span>{icon}</span>{label}
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--cat-terra)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
                {shelter.phone     && <a href={`tel:${shelter.phone}`}     style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', gap: '0.5rem' }}><span>📞</span>{shelter.phone}</a>}
                {shelter.email     && <a href={`mailto:${shelter.email}`}  style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', gap: '0.5rem', wordBreak: 'break-all' }}><span>✉️</span>{shelter.email}</a>}
                {(shelter.street || shelter.city) && <p style={{ margin: 0, color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}><span>📍</span>{[shelter.street, shelter.city, shelter.country].filter(Boolean).join(', ')}</p>}
                {shelter.website   && <a href={shelter.website} target="_blank" rel="noreferrer" style={{ color: 'var(--cat-terra)', textDecoration: 'none', display: 'flex', gap: '0.5rem' }}><span>🌐</span>Website ↗</a>}
              </div>
            </div>

            {/* Edit details button for Admin/Owner */}
            {(user?.role === 'SUPER_ADMIN' || (user?.role === 'SHELTER_ADMIN' && shelter.admin === user.id)) && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem', fontWeight: 700 }}
              >
                ✏️ Edit Shelter Info
              </button>
            )}

            {/* CTA */}
            <div style={{ background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))', borderRadius: '14px', padding: '1.25rem', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❤️</div>
              <p style={{ margin: '0 0 0.75rem', fontWeight: 700 }}>Adopt a cat from this shelter</p>
              <Link to={`/adoption?shelter=${id}`} style={{ background: 'white', color: 'var(--cat-rust)', padding: '0.625rem 1.25rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block' }}>
                View Available Cats →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Shelter Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="✏️ Edit Shelter Info"
        footer={
          <>
            <button onClick={() => setEditOpen(false)} className="btn btn-secondary">Cancel</button>
            <button form="edit-shelter-form" type="submit" disabled={editSaving} className="btn btn-primary">
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editError && <div className="form-error" style={{ marginBottom: '1rem' }}>🙀 {editError}</div>}
        <form id="edit-shelter-form" onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div className="form-group">
            <label className="label-base">Shelter Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="input-base"
            />
          </div>
          <div className="form-group">
            <label className="label-base">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="input-base"
              rows={3}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Capacity (Total Cats) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.capacity_total}
                onChange={e => setForm(prev => ({ ...prev, capacity_total: e.target.value }))}
                className="input-base"
              />
            </div>
            <div className="form-group">
              <label className="label-base">City *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label-base">Street Address</label>
            <input
              type="text"
              value={form.street}
              onChange={e => setForm(prev => ({ ...prev, street: e.target.value }))}
              className="input-base"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Phone *</label>
              <ShelterPhoneField
                cityName={form.city}
                value={form.phone}
                onChange={v => setForm(prev => ({ ...prev, phone: v }))}
                error={!!editError && !isValidPkPhone(form.phone)}
              />
            </div>
            <div className="form-group">
              <label className="label-base">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label-base">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))}
              className="input-base"
              placeholder="https://example.com"
            />
          </div>
          
          {user?.role === 'SUPER_ADMIN' && (
            <div className="form-group">
              <label className="label-base">Assign Shelter Owner / Manager</label>
              <select
                value={form.admin || ''}
                onChange={e => setForm(prev => ({ ...prev, admin: e.target.value }))}
                className="input-base"
              >
                <option value="">No manager assigned</option>
                {admins
                  .filter(adm => !adm.assigned_shelter_id || String(adm.assigned_shelter_id) === String(shelter.id))
                  .map(adm => (
                    <option key={adm.id} value={adm.id}>
                      {adm.email} {adm.profile ? `(${adm.profile.first_name} ${adm.profile.last_name})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}