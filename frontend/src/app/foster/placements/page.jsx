'use client';

import { useState } from 'react';
import { Home, CheckCircle2, Undo2, Phone } from 'lucide-react';
import { mockFosterPlacements } from '@/lib/mock-data/foster';
import usePagination from '@/hooks/usePagination';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import { formatDate, timeAgo } from '@/utils/dateUtils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const STATUS_TONE = { ACTIVE: 'bg-success/10 text-success', COMPLETED: 'bg-info/10 text-info', RETURNED: 'bg-warning/10 text-warning' };
const SUMMARY_CARDS = [
  { key: 'ACTIVE', icon: Home, label: 'Active placements', tone: 'text-success', border: 'border-success' },
  { key: 'COMPLETED', icon: CheckCircle2, label: 'Completed', tone: 'text-info', border: 'border-info' },
  { key: 'RETURNED', icon: Undo2, label: 'Returned to shelter', tone: 'text-warning', border: 'border-warning' },
];

export default function FosterPlacementsPage() {
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(16);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const filtered = mockFosterPlacements.filter((p) => p.status === statusFilter);
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const placements = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader title="Foster placements" description={`${total} placements · Manage foster care arrangements`} />

      <div className="mb-6 grid grid-cols-3 gap-3.5">
        {SUMMARY_CARDS.map((s) => (
          <button key={s.key} onClick={() => { setStatusFilter(s.key); reset(); }}
            className={cn('rounded-xl border-2 bg-card p-4 text-center transition-colors', statusFilter === s.key ? s.border : 'border-border')}>
            <s.icon className={cn('mx-auto mb-1.5 size-6', statusFilter === s.key ? s.tone : 'text-muted-foreground')} />
            <div className={cn('text-[13px] font-bold', statusFilter === s.key ? s.tone : 'text-muted-foreground')}>{s.label}</div>
          </button>
        ))}
      </div>

      {placements.length === 0 && (
        <EmptyState icon={Home} title={`No ${statusFilter.toLowerCase()} placements`} message="No foster placements found for the selected filter." />
      )}

      {placements.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Animal</TableHead><TableHead>Foster parent</TableHead><TableHead>Start date</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead><TableHead>Last update</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {placements.map((p) => {
                const days = Math.floor((new Date() - new Date(p.start_date)) / 86400000);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-primary">{p.pet_name}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{p.foster_name}</div>
                      {p.foster_phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" />{p.foster_phone}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(p.start_date)}</TableCell>
                    <TableCell><span className={cn('font-bold', days > 30 ? 'text-warning' : 'text-foreground')}>{days}d</span></TableCell>
                    <TableCell><span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', STATUS_TONE[p.status] || STATUS_TONE.ACTIVE)}>{p.status}</span></TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{p.last_update_at ? timeAgo(p.last_update_at) : '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}
