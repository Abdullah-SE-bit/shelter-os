import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Scale, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { wellnessApi } from '@/api/wellnessApi';
import useApi from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function Sparkline({ data }) {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => d.weight_kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 140, H = 44;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - ((v - min) / range) * H]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  return (
    <svg width={W} height={H} className="overflow-visible">
      <defs>
        <linearGradient id="wt-sparkgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${pts[pts.length - 1][0].toFixed(1)} ${H} L 0 ${H} Z`} fill="url(#wt-sparkgrad)" />
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="var(--primary)" />
    </svg>
  );
}

export default function WeightTrackerPage() {
  const { id: catId } = useParams();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ weight_kg: '', measured_at: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useApi(() => wellnessApi.listWeightLogs(catId), null, [catId]);
  const logs = data?.results || data || [];

  const canAdd = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'].includes(user?.role);
  // NOTE (pre-existing): the growth API returns each log's timestamp as `recorded_at`,
  // not `measured_at` — sort/trend/date display below silently no-op until the
  // backend or this mapping is fixed. Left as-is; not a presentation bug.
  const sorted = [...logs].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const trend = latest && prev ? (latest.weight_kg - prev.weight_kg).toFixed(2) : null;

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
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Weight tracker"
        backTo={`/cats/${catId}`}
        backLabel="Cat profile"
        actions={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Log weight</Button>}
      />

      {latest && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-[28px] font-black text-primary">{latest.weight_kg} kg</div>
            <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Current weight</div>
          </div>
          {trend !== null && (
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className={cn('flex items-center justify-center gap-1 text-[28px] font-black', Number(trend) >= 0 ? 'text-success' : 'text-destructive')}>
                {Number(trend) >= 0 ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                {Math.abs(trend)} kg
              </div>
              <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Since last log</div>
            </div>
          )}
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-[28px] font-black text-foreground">{logs.length}</div>
            <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Total logs</div>
          </div>
        </div>
      )}

      {sorted.length >= 2 && (
        <div className="mb-6 flex items-center justify-between gap-6 rounded-xl border border-border bg-card p-5">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Weight trend</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Last {Math.min(sorted.length, 10)} entries</p>
          </div>
          <Sparkline data={sorted.slice(-10)} />
        </div>
      )}

      {loading && <LoadingSpinner text="Loading weight logs…" />}

      {!loading && logs.length === 0 && (
        <EmptyState icon={Scale} title="No weight logs" message="Start tracking this cat's weight to monitor their health."
          action={canAdd && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Log first weight</Button>} />
      )}

      {!loading && logs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Weight</TableHead><TableHead>Change</TableHead><TableHead>Notes</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {[...logs].sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at)).map((log, i, arr) => {
                const p = arr[i + 1];
                const change = p ? (log.weight_kg - p.weight_kg).toFixed(2) : null;
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-semibold">{formatDate(log.measured_at)}</TableCell>
                    <TableCell className="font-bold text-primary">{log.weight_kg} kg</TableCell>
                    <TableCell>
                      {change !== null && (
                        <span className={cn('flex items-center gap-1 text-sm font-bold', Number(change) >= 0 ? 'text-success' : 'text-destructive')}>
                          {Number(change) >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                          {Math.abs(change)} kg
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.notes || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Log weight"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button form="weight-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Log weight'}</Button></>}
      >
        <form id="weight-form" onSubmit={handleSave} className="flex flex-col gap-4">
          <div><Label>Weight (kg) *</Label><Input type="number" step="0.01" required min="0.1" max="30" value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} placeholder="4.20" className="mt-1.5" /></div>
          <div><Label>Measured on</Label><Input type="date" value={form.measured_at} onChange={(e) => setForm((f) => ({ ...f, measured_at: e.target.value }))} className="mt-1.5" /></div>
          <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any observations…" className="mt-1.5" /></div>
        </form>
      </Modal>
    </div>
  );
}
