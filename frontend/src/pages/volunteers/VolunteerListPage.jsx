import { useState } from 'react';
import { volunteerApi } from '../../api/volunteersApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { Link } from 'react-router-dom';
import { initials } from '../../utils/formatters';

export default function VolunteerListPage() {
  const [search, setSearch] = useState('');
  const [avail,  setAvail]  = useState(false);
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(16);

  const { data, loading } = useApi(
    () => volunteerApi.list({ page, page_size: pageSize, search: search || undefined, online_now: avail || undefined }),
    null,
    [page, search, avail]
  );

  // F1: pending shelter-change requests awaiting this admin's decision.
  const { data: reqData, refetch: refetchReqs } = useApi(
    () => volunteerApi.listShelterChangeRequests({ status: 'PENDING' }), null, []
  );
  const pendingRequests = reqData || [];

  const handleDecision = async (reqId, decision) => {
    try {
      if (decision === 'approve') await volunteerApi.approveShelterChange(reqId);
      else await volunteerApi.rejectShelterChange(reqId);
      refetchReqs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Action failed.');
    }
  };

  const volunteers = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);

  const SKILL_ICONS = { MEDICAL: '🩺', TRANSPORT: '🚗', SOCIALIZING: '🤝', FOSTERING: '🏠', RESCUE: '🚨', ADMIN: '💼', PHOTOGRAPHY: '📷' };

  return (
    <div className="page-container">
      <PageHeader title="🙋 Volunteers" subtitle={`${total} registered volunteers`} />

      {/* F1: pending shelter-change requests */}
      {pendingRequests.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--cat-amber, #e6b450)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🔁 Pending shelter-change requests ({pendingRequests.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {pendingRequests.map(req => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 1rem', background: 'var(--cat-linen)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>{req.volunteer_name}</strong> wants to move{' '}
                  {req.from_shelter_name ? <>from <strong>{req.from_shelter_name}</strong> </> : ''}
                  to <strong>{req.to_shelter_name}</strong>
                  {req.reason && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>“{req.reason}”</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleDecision(req.id, 'approve')} className="btn btn-primary btn-sm">Approve</button>
                  <button onClick={() => handleDecision(req.id, 'reject')} className="btn btn-secondary btn-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', padding: '0.875rem 1.25rem', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px' }}>
        <input type="search" value={search} onChange={e => { setSearch(e.target.value); reset(); }}
          placeholder="🔍 Search by name or skill…"
          className="input-base" style={{ flex: 1, minWidth: '200px' }} id="vol-search" />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
          <input type="checkbox" checked={avail} onChange={e => { setAvail(e.target.checked); reset(); }} style={{ accentColor: 'var(--cat-terra)' }} />
          🟢 Online now
        </label>
      </div>

      {loading && <LoadingSpinner size="lg" text="Loading volunteers…" />}

      {!loading && volunteers.length === 0 && (
        <EmptyState icon="🙋" title="No volunteers found" message={search ? `No volunteers match "${search}"` : 'No volunteers registered yet.'} />
      )}

      {!loading && volunteers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {volunteers.map(vol => (
            <Link key={vol.id} to={`/volunteers/${vol.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)',
              }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--cat-terra)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              >
                {/* Avatar */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  margin: '0 auto 0.875rem',
                  position: 'relative',
                }}>
                  {vol.profile_photo
                    ? <img src={vol.profile_photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : initials(vol.first_name, vol.last_name)
                  }
                  {/* Online presence indicator */}
                  {vol.is_online && (
                    <div style={{
                      position: 'absolute', bottom: '2px', right: '2px',
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: '#2ecc71', border: '2px solid var(--surface-card)',
                    }} title="Online now" />
                  )}
                </div>

                <h3 style={{ margin: '0 0 0.2rem', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {vol.first_name} {vol.last_name}
                </h3>
                {vol.city && <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {vol.city}</p>}

                {/* Skills */}
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {(vol.skills || []).slice(0, 3).map(skill => (
                    <span key={skill} style={{
                      background: 'var(--cat-linen)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                    }}>
                      {SKILL_ICONS[skill] || '🔧'} {skill}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: '0.875rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  🤝 {vol.completed_assignments || 0} assignments
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}