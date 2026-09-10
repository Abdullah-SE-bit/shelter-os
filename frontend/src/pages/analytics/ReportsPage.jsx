import { useState } from 'react';
import { analyticsApi } from '../../api/analyticsApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import { formatCurrency } from '../../utils/formatters';

function StatBar({ label, value, max, color = 'var(--cat-terra)' }) {
  const pct = Math.min(100, ((value || 0) / (max || 1)) * 100);
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 800 }}>{value}</span>
      </div>
      <div style={{ height: '8px', background: 'var(--cat-linen)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: '999px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function NumberCard({ icon, label, value, sub, color = 'var(--cat-terra)', wide }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: '14px',
      padding: '1.25rem 1.5rem',
      gridColumn: wide ? 'span 2' : undefined,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '3.5rem', opacity: 0.08 }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const { data, loading }   = useApi(() => analyticsApi.reports({ period }), null, [period]);
  const r = data?.data || data || {};

  const maxBreed  = Math.max(...Object.values(r.cats_by_breed || {}).map(Number), 1);
  const maxStatus = Math.max(...Object.values(r.cats_by_status || {}).map(Number), 1);

  const handleExport = async (type) => {
    try {
      const res = await analyticsApi.exportReport(type, {});
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export report.');
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="📊 Reports &amp; Analytics"
        subtitle="Shelter performance metrics and insights"
        action={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => handleExport('adoptions')} className="btn btn-secondary btn-sm">⬇ Adoptions CSV</button>
            <button onClick={() => handleExport('rescues')} className="btn btn-secondary btn-sm">⬇ Rescues CSV</button>
            <button onClick={() => handleExport('donations')} className="btn btn-secondary btn-sm">⬇ Donations CSV</button>
          </div>
        }
      />

      {/* Period selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[
          { id: 'week', label: 'This Week' },
          { id: 'month', label: 'This Month' },
          { id: 'year', label: 'This Year' },
          { id: 'all', label: 'All Time' },
        ].map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding: '0.5rem 1.125rem',
            borderRadius: '8px',
            border: `2px solid ${period === p.id ? 'var(--cat-terra)' : 'var(--border-default)'}`,
            background: period === p.id ? 'var(--cat-terra)' : 'var(--surface-card)',
            color: period === p.id ? 'white' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner size="lg" text="Generating report…" />}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            <NumberCard icon="🐱" label="Total Cats"         value={r.total_cats || 0}              color="var(--cat-terra)" />
            <NumberCard icon="❤️" label="Adoptions"          value={r.adoptions || 0}               color="var(--cat-sage)" />
            <NumberCard icon="🚨" label="Rescues"            value={r.rescues_resolved || 0}        color="var(--cat-red)"  />
            <NumberCard icon="🙋" label="Volunteers"         value={r.active_volunteers || 0}       color="var(--cat-blue)" />
            <NumberCard icon="💝" label="Donations"          value={formatCurrency(r.total_donations)} color="var(--cat-amber)" wide />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* By status */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🐱 Cats by Status
              </h3>
              {Object.entries(r.cats_by_status || {}).map(([status, count]) => (
                <StatBar key={status} label={status.replace(/_/g, ' ')} value={Number(count)} max={maxStatus} color="var(--cat-terra)" />
              ))}
              {Object.keys(r.cats_by_status || {}).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data</p>}
            </div>

            {/* By breed */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🦴 Cats by Breed
              </h3>
              {Object.entries(r.cats_by_breed || {}).slice(0, 8).map(([breed, count]) => (
                <StatBar key={breed} label={breed.replace(/_/g, ' ')} value={Number(count)} max={maxBreed} color="var(--cat-brown)" />
              ))}
              {Object.keys(r.cats_by_breed || {}).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data</p>}
            </div>
          </div>

          {/* Adoption funnel */}
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ❤️ Adoption Funnel
            </h3>
            <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
              {[
                { label: 'Applications', value: r.total_applications || 0, color: 'var(--cat-terra)' },
                { label: 'Reviewed',     value: r.reviewed_applications || 0, color: 'var(--cat-brown)' },
                { label: 'Interviews',   value: r.interviews_done || 0, color: 'var(--cat-amber)' },
                { label: 'Approved',     value: r.approved_applications || 0, color: 'var(--cat-sage)' },
              ].map((stage, i, arr) => (
                <div key={stage.label} style={{ flex: 1, textAlign: 'center', padding: '1rem 0.5rem', background: `${stage.color}18`, borderRadius: i === 0 ? '10px 0 0 10px' : i === arr.length - 1 ? '0 10px 10px 0' : '0', borderRight: i < arr.length - 1 ? `2px solid white` : 'none' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.5rem', color: stage.color }}>{stage.value}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: stage.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>{stage.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}