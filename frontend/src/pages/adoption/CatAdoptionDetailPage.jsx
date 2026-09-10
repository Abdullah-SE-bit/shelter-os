import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adoptionApi } from '../../api/adoptionApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import { formatCurrency, formatCatAge, catGenderLabel } from '../../utils/formatters';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80';

export default function CatAdoptionDetailPage() {
  const { catId }  = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [faving,   setFaving]   = useState(false);
  const [isFav,    setIsFav]    = useState(false);

  const { data, loading } = useApi(() => adoptionApi.getDetail(catId), null, [catId]);
  const cat = data;

  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    setFaving(true);
    try {
      if (isFav) { await adoptionApi.removeFavorite(catId); setIsFav(false); }
      else        { await adoptionApi.addFavorite(catId);   setIsFav(true); }
    } catch {}
    setFaving(false);
  };

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" text="Loading cat profile…" /></div>;
  if (!cat)    return (
    <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '4rem' }}>😿</div><h2>Cat not found</h2>
      <Link to="/adoption" className="btn btn-secondary" style={{ marginTop: '1rem' }}>← Back to Adoption</Link>
    </div>
  );

  const photos = (cat.photos || []).filter(Boolean);
  const mainPhoto = photos[0] || CAT_PLACEHOLDER;

  return (
    <div>
      {/* Full-width hero photo */}
      <div style={{ height: '380px', position: 'relative', overflow: 'hidden', background: 'var(--cat-linen)' }}>
        <img src={mainPhoto} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(61,43,31,0.7) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 0.375rem', fontSize: '2.5rem', fontFamily: 'Playfair Display, serif' }}>
              {cat.name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '1.0625rem' }}>
              {cat.breed_label || 'Mixed breed'} · {catGenderLabel(cat.gender)} · {formatCatAge(cat.age_years, cat.age_months)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontSize: '1.75rem', fontWeight: 900 }}>
              {cat.adoption_fee > 0 ? formatCurrency(cat.adoption_fee) : 'Free'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>adoption fee</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {user?.role === 'ADOPTER' || !user ? (
            <Link
              to={user ? `/adoption/apply/${catId}` : '/login'}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}
            >
              ❤️ Apply to Adopt {cat.name}
            </Link>
          ) : null}
          <button onClick={handleFavorite} disabled={faving} className="btn btn-secondary" style={{ flexShrink: 0 }}>
            {isFav ? '💖 Saved' : '🤍 Save'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* About */}
            {cat.description && (
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
                <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  About {cat.name} 🐱
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.9375rem' }}>
                  {cat.description}
                </p>
              </div>
            )}

            {/* Health badges */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
              <h2 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Health Status
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { ok: cat.is_neutered,       label: '✂️ Neutered/Spayed' },
                  { ok: cat.is_vaccinated_core, label: '💉 Core Vaccinations' },
                  { ok: cat.is_microchipped,   label: '📡 Microchipped' },
                  { ok: cat.is_dewormed,       label: '💊 Dewormed' },
                  { ok: !cat.is_fiv_positive,  label: '🧬 FIV Negative' },
                  { ok: !cat.is_felv_positive, label: '🧬 FeLV Negative' },
                ].map(({ ok, label }) => (
                  <span key={label} style={{
                    padding: '0.35rem 0.875rem',
                    borderRadius: '999px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    background: ok ? 'var(--cat-sage-light)' : '#EDE8E3',
                    color: ok ? '#2E6B24' : 'var(--text-muted)',
                  }}>
                    {ok ? '✓' : '✗'} {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Photo gallery */}
            {photos.length > 1 && (
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
                <h2 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  More Photos
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ height: '100px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Quick facts */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
              <h2 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Quick Facts
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { icon: '🎂', label: 'Age',     value: formatCatAge(cat.age_years, cat.age_months) },
                  { icon: '⚧',  label: 'Gender',  value: catGenderLabel(cat.gender) },
                  { icon: '🎨', label: 'Color',   value: cat.color },
                  { icon: '🦴', label: 'Breed',   value: cat.breed_label || 'Mixed' },
                  { icon: '📍', label: 'Shelter', value: cat.shelter_name },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <span>{f.icon}</span>{f.label}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Adoption requirements */}
            {cat.adoption_requirements && (
              <div style={{
                background: 'var(--cat-amber-light)',
                border: '1px solid rgba(232,160,48,0.3)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
              }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#7A4F00', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  📋 Requirements
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#5A3800', lineHeight: 1.6 }}>
                  {cat.adoption_requirements}
                </p>
              </div>
            )}

            {/* Shelter CTA */}
            <div style={{
              background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'center',
              color: 'white',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
              <p style={{ margin: '0 0 0.75rem', fontWeight: 700, fontSize: '0.9375rem' }}>
                {cat.shelter_name || 'Shelter'}
              </p>
              {user?.role === 'ADOPTER' || !user ? (
                <Link
                  to={user ? `/adoption/apply/${catId}` : '/login'}
                  style={{ background: 'white', color: 'var(--cat-rust)', padding: '0.625rem 1.25rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block' }}
                >
                  Apply Now →
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}