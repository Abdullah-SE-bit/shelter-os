'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Inbox, Search, CalendarClock, CheckCircle2, XCircle, Undo2, Heart } from 'lucide-react';
import { mockAdoptionApplications } from '@/lib/mock-data/adoption';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  SUBMITTED: { tone: 'bg-info/10 text-info', icon: Inbox, label: 'Submitted' },
  UNDER_REVIEW: { tone: 'bg-warning/10 text-warning', icon: Search, label: 'Under review' },
  INTERVIEW_SCHEDULED: { tone: 'bg-primary/10 text-primary', icon: CalendarClock, label: 'Interview' },
  APPROVED: { tone: 'bg-success/10 text-success', icon: CheckCircle2, label: 'Approved' },
  REJECTED: { tone: 'bg-destructive/10 text-destructive', icon: XCircle, label: 'Rejected' },
  WITHDRAWN: { tone: 'bg-surface-muted text-muted-foreground', icon: Undo2, label: 'Withdrawn' },
};
const TIMELINE_STEPS = ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'APPROVED'];
const PET_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState(mockAdoptionApplications);

  const handleWithdraw = (id) => {
    if (!window.confirm('Withdraw this application?')) return;
    setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, status: 'WITHDRAWN' } : a)));
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader title="My applications" description={`${applications.length} adoption application${applications.length !== 1 ? 's' : ''}`} />

      {applications.length === 0 && (
        <EmptyState icon={Heart} title="No applications yet" message="Browse animals available for adoption and apply to give one a forever home."
          action={<Button asChild><Link href="/adoption">Browse animals</Link></Button>} />
      )}

      {applications.length > 0 && (
        <div className="flex flex-col gap-4">
          {applications.map((app) => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.SUBMITTED;
            const currentIdx = TIMELINE_STEPS.indexOf(app.status);
            return (
              <div key={app.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-start gap-4 p-5">
                  <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                    <img src={app.pet_photo || PET_PLACEHOLDER} alt={app.pet_name} className="size-full object-cover" onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-[17px] font-extrabold text-foreground">{app.pet_name || 'Animal'}</h3>
                      <span className={cn('flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', cfg.tone)}><cfg.icon className="size-3" />{cfg.label}</span>
                    </div>

                    <p className="mb-2 text-[13px] text-muted-foreground">{app.shelter_name || 'Shelter'} · Applied {formatDate(app.created_at)}</p>

                    {app.status !== 'REJECTED' && app.status !== 'WITHDRAWN' && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {TIMELINE_STEPS.map((s, i, arr) => {
                          const reached = currentIdx >= i;
                          return (
                            <span key={s} className="flex items-center gap-1.5">
                              <span className={cn(reached ? 'font-bold text-primary' : 'text-muted-foreground')}>{reached ? '●' : '○'} {STATUS_CONFIG[s]?.label}</span>
                              {i < arr.length - 1 && <span>→</span>}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {app.interview_scheduled_at && (
                      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-[13px] font-semibold text-primary">
                        <CalendarClock className="size-3.5" />
                        Interview: {formatDate(app.interview_scheduled_at)}{app.interview_format && ` · ${app.interview_format}`}
                      </div>
                    )}

                    {app.status === 'REJECTED' && app.rejection_reason && (
                      <div className="mt-2.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-[13px] text-destructive">Reason: {app.rejection_reason}</div>
                    )}
                  </div>
                </div>

                {['SUBMITTED', 'UNDER_REVIEW'].includes(app.status) && (
                  <div className="flex justify-end border-t border-border bg-surface-muted px-5 py-3">
                    <Button size="sm" variant="secondary" onClick={() => handleWithdraw(app.id)}><Undo2 className="size-3.5" />Withdraw</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
