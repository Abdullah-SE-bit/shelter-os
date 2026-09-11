'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Gift, Globe2, Building2, Plus } from 'lucide-react';
import { mockDonations, mockCampaigns } from '@/lib/mock-data/finance';
import { mockShelters } from '@/lib/mock-data/shelters';
import { useAuth } from '@/context/AuthContext';
import usePagination from '@/hooks/usePagination';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const METHODS = ['BANK_TRANSFER', 'JAZZCASH', 'EASYPAISA', 'CASH', 'CHEQUE', 'ONLINE'];

export default function DonationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const recordMode = pathname.endsWith('/record');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { page, pageSize, nextPage, prevPage, goTo } = usePagination(20);
  const [donations, setDonations] = useState(mockDonations);
  const [addOpen, setAddOpen] = useState(recordMode);
  const [form, setForm] = useState({ amount: '', donor_name: '', donor_email: '', payment_method: 'BANK_TRANSFER', notes: '', received_at: new Date().toISOString().split('T')[0], scope: 'SHELTER', shelter: '', campaign: '' });
  const [saving, setSaving] = useState(false);

  const campaigns = mockCampaigns.filter((c) => c.status === 'ACTIVE');

  useEffect(() => { if (recordMode) setAddOpen(true); }, [recordMode]);

  const closeModal = () => {
    setAddOpen(false);
    if (recordMode) router.push('/finance/donations');
  };

  const total = donations.length;
  const totalPages = Math.ceil(total / pageSize);
  const pageItems = donations.slice((page - 1) * pageSize, page * pageSize);
  const totalAmount = pageItems.reduce((s, d) => s + Number(d.amount || 0), 0);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setDonations((d) => [{ id: `don-${Date.now()}`, ...form, amount: Number(form.amount) }, ...d]);
      setForm({ amount: '', donor_name: '', donor_email: '', payment_method: 'BANK_TRANSFER', notes: '', received_at: new Date().toISOString().split('T')[0], scope: 'SHELTER', shelter: '', campaign: '' });
      setSaving(false);
      closeModal();
    }, 350);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Donations & Finance"
        description={`${total} donations recorded`}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Record donation</Button>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-primary p-5 text-primary-foreground">
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          <div className="text-xs font-semibold tracking-wide uppercase opacity-85">Total (this page)</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-2xl font-bold text-primary">{total}</div>
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Total donations</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-2xl font-bold text-success">{pageItems.length > 0 ? formatCurrency(totalAmount / pageItems.length) : '—'}</div>
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Average donation</div>
        </div>
      </div>

      {pageItems.length === 0 && (
        <EmptyState icon={Gift} title="No donations yet" message="Record your first donation to start tracking finances."
          action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Record donation</Button>} />
      )}

      {pageItems.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{d.donor_name || 'Anonymous'}</div>
                    {d.donor_email && <div className="text-xs text-muted-foreground">{d.donor_email}</div>}
                  </TableCell>
                  <TableCell className="text-[15px] font-bold text-primary">{formatCurrency(d.amount)}</TableCell>
                  <TableCell><Badge variant="secondary">{d.payment_method?.replace(/_/g, ' ')}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(d.received_at)}</TableCell>
                  <TableCell className="max-w-[180px] overflow-hidden text-ellipsis text-sm text-muted-foreground">{d.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      <Modal
        open={addOpen}
        onClose={closeModal}
        title="Record donation"
        footer={<><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button form="donation-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record donation'}</Button></>}
      >
        <form id="donation-form" onSubmit={handleSave} className="flex flex-col gap-3.5">
          {isSuperAdmin && (
            <>
              <div>
                <Label>Donation for *</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {[{ key: 'APP', icon: Globe2, label: 'App-wide' }, { key: 'SHELTER', icon: Building2, label: 'A shelter' }].map((opt) => {
                    const selected = form.scope === opt.key;
                    return (
                      <button type="button" key={opt.key} onClick={() => set('scope', opt.key)}
                        className={cn('flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition-colors', selected ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground')}>
                        <opt.icon className="size-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {form.scope === 'SHELTER' && (
                <div>
                  <Label htmlFor="don-shelter">Shelter *</Label>
                  <NativeSelect id="don-shelter" required value={form.shelter} onChange={(e) => set('shelter', e.target.value)} className="mt-1.5">
                    <option value="">Select a shelter…</option>
                    {mockShelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </NativeSelect>
                </div>
              )}
            </>
          )}
          <div>
            <Label htmlFor="don-campaign">Campaign (optional)</Label>
            <NativeSelect id="don-campaign" value={form.campaign} onChange={(e) => set('campaign', e.target.value)} className="mt-1.5">
              <option value="">General donation (no campaign)</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.title}{c.is_app_level ? ' · App-wide' : c.shelter_name ? ` · ${c.shelter_name}` : ''}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="don-amount">Amount (PKR) *</Label><Input id="don-amount" type="number" required min="1" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="5000" className="mt-1.5" /></div>
            <div><Label htmlFor="don-date">Date received</Label><Input id="don-date" type="date" value={form.received_at} onChange={(e) => set('received_at', e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="don-name">Donor name</Label><Input id="don-name" value={form.donor_name} onChange={(e) => set('donor_name', e.target.value)} placeholder="Leave blank for anonymous" className="mt-1.5" /></div>
            <div><Label htmlFor="don-email">Donor email</Label><Input id="don-email" type="email" value={form.donor_email} onChange={(e) => set('donor_email', e.target.value)} placeholder="Optional" className="mt-1.5" /></div>
            <div className="col-span-2">
              <Label htmlFor="don-method">Payment method</Label>
              <NativeSelect id="don-method" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)} className="mt-1.5">
                {METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </NativeSelect>
            </div>
            <div className="col-span-2"><Label htmlFor="don-notes">Notes</Label><Input id="don-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any additional notes…" className="mt-1.5" /></div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
