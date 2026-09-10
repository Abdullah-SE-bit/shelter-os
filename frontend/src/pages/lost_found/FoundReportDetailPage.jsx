import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Frown, Search, Link2, PartyPopper, Home, CalendarDays, User, MapPin, CheckCircle2, X } from 'lucide-react';
import { lostFoundApi } from '@/api/lostFoundApi';
import useApi from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate, timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80';
const STATUS_BADGE = {
  OPEN: { tone: 'bg-success/10 text-success', icon: Search, label: 'Open' },
  MATCHED: { tone: 'bg-warning/10 text-warning', icon: Link2, label: 'Matched' },
  REUNITED: { tone: 'bg-success/10 text-success', icon: PartyPopper, label: 'Reunited with owner' },
  SHELTERED: { tone: 'bg-info/10 text-info', icon: Home, label: 'Taken in by shelter' },
  CLOSED: { tone: 'bg-surface-muted text-muted-foreground', icon: X, label: 'Closed' },
};

function scoreTone(pct) { return pct >= 80 ? 'text-success' : pct >= 55 ? 'text-warning' : 'text-muted-foreground'; }
function scoreBg(pct) { return pct >= 80 ? 'bg-success/10' : pct >= 55 ? 'bg-warning/10' : 'bg-surface-muted'; }

export default function FoundReportDetailPage() {
  const { foundId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: report, loading, refetch } = useApi(() => lostFoundApi.getFound(foundId), null, [foundId]);
  const { data: matches, loading: matchesLoading, refetch: refetchMatches } = useApi(() => lostFoundApi.foundMatches(foundId), null, [foundId]);

  const [confirmMatchId, setConfirmMatchId] = useState(null);
  const [rejectMatchId, setRejectMatchId] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [linkOpen, setLinkOpen] = useState(false);
  const [lostOptions, setLostOptions] = useState([]);
  const [selectedLost, setSelectedLost] = useState('');

  useEffect(() => {
    if (linkOpen && lostOptions.length === 0) {
      lostFoundApi.listLost({ status: 'ACTIVE', page_size: 100 }).then((res) => setLostOptions(res.data?.data?.results || [])).catch(() => {});
    }
  }, [linkOpen, lostOptions.length]);

  const matchList = Array.isArray(matches) ? matches : [];
  const isFinder = report && report.reporter === user?.id;
  const isAdmin = user?.role === 'SHELTER_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isResolved = report && ['REUNITED', 'SHELTERED', 'CLOSED'].includes(report.status);

  const doConfirm = async () => {
    setBusy(true);
    try {
      await lostFoundApi.confirmMatch(confirmMatchId);
      setMsg('Match confirmed — the cat has been reunited with its owner.');
      refetch(); refetchMatches();
    } catch (err) {
      setMsg(err.response?.data?.error?.message || 'Failed to confirm match.');
    }
    setBusy(false); setConfirmMatchId(null);
  };

  const doReject = async () => {
    setBusy(true);
    try {
      await lostFoundApi.rejectMatch(rejectMatchId);
      refetchMatches();
    } catch (err) {
      setMsg(err.response?.data?.error?.message || 'Failed to reject match.');
    }
    setBusy(false); setRejectMatchId(null);
  };

  const doIntake = async () => {
    setBusy(true);
    try {
      const res = await lostFoundApi.intakeFound(foundId);
      const catId = res.data?.data?.cat_id;
      setMsg('This cat has been taken into your shelter.');
      setIntakeOpen(false);
      refetch(); refetchMatches();
      if (catId) setTimeout(() => navigate(`/cats/${catId}`), 900);
    } catch (err) {
      setMsg(err.response?.data?.error?.message || 'Failed to take cat into shelter.');
      setIntakeOpen(false);
    }
    setBusy(false);
  };

  const doLink = async () => {
    if (!selectedLost) return;
    setBusy(true);
    try {
      await lostFoundApi.linkFound(foundId, { lost_alert: selectedLost });
      setMsg('Linked to the lost report. The owner can now confirm.');
      setLinkOpen(false); setSelectedLost('');
      refetch(); refetchMatches();
    } catch (err) {
      setMsg(err.response?.data?.error?.message || 'Failed to link.');
    }
    setBusy(false);
  };

  if (loading) return <div className="p-8"><LoadingSpinner size="lg" text="Loading found report…" /></div>;
  if (!report) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Found report not found</h2>
      <Button variant="secondary" asChild><Link to="/lost-found/found">Back to Found Reports</Link></Button>
    </div>
  );

  const badge = STATUS_BADGE[report.status] || STATUS_BADGE.OPEN;
  const photo = (report.photos && report.photos[0]) || CAT_PLACEHOLDER;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader title="Found cat report" description="Compare with lost-cat reports or hand the cat to a shelter" backTo="/lost-found/found" backLabel="Found reports" />

      {msg && <div className="mb-5 rounded-xl border border-success/25 bg-success/10 px-5 py-3.5 text-sm font-semibold text-success">{msg}</div>}

      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap gap-5 p-5">
          <div className="size-40 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
            <img src={photo} alt="Found cat" className="size-full object-cover" onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
          </div>
          <div className="min-w-[200px] flex-1">
            <span className={cn('flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[13px] font-bold', badge.tone)}><badge.icon className="size-3.5" />{badge.label}</span>
            <p className="mt-3 mb-2 leading-relaxed text-muted-foreground">{report.description}</p>
            <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              {report.breed_guess && <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold">{report.breed_guess}</span>}
              {(report.color_tags || []).map((c) => <span key={c} className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold">{c}</span>)}
            </div>
            <div className="mt-3 flex flex-col gap-1 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />Found {formatDate(report.found_at)} · reported {timeAgo(report.created_at)}</span>
              {report.reporter_name && <span className="flex items-center gap-1.5"><User className="size-3.5" />Reported by {report.reporter_name}</span>}
              {report.found_latitude != null && report.found_longitude != null && (
                <a href={`https://maps.google.com/?q=${report.found_latitude},${report.found_longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold text-primary"><MapPin className="size-3.5" />Found location ↗</a>
              )}
              {report.shelter_name && <span className="flex items-center gap-1.5"><Home className="size-3.5" />Taken in by {report.shelter_name}</span>}
            </div>
          </div>
        </div>

        {isAdmin && !isResolved && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4">
            <span className="text-[13px] text-muted-foreground">No owner? A shelter can take this cat in.</span>
            <Button size="sm" onClick={() => setIntakeOpen(true)} disabled={busy}><Home className="size-3.5" />Take into shelter</Button>
          </div>
        )}
        {report.resolved_cat && (
          <div className="border-t border-border px-5 py-4">
            <Button size="sm" variant="secondary" asChild><Link to={`/cats/${report.resolved_cat}`}>View cat profile →</Link></Button>
          </div>
        )}
      </div>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Link2 className="size-4.5" />Possible owner matches</h2>
        {isFinder && !isResolved && <Button size="sm" variant="secondary" onClick={() => setLinkOpen((o) => !o)}>{linkOpen ? 'Cancel' : 'Link a lost report manually'}</Button>}
      </div>

      {linkOpen && (
        <div className="mb-5 rounded-xl border border-border bg-card p-5">
          <Label>Choose the lost-cat report you think this matches</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            <NativeSelect value={selectedLost} onChange={(e) => setSelectedLost(e.target.value)} className="min-w-[200px] flex-1">
              <option value="">Select a lost-cat report…</option>
              {lostOptions.map((a) => <option key={a.id} value={a.id}>{a.title}{a.cat_name ? ` — ${a.cat_name}` : ''}</option>)}
            </NativeSelect>
            <Button onClick={doLink} disabled={busy || !selectedLost}>Link</Button>
          </div>
        </div>
      )}

      {matchesLoading && <LoadingSpinner text="Comparing with lost-cat reports…" />}

      {!matchesLoading && matchList.length === 0 && (
        <EmptyState icon={Search} title="No matching lost reports yet" message="We compared this cat against active lost-cat reports and found no strong matches. A shelter can take the cat in, or link a report manually." />
      )}

      {!matchesLoading && matchList.length > 0 && (
        <div className="flex flex-col gap-4">
          {matchList.map((m) => {
            const alert = m.lost_alert || {};
            const pct = m.score_pct ?? Math.round((m.score || 0) * 100);
            const lostPhoto = (alert.photos && alert.photos[0]) || CAT_PLACEHOLDER;
            return (
              <div key={m.id} className={cn('flex items-start gap-5 rounded-xl border-2 bg-card p-5', pct >= 80 ? 'border-success/40' : 'border-border')}>
                <div className="size-[90px] shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                  <img src={lostPhoto} alt="Lost cat" className="size-full object-cover" onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[13px] font-extrabold', scoreBg(pct), scoreTone(pct))}>{pct}% match</span>
                    <span className="text-[11px] font-bold text-muted-foreground">{m.status}</span>
                  </div>
                  <p className="mb-1 font-extrabold text-foreground">{alert.title || alert.cat_name || 'Lost cat'}</p>
                  <p className="mb-1.5 text-sm leading-relaxed text-muted-foreground">{(alert.description || '').slice(0, 120)}</p>
                  <p className="text-xs text-muted-foreground">Reported by {alert.reporter_name || 'someone'}{alert.last_seen_at ? ` · last seen ${formatDate(alert.last_seen_at)}` : ''}</p>

                  {(isFinder || isAdmin) && m.status === 'PENDING' && !isResolved && (
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setConfirmMatchId(m.id)}><CheckCircle2 className="size-3.5" />Confirm — reunite with owner</Button>
                      <Button size="sm" variant="secondary" onClick={() => setRejectMatchId(m.id)}><X className="size-3.5" />Not a match</Button>
                    </div>
                  )}
                  {m.status === 'CONFIRMED' && <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-success"><PartyPopper className="size-4" />Confirmed — reunited with the owner.</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!confirmMatchId} title="Reunite with owner?" message="Confirm this found cat belongs to the lost-cat report. The cat will be returned to the person who reported it lost, and both reports will be closed."
        confirmLabel="Yes, reunite" onConfirm={doConfirm} onCancel={() => setConfirmMatchId(null)} />
      <ConfirmDialog open={!!rejectMatchId} title="Not a match?" message="Dismiss this suggested match. It won't be shown again." confirmLabel="Dismiss" danger onConfirm={doReject} onCancel={() => setRejectMatchId(null)} />
      <ConfirmDialog open={intakeOpen} title="Take cat into shelter?" message="This creates a cat profile in your shelter (status: In Shelter) and marks this found report as sheltered."
        confirmLabel="Take in" onConfirm={doIntake} onCancel={() => setIntakeOpen(false)} />
    </div>
  );
}
