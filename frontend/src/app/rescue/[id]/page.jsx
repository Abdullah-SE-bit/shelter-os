'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TriangleAlert, MapPin, ExternalLink, Sparkles, CheckCircle2, Frown, Trophy, Medal, Award, Building2 } from 'lucide-react';
import { getRescueById, mockRescueSuggestions } from '@/lib/mock-data/rescue';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const URGENCY_TONE = { LOW: 'bg-success/10 text-success', MEDIUM: 'bg-warning/10 text-warning', HIGH: 'bg-warning/10 text-warning', CRITICAL: 'bg-destructive/10 text-destructive' };
const STATUS_TONE = { RESOLVED: 'bg-success/10 text-success', PENDING: 'bg-warning/10 text-warning', ASSIGNED: 'bg-info/10 text-info', IN_PROGRESS: 'bg-primary/10 text-primary', CANCELLED: 'bg-surface-muted text-muted-foreground' };
const RANK_ICONS = [Trophy, Medal, Award];

export default function RescueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [report, setReport] = useState(() => getRescueById(id));

  const canAdmin = ['SUPER_ADMIN', 'SHELTER_ADMIN'].includes(user?.role);
  const canResolve = canAdmin || report?.assigned_volunteer === user?.id;

  const handleResolve = () => {
    setSaving(true);
    setTimeout(() => {
      setReport((r) => ({ ...r, status: 'RESOLVED', resolution_notes: resolveNotes, resolved_at: new Date().toISOString() }));
      setResolveOpen(false);
      setSaving(false);
    }, 350);
  };

  const handleSuggest = () => {
    setLoadingSuggest(true);
    setSuggestOpen(true);
    setTimeout(() => { setSuggestions(mockRescueSuggestions); setLoadingSuggest(false); }, 400);
  };

  if (!report) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Report not found</h2>
    </div>
  );

  const isCritical = report.urgency_level === 'CRITICAL';

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title="Rescue report" description={`#${report.id?.slice(0, 8)}`} backTo="/rescue" backLabel="Rescue" />

      {isCritical && (
        <div className="mb-6 flex animate-pulse items-center gap-2 rounded-xl bg-destructive px-5 py-3.5 text-[15px] font-bold text-destructive-foreground">
          <TriangleAlert className="size-5" />
          CRITICAL — Immediate response required!
        </div>
      )}

      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', URGENCY_TONE[report.urgency_level] || URGENCY_TONE.MEDIUM)}>{report.urgency_level}</span>
            <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', STATUS_TONE[report.status] || STATUS_TONE.PENDING)}>{report.status?.replace(/_/g, ' ')}</span>
          </div>

          <p className="mb-4 text-[15px] leading-relaxed text-foreground">{report.description}</p>

          <div className="grid grid-cols-2 gap-3.5 text-sm">
            {[
              { label: 'Reported by', value: report.reporter_name || 'Anonymous' },
              { label: 'Reported at', value: formatDateTime(report.reported_at) },
              { label: 'Assigned to', value: report.assigned_volunteer_name || '—' },
              { label: 'Shelter', value: report.assigned_shelter_name || '—' },
              { label: 'Resolved at', value: report.resolved_at ? formatDateTime(report.resolved_at) : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="mb-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
                <div className="font-semibold text-foreground">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {report.latitude && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Location</h3>
            <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-lg bg-surface-muted">
              <MapPin className="size-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">{Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}</p>
              <Button size="sm" variant="secondary" asChild>
                <a href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open in Google Maps
                </a>
              </Button>
            </div>
          </div>
        )}

        {report.cat_condition_notes && (
          <div className="rounded-xl border border-warning/25 bg-warning/10 p-4">
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-warning uppercase">Condition notes</h4>
            <p className="text-sm leading-relaxed text-foreground">{report.cat_condition_notes}</p>
          </div>
        )}

        {report.resolution_notes && (
          <div className="rounded-xl border border-success/25 bg-success/10 p-4">
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-success uppercase">Resolution notes</h4>
            <p className="text-sm leading-relaxed text-foreground">{report.resolution_notes}</p>
          </div>
        )}

        {report.status !== 'RESOLVED' && report.status !== 'CANCELLED' && (
          <div className="flex flex-wrap gap-3">
            {canAdmin && <Button variant="secondary" onClick={handleSuggest}><Sparkles className="size-4" />Suggest assignment</Button>}
            {canResolve && <Button onClick={() => setResolveOpen(true)}><CheckCircle2 className="size-4" />Mark as resolved</Button>}
          </div>
        )}
      </div>

      <Modal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve rescue report"
        footer={<><Button variant="secondary" onClick={() => setResolveOpen(false)}>Cancel</Button><Button onClick={handleResolve} disabled={saving}>{saving ? 'Saving…' : 'Confirm resolution'}</Button></>}
      >
        <Label>Resolution notes</Label>
        <Textarea value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} placeholder="Describe how the rescue was handled…" rows={4} className="mt-1.5" />
      </Modal>

      <Modal open={suggestOpen} onClose={() => setSuggestOpen(false)} title="Assignment suggestions" size="lg">
        {loadingSuggest && <LoadingSpinner text="Calculating best matches…" />}
        {!loadingSuggest && suggestions && (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Ranked volunteers</h4>
              <div className="flex flex-col gap-2">
                {(suggestions.ranked_volunteers || []).map((v, i) => {
                  const RankIcon = RANK_ICONS[i];
                  return (
                    <div key={v.volunteer_id} className={cn('flex items-center gap-4 rounded-lg border p-3', i === 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface-muted')}>
                      <span className="flex w-7 justify-center">{RankIcon ? <RankIcon className="size-5 text-primary" /> : <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">{v.name}</div>
                        <div className="text-xs text-muted-foreground">{v.distance_km} km away · {v.active_assignments} active · {v.available_now ? 'Available now' : 'Unavailable'}</div>
                      </div>
                      <span className="font-bold text-primary">{Math.round(v.score * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nearest shelters</h4>
              {(suggestions.nearest_shelters || []).map((s) => (
                <div key={s.shelter_id} className="mb-1.5 flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-foreground"><Building2 className="size-3.5" />{s.name}</span>
                  <span className="text-muted-foreground">{s.distance_km} km</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
