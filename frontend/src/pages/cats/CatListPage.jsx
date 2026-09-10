import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { catsApi } from '../../api/catsApi';
import { sheltersApi } from '../../api/sheltersApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { formatCatAge, statusLabel } from '../../utils/formatters';
import { STATUS_CSS } from '../../utils/constants';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

function StatusBadge({ status }) {
  const css = STATUS_CSS[status] || 'status-unknown';
  return (
    <span className={`badge ${css}`}>
      {statusLabel(status)}
    </span>
  );
}

export default function CatListPage() {
  const { user }                         = useAuth();
  const navigate                         = useNavigate();
  const [searchParams]                   = useSearchParams();
  const shelterParam                     = searchParams.get('shelter') || '';
  const [sheltersList, setSheltersList]   = useState([]);
  const [search,    setSearch]           = useState('');
  const [status,    setStatus]           = useState('');
  const [shelter,   setShelter]          = useState(shelterParam);
  const [view,      setView]             = useState('grid'); // grid | table
  const debouncedSearch                  = useDebounce(search, 400);
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(20);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'VET') {
      sheltersApi.list().then(res => {
        setSheltersList(res.data?.data || []);
      }).catch(err => console.error('Failed to load shelters:', err));
    }
  }, [user]);

  const { data, loading, refetch } = useApi(
    () => catsApi.list({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      current_status: status || undefined,
      shelter_id: shelter || undefined
    }),
    null,
    [page, debouncedSearch, status, shelter]
  );

  const cats       = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);

  // C1: every authenticated role can create a cat. Admins/vets use the
  // shelter-oriented form; everyone else registers a personally-owned cat.
  const canCreate = !!user && user.role !== 'GUEST';
  const createPath = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'].includes(user?.role)
    ? '/cats/create'
    : '/cats/register';

  const handleSearchChange = (v) => { setSearch(v); reset(); };
  const handleStatusChange = (v) => { setStatus(v); reset(); };

  return (
    <div className="page-container">
      <PageHeader
        title="🐱 All Cats"
        subtitle={`${total} cats registered in the system`}
        action={canCreate && (
          <Link to={createPath} className="btn btn-primary">
            + Add Cat
          </Link>
        )}
      />

      {/* Filter bar */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <input
            type="search"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="input-base"
            placeholder="🔍 Search by name, breed, microchip…"
            id="cat-search"
          />
        </div>

        <select value={status} onChange={e => handleStatusChange(e.target.value)}
          className="input-base" style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="">All Statuses</option>
          <option value="IN_SHELTER">In Shelter</option>
          <option value="FOSTERED">Fostered</option>
          <option value="ADOPTED">Adopted</option>
          <option value="LOST">Lost</option>
          <option value="DECEASED">Deceased</option>
        </select>

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'VET') && (
          <select value={shelter} onChange={e => { setShelter(e.target.value); reset(); }}
            className="input-base" style={{ width: 'auto', flex: '0 0 auto' }}>
            <option value="">All Shelters</option>
            {sheltersList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1.5px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden' }}>
          {['grid', 'table'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '0.375rem 0.75rem',
              background: view === v ? 'var(--cat-terra)' : 'transparent',
              color: view === v ? 'white' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 700,
              transition: 'all 0.2s',
            }}>
              {v === 'grid' ? '⊞' : '≡'}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingSpinner size="lg" text="Loading cats…" />}

      {!loading && cats.length === 0 && (
        <EmptyState
          icon="🐱"
          title="No cats found"
          message="Try adjusting your search filters."
          action={canCreate && <Link to={createPath} className="btn btn-primary">+ Add First Cat</Link>}
        />
      )}

      {/* Grid view */}
      {!loading && view === 'grid' && cats.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          {cats.map(cat => (
            <Link key={cat.id} to={`/cats/${cat.id}`} style={{ textDecoration: 'none' }}>
              <div className="cat-card" style={{ overflow: 'hidden', height: '100%' }}>
                <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={cat.primary_photo_url || CAT_PLACEHOLDER}
                    alt={cat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }}
                  />
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                    <StatusBadge status={cat.current_status} />
                  </div>
                </div>
                <div style={{ padding: '0.875rem 1rem 1rem' }}>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {cat.name || 'Unnamed'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {cat.breed_label || 'Mixed'} · {formatCatAge(cat.age_years, cat.age_months)}
                  </p>
                  {cat.shelter_name ? (
                    <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      📍 {cat.shelter_name}
                    </p>
                  ) : cat.owner_name && (
                    <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      👤 {cat.owner_name}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Table view */}
      {!loading && view === 'table' && cats.length > 0 && (
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '1.5rem',
        }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cat</th>
                <th>Breed</th>
                <th>Age</th>
                <th>Status</th>
                <th>Shelter</th>
                <th>Microchip</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cats.map(cat => (
                <tr key={cat.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                        <img
                          src={cat.primary_photo_url || CAT_PLACEHOLDER}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.currentTarget.src = CAT_PLACEHOLDER; }}
                        />
                      </div>
                      <span style={{ fontWeight: 700 }}>{cat.name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{cat.breed_label || 'Mixed'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatCatAge(cat.age_years, cat.age_months)}</td>
                  <td><StatusBadge status={cat.current_status} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {cat.shelter_name || (cat.owner_name ? `👤 ${cat.owner_name}` : '—')}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {cat.microchip_number || '—'}
                  </td>
                  <td>
                    <Link to={`/cats/${cat.id}`} className="btn btn-secondary btn-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPrev={prevPage}
        onNext={nextPage}
        onGoTo={goTo}
      />
    </div>
  );
}