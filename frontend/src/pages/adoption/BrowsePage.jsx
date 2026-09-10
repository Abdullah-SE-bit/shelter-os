import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adoptionApi } from '../../api/adoptionApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { formatCurrency, formatCatAge } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const HERO_CATS = [
  { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80', name: 'Whiskers' },
  { url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80', name: 'Luna' },
  { url: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&q=80', name: 'Mochi' },
  { url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&q=80', name: 'Biscuit' },
];

function CatCard({ cat }) {
  return (
    <Link to={`/adoption/${cat.cat}`} style={{ textDecoration: 'none' }}>
      <div className="cat-card" style={{ overflow: 'hidden', height: '100%' }}>
        {/* Photo */}
        <div style={{
          height: '220px',
          background: 'var(--cat-linen)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {cat.primary_photo_url ? (
            <img
              src={cat.primary_photo_url}
              alt={cat.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', background: 'linear-gradient(135deg, var(--cat-linen), var(--cat-blush))' }}>
              🐱
            </div>
          )}
          {/* Available badge */}
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            background: 'rgba(123,173,110,0.92)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.625rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Available
          </div>
          {/* Badges top right */}
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            alignItems: 'flex-end',
          }}>
            {cat.is_neutered && (
              <span style={{ background: 'rgba(91,141,184,0.92)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                ✂️ Neutered
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '1rem 1.125rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {cat.name || 'Unnamed'}
            </h3>
            <span style={{ fontSize: '0.9375rem', color: 'var(--cat-terra)', fontWeight: 800, flexShrink: 0, marginLeft: '0.5rem' }}>
              {cat.adoption_fee > 0 ? formatCurrency(cat.adoption_fee) : 'Free'}
            </span>
          </div>

          <p style={{ margin: '0 0 0.625rem', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {cat.breed_label || 'Mixed breed'} · {cat.gender} · {formatCatAge(cat.age_years, cat.age_months)}
          </p>

          {cat.shelter_name && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>📍</span> {cat.shelter_name}
            </p>
          )}

          {/* Tags */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {cat.is_vaccinated_core && (
              <span style={{ background: 'var(--cat-sage-light)', color: '#2E6B24', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                💉 Vaccinated
              </span>
            )}
            {cat.is_microchipped && (
              <span style={{ background: 'var(--cat-blue-light)', color: '#2E5A80', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                📡 Microchipped
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BrowsePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(12);
  const [gender,   setGender]   = useState('');
  const [neutered, setNeutered] = useState('');
  const [search,   setSearch]   = useState('');

  const { data, loading } = useApi(
    () => adoptionApi.browse({ page, page_size: pageSize, gender, is_neutered: neutered || undefined }),
    null,
    [page, gender, neutered]
  );

  const listings   = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleFilterChange = (setter, value) => {
    setter(value);
    reset();
  };

  return (
    <div>
      {/* Hero section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--cat-espresso) 0%, var(--cat-brown) 50%, var(--cat-rust) 100%)',
        padding: '4rem 2rem 5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Floating cat photos */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '1rem',
          paddingRight: '2rem',
          opacity: 0.25,
          overflow: 'hidden',
        }}>
          {HERO_CATS.map((c, i) => (
            <div key={i} style={{
              width: '140px',
              height: '180px',
              borderRadius: '12px',
              overflow: 'hidden',
              flexShrink: 0,
              transform: `rotate(${i % 2 === 0 ? '3deg' : '-2deg'}) translateY(${i * 8}px)`,
            }}>
              <img src={c.url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '999px',
            padding: '0.375rem 1rem',
            marginBottom: '1.25rem',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '0.8125rem',
            fontWeight: 700,
          }}>
            🐾 Find your perfect companion
          </div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 700,
            color: 'white',
            margin: '0 0 1rem',
            lineHeight: 1.15,
          }}>
            Adopt a Cat,<br />Change a Life 🐾
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', maxWidth: '540px', margin: '0 0 2rem', lineHeight: 1.7 }}>
            {total > 0 ? `${total} cats are waiting for their forever home.` : 'Cats are waiting for their forever home.'}
            Give a shelter cat the love they deserve.
          </p>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { icon: '🐱', label: `${total || '—'} cats available` },
              { icon: '🏠', label: 'Verified shelters' },
              { icon: '❤️', label: 'Happy adoptions' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.85)' }}>
                <span style={{ fontSize: '1.125rem' }}>{icon}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div style={{
          position: 'absolute',
          bottom: '-1px',
          left: 0,
          right: 0,
          height: '50px',
          background: 'var(--cat-cream)',
          clipPath: 'ellipse(55% 100% at 50% 100%)',
        }} />
      </section>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Filters bar */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '14px',
          padding: '1.125rem 1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.25rem' }}>🔍 Filter:</span>
          {[
            { label: 'Any Gender', value: '', setter: v => handleFilterChange(setGender, v), current: gender, options: [
                { value: '', label: 'Any Gender' },
                { value: 'MALE', label: '♂ Male' },
                { value: 'FEMALE', label: '♀ Female' },
              ]
            },
            { label: 'Neutered', value: '', setter: v => handleFilterChange(setNeutered, v), current: neutered, options: [
                { value: '', label: 'Any' },
                { value: 'true', label: '✂️ Neutered' },
                { value: 'false', label: 'Not neutered' },
              ]
            },
          ].map(({ setter, current, options }) => (
            <select
              key={options[0].label}
              value={current}
              onChange={e => setter(e.target.value)}
              className="input-base"
              style={{ width: 'auto', fontSize: '0.875rem', padding: '0.4rem 0.875rem' }}
            >
              {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}

          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {loading ? '…' : `${total} cats found`}
          </div>
        </div>

        {/* Cat image placeholders when no data */}
        {loading && <LoadingSpinner size="lg" text="Finding cats for you…" />}

        {!loading && listings.length === 0 && (
          <EmptyState
            icon="🏠"
            title="No cats available right now"
            message="Check back soon — shelters are regularly adding new cats ready for adoption."
            action={user ? undefined : (
              <Link to="/register" className="btn btn-primary">
                🐾 Create Account to Get Notified
              </Link>
            )}
          />
        )}

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          {listings.map(cat => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPrev={prevPage}
          onNext={nextPage}
          onGoTo={goTo}
        />

        {/* CTA banner */}
        {!user && listings.length > 0 && (
          <div style={{
            marginTop: '3rem',
            background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
            borderRadius: '20px',
            padding: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: '-1rem', bottom: '-1rem', fontSize: '8rem', opacity: 0.08 }}>🐾</div>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '1.5rem' }}>Ready to adopt? 🐱</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9375rem' }}>
                Create a free account to apply, save favorites, and track your applications.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <Link to="/register" style={{
                background: 'white',
                color: 'var(--cat-rust)',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                textDecoration: 'none',
                flexShrink: 0,
              }}>
                Create Free Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
