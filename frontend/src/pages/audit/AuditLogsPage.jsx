import { useState } from 'react';
import { auditApi } from '../../api/auditApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { formatDateTime } from '../../utils/dateUtils';

const ACTION_ICONS = {
  CREATE: '➕',
  UPDATE: '✏️',
  DELETE: '🗑️',
  LOGIN:  '🔑',
  LOGOUT: '🚪',
  VIEW:   '👁️',
  CAMPAIGN_COMPLETED:  '✅',
  CAMPAIGN_INCOMPLETE: '⚠️',
};

const ACTION_COLORS = {
  CREATE: { bg: 'var(--cat-sage-light)', color: '#2E6B24' },
  UPDATE: { bg: 'var(--cat-blue-light)', color: '#2E5A80' },
  DELETE: { bg: 'var(--cat-red-light)',  color: '#8B2C2A' },
  LOGIN:  { bg: 'rgba(201,123,84,0.12)', color: 'var(--cat-rust)' },
  LOGOUT: { bg: 'var(--cat-linen)',      color: 'var(--text-muted)' },
  VIEW:   { bg: 'var(--cat-linen)',      color: 'var(--text-muted)' },
  CAMPAIGN_COMPLETED:  { bg: 'var(--cat-sage-light)', color: '#2E6B24' },
  CAMPAIGN_INCOMPLETE: { bg: 'var(--cat-red-light)',  color: '#8B2C2A' },
};

// Short, human-friendly labels for the action pills.
const ACTION_LABELS = {
  CAMPAIGN_COMPLETED:  'CAMPAIGN COMPLETE',
  CAMPAIGN_INCOMPLETE: 'CAMPAIGN NOT COMPLETE',
};

export default function AuditLogsPage() {
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(25);
  const [actionFilter, setActionFilter] = useState('');

  const { data, loading } = useApi(
    () => auditApi.list({ page, page_size: pageSize, action: actionFilter || undefined }),
    null,
    [page, actionFilter]
  );

  const logs       = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="page-container">
      <PageHeader title="📋 Audit Logs" subtitle={`${total} log entries · Full audit trail`} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CAMPAIGN_COMPLETED', 'CAMPAIGN_INCOMPLETE'].map(a => {
          const cfg = ACTION_COLORS[a] || {};
          return (
            <button key={a} onClick={() => { setActionFilter(a); reset(); }} style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '8px',
              border: `1.5px solid ${actionFilter === a ? 'var(--cat-terra)' : 'var(--border-default)'}`,
              background: actionFilter === a ? 'var(--cat-terra)' : 'var(--surface-card)',
              color: actionFilter === a ? 'white' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}>
              {a ? `${ACTION_ICONS[a] || ''} ${ACTION_LABELS[a] || a}`.trim() : 'All Actions'}
            </button>
          );
        })}
      </div>

      {loading && <LoadingSpinner text="Loading audit logs…" />}

      {!loading && logs.length === 0 && (
        <EmptyState icon="📋" title="No logs found" message="No audit entries match the current filter." />
      )}

      {!loading && logs.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Resource</th>
                <th>Email</th>
                <th>IP</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const cfg = ACTION_COLORS[log.action] || ACTION_COLORS.VIEW;
                return (
                  <tr key={log.id}>
                    <td>
                      <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                        {ACTION_ICONS[log.action] || '•'} {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{log.actor_name || log.actor_email || 'System'}</div>
                        {log.actor_role && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.actor_role}</div>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
                      <div>
                        {log.entity_type && <span style={{ color: 'var(--cat-terra)' }}>{log.entity_type}</span>}
                        {log.entity_id && <span style={{ color: 'var(--text-muted)' }}> #{String(log.entity_id).slice(0, 8)}</span>}
                      </div>
                      {log.new_value?.message && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.15rem' }}>
                          {log.new_value.message}
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {log.actor_email || '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.ip_address || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(log.performed_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}