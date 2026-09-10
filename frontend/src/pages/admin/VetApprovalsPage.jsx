import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { formatDateTime } from '../../utils/dateUtils';

const STATUS_META = {
  APPROVED:     { color: '#2E6B24', bg: 'var(--cat-sage-light)', text: '✅ Approved' },
  REJECTED:     { color: 'var(--cat-red)', bg: '#FBE3E3', text: '❌ Rejected' },
  PENDING:      { color: '#8A6D1A', bg: '#FBEFD3', text: '⏳ Pending' },
  NOT_REQUIRED: { color: 'var(--text-muted)', bg: '#EDE8E3', text: '— N/A' },
};

const LIFECYCLE_META = {
  PENDING:             { text: 'Round 1',        color: '#8A6D1A', bg: '#FBEFD3' },
  APPROVED:            { text: 'Approved',        color: '#2E6B24', bg: 'var(--cat-sage-light)' },
  REJECTED:            { text: 'Rejected (appeal open)', color: 'var(--cat-red)', bg: '#FBE3E3' },
  APPEAL_UNDER_REVIEW: { text: 'Appeal review',   color: '#8A6D1A', bg: '#FBEFD3' },
  SUPER_FINAL_REVIEW:  { text: 'Final review',    color: '#8A6D1A', bg: '#FBEFD3' },
  SUSPENDED:           { text: 'Suspended',       color: 'var(--cat-red)', bg: '#FBE3E3' },
  FLAGGED:             { text: 'Flagged',         color: 'var(--cat-red)', bg: '#FBE3E3' },
};

function Pill({ status, map = STATUS_META }) {
  const m = map[status] || STATUS_META.PENDING;
  return (
    <span style={{ fontWeight: 700, fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '999px', color: m.color, background: m.bg, whiteSpace: 'nowrap' }}>
      {m.text}
    </span>
  );
}

function Muted({ children, red }) {
  return <span style={{ color: red ? 'var(--cat-red)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem' }}>{children}</span>;
}

// Modal for capturing a rejection form (details + optional anomalies).
function RejectModal({ target, onCancel, onSubmit, busy }) {
  const [details, setDetails] = useState('');
  const [anomalies, setAnomalies] = useState('');
  const [error, setError] = useState('');
  if (!target) return null;

  const submit = () => {
    if (details.trim().length < 5) { setError('Please provide the reason / details.'); return; }
    if (target.withAnomalies && anomalies.trim().length < 5) { setError('Please list the anomalies found.'); return; }
    onSubmit({ details: details.trim(), anomalies: anomalies.trim() });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
      <div style={{ background: 'var(--surface-raised)', borderRadius: '16px', padding: '1.5rem', maxWidth: '520px', width: '100%', boxShadow: 'var(--shadow-xl)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{target.title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1rem' }}>{target.subtitle}</p>
        <div className="form-group">
          <label className="label-base">{target.withAnomalies ? 'Details of the decision *' : 'Reason for rejection *'}</label>
          <textarea value={details} onChange={e => setDetails(e.target.value)} className="input-base" rows={3} style={{ resize: 'vertical' }} placeholder="Explain the decision clearly." />
        </div>
        {target.withAnomalies && (
          <div className="form-group">
            <label className="label-base">Anomalies found *</label>
            <textarea value={anomalies} onChange={e => setAnomalies(e.target.value)} className="input-base" rows={3} style={{ resize: 'vertical' }} placeholder="List the anomalies / issues found in the documents or application." />
          </div>
        )}
        {error && <div className="form-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={busy} className="btn btn-secondary">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn btn-primary" style={{ background: 'var(--cat-red)', borderColor: 'var(--cat-red)' }}>
            {busy ? 'Submitting…' : 'Confirm rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormBlock({ title, details, anomalies }) {
  if (!details && !anomalies) return null;
  return (
    <div style={{ background: 'var(--cat-linen)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '0.6rem 0.75rem', marginTop: '0.5rem', fontSize: '0.78rem' }}>
      <div style={{ fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{title}</div>
      {details && <div><strong>Details:</strong> {details}</div>}
      {anomalies && <div style={{ marginTop: '0.2rem' }}><strong>Anomalies:</strong> {anomalies}</div>}
    </div>
  );
}

export default function VetApprovalsPage() {
  useDocumentTitle('Vet Approvals');
  const { user } = useAuth();
  const isSuper = user?.role === 'SUPER_ADMIN';
  const isShelter = user?.role === 'SHELTER_ADMIN';

  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState(null);
  const [filter, setFilter]   = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.listVetApprovals(filter === 'pending' ? { status: 'pending' } : {});
      const data = res.data?.data ?? res.data;
      setList(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const decide = async (row, admin, decision, extra = {}) => {
    setBusyId(row.user_id);
    try {
      const payload = { decision, ...extra };
      if (admin === 'super') await authApi.superDecideVet(row.user_id, payload);
      else await authApi.shelterDecideVet(row.user_id, payload);
      setRejectTarget(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to record the decision.');
    } finally {
      setBusyId(null);
    }
  };

  const viewDoc = async (row) => {
    try {
      const res = await authApi.getVetAppealDocument(row.user_id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch {
      alert('Could not open the appeal document.');
    }
  };

  const ApproveReject = ({ row, admin, withAnomalies, approveLabel = '✅ Approve', rejectLabel = 'Reject', title, subtitle }) => {
    const busy = busyId === row.user_id;
    return (
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button disabled={busy} className="btn btn-primary btn-sm" onClick={() => decide(row, admin, 'APPROVED')}>{approveLabel}</button>
        <button disabled={busy} className="btn btn-secondary btn-sm"
          onClick={() => setRejectTarget({ row, admin, withAnomalies, title: title || 'Reject request', subtitle: subtitle || '' })}>
          {rejectLabel}
        </button>
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

    // ---- Round 1 ----
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
              {vp.super_admin_status === 'REJECTED' && <div style={{ marginBottom: '0.35rem' }}><Muted red>Rejected by Super Admin</Muted></div>}
              <ApproveReject row={row} admin="shelter" withAnomalies={false}
                title="Reject registration (Shelter Admin)" subtitle="The vet will get 5 days and one appeal." />
            </div>
          );
        }
        return <Muted>You {vp.shelter_admin_status === 'APPROVED' ? 'approved' : 'rejected'} — awaiting super admin</Muted>;
      }
      return <Muted>Awaiting review</Muted>;
    }

    // ---- Appeal under review ----
    if (ls === 'APPEAL_UNDER_REVIEW' && appeal) {
      const canSuper = isSuper && appeal.needs_super_review && appeal.super_status === 'PENDING';
      const canShelter = isShelter && appeal.needs_shelter_review && appeal.shelter_status === 'PENDING';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {appeal.has_document && (
            <button className="btn btn-secondary btn-sm" onClick={() => viewDoc(row)}>📄 View proof (PDF)</button>
          )}
          {canSuper && <ApproveReject row={row} admin="super" withAnomalies title="Reject appeal (Super Admin)"
            subtitle="Rejecting the appeal by the Super Admin is final and suspends the account." />}
          {canShelter && <ApproveReject row={row} admin="shelter" withAnomalies title="Reject appeal (Shelter Admin)"
            subtitle="If the Super Admin's stance is approval, this escalates to the Super Admin for a final call." />}
          {!canSuper && !canShelter && <Muted>Your decision is recorded — awaiting the other reviewer</Muted>}
        </div>
      );
    }

    // ---- Super admin final review (escalation) ----
    if (ls === 'SUPER_FINAL_REVIEW' && appeal) {
      if (isSuper) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {appeal.has_document && <button className="btn btn-secondary btn-sm" onClick={() => viewDoc(row)}>📄 View proof (PDF)</button>}
            <FormBlock title="Shelter Admin's rejection" details={appeal.shelter_reject_details} anomalies={appeal.shelter_reject_anomalies} />
            <ApproveReject row={row} admin="super" withAnomalies approveLabel="✅ Approve (override)" rejectLabel="Final reject"
              title="Final decision (Super Admin)" subtitle="Your decision is final. Rejecting suspends the account permanently." />
          </div>
        );
      }
      return <Muted>Awaiting Super Admin final decision</Muted>;
    }

    return <Muted>—</Muted>;
  };

  return (
    <div className="page-container">
      <PageHeader
        title="🩺 Vet Approvals"
        subtitle={isSuper
          ? 'Review veterinarian requests, appeals, and final escalations'
          : 'Review veterinarian requests and appeals for your shelter'}
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setFilter('pending')} className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}>Needs action</button>
            <button onClick={() => setFilter('all')} className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}>All</button>
          </div>
        }
      />

      {loading && <LoadingSpinner text="Loading vet requests…" />}

      {!loading && list.length === 0 && (
        <EmptyState icon="🩺" title="No vet requests" message={filter === 'pending' ? 'Nothing is awaiting a decision.' : 'No veterinarian requests found.'} />
      )}

      {!loading && list.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Reg. No.</th>
                <th>Practice</th>
                <th>Stage</th>
                <th>Super</th>
                <th>Shelter</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map(row => {
                const vp = row.vet_profile || {};
                const appeal = vp.latest_appeal;
                const name = `${row.first_name || ''} ${row.last_name || ''}`.trim() || '—';
                const practice = vp.practice_type === 'SHELTER'
                  ? `Shelter${vp.target_shelter_name ? ` — ${vp.target_shelter_name}` : ''}`
                  : `Clinic${vp.clinic_name ? ` — ${vp.clinic_name}` : ''}`;
                const showAppeal = ['APPEAL_UNDER_REVIEW', 'SUPER_FINAL_REVIEW'].includes(vp.lifecycle_status) && appeal;
                return (
                  <tr key={row.user_id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row.email}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                        {(vp.specializations || []).join(', ')}
                      </div>
                      {vp.rejection_reason && vp.lifecycle_status !== 'APPROVED' && (
                        <div style={{ color: 'var(--cat-red)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                          Reason: {vp.rejection_reason}
                        </div>
                      )}
                      {showAppeal && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                          <strong>Appeal:</strong> {appeal.explanation}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{vp.license_number || '—'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{practice}</td>
                    <td><Pill status={vp.lifecycle_status} map={LIFECYCLE_META} /></td>
                    <td><Pill status={vp.super_admin_status} /></td>
                    <td><Pill status={vp.shelter_admin_status} /></td>
                    <td>{renderActions(row)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
