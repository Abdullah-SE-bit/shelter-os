import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { analyticsApi } from '../../api/analyticsApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { formatDateTime } from '../../utils/dateUtils';

const ROLE_META = {
  SUPER_ADMIN:   { icon: '👑', label: 'Super Admins', color: 'var(--cat-rust)' },
  SHELTER_ADMIN: { icon: '🏠', label: 'Shelter Admins', color: 'var(--cat-terra)' },
  VET:           { icon: '🩺', label: 'Vets', color: 'var(--cat-blue)' },
  CAT_OWNER:     { icon: '🐱', label: 'Cat Owners', color: 'var(--cat-sage)' },
  ADOPTER:       { icon: '❤️', label: 'Adopters', color: 'var(--cat-amber)' },
  VOLUNTEER:     { icon: '🙋', label: 'Volunteers', color: 'var(--cat-brown)' },
};

// "Online" if the user recorded activity within this window.
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get('role') || '';

  const [list, setList]               = useState([]);
  const [usersByRole, setUsersByRole] = useState({});
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [busyId, setBusyId]           = useState(null);

  const POLL_MS = 15000;

  // Fetch users + role counts. `silent` skips the full-page spinner so live
  // background refreshes update presence in place without hiding the table.
  const loadData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const [usersRes, overviewRes] = await Promise.all([
        // `_` is a cache-buster so polled responses are never served stale.
        authApi.listUsers({ role: roleFilter || undefined, _: Date.now() }),
        analyticsApi.overview(),
      ]);
      const usersData = usersRes.data?.data ?? usersRes.data;
      setList(Array.isArray(usersData) ? usersData : (usersData?.results || []));
      const overviewData = overviewRes.data?.data ?? overviewRes.data;
      setUsersByRole(overviewData?.users_by_role || {});
    } catch {
      // Keep the last good data if a background poll fails transiently.
    } finally {
      if (silent) setRefreshing(false); else setLoading(false);
    }
  }, [roleFilter]);

  // Initial load, and reload when the role filter changes.
  useEffect(() => { loadData(false); }, [loadData]);

  // Live presence: silently re-fetch on an interval. No spinner, the table
  // stays in place, and the online/offline dots update on their own.
  useEffect(() => {
    const id = setInterval(() => loadData(true), POLL_MS);
    return () => clearInterval(id);
  }, [loadData]);

  const setRole = (r) => {
    const next = new URLSearchParams(searchParams);
    if (r) next.set('role', r); else next.delete('role');
    setSearchParams(next);
  };

  const toggleActive = async (u) => {
    setBusyId(u.id);
    try {
      await authApi.setStatus(u.id, !u.is_active);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update status.');
      setBusyId(null);
    }
  };

  const toggleVerified = async (u) => {
    setBusyId(u.id);
    try {
      await authApi.verifyUser(u.id, !u.is_email_verified);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update verification.');
      setBusyId(null);
    }
  };

  // Prefer real activity (updated on every request); fall back to login time.
  const lastSeenAt = (u) => u.last_activity_at || u.last_login_at;
  const isOnline = (u) => lastSeenAt(u) && (Date.now() - new Date(lastSeenAt(u)).getTime() < ONLINE_WINDOW_MS);

  return (
    <div className="page-container">
      <PageHeader
        title="👥 Users"
        subtitle="All platform users by role, with live online status"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}
              title={`Auto-refreshing every ${POLL_MS / 1000}s`}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 0 3px rgba(46,204,113,0.2)' }} />
              {refreshing ? 'Updating…' : 'Live'}
            </span>
            <button onClick={() => loadData(true)} disabled={refreshing} className="btn btn-secondary btn-sm">↻ Refresh</button>
          </div>
        }
      />

      {/* Role counter cards (B2) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {Object.entries(ROLE_META).map(([role, meta]) => {
          const count = usersByRole[role] || 0;
          const active = roleFilter === role;
          return (
            <button key={role} onClick={() => setRole(active ? '' : role)} style={{
              background: active ? meta.color : 'var(--surface-card)',
              border: `1.5px solid ${active ? meta.color : 'var(--border-default)'}`,
              borderRadius: '14px', padding: '1.1rem 1.25rem', cursor: 'pointer', textAlign: 'left',
              color: active ? 'white' : 'var(--text-primary)', transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{meta.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1, color: active ? 'white' : meta.color }}>{count}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: active ? 0.9 : 0.7 }}>{meta.label}</div>
            </button>
          );
        })}
      </div>

      {roleFilter && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setRole('')} className="btn btn-secondary btn-sm">✕ Clear filter: {ROLE_META[roleFilter]?.label || roleFilter}</button>
        </div>
      )}

      {loading && <LoadingSpinner text="Loading users…" />}

      {!loading && list.length === 0 && (
        <EmptyState icon="👥" title="No users found" message="No users match the current filter." />
      )}

      {!loading && list.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Email Verified</th>
                <th>Last Seen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(u => {
                const meta = ROLE_META[u.role] || { icon: '👤', label: u.role };
                const name = u.profile ? `${u.profile.first_name} ${u.profile.last_name}`.trim() : '—';
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{name || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td>
                      <span style={{ background: 'var(--cat-linen)', color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                        {meta.icon} {u.role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        background: u.is_active ? 'var(--cat-sage-light)' : '#EDE8E3',
                        color: u.is_active ? '#2E6B24' : 'var(--text-muted)',
                        fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px',
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.is_active ? (isOnline(u) ? '#2ecc71' : 'var(--cat-sage)') : 'var(--text-muted)' }} />
                        {u.is_active ? (isOnline(u) ? 'Online' : 'Offline') : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {u.role === 'SUPER_ADMIN' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>— Exempt</span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          background: u.is_email_verified ? 'var(--cat-sage-light)' : '#FBEFD3',
                          color: u.is_email_verified ? '#2E6B24' : '#8A6D1A',
                          fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px',
                        }}>
                          {u.is_email_verified ? '✅ Verified' : '⏳ Unverified'}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {lastSeenAt(u) ? formatDateTime(lastSeenAt(u)) : 'Never'}
                    </td>
                    <td>
                      {u.role !== 'SUPER_ADMIN' && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {!u.is_email_verified ? (
                            <button onClick={() => toggleVerified(u)} disabled={busyId === u.id} className="btn btn-primary btn-sm">
                              ✅ Verify
                            </button>
                          ) : (
                            <button onClick={() => toggleVerified(u)} disabled={busyId === u.id} className="btn btn-secondary btn-sm" title="Revoke email verification">
                              ↩ Unverify
                            </button>
                          )}
                          <button onClick={() => toggleActive(u)} disabled={busyId === u.id} className="btn btn-secondary btn-sm">
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
