'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ClipboardList, Plus, Link2, Phone, CalendarDays } from 'lucide-react';
import { mockLostAlerts, mockFoundReports } from '@/lib/mock-data/lostFound';
import usePagination from '@/hooks/usePagination';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { formatDate, timeAgo } from '@/utils/dateUtils';
import { truncate } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const PET_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';
const STATUS_TONE = { ACTIVE: 'bg-destructive text-white', RESOLVED: 'bg-success text-white', EXPIRED: 'bg-surface-muted text-muted-foreground' };
const STATUS_LABEL = { ACTIVE: 'Lost', RESOLVED: 'Resolved', EXPIRED: 'Expired' };
const FOUND_TONE = { OPEN: 'bg-success/10 text-success', MATCHED: 'bg-warning/10 text-warning', REUNITED: 'bg-success/10 text-success', SHELTERED: 'bg-info/10 text-info', CLOSED: 'bg-surface-muted text-muted-foreground' };
const FOUND_LABEL = { OPEN: 'Found', MATCHED: 'Matched', REUNITED: 'Reunited', SHELTERED: 'Sheltered', CLOSED: 'Closed' };

function LostAlertCard({ alert }) {
  return (
    <Link href={`/lost-found/lost/${alert.id}`} className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-[180px] overflow-hidden bg-surface-muted">
        <img src={(alert.photos && alert.photos[0]) || PET_PLACEHOLDER} alt={alert.title} className="size-full object-cover" onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }} />
        <span className={cn('absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase', STATUS_TONE[alert.status] || STATUS_TONE.ACTIVE)}>{STATUS_LABEL[alert.status] || alert.status}</span>
        {alert.match_count > 0 && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[11px] font-bold text-warning-foreground">
            <Link2 className="size-3" />{alert.match_count} match{alert.match_count > 1 ? 'es' : ''}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3.5 pt-6 pb-2.5">
          <p className="text-base font-extrabold text-white">{alert.pet_name || alert.title}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">{truncate(alert.description, 80)}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {alert.last_seen_at && <span className="flex items-center gap-1"><CalendarDays className="size-3" />Last seen {formatDate(alert.last_seen_at)}</span>}
          {alert.contact_phone && <span className="flex items-center gap-1"><Phone className="size-3" />{alert.contact_phone}</span>}
        </div>
        <div className="text-xs text-muted-foreground">Posted {timeAgo(alert.created_at)} by {alert.reporter_name || 'Anonymous'}</div>
        <div className="mt-auto pt-1.5 text-[13px] font-bold text-primary">View full report &amp; matches →</div>
      </div>
    </Link>
  );
}

export default function LostAlertsPage() {
  const { user } = useAuth();
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(12);
  const [tab, setTab] = useState('lost');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const lostFiltered = mockLostAlerts.filter((a) => (statusFilter === 'ALL' || a.status === statusFilter) && (!search || a.title.toLowerCase().includes(search.toLowerCase())));
  const foundFiltered = mockFoundReports.filter((r) => !search || r.description.toLowerCase().includes(search.toLowerCase()));
  const items = tab === 'lost' ? lostFiltered : foundFiltered;
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-ink)] to-[#5A3A25] px-6 pt-12 pb-16">
        <Search className="pointer-events-none absolute right-8 -bottom-4 size-32 text-white opacity-10" />
        <div className="relative mx-auto max-w-[1200px]">
          <h1 className="font-display mb-2 text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-white">Lost &amp; Found</h1>
          <p className="mb-6 max-w-[480px] text-white/75">Help reunite lost animals with their families. Browse alerts or report a found animal.</p>
          <div className="flex flex-wrap gap-3">
            {user && <Button asChild><Link href="/lost-found/create"><Plus className="size-4" />Report lost animal</Link></Button>}
            <Button variant="outline" className="border-white/25 bg-white/15 text-white hover:bg-white/25 hover:text-white" asChild>
              <Link href="/lost-found/found"><ClipboardList className="size-4" />Found animal reports</Link>
            </Button>
          </div>
        </div>
        <div className="absolute right-0 bottom-[-1px] left-0 h-[50px] bg-background" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-10 sm:px-6">
        <div className="mb-6 flex gap-2">
          {[{ id: 'lost', label: 'Lost animals', count: mockLostAlerts.length }, { id: 'found', label: 'Found reports', count: mockFoundReports.length }].map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); reset(); }}
              className={cn('flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-bold transition-colors', tab === t.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}>
              {t.label}
              <span className={cn('rounded-full px-2 py-0.5 text-xs', tab === t.id ? 'bg-white/25' : 'bg-surface-muted')}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card p-3.5">
          <Input type="search" value={search} onChange={(e) => { setSearch(e.target.value); reset(); }} placeholder="Search by name, description, breed…" className="min-w-[200px] flex-1" />
          {tab === 'lost' && (
            <NativeSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); reset(); }} className="w-auto">
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
              <option value="EXPIRED">Expired</option>
              <option value="ALL">All statuses</option>
            </NativeSelect>
          )}
        </div>

        {pageItems.length === 0 && (
          <EmptyState icon={tab === 'lost' ? Search : ClipboardList} title={tab === 'lost' ? 'No active lost alerts' : 'No found animal reports'} message="Check back later or be the first to report."
            action={user && tab === 'lost' && <Button asChild><Link href="/lost-found/create">Report lost animal</Link></Button>} />
        )}

        {pageItems.length > 0 && tab === 'lost' && (
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((alert) => <LostAlertCard key={alert.id} alert={alert} />)}
          </div>
        )}

        {pageItems.length > 0 && tab === 'found' && (
          <div className="mb-6 flex flex-col gap-3">
            {pageItems.map((report) => (
              <Link key={report.id} href={`/lost-found/found/${report.id}`} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  <img src={(report.photos && report.photos[0]) || PET_PLACEHOLDER} alt="Found animal" className="size-full object-cover" onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', FOUND_TONE[report.status] || FOUND_TONE.OPEN)}>{FOUND_LABEL[report.status] || report.status}</span>
                    {report.match_count > 0 && <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-bold text-warning"><Link2 className="size-3" />{report.match_count} match{report.match_count > 1 ? 'es' : ''}</span>}
                    <span className="text-xs text-muted-foreground">{timeAgo(report.created_at)}</span>
                  </div>
                  <p className="mb-1 text-[15px] font-semibold text-foreground">{truncate(report.description, 100)}</p>
                  {report.breed_guess && <span className="text-xs text-muted-foreground">Breed guess: {report.breed_guess}</span>}
                  <div className="mt-1.5 text-[13px] font-bold text-primary">View &amp; compare →</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />
      </div>
    </div>
  );
}
