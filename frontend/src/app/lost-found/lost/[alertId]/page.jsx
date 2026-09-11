'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Frown, Search, PartyPopper, Clock, Phone, Mail, MapPin, Link2, CheckCircle2 } from 'lucide-react';
import { getLostAlertById } from '@/lib/mock-data/lostFound';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/patterns/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDateTime, timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PET_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80';
const STATUS_BADGE = {
  ACTIVE: { tone: 'bg-destructive/10 text-destructive', icon: Search, label: 'Still lost' },
  RESOLVED: { tone: 'bg-success/10 text-success', icon: PartyPopper, label: 'Resolved — back home' },
  EXPIRED: { tone: 'bg-surface-muted text-muted-foreground', icon: Clock, label: 'Expired' },
};

export default function LostAlertDetailPage() {
  const { alertId } = useParams();
  const { user } = useAuth();
  const [alert, setAlert] = useState(() => getLostAlertById(alertId));

  const [selectedImg, setSelectedImg] = useState(0);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const isOwner = alert && alert.reporter === user?.id;
  const isAdmin = user?.role === 'SHELTER_ADMIN' || user?.role === 'SUPER_ADMIN';

  const doResolve = () => {
    setBusy(true);
    setTimeout(() => {
      setAlert((a) => ({ ...a, status: 'RESOLVED' }));
      setMsg('Marked as resolved — glad the animal is safe!');
      setBusy(false); setResolveOpen(false);
    }, 350);
  };

  if (!alert) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Lost report not found</h2>
      <Button variant="secondary" asChild><Link href="/lost-found">Back to Lost &amp; Found</Link></Button>
    </div>
  );

  const badge = STATUS_BADGE[alert.status] || STATUS_BADGE.ACTIVE;
  const photos = (alert.photos && alert.photos.length) ? alert.photos : [PET_PLACEHOLDER];
  const mainPhoto = photos[selectedImg] || PET_PLACEHOLDER;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader title="Lost report" description={alert.title} backTo="/lost-found" backLabel="Lost & Found" />

      {msg && <div className="mb-5 rounded-xl border border-success/25 bg-success/10 px-5 py-3.5 text-sm font-semibold text-success">{msg}</div>}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="h-[300px] overflow-hidden rounded-2xl bg-surface-muted shadow-md">
            <img src={mainPhoto} alt={alert.title} className="size-full object-cover" onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }} />
          </div>
          {photos.length > 1 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setSelectedImg(i)} className={cn('size-[60px] shrink-0 overflow-hidden rounded-lg border-2', selectedImg === i ? 'border-primary' : 'border-border')}>
                  <img src={p} alt="" className="size-full object-cover" onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className={cn('flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[13px] font-bold', badge.tone)}><badge.icon className="size-3.5" />{badge.label}</span>
            <h2 className="mt-2.5 mb-1 text-2xl font-bold text-foreground">{alert.pet_name || alert.title}</h2>
            <p className="text-[13px] text-muted-foreground">Posted {timeAgo(alert.created_at)} by {alert.reporter_name || 'someone'}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Description</h3>
            <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{alert.description}</p>
            {alert.behavioral_notes && (
              <>
                <h3 className="mt-3.5 mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Behavior</h3>
                <p className="leading-relaxed text-muted-foreground">{alert.behavioral_notes}</p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-5">
            {alert.last_seen_at && (
              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="size-3.5" />Last seen</span>
                <span className="text-sm font-bold text-foreground">{formatDateTime(alert.last_seen_at)}</span>
              </div>
            )}
            {alert.last_seen_latitude != null && alert.last_seen_longitude != null && (
              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" />Location</span>
                <a href={`https://maps.google.com/?q=${alert.last_seen_latitude},${alert.last_seen_longitude}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary">Open in maps ↗</a>
              </div>
            )}
          </div>

          {(alert.contact_phone || alert.contact_email) && (
            <div className="rounded-xl border border-info/25 bg-info/10 p-4">
              <h3 className="mb-2 text-xs font-bold tracking-wide text-info uppercase">Seen this animal? Contact the owner</h3>
              <div className="flex flex-wrap gap-4">
                {alert.contact_phone && <a href={`tel:${alert.contact_phone}`} className="flex items-center gap-1.5 text-sm font-bold text-info"><Phone className="size-3.5" />{alert.contact_phone}</a>}
                {alert.contact_email && <a href={`mailto:${alert.contact_email}`} className="flex items-center gap-1.5 text-sm font-bold text-info"><Mail className="size-3.5" />{alert.contact_email}</a>}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            <Button className="min-w-[180px] flex-1" asChild><Link href={`/lost-found/matches/${alert.id}`}><Link2 className="size-4" />View possible matches{alert.match_count > 0 ? ` (${alert.match_count})` : ''}</Link></Button>
            {(isOwner || isAdmin) && alert.status === 'ACTIVE' && <Button variant="secondary" onClick={() => setResolveOpen(true)} disabled={busy}><CheckCircle2 className="size-4" />Mark resolved</Button>}
          </div>

          {!isOwner && alert.status === 'ACTIVE' && (
            <div className="text-[13px] text-muted-foreground">Think you found this animal? <Link href="/lost-found/found" className="font-bold text-primary">Report a found animal →</Link></div>
          )}
        </div>
      </div>

      <ConfirmDialog open={resolveOpen} title="Mark as resolved?" message="This closes the lost report and any pending match suggestions. Do this once the animal is back safe."
        confirmLabel="Mark resolved" onConfirm={doResolve} onCancel={() => setResolveOpen(false)} />
    </div>
  );
}
