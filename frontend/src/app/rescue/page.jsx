'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Siren, MapPin, HeartHandshake, Plus } from 'lucide-react';
import { mockRescueReports } from '@/lib/mock-data/rescue';
import usePagination from '@/hooks/usePagination';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import { timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const URGENCY_TONE = { LOW: 'bg-success/10 text-success', MEDIUM: 'bg-warning/10 text-warning', HIGH: 'bg-warning/10 text-warning', CRITICAL: 'bg-destructive/10 text-destructive' };
const STATUS_TONE = {
  PENDING: 'bg-warning/10 text-warning', ASSIGNED: 'bg-info/10 text-info', IN_PROGRESS: 'bg-highlight-mint/20 text-primary',
  RESOLVED: 'bg-success/10 text-success', CANCELLED: 'bg-surface-muted text-muted-foreground',
};

function RescueCard({ report }) {
  const isCritical = report.urgency_level === 'CRITICAL';
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm', isCritical ? 'border-destructive/40 border-l-4 border-l-destructive' : 'border-border')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-foreground">{report.description || 'Rescue report'}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">by {report.reporter_name || 'Anonymous'} · {timeAgo(report.reported_at)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', URGENCY_TONE[report.urgency_level] || URGENCY_TONE.MEDIUM)}>{report.urgency_level}</span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap', STATUS_TONE[report.status] || STATUS_TONE.PENDING)}>{report.status?.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {report.latitude && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {Number(report.latitude).toFixed(4)}, {Number(report.longitude).toFixed(4)}
        </div>
      )}

      {report.assigned_employee_name && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <HeartHandshake className="size-3.5" />
          Assigned to <strong className="text-foreground">{report.assigned_employee_name}</strong>
        </div>
      )}

      <div className="mt-auto flex justify-end">
        <Button size="sm" variant="secondary" asChild><Link href={`/rescue/${report.id}`}>View details</Link></Button>
      </div>
    </div>
  );
}

export default function RescueListPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [urgency, setUrgency] = useState('');
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(16);

  const filtered = mockRescueReports.filter((r) => (!statusFilter || r.status === statusFilter) && (!urgency || r.urgency_level === urgency));
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const reports = filtered.slice((page - 1) * pageSize, page * pageSize);
  const canSubmit = !!user;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-xl bg-destructive px-6 py-6 text-destructive-foreground sm:px-8">
        <Siren className="pointer-events-none absolute right-4 -bottom-2 size-20 opacity-10" />
        <div>
          <h1 className="font-display text-[26px] font-bold">Rescue reports</h1>
          <p className="mt-1 text-sm opacity-85">{total} reports · Coordinate emergency rescues</p>
        </div>
        {canSubmit && <Button variant="secondary" asChild><Link href="/rescue/submit"><Plus className="size-4" />Submit rescue</Link></Button>}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <NativeSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); reset(); }} className="w-auto min-w-[150px]">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
        </NativeSelect>
        <NativeSelect value={urgency} onChange={(e) => { setUrgency(e.target.value); reset(); }} className="w-auto min-w-[150px]">
          <option value="">All urgency</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </NativeSelect>
        <span className="ml-auto text-sm font-semibold text-muted-foreground">{total} results</span>
      </div>

      {reports.length === 0 && (
        <EmptyState icon={Siren} title="No rescue reports found" message="No reports match your current filters. Try changing the status or urgency level."
          action={canSubmit && <Button variant="destructive" asChild><Link href="/rescue/submit">Submit a rescue</Link></Button>} />
      )}

      {reports.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => <RescueCard key={r.id} report={r} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}
