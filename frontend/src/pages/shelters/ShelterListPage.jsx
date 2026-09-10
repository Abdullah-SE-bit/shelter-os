import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sheltersApi } from '../../api/sheltersApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&q=80';

function ShelterCard({ shelter }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.25s',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {/* Header image */}
      <div style={{ height: '160px', background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-brown))', position: 'relative', overflow: 'hidden' }}>
        {shelter.logo_url ? (
          <img src={shelter.logo_url} alt={shelter.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '0.375rem',
          }}>
            <div style={{ fontSize: '3rem', opacity: 0.6 }}>🏠</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>{shelter.city || 'Cat Shelter'}</div>
          </div>
        )}
        {/* Cat count badge */}
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          background: 'rgba(61,43,31,0.7)',
          backdropFilter: 'blur(6px)',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.25rem 0.625rem',
          borderRadius: '999px',
        }}>
          🐱 {shelter.cat_count || 0} cats
        </div>
      </div>

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {shelter.name}
        </h3>

        {shelter.city && (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>📍</span> {shelter.city}{shelter.country ? `, ${shelter.country}` : ''}
          </p>
        )}

        {shelter.description && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
            {shelter.description.slice(0, 100)}{shelter.description.length > 100 ? '…' : ''}
          </p>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', padding: '0.625rem', background: 'var(--cat-linen)', borderRadius: '8px' }}>
          {[
            { label: 'Capacity', value: shelter.capacity_total || '—' },
            { label: 'Volunteers', value: shelter.volunteer_count || 0 },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: '1.125rem', color: 'var(--cat-terra)' }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        <Link to={`/shelter/${shelter.id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
          View Shelter →
        </Link>
      </div>
    </div>
  );
}

export default function ShelterListPage() {
  const [search, setSearch] = useState('');
  const { data, loading }   = useApi(() => sheltersApi.list({ search: search || undefined }), null, [search]);
  const shelters = data?.results || data || [];

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-brown), var(--cat-espresso))',
        padding: '3rem 2rem 4.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '2rem', bottom: '-1rem', fontSize: '8rem', opacity: 0.08 }}>🏠</div>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', margin: '0 0 0.75rem', fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: 'Playfair Display, serif' }}>
            Our Shelter Network 🏠
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 1.5rem', fontSize: '1.0625rem', maxWidth: '500px' }}>
            {shelters.length} cat shelters across Pakistan providing safe havens for cats in need.
          </p>

          {/* Search */}
          <div style={{ maxWidth: '380px' }}>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search shelters by name or city…"
              style={{
                width: '100%',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                fontSize: '0.9375rem',
                color: 'var(--text-primary)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                outline: 'none',
                fontFamily: 'Nunito, sans-serif',
                boxSizing: 'border-box',
              }}
              id="shelter-search"
            />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '50px', background: 'var(--cat-cream)', clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </div>

      {/* Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {loading && <LoadingSpinner size="lg" text="Loading shelters…" />}
        {!loading && shelters.length === 0 && (
          <EmptyState icon="🏠" title="No shelters found" message={search ? `No shelters match "${search}"` : 'No shelters registered yet.'} />
        )}
        {!loading && shelters.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {shelters.map(s => <ShelterCard key={s.id} shelter={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}