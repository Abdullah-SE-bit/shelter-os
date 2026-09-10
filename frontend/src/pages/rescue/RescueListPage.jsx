import { useState } from 'react';
import { Link } from 'react-router-dom';
import { rescueApi } from '../../api/rescueApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { timeAgo } from '../../utils/dateUtils';
import { URGENCY_CSS } from '../../utils/constants';

const URGENCY_ICONS = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🟠', CRITICAL: '🔴' };
const STATUS_COLORS = {
  PENDING:     { bg: 'var(--cat-amber-light)', text: '#7A4F00' },
  ASSIGNED:    { bg: 'var(--cat-blue-light)',  text: '#2E5A80' },
  IN_PROGRESS: { bg: 'rgba(201,123,84,0.15)', text: 'var(--cat-rust)' },
  RESOLVED:    { bg: 'var(--cat-sage-light)',  text: '#2E6B24' },
  CANCELLED:   { bg: '#EDE8E3',               text: 'var(--text-muted)' },
};

function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  return (
    <span style={{
      background: c.bg,
      color: c.text,
      fontSize: '0.7rem',
      fontWeight: 700,
      padding: '0.2rem 0.625rem',
      borderRadius: '999px',
      whiteSpace: 'nowrap',
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function UrgencyBadge({ level }) {
  return (
    <span className={`badge ${URGENCY_CSS[level] || 'urgency-medium'}`}>
      {URGENCY_ICONS[level]} {level}
    </span>
  );
}

function RescueCard({ report }) {
  const isCritical = report.urgency_level === 'CRITICAL';
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: `1px solid ${isCritical ? 'rgba(192,82,78,0.4)' : 'var(--border-default)'}`,
      borderLeft: isCritical ? '4px solid var(--cat-red)' : '4px solid transparent',
      borderRadius: '12px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      transition: 'all 0.2s',
      boxShadow: isCritical ? '0 2px 12px rgba(192,82,78,0.12)' : 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {report.description || 'Rescue Report'}
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            by {report.reporter_name || 'Anonymous'} · {timeAgo(report.reported_at)}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end', flexShrink: 0 }}>
          <UrgencyBadge level={report.urgency_level} />
          <StatusPill status={report.status} />
        </div>
      </div>

      {/* Location */}
      {report.latitude && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>📍</span>
          <span>{Number(report.latitude).toFixed(4)}, {Number(report.longitude).toFixed(4)}</span>
        </div>
      )}

      {/* Volunteer assigned */}
      {report.assigned_volunteer_name && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span>🙋</span> Assigned to <strong>{report.assigned_volunteer_name}</strong>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
        <Link to={`/rescue/${report.id}`} className="btn btn-secondary btn-sm">View Details →</Link>
      </div>
    </div>
  );
}

export default function RescueListPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [urgency,      setUrgency]      = useState('');
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(16);

  const { data, loading, refetch } = useApi(
    () => rescueApi.list({ page, page_size: pageSize, status: statusFilter || undefined, urgency_level: urgency || undefined }),
    null,
    [page, statusFilter, urgency]
  );

  const reports    = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);

  const canSubmit = !!user;

  return (
    <div className="page-container">
      {/* Hero strip */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-red) 0%, #A03B38 100%)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        gap: '1rem',
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(192,82,78,0.25)',
      }}>
        <div style={{ position: 'absolute', right: '1rem', bottom: '-0.5rem', fontSize: '5rem', opacity: 0.1 }}>🚨</div>
        <div>
          <h1 style={{ color: 'white', margin: '0 0 0.375rem', fontSize: '1.625rem', fontWeight: 900 }}>🚨 Rescue Reports</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>
            {total} reports · Coordinate emergency cat rescues
          </p>
        </div>
        {canSubmit && (
          <Link to="/rescue/submit" style={{
            background: 'white',
            color: 'var(--cat-red)',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.875rem',
            textDecoration: 'none',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            + Submit Rescue
          </Link>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '0.875rem 1.25rem',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
      }}>
        {[
          { label: 'All Statuses', value: '', setter: v => { setStatusFilter(v); reset(); }, current: statusFilter,
            options: [
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: '⏳ Pending' },
              { value: 'ASSIGNED', label: '🙋 Assigned' },
              { value: 'IN_PROGRESS', label: '🔄 In Progress' },
              { value: 'RESOLVED', label: '✅ Resolved' },
            ]
          },
          { label: 'All Urgency', value: '', setter: v => { setUrgency(v); reset(); }, current: urgency,
            options: [
              { value: '', label: 'All Urgency' },
              { value: 'LOW', label: '🟢 Low' },
              { value: 'MEDIUM', label: '🟡 Medium' },
              { value: 'HIGH', label: '🟠 High' },
              { value: 'CRITICAL', label: '🔴 Critical' },
            ]
          },
        ].map(({ setter, current, options }) => (
          <select key={options[0].value + 'sel'} value={current}
            onChange={e => setter(e.target.value)}
            className="input-base" style={{ width: 'auto', fontSize: '0.875rem', padding: '0.4rem 0.875rem' }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {loading ? '…' : `${total} results`}
        </span>
      </div>

      {loading && <LoadingSpinner size="lg" text="Loading rescue reports…" />}

      {!loading && reports.length === 0 && (
        <EmptyState
          icon="🚨"
          title="No rescue reports found"
          message="No reports match your current filters. Try changing the status or urgency level."
          action={canSubmit && <Link to="/rescue/submit" className="btn btn-danger">+ Submit a Rescue</Link>}
        />
      )}

      {!loading && reports.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {reports.map(r => <RescueCard key={r.id} report={r} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize}
        onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}