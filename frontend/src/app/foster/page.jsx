'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PawPrint, Home, User, CalendarDays, ClipboardList } from 'lucide-react';
import { mockFosterPlacements } from '@/lib/mock-data/foster';
import usePagination from '@/hooks/usePagination';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const PET_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';
const STATUS_TONE = { ACTIVE: 'bg-success/10 text-success', COMPLETED: 'bg-info/10 text-info', RETURNED: 'bg-warning/10 text-warning' };
const STATUS_LABEL = { ACTIVE: 'Active', COMPLETED: 'Completed', RETURNED: 'Returned' };

export default function FosterListPage() {
  const { page, pageSize, nextPage, prevPage, goTo } = usePagination(12);
  const [placements] = useState(mockFosterPlacements);
  const [updateOpen, setUpdateOpen] = useState(null);
  const [updateNotes, setUpdateNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const total = placements.length;
  const totalPages = Math.ceil(total / pageSize);
  const pageItems = placements.slice((page - 1) * pageSize, page * pageSize);

  const handleUpdate = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setUpdateOpen(null); setUpdateNotes(''); }, 350);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader title="Foster care" description={`${total} placements`} />

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3.5 text-sm font-semibold text-primary">
        <PawPrint className="size-5 shrink-0" />
        Foster parents provide temporary loving homes for animals awaiting adoption. Thank you for your dedication!
      </div>

      {pageItems.length === 0 && (
        <EmptyState icon={Home} title="No foster placements" message="No active foster care arrangements found." />
      )}

      {pageItems.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((p) => {
            const days = Math.floor((new Date() - new Date(p.start_date)) / 86400000);
            return (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="relative h-[120px] overflow-hidden bg-surface-muted">
                  <img src={p.pet_photo || PET_PLACEHOLDER} alt={p.pet_name} className="size-full object-cover" onError={(e) => { e.currentTarget.src = PET_PLACEHOLDER; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className={cn('absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[11px] font-bold', STATUS_TONE[p.status] || STATUS_TONE.ACTIVE)}>{STATUS_LABEL[p.status] || p.status}</span>
                  <Link href={`/pets/${p.pet}`} className="absolute bottom-2.5 left-3.5 text-base font-extrabold text-white">{p.pet_name}</Link>
                </div>

                <div className="flex flex-col gap-2.5 p-4">
                  <div className="flex justify-between text-[13px] text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="size-3.5" />{p.foster_name || 'Foster parent'}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{days}d in care</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Start: {formatDate(p.start_date)}</span>
                    {p.end_date && <span>End: {formatDate(p.end_date)}</span>}
                  </div>
                  {p.status === 'ACTIVE' && (
                    <Button size="sm" variant="secondary" className="mt-1 self-start" onClick={() => { setUpdateOpen(p); setUpdateNotes(''); }}>
                      <ClipboardList className="size-3.5" />Submit update
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      <Modal open={!!updateOpen} onClose={() => setUpdateOpen(null)} title={`Foster update: ${updateOpen?.pet_name}`}
        footer={<><Button variant="secondary" onClick={() => setUpdateOpen(null)}>Cancel</Button><Button onClick={handleUpdate} disabled={saving}>{saving ? 'Submitting…' : 'Submit update'}</Button></>}
      >
        <Label>Update notes</Label>
        <Textarea value={updateNotes} onChange={(e) => setUpdateNotes(e.target.value)} rows={4} placeholder="How is the animal doing? Any health concerns, behavioral changes…" className="mt-1.5" />
      </Modal>
    </div>
  );
}
