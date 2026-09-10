import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { catsApi } from '../../api/catsApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDate, formatCatAge, statusLabel, catGenderLabel } from '../../utils/formatters';
import { STATUS_CSS } from '../../utils/constants';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80';

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function CatDetailPage() {
  const { id }        = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const [selectedImg, setSelectedImg] = useState(0);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [activeTab,   setActiveTab]   = useState('info');

  const { data: cat, loading, error } = useApi(() => catsApi.get(id), null, [id]);

  const canEdit   = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'].includes(user?.role);
  const canDelete = ['SUPER_ADMIN', 'SHELTER_ADMIN'].includes(user?.role);
  // Cat owners can "remove" (unlink) their own cats
  const canRemove = user?.role === 'CAT_OWNER' && cat?.owner_id === user?.id;

  const handleDelete = async () => {
    try {
      await catsApi.delete(id);
      navigate('/cats');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete cat');
    }
  };

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" text="Loading cat profile…" /></div>;
  if (error || !cat) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '4rem' }}>😿</div>
      <h2>Cat not found</h2>
      <Link to="/cats" className="btn btn-secondary" style={{ marginTop: '1rem' }}>← Back to Cats</Link>
    </div>
  );

  const photos = cat.photos?.length ? cat.photos : [null];
  const statusCss = STATUS_CSS[cat.current_status] || 'status-unknown';

  const tabs = [
    { id: 'info',    label: '📋 Info' },
    { id: 'medical', label: '💊 Medical', link: `/cats/${id}/medical` },
    { id: 'vaccines',label: '💉 Vaccines', link: `/cats/${id}/vaccinations` },
    { id: 'weight',  label: '⚖️ Weight', link: `/cats/${id}/weight` },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={cat.name || 'Unnamed Cat'}
        subtitle={`${cat.breed_label || 'Mixed breed'} · ${catGenderLabel(cat.gender)} · ${formatCatAge(cat.age_years, cat.age_months)}`}
        backPath="/cats"
        action={canEdit && (
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <Link to={`/cats/${id}/edit`} className="btn btn-secondary">✏️ Edit</Link>
            {canDelete && (
              <button onClick={() => setDeleteOpen(true)} className="btn btn-danger btn-sm">
                🗑️ Delete
              </button>
            )}
            {canRemove && (
              <button onClick={() => setDeleteOpen(true)} className="btn btn-warning btn-sm">
                ✖️ Remove from My Cats
              </button>
            )}
          </div>
        )}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left — photos */}
        <div>
          {/* Main photo */}
          <div style={{
            borderRadius: '16px',
            overflow: 'hidden',
            height: '320px',
            background: 'var(--cat-linen)',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-md)',
          }}>
            <img
              src={photos[selectedImg]?.photo_url || CAT_PLACEHOLDER}
              alt={cat.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }}
            />
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {photos.map((p, i) => (
                <div key={i} onClick={() => setSelectedImg(i)} style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `2px solid ${selectedImg === i ? 'var(--cat-terra)' : 'var(--border-default)'}`,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  flexShrink: 0,
                }}>
                  <img src={p?.photo_url || CAT_PLACEHOLDER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                </div>
              ))}
            </div>
          )}

          {/* Status card */}
          <div style={{
            marginTop: '1rem',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Current Status</span>
              <span className={`badge ${statusCss}`}>{statusLabel(cat.current_status)}</span>
            </div>
            {cat.shelter_name && (
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                📍 {cat.shelter_name}
              </p>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {cat.current_status === 'IN_SHELTER' && (
              <Link to={`/adoption/${id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                ❤️ View Adoption Listing
              </Link>
            )}
            <Link to={`/cats/${id}/medical`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              🏥 Medical History
            </Link>
          </div>
        </div>

        {/* Right — details */}
        <div>
          {/* Tabs */}
          <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
            {tabs.map(tab => (
              tab.link ? (
                <Link key={tab.id} to={tab.link} className="tab-item" style={{ textDecoration: 'none' }}>
                  {tab.label}
                </Link>
              ) : (
                <button key={tab.id} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  {tab.label}
                </button>
              )
            ))}
          </div>

          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Info grid */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Basic Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <InfoRow label="Name"        value={cat.name} />
                  <InfoRow label="Gender"      value={catGenderLabel(cat.gender)} />
                  <InfoRow label="Age"         value={formatCatAge(cat.age_years, cat.age_months)} />
                  <InfoRow label="Breed"       value={cat.breed_label || 'Mixed'} />
                  <InfoRow label="Color"       value={cat.color} />
                  <InfoRow label="Weight"      value={cat.weight_kg ? `${cat.weight_kg} kg` : undefined} />
                  <InfoRow label="Intake Date" value={formatDate(cat.intake_date)} />
                  <InfoRow label="Microchip"   value={cat.microchip_id} />
                </div>
              </div>

              {/* Health */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Health & Care
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    { ok: cat.is_neutered,       label: '✂️ Neutered' },
                    { ok: cat.is_vaccinated_core, label: '💉 Core Vaccinated' },
                    { ok: cat.is_microchipped,   label: '📡 Microchipped' },
                    { ok: cat.is_fiv_positive,   label: '⚠️ FIV+',    danger: true },
                    { ok: cat.is_felv_positive,  label: '⚠️ FeLV+',   danger: true },
                  ].map(({ ok, label, danger }) => (
                    ok !== undefined && (
                      <span key={label} style={{
                        padding: '0.3rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: ok
                          ? (danger ? 'var(--cat-amber-light)' : 'var(--cat-sage-light)')
                          : 'var(--cat-linen)',
                        color: ok
                          ? (danger ? '#7A4F00' : '#2E6B24')
                          : 'var(--text-muted)',
                        border: `1px solid ${ok ? 'transparent' : 'var(--border-default)'}`,
                        textDecoration: !ok ? 'line-through' : 'none',
                      }}>
                        {label}
                      </span>
                    )
                  ))}
                </div>
              </div>

              {/* Description */}
              {cat.description && (
                <div style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    About
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9375rem' }}>
                    {cat.description}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Added: {formatDate(cat.created_at)}</span>
                {cat.updated_at && <span>· Updated: {formatDate(cat.updated_at)}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={canRemove ? "Remove Cat?" : "Delete Cat?"}
        message={
          canRemove
            ? `Remove ${cat.name || 'this cat'} from your cats? The cat will remain in the system but no longer be linked to your account.`
            : `Are you sure you want to delete ${cat.name || 'this cat'}? This action cannot be undone.`
        }
        danger={!canRemove}
        confirmLabel={canRemove ? "Remove Cat" : "Delete Cat"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}