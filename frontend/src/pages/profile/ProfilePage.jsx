import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Crown, Home, Stethoscope, HeartHandshake, Cat, Heart, User, Shield, CheckCircle2, XCircle, PawPrint, Paperclip, MessageSquare, Bell, PartyPopper, Lock, Frown, Clock, Ban } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/authApi';
import useApi from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/patterns/PageHeader';
import { formatDate } from '@/utils/dateUtils';
import { initials } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const ROLE_META = {
  SUPER_ADMIN: { icon: Crown, label: 'Super Admin' },
  SHELTER_ADMIN: { icon: Home, label: 'Shelter Admin' },
  VET: { icon: Stethoscope, label: 'Veterinarian' },
  VOLUNTEER: { icon: HeartHandshake, label: 'Volunteer' },
  CAT_OWNER: { icon: Cat, label: 'Cat Owner' },
  ADOPTER: { icon: Heart, label: 'Adopter' },
};

const STATUS_TONE = { APPROVED: 'text-success bg-success/10', REJECTED: 'text-destructive bg-destructive/10', PENDING: 'text-warning bg-warning/10', NOT_REQUIRED: 'text-muted-foreground bg-surface-muted' };
const STATUS_LABEL = { APPROVED: 'Approved', REJECTED: 'Rejected', PENDING: 'Pending', NOT_REQUIRED: 'Not required' };

function StatusPill({ status }) {
  return <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', STATUS_TONE[status] || STATUS_TONE.PENDING)}>{STATUS_LABEL[status] || status}</span>;
}

function daysLeft(deadline) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86400000);
}

function AppealForm({ onSubmitted }) {
  const [explanation, setExplanation] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (explanation.trim().length < 20) { setError('Please explain in detail (at least 20 characters).'); return; }
    if (!file) { setError('Please attach your veterinary proof as a PDF.'); return; }
    if (!file.name.toLowerCase().endsWith('.pdf')) { setError('Only PDF documents are allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('The document must be 10 MB or smaller.'); return; }

    const fd = new FormData();
    fd.append('explanation', explanation.trim());
    fd.append('document', file);
    setLoading(true);
    try {
      await authApi.submitVetAppeal(fd);
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not submit your appeal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <div>
        <Label>Explain your case in detail *</Label>
        <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={4} placeholder="Explain why your registration should be approved. Address the reason(s) given above." className="mt-1.5" />
      </div>
      <div>
        <Label>Veterinary proof (PDF only) *</Label>
        <input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1.5 block w-full text-sm" />
        <p className="mt-1 text-xs text-muted-foreground">Attach official documents proving your veterinary credentials. Max 10 MB.</p>
      </div>
      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
      <Button type="submit" disabled={loading}><Paperclip className="size-4" />{loading ? 'Submitting appeal…' : 'Submit appeal'}</Button>
    </form>
  );
}

function ApprovalRow({ label, status, hint }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-3.5 py-2.5">
      <div>
        <div className="text-sm font-bold text-foreground">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
      <StatusPill status={status} />
    </div>
  );
}

const LIFECYCLE_BANNER = {
  APPROVED: { tone: 'bg-success/10 text-success', icon: PartyPopper, text: 'You are fully approved — all veterinarian features are unlocked.' },
  PENDING: { tone: 'bg-warning/10 text-warning', icon: Lock, text: 'Your account is under review. Only your profile is available until approval.' },
  REJECTED: { tone: 'bg-destructive/10 text-destructive', icon: Frown, text: 'Your registration was rejected. You may submit ONE appeal with additional proof before the deadline below.' },
  APPEAL_UNDER_REVIEW: { tone: 'bg-warning/10 text-warning', icon: Clock, text: 'Your appeal is under review. We will notify you of the decision.' },
  SUPER_FINAL_REVIEW: { tone: 'bg-warning/10 text-warning', icon: Clock, text: 'Your appeal has been escalated to the Super Admin for a final decision.' },
  SUSPENDED: { tone: 'bg-destructive/10 text-destructive', icon: Ban, text: 'Your registration was permanently rejected and your account is suspended.' },
  FLAGGED: { tone: 'bg-destructive/10 text-destructive', icon: Ban, text: 'Your appeal window lapsed. Your account has been flagged and is no longer active.' },
};

function VetApprovalCard({ vp, emailVerified, onChanged }) {
  const ls = vp.lifecycle_status;
  const banner = LIFECYCLE_BANNER[ls] || { tone: 'bg-warning/10 text-warning', icon: Lock, text: 'Your account is under review.' };
  const shelterHint = vp.shelter_admin_status === 'NOT_REQUIRED' ? 'No shelter selected — shelter approval not required' : (vp.shelter_admin_status === 'PENDING' ? 'Pending by Shelter Admin' : undefined);
  const remaining = daysLeft(vp.appeal_deadline);

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase"><Stethoscope className="size-3.5" />Verification &amp; approval</h3>

      <div className={cn('mb-4 flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm leading-relaxed font-semibold', banner.tone)}>
        <banner.icon className="mt-0.5 size-4 shrink-0" />
        {banner.text}
      </div>

      <div className="flex flex-col gap-2.5">
        <ApprovalRow label="Email verified" status={emailVerified ? 'APPROVED' : 'PENDING'} />
        <ApprovalRow label="Super Admin" status={vp.super_admin_status} hint={vp.super_admin_status === 'PENDING' ? 'Pending by Super Admin' : undefined} />
        <ApprovalRow label="Shelter Admin" status={vp.shelter_admin_status} hint={shelterHint} />
      </div>

      {vp.rejection_reason && ['REJECTED', 'APPEAL_UNDER_REVIEW', 'SUPER_FINAL_REVIEW'].includes(ls) && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-3.5 py-3 text-sm text-destructive"><strong>Reason for rejection:</strong> {vp.rejection_reason}</div>
      )}
      {(ls === 'SUSPENDED' || ls === 'FLAGGED') && vp.blocked_reason && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-3.5 py-3 text-sm text-destructive"><strong>Details:</strong> {vp.blocked_reason}</div>
      )}

      {ls === 'REJECTED' && (
        <div className="mt-4 rounded-xl border border-dashed border-destructive/40 p-4">
          <div className="mb-1.5 flex items-center gap-1.5 font-extrabold text-destructive"><Clock className="size-4" />{remaining === 0 ? 'Appeal window closing today' : `${remaining} day${remaining === 1 ? '' : 's'} left to appeal`}</div>
          <div className="text-[13px] leading-relaxed text-muted-foreground">
            You have <strong>one</strong> appeal. Explain your case in detail and attach your veterinary proof (PDF). If you do not appeal and get re-approved within 5 days of the rejection, your account and registration number will be permanently blocked.
          </div>
          {vp.can_appeal ? <AppealForm onSubmitted={onChanged} /> : <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">The appeal window has closed or your appeal has been used.</div>}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3.5">
        <InfoBlock label="Registration no." value={vp.license_number} />
        <InfoBlock label="Practice type" value={vp.practice_type === 'SHELTER' ? 'Shelter' : 'Clinic'} />
        {vp.practice_type === 'CLINIC' ? (
          <>
            <InfoBlock label="Clinic name" value={vp.clinic_name} />
            <InfoBlock label="Clinic location" value={vp.clinic_location} />
            <InfoBlock label="Clinic reg. no." value={vp.clinic_registration_number} />
          </>
        ) : <InfoBlock label="Shelter" value={vp.target_shelter_name} />}
      </div>

      {Array.isArray(vp.specializations) && vp.specializations.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">Specializations</div>
          <div className="flex flex-wrap gap-1.5">{vp.specializations.map((s) => <span key={s} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-foreground">{s}</span>)}</div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <div className="mb-0.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="text-[15px] font-semibold text-foreground">{value || '—'}</div>
    </div>
  );
}

const QUICK_LINKS = [
  { to: '/adoption/my-applications', Icon: Heart, label: 'My applications' },
  { to: '/cats', Icon: Cat, label: 'My cats' },
  { to: '/messages', Icon: MessageSquare, label: 'Messages' },
  { to: '/notifications', Icon: Bell, label: 'Notifications' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, loading } = useApi(() => authApi.getMe());

  if (loading) return <div className="p-8"><LoadingSpinner size="lg" text="Loading profile…" /></div>;

  const u = profile || user;
  const p = u?.profile || {};
  const roleMeta = ROLE_META[u?.role] || { icon: User, label: u?.role };
  const memberSince = u?.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader title="My profile" actions={<Button asChild><Link to="/profile/edit">Edit profile</Link></Button>} />

      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative h-[120px] bg-gradient-to-br from-[var(--brand-rust)] via-[var(--brand-ink)] to-[var(--brand-amber)]">
          <PawPrint className="pointer-events-none absolute right-6 -bottom-4 size-20 text-white opacity-15" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="-mt-11 mb-4 flex size-[88px] items-center justify-center rounded-full border-4 border-card bg-gradient-to-br from-[var(--brand-rust)] to-[var(--brand-ink)] text-3xl font-black text-white shadow-md">
            {p.profile_photo_url ? <img src={p.profile_photo_url} alt="avatar" className="size-full rounded-full object-cover" /> : initials(p.first_name, p.last_name)}
          </div>
          <h2 className="mb-1.5 text-2xl font-black text-foreground">{p.first_name} {p.last_name}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary"><roleMeta.icon className="size-3.5" />{roleMeta.label}</span>
            <span className="text-sm text-muted-foreground">{u?.email}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {[
          { title: 'Personal info', Icon: User, fields: [{ label: 'First name', value: p.first_name }, { label: 'Last name', value: p.last_name }, { label: 'Phone', value: p.phone }, { label: 'Date of birth', value: p.date_of_birth ? formatDate(p.date_of_birth) : null }] },
          { title: 'Account info', Icon: Shield, fields: [{ label: 'Email', value: u?.email }, { label: 'Role', value: roleMeta.label }, { label: 'Email verified', value: u?.is_email_verified ? 'Yes' : 'No', icon: u?.is_email_verified ? CheckCircle2 : XCircle }, { label: 'Member since', value: memberSince }] },
        ].map(({ title, Icon, fields }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase"><Icon className="size-3.5" />{title}</h3>
            <div className="flex flex-col gap-3.5">{fields.filter((f) => f.value).map((f) => <InfoBlock key={f.label} label={f.label} value={f.value} />)}</div>
          </div>
        ))}
      </div>

      {u?.role === 'VET' && u?.vet_profile && <VetApprovalCard vp={u.vet_profile} emailVerified={u?.is_email_verified} onChanged={() => window.location.reload()} />}

      {p.bio && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase"><PawPrint className="size-3.5" />Bio</h3>
          <p className="leading-relaxed text-muted-foreground">{p.bio}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_LINKS.map(({ to, Icon, label }) => (
          <Link key={to} to={to} className="rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary">
            <Icon className="mx-auto mb-1.5 size-6 text-muted-foreground" />
            <div className="text-[13px] font-bold text-foreground">{label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
