'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Search, Bot, Phone, CheckCircle2, X } from 'lucide-react';
import { mockMatches } from '@/lib/mock-data/lostFound';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';

function scoreTone(pct) { return pct >= 80 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-muted-foreground'; }
function scoreBg(pct) { return pct >= 80 ? 'bg-success/10' : pct >= 60 ? 'bg-warning/10' : 'bg-surface-muted'; }

function MatchCard({ match, isOwner, onConfirm, onReject }) {
  const score = Math.round((match.score || 0) * 100);

  return (
    <div className={cn('flex items-start gap-5 rounded-xl border-2 bg-card p-5', score >= 80 ? 'border-success/40 shadow-sm' : 'border-border')}>
      <div className="size-[100px] shrink-0 overflow-hidden rounded-xl bg-surface-muted">
        <img src={(match.found_report?.photos && match.found_report.photos[0]) || CAT_PLACEHOLDER} alt="Found animal" className="size-full object-cover" onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <span className={cn('rounded-full px-3 py-1 text-[13px] font-extrabold', scoreBg(score), scoreTone(score))}>{score}% match</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', match.status === 'CONFIRMED' ? 'bg-success/10 text-success' : 'bg-surface-muted text-muted-foreground')}>{match.status}</span>
        </div>

        <p className="mb-1.5 text-sm leading-relaxed text-muted-foreground">{match.found_report?.description?.slice(0, 120) || 'Found animal report'}</p>
        <p className="text-xs text-muted-foreground">Found by {match.found_report?.reporter_name || 'someone'} · reported {timeAgo(match.found_report?.created_at)}</p>
        {match.found_report?.contact_phone && (
          <a href={`tel:${match.found_report.contact_phone}`} className="flex items-center gap-1 text-[13px] font-bold text-primary"><Phone className="size-3.5" />{match.found_report.contact_phone}</a>
        )}

        {isOwner && match.status === 'PENDING' && (
          <div className="mt-3.5 flex gap-2">
            <Button size="sm" onClick={() => onConfirm(match.id)}><CheckCircle2 className="size-3.5" />This is my pet!</Button>
            <Button size="sm" variant="secondary" onClick={() => onReject(match.id)}><X className="size-3.5" />Not a match</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const { alertId } = useParams();
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(null);

  const matchList = mockMatches.filter((m) => m.lost_alert.id === alertId);
  const isAdmin = user?.role === 'SHELTER_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isOwner = matchList[0]?.lost_alert?.reporter === user?.id || isAdmin;

  const handleConfirm = () => setConfirmOpen(null);
  const handleReject = () => setRejectOpen(null);

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader title="Match results" description={`${matchList.length} potential matches found by our AI`} backTo="/lost-found" backLabel="Lost & Found" />

      {matchList.length > 0 && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-warning/25 bg-warning/10 px-5 py-3.5 text-sm font-semibold text-warning">
          <Bot className="size-5 shrink-0" />
          Our AI scanned found-animal reports and found these potential matches. Review each one and confirm if it's yours!
        </div>
      )}

      {matchList.length === 0 && (
        <EmptyState icon={Search} title="No matches yet" message="Our AI will scan all found-animal reports and notify you when a match is found." />
      )}

      {matchList.length > 0 && (
        <div className="flex flex-col gap-4">
          {[...matchList].sort((a, b) => b.score - a.score).map((match) => (
            <MatchCard key={match.id} match={match} isOwner={isOwner} onConfirm={(id) => setConfirmOpen(id)} onReject={(id) => setRejectOpen(id)} />
          ))}
        </div>
      )}

      <ConfirmDialog open={!!confirmOpen} title="Confirm match?" message="Are you sure this is your pet? This will mark your lost alert as resolved."
        confirmLabel="Yes, found my pet!" onConfirm={handleConfirm} onCancel={() => setConfirmOpen(null)} />
      <ConfirmDialog open={!!rejectOpen} title="Reject match" message="Mark this as not a match? It won't be shown to you again." confirmLabel="Not my pet" danger
        onConfirm={handleReject} onCancel={() => setRejectOpen(null)} />
    </div>
  );
}
