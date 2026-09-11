'use client';

import { useState } from 'react';
import { Stethoscope, FileText } from 'lucide-react';
import { mockVetApprovals } from '@/lib/mock-data/users';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const STATUS_TONE = {
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-destructive/10 text-destructive',
  PENDING: 'bg-warning/10 text-warning',
  NOT_REQUIRED: 'bg-surface-muted text-muted-foreground',
};
const STATUS_LABEL = { APPROVED: 'Approved', REJECTED: 'Rejected', PENDING: 'Pending', NOT_REQUIRED: 'N/A' };

const LIFECYCLE_TONE = {
  PENDING: 'bg-warning/10 text-warning',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-destructive/10 text-destructive',
  APPEAL_UNDER_REVIEW: 'bg-warning/10 text-warning',
  SUPER_FINAL_REVIEW: 'bg-warning/10 text-warning',
  SUSPENDED: 'bg-destructive/10 text-destructive',
  FLAGGED: 'bg-destructive/10 text-destructive',
};
const LIFECYCLE_LABEL = {
  PENDING: 'Round 1', APPROVED: 'Approved', REJECTED: 'Rejected (appeal open)',
  APPEAL_UNDER_REVIEW: 'Appeal review', SUPER_FINAL_REVIEW: 'Final review',
  SUSPENDED: 'Suspended', FLAGGED: 'Flagged',
};

function Pill({ status, tone = STATUS_TONE, label = STATUS_LABEL }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap', tone[status] || tone.PENDING)}>
      {label[status] || status || '—'}
    </span>
  );
}

function Muted({ children, red }) {
  return <span className={cn('text-xs font-semibold', red ? 'text-destructive' : 'text-muted-foreground')}>{children}</span>;
}

function RejectModal({ target, onCancel, onSubmit, busy }) {
  const [details, setDetails] = useState('');
  const [anomalies, setAnomalies] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (details.trim().length < 5) { setError('Please provide the reason / details.'); return; }
    if (target.withAnomalies && anomalies.trim().length < 5) { setError('Please list the anomalies found.'); return; }
    onSubmit({ details: details.trim(), anomalies: anomalies.trim() });
    setDetails('');
    setAnomalies('');
    setError('');
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{target?.title}</DialogTitle>
          <DialogDescription>{target?.subtitle}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label>{target?.withAnomalies ? 'Details of the decision *' : 'Reason for rejection *'}</Label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="mt-1.5" placeholder="Explain the decision clearly." />
          </div>
          {target?.withAnomalies && (
            <div>
              <Label>Anomalies found *</Label>
              <Textarea value={anomalies} onChange={(e) => setAnomalies(e.target.value)} rows={3} className="mt-1.5" placeholder="List the anomalies / issues found in the documents or application." />
            </div>
          )}
          {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {busy ? 'Submitting…' : 'Confirm rejection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormBlock({ title, details, anomalies }) {
  if (!details && !anomalies) return null;
  return (
    <div className="mt-2 rounded-lg border border-border bg-surface-muted p-3 text-xs">
      <div className="mb-1 font-semibold text-foreground">{title}</div>
      {details && <div><strong>Details:</strong> {details}</div>}
      {anomalies && <div className="mt-1"><strong>Anomalies:</strong> {anomalies}</div>}
    </div>
  );
}

export default function VetApprovalsPage() {
  const { user } = useAuth();
  const isSuper = user?.role === 'SUPER_ADMIN';
  const isShelter = user?.role === 'SHELTER_ADMIN';

  const [list, setList] = useState(mockVetApprovals);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null);

  const visibleList = filter === 'pending'
    ? list.filter((row) => !['APPROVED', 'SUSPENDED', 'FLAGGED'].includes(row.vet_profile?.lifecycle_status))
    : list;

  const decide = (row, admin, decision, extra = {}) => {
    setBusyId(row.user_id);
    setTimeout(() => {
      setList((rows) => rows.map((r) => {
        if (r.user_id !== row.user_id) return r;
        const vp = { ...r.vet_profile };
        if (admin === 'super') vp.super_admin_status = decision;
        else vp.shelter_admin_status = decision;
        if (decision === 'REJECTED') {
          vp.rejection_reason = extra.details;
          if (vp.lifecycle_status === 'PENDING') vp.lifecycle_status = 'REJECTED';
        } else if (vp.super_admin_status === 'APPROVED' && vp.shelter_admin_status === 'APPROVED') {
          vp.lifecycle_status = 'APPROVED';
        }
        return { ...r, vet_profile: vp };
      }));
      setRejectTarget(null);
      setBusyId(null);
    }, 350);
  };

  const viewDoc = () => {
    alert('Mock preview — no real appeal document in this demo.');
  };

  const ApproveReject = ({ row, admin, withAnomalies, approveLabel = 'Approve', rejectLabel = 'Reject', title, subtitle }) => {
    const busy = busyId === row.user_id;
    return (
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" disabled={busy} onClick={() => decide(row, admin, 'APPROVED')}>{approveLabel}</Button>
        <Button size="sm" variant="secondary" disabled={busy}
          onClick={() => setRejectTarget({ row, admin, withAnomalies, title: title || 'Reject request', subtitle: subtitle || '' })}>
          {rejectLabel}
        </Button>
      </div>
    );
  };

  const renderActions = (row) => {
    const vp = row.vet_profile || {};
    const ls = vp.lifecycle_status;
    const appeal = vp.latest_appeal;

    if (ls === 'APPROVED') return <Muted>Fully approved</Muted>;
    if (ls === 'SUSPENDED') return <Muted red>Suspended (permanent)</Muted>;
    if (ls === 'FLAGGED') return <Muted red>Flagged (window lapsed)</Muted>;

    if (ls === 'PENDING') {
      if (isSuper) {
        if (vp.super_admin_status === 'PENDING') {
          return <ApproveReject row={row} admin="super" withAnomalies={false}
            title="Reject registration (Super Admin)" subtitle="The vet will get 5 days and one appeal." />;
        }
        return <Muted>You {vp.super_admin_status === 'APPROVED' ? 'approved' : 'rejected'} — awaiting shelter admin</Muted>;
      }
      if (isShelter) {
        if (vp.shelter_admin_status === 'PENDING') {
          return (
            <div>
              {vp.super_admin_status === 'REJECTED' && <div className="mb-1.5"><Muted red>Rejected by Super Admin</Muted></div>}
              <ApproveReject row={row} admin="shelter" withAnomalies={false}
                title="Reject registration (Shelter Admin)" subtitle="The vet will get 5 days and one appeal." />
            </div>
          );
        }
        return <Muted>You {vp.shelter_admin_status === 'APPROVED' ? 'approved' : 'rejected'} — awaiting super admin</Muted>;
      }
      return <Muted>Awaiting review</Muted>;
    }

    if (ls === 'APPEAL_UNDER_REVIEW' && appeal) {
      const canSuper = isSuper && appeal.needs_super_review && appeal.super_status === 'PENDING';
      const canShelter = isShelter && appeal.needs_shelter_review && appeal.shelter_status === 'PENDING';
      return (
        <div className="flex flex-col gap-1.5">
          {appeal.has_document && (
            <Button size="sm" variant="secondary" onClick={viewDoc}>
              <FileText className="size-3.5" />
              View proof (PDF)
            </Button>
          )}
          {canSuper && <ApproveReject row={row} admin="super" withAnomalies title="Reject appeal (Super Admin)"
            subtitle="Rejecting the appeal by the Super Admin is final and suspends the account." />}
          {canShelter && <ApproveReject row={row} admin="shelter" withAnomalies title="Reject appeal (Shelter Admin)"
            subtitle="If the Super Admin's stance is approval, this escalates to the Super Admin for a final call." />}
          {!canSuper && !canShelter && <Muted>Your decision is recorded — awaiting the other reviewer</Muted>}
        </div>
      );
    }

    if (ls === 'SUPER_FINAL_REVIEW' && appeal) {
      if (isSuper) {
        return (
          <div className="flex flex-col gap-1.5">
            {appeal.has_document && (
              <Button size="sm" variant="secondary" onClick={viewDoc}>
                <FileText className="size-3.5" />
                View proof (PDF)
              </Button>
            )}
            <FormBlock title="Shelter Admin's rejection" details={appeal.shelter_reject_details} anomalies={appeal.shelter_reject_anomalies} />
            <ApproveReject row={row} admin="super" withAnomalies approveLabel="Approve (override)" rejectLabel="Final reject"
              title="Final decision (Super Admin)" subtitle="Your decision is final. Rejecting suspends the account permanently." />
          </div>
        );
      }
      return <Muted>Awaiting Super Admin final decision</Muted>;
    }

    return <Muted>—</Muted>;
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Vet Approvals"
        description={isSuper
          ? 'Review veterinarian requests, appeals, and final escalations'
          : 'Review veterinarian requests and appeals for your shelter'}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant={filter === 'pending' ? 'default' : 'secondary'} onClick={() => setFilter('pending')}>Needs action</Button>
            <Button size="sm" variant={filter === 'all' ? 'default' : 'secondary'} onClick={() => setFilter('all')}>All</Button>
          </div>
        }
      />

      {visibleList.length === 0 && (
        <EmptyState icon={Stethoscope} title="No vet requests" message={filter === 'pending' ? 'Nothing is awaiting a decision.' : 'No veterinarian requests found.'} />
      )}

      {visibleList.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Reg. no.</TableHead>
                <TableHead>Practice</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Super</TableHead>
                <TableHead>Shelter</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleList.map((row) => {
                const vp = row.vet_profile || {};
                const appeal = vp.latest_appeal;
                const name = `${row.first_name || ''} ${row.last_name || ''}`.trim() || '—';
                const practice = vp.practice_type === 'SHELTER'
                  ? `Shelter${vp.target_shelter_name ? ` — ${vp.target_shelter_name}` : ''}`
                  : `Clinic${vp.clinic_name ? ` — ${vp.clinic_name}` : ''}`;
                const showAppeal = ['APPEAL_UNDER_REVIEW', 'SUPER_FINAL_REVIEW'].includes(vp.lifecycle_status) && appeal;
                return (
                  <TableRow key={row.user_id}>
                    <TableCell className="whitespace-normal">
                      <div className="font-semibold text-foreground">{name}</div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{(vp.specializations || []).join(', ')}</div>
                      {vp.rejection_reason && vp.lifecycle_status !== 'APPROVED' && (
                        <div className="mt-1 text-[11px] text-destructive">Reason: {vp.rejection_reason}</div>
                      )}
                      {showAppeal && (
                        <div className="mt-1.5 max-w-[280px] text-xs text-muted-foreground">
                          <strong className="text-foreground">Appeal:</strong> {appeal.explanation}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{vp.license_number || '—'}</TableCell>
                    <TableCell className="text-sm">{practice}</TableCell>
                    <TableCell><Pill status={vp.lifecycle_status} tone={LIFECYCLE_TONE} label={LIFECYCLE_LABEL} /></TableCell>
                    <TableCell><Pill status={vp.super_admin_status} /></TableCell>
                    <TableCell><Pill status={vp.shelter_admin_status} /></TableCell>
                    <TableCell className="whitespace-normal">{renderActions(row)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <RejectModal
        target={rejectTarget}
        busy={busyId === rejectTarget?.row?.user_id}
        onCancel={() => setRejectTarget(null)}
        onSubmit={(extra) => decide(rejectTarget.row, rejectTarget.admin, 'REJECTED', extra)}
      />
    </div>
  );
}
