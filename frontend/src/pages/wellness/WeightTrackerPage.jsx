import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { wellnessApi } from '../../api/wellnessApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/dateUtils';

function Sparkline({ data, color = 'var(--cat-terra)' }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.weight_kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 120, H = 40;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - ((v - min) / range) * H,
  ]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${pts[pts.length-1][0].toFixed(1)} ${H} L 0 ${H} Z`} fill="url(#sparkgrad)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.length > 0 && (
        <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color} />
      )}
    </svg>
  );
}

export default function WeightTrackerPage() {
  const { id: catId } = useParams();
  const { user }      = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [form,    setForm]    = useState({ weight_kg: '', measured_at: new Date().toISOString().split('T')[0], notes: '' });
  const [saving,  setSaving]  = useState(false);

  const { data, loading, refetch } = useApi(() => wellnessApi.listWeightLogs(catId), null, [catId]);
  const logs = data?.results || data || [];

  const canAdd = ['SUPER_ADMIN','SHELTER_ADMIN','VET'].includes(user?.role);
  const sorted = [...logs].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
  const latest = sorted[sorted.length - 1];
  const prev   = sorted[sorted.length - 2];
  const trend  = latest && prev
    ? (latest.weight_kg - prev.weight_kg).toFixed(2)
    : null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await wellnessApi.logWeight(catId, form);
      setAddOpen(false);
      refetch();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="page-container-sm">
      <PageHeader
        title="⚖️ Weight Tracker"
        backPath={`/cats/${catId}`}
        action={canAdd && (
          <button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Log Weight</button>
        )}
      />

      {/* Stats cards */}
      {latest && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1rem 1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--cat-terra)' }}>{latest.weight_kg} kg</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Weight</div>
          </div>
          {trend !== null && (
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1rem 1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: Number(trend) >= 0 ? 'var(--cat-sage)' : 'var(--cat-red)' }}>
                {Number(trend) >= 0 ? '▲' : '▼'} {Math.abs(trend)} kg
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Since Last Log</div>
            </div>
          )}
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1rem 1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--cat-brown)' }}>{logs.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Logs</div>
          </div>
        </div>
      )}

      {/* Mini chart */}
      {sorted.length >= 2 && (
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weight Trend</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last {Math.min(sorted.length, 10)} entries</p>
          </div>
          <Sparkline data={sorted.slice(-10)} />
        </div>
      )}

      {loading && <LoadingSpinner text="Loading weight logs…" />}

      {!loading && logs.length === 0 && (
        <EmptyState icon="⚖️" title="No weight logs" message="Start tracking this cat's weight to monitor their health."
          action={canAdd && <button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Log First Weight</button>} />
      )}

      {!loading && logs.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (kg)</th>
                <th>Change</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {[...logs].sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at)).map((log, i, arr) => {
                const prev = arr[i + 1];
                const change = prev ? (log.weight_kg - prev.weight_kg).toFixed(2) : null;
                return (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(log.measured_at)}</td>
                    <td style={{ fontWeight: 800, color: 'var(--cat-terra)', fontSize: '1rem' }}>{log.weight_kg} kg</td>
                    <td>
                      {change !== null && (
                        <span style={{ color: Number(change) >= 0 ? 'var(--cat-sage)' : 'var(--cat-red)', fontWeight: 700, fontSize: '0.875rem' }}>
                          {Number(change) >= 0 ? '▲' : '▼'} {Math.abs(change)} kg
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="⚖️ Log Weight"
        footer={
          <>
            <button onClick={() => setAddOpen(false)} className="btn btn-secondary">Cancel</button>
            <button form="weight-form" type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving…' : 'Log Weight'}
            </button>
          </>
        }
      >
        <form id="weight-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="label-base">Weight (kg) *</label>
            <input type="number" step="0.01" required min="0.1" max="30"
              value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))}
              className="input-base" placeholder="4.20" id="wt-kg" />
          </div>
          <div className="form-group">
            <label className="label-base">Measured On</label>
            <input type="date" value={form.measured_at} onChange={e => setForm(f => ({ ...f, measured_at: e.target.value }))}
              className="input-base" id="wt-date" />
          </div>
          <div className="form-group">
            <label className="label-base">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-base" placeholder="Any observations…" id="wt-notes" />
          </div>
        </form>
      </Modal>
    </div>
  );
}