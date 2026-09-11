'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Heart } from 'lucide-react';
import { mockAdoptionApplications } from '@/lib/mock-data/adoption';
import usePagination from '@/hooks/usePagination';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { formatDate, timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const STATUS_TONE = {
  SUBMITTED: 'bg-info/10 text-info',
  UNDER_REVIEW: 'bg-warning/10 text-warning',
  INTERVIEW_SCHEDULED: 'bg-primary/10 text-primary',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-destructive/10 text-destructive',
  WITHDRAWN: 'bg-surface-muted text-muted-foreground',
};
const STATUS_LABEL = {
  SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under review', INTERVIEW_SCHEDULED: 'Interview scheduled',
  APPROVED: 'Approved', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
};
const FILTER_STATUSES = ['', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED', 'WITHDRAWN'];
const REVIEW_OPTIONS = [
  { value: 'UNDER_REVIEW', label: 'Move to under review' },
  { value: 'INTERVIEW', label: 'Schedule interview' },
  { value: 'APPROVED', label: 'Approve' },
  { value: 'REJECTED', label: 'Reject' },
];

export default function AdminApplicationsPage() {
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(15);
  const [statusFilter, setStatusFilter] = useState('');
  const [applications, setApplications] = useState(mockAdoptionApplications);
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const filtered = applications.filter((a) => !statusFilter || a.status === statusFilter);
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleReview = () => {
    setSaving(true);
    setTimeout(() => {
      const nextStatus = reviewForm.status === 'INTERVIEW' ? 'INTERVIEW_SCHEDULED' : reviewForm.status;
      setApplications((apps) => apps.map((a) => (a.id === selected.id ? { ...a, status: nextStatus || a.status } : a)));
      setSelected(null);
      setSaving(false);
    }, 350);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader title="Adoption applications" description={`${total} total applications`}
        actions={<Button variant="secondary" size="sm" onClick={() => {}}><RefreshCw className="size-3.5" />Refresh</Button>} />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_STATUSES.map((s) => (
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

      {pageItems.length === 0 && (
        <EmptyState icon={Heart} title="No applications found" message="No adoption applications match your filter." />
      )}

      {pageItems.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Animal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Score</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{app.applicant_name}</div>
                    <div className="text-xs text-muted-foreground">{app.applicant_email}</div>
                  </TableCell>
                  <TableCell><Link href={`/cats/${app.cat}`} className="font-semibold text-primary">{app.cat_name}</Link></TableCell>
                  <TableCell><span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_TONE[app.status] || STATUS_TONE.SUBMITTED)}>{STATUS_LABEL[app.status] || app.status}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{timeAgo(app.created_at)}</TableCell>
                  <TableCell>{app.compatibility_score && <span className="font-bold text-primary">{Math.round(app.compatibility_score * 100)}%</span>}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => { setSelected(app); setReviewForm({ status: 'UNDER_REVIEW', notes: '' }); }}>Review</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Review: ${selected?.applicant_name}`}
        footer={<><Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button><Button onClick={handleReview} disabled={saving}>{saving ? 'Saving…' : 'Save review'}</Button></>}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Animal: <strong className="text-foreground">{selected.cat_name}</strong></span>
              <span>Applied: <strong className="text-foreground">{formatDate(selected.created_at)}</strong></span>
            </div>

            {selected.motivation && (
              <div className="rounded-lg bg-surface-muted p-3.5">
                <div className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Motivation</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{selected.motivation}</p>
              </div>
            )}

            <div>
              <Label htmlFor="review-status">Update status</Label>
              <NativeSelect id="review-status" value={reviewForm.status} onChange={(e) => setReviewForm((f) => ({ ...f, status: e.target.value }))} className="mt-1.5">
                {REVIEW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </NativeSelect>
            </div>

            {reviewForm.status === 'INTERVIEW' && (
              <div>
                <Label htmlFor="review-interview">Interview date &amp; time</Label>
                <Input id="review-interview" type="datetime-local" value={reviewForm.interview_scheduled_at || ''} onChange={(e) => setReviewForm((f) => ({ ...f, interview_scheduled_at: e.target.value }))} className="mt-1.5" />
              </div>
            )}

            {reviewForm.status === 'REJECTED' && (
              <div>
                <Label htmlFor="review-reject-reason">Rejection reason</Label>
                <Textarea id="review-reject-reason" value={reviewForm.rejection_reason || ''} onChange={(e) => setReviewForm((f) => ({ ...f, rejection_reason: e.target.value }))} rows={2} placeholder="Brief reason for rejection…" className="mt-1.5" />
              </div>
            )}

            <div>
              <Label htmlFor="review-notes">Internal notes</Label>
              <Textarea id="review-notes" value={reviewForm.notes} onChange={(e) => setReviewForm((f) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Notes visible only to shelter staff…" className="mt-1.5" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
