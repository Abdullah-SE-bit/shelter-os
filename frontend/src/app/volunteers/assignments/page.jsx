'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HeartHandshake, CalendarDays, Building2, Siren } from 'lucide-react';
import { mockVolunteerAssignments } from '@/lib/mock-data/rescue';
import usePagination from '@/hooks/usePagination';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_TONE = {
  PENDING: 'bg-warning/10 text-warning', ACCEPTED: 'bg-info/10 text-info', IN_PROGRESS: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-success/10 text-success', REJECTED: 'bg-destructive/10 text-destructive',
};
const STATUS_LABEL = { PENDING: 'Pending', ACCEPTED: 'Accepted', IN_PROGRESS: 'In progress', COMPLETED: 'Completed', REJECTED: 'Rejected' };

export default function AssignmentsPage() {
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(16);
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = mockVolunteerAssignments.filter((a) => !statusFilter || a.status === statusFilter);
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const assignments = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader title="My assignments" description={`${total} volunteer assignments`} />

      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => { setStatusFilter(s); reset(); }}
            className={cn(
              'rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-colors',
              statusFilter === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-border-strong',
            )}
          >
            {s ? STATUS_LABEL[s] || s : 'All'}
          </button>
        ))}
      </div>

      {assignments.length === 0 && (
        <EmptyState icon={HeartHandshake} title="No assignments" message={statusFilter ? `No ${statusFilter.toLowerCase()} assignments.` : 'You have no volunteer assignments yet. Browse rescue reports to get started!'} />
      )}

      {assignments.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((asgn) => (
            <div key={asgn.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{asgn.assignment_type?.replace(/_/g, ' ') || 'Assignment'}</span>
                  <h3 className="mt-0.5 text-[15px] font-bold text-foreground">{asgn.rescue_description || 'Task'}</h3>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', STATUS_TONE[asgn.status] || STATUS_TONE.PENDING)}>{STATUS_LABEL[asgn.status] || asgn.status}</span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {asgn.scheduled_at && <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{formatDate(asgn.scheduled_at)}</span>}
                {asgn.shelter_name && <span className="flex items-center gap-1"><Building2 className="size-3.5" />{asgn.shelter_name}</span>}
              </div>

              {asgn.notes && <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm leading-relaxed text-muted-foreground">{asgn.notes}</p>}

              {asgn.rescue_id && (
                <Button size="sm" variant="secondary" className="self-start" asChild>
                  <Link href={`/rescue/${asgn.rescue_id}`}><Siren className="size-3.5" />View rescue</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
    </div>
  );
}
