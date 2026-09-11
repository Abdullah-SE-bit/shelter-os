'use client';

import { useState } from 'react';
import { PawPrint, Download, Heart, Siren, HeartHandshake, Gift } from 'lucide-react';
import { mockReports } from '@/lib/mock-data/analytics';
import PageHeader from '@/components/patterns/PageHeader';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TONE_TEXT = { primary: 'text-primary', success: 'text-success', warning: 'text-warning', destructive: 'text-destructive', info: 'text-info' };
const TONE_BG = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', destructive: 'bg-destructive', info: 'bg-info' };
const TONE_BG_TINT = { primary: 'bg-highlight-mint/20', success: 'bg-success/10', warning: 'bg-warning/10', destructive: 'bg-destructive/10', info: 'bg-info/10' };

function StatBar({ label, value, max, tone = 'primary' }) {
  const pct = Math.min(100, ((value || 0) / (max || 1)) * 100);
  return (
    <div className="mb-3.5">
      <div className="mb-1.5 flex justify-between text-sm font-medium text-muted-foreground">
        <span>{label}</span>
        <span className={cn('font-bold', TONE_TEXT[tone])}>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div className={cn('h-full rounded-full transition-all', TONE_BG[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NumberCard({ icon: Icon, label, value, tone = 'primary', wide }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border bg-card p-5', wide && 'col-span-2')}>
      <Icon className="pointer-events-none absolute top-1/2 right-3 size-14 -translate-y-1/2 opacity-[0.08]" />
      <div className={cn('text-[28px] leading-none font-bold', TONE_TEXT[tone])}>{value}</div>
      <div className="mt-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const r = mockReports;

  const maxBreed = Math.max(...Object.values(r.pets_by_breed || {}).map(Number), 1);
  const maxStatus = Math.max(...Object.values(r.pets_by_status || {}).map(Number), 1);

  const handleExport = (type) => {
    alert(`Mock export: ${type}_report.csv (no real file in this demo)`);
  };

  const funnelStages = [
    { label: 'Applications', value: r.total_applications || 0, tone: 'primary' },
    { label: 'Reviewed', value: r.reviewed_applications || 0, tone: 'info' },
    { label: 'Interviews', value: r.interviews_done || 0, tone: 'warning' },
    { label: 'Approved', value: r.approved_applications || 0, tone: 'success' },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Reports & analytics"
        description="Shelter performance metrics and insights"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleExport('adoptions')}><Download className="size-3.5" />Adoptions CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport('rescues')}><Download className="size-3.5" />Rescues CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport('donations')}><Download className="size-3.5" />Donations CSV</Button>
          </div>
        }
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {[{ id: 'week', label: 'This week' }, { id: 'month', label: 'This month' }, { id: 'year', label: 'This year' }, { id: 'all', label: 'All time' }].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={cn('rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors', period === p.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <NumberCard icon={PawPrint} label="Total pets" value={r.total_pets || 0} tone="primary" />
          <NumberCard icon={Heart} label="Adoptions" value={r.adoptions || 0} tone="success" />
          <NumberCard icon={Siren} label="Rescues" value={r.rescues_resolved || 0} tone="destructive" />
          <NumberCard icon={HeartHandshake} label="Employees" value={r.active_employees || 0} tone="info" />
          <NumberCard icon={Gift} label="Donations" value={formatCurrency(r.total_donations)} tone="warning" wide />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Pets by status</h3>
            {Object.entries(r.pets_by_status || {}).map(([status, count]) => (
              <StatBar key={status} label={status.replace(/_/g, ' ')} value={Number(count)} max={maxStatus} tone="primary" />
            ))}
            {Object.keys(r.pets_by_status || {}).length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Pets by breed</h3>
            {Object.entries(r.pets_by_breed || {}).slice(0, 8).map(([breed, count]) => (
              <StatBar key={breed} label={breed.replace(/_/g, ' ')} value={Number(count)} max={maxBreed} tone="info" />
            ))}
            {Object.keys(r.pets_by_breed || {}).length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Adoption funnel</h3>
          <div className="flex overflow-hidden rounded-lg">
            {funnelStages.map((stage, i) => (
              <div key={stage.label} className={cn('flex-1 py-4 text-center', TONE_BG_TINT[stage.tone], i > 0 && 'border-l-2 border-background')}>
                <div className={cn('text-2xl font-bold', TONE_TEXT[stage.tone])}>{stage.value}</div>
                <div className={cn('mt-1 text-[11px] font-semibold tracking-wide uppercase', TONE_TEXT[stage.tone])}>{stage.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
