'use client';

import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { mockExpenses } from '@/lib/mock-data/finance';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const CATEGORIES = ['FOOD', 'MEDICINE', 'UTILITIES', 'RENT', 'SALARIES', 'EQUIPMENT', 'TRANSPORT', 'MAINTENANCE', 'OTHER'];

export default function ExpensesPage() {
  const { page, pageSize, nextPage, prevPage, goTo } = usePagination(20);
  const [expenses, setExpenses] = useState(mockExpenses);
  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [form, setForm] = useState({ amount: '', category: 'FOOD', description: '', incurred_at: new Date().toISOString().split('T')[0], payment_method: 'CASH', receipt_number: '' });
  const [saving, setSaving] = useState(false);

  const filtered = expenses.filter((e) => !category || e.category === category);
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalAmount = pageItems.reduce((s, e) => s + Number(e.amount || 0), 0);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setExpenses((ex) => [{ id: `exp-${Date.now()}`, ...form, amount: Number(form.amount) }, ...ex]);
      setAddOpen(false);
      setSaving(false);
    }, 350);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader title="Expenses" description={`${total} expense records`} actions={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add expense</Button>} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-destructive p-5 text-destructive-foreground">
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          <div className="text-xs font-semibold tracking-wide uppercase opacity-85">Total (this page)</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-2xl font-bold text-destructive">{total}</div>
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Total records</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-2xl font-bold text-warning">{pageItems.length > 0 ? formatCurrency(totalAmount / pageItems.length) : '—'}</div>
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Average</div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {['', ...CATEGORIES].map((c) => (
          <button
            key={c || 'ALL'}
            onClick={() => setCategory(c)}
            className={cn('rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors', category === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-border-strong')}
          >
            {c || 'All'}
          </button>
        ))}
      </div>

      {pageItems.length === 0 && (
        <EmptyState icon={Receipt} title="No expenses" message="No expense records found." action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add expense</Button>} />
      )}

      {pageItems.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="font-medium text-foreground">{exp.description || '—'}</TableCell>
                  <TableCell className="text-sm font-medium text-muted-foreground">{exp.category}</TableCell>
                  <TableCell className="text-[15px] font-bold text-destructive">{formatCurrency(exp.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(exp.incurred_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{exp.payment_method?.replace(/_/g, ' ') || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add expense"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button form="exp-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add expense'}</Button></>}
      >
        <form id="exp-form" onSubmit={handleSave} className="grid grid-cols-2 gap-3.5">
          <div><Label htmlFor="exp-amount">Amount (PKR) *</Label><Input id="exp-amount" required type="number" min="1" value={form.amount} onChange={(e) => set('amount', e.target.value)} className="mt-1.5" /></div>
          <div>
            <Label htmlFor="exp-cat">Category</Label>
            <NativeSelect id="exp-cat" value={form.category} onChange={(e) => set('category', e.target.value)} className="mt-1.5">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </NativeSelect>
          </div>
          <div className="col-span-2"><Label htmlFor="exp-desc">Description</Label><Input id="exp-desc" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What was this expense for?" className="mt-1.5" /></div>
          <div><Label htmlFor="exp-date">Date *</Label><Input id="exp-date" required type="date" value={form.incurred_at} onChange={(e) => set('incurred_at', e.target.value)} className="mt-1.5" /></div>
          <div>
            <Label htmlFor="exp-method">Payment method</Label>
            <NativeSelect id="exp-method" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)} className="mt-1.5">
              {['CASH', 'BANK_TRANSFER', 'JAZZCASH', 'EASYPAISA', 'CHEQUE', 'ONLINE'].map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
            </NativeSelect>
          </div>
          <div className="col-span-2"><Label htmlFor="exp-receipt">Receipt number</Label><Input id="exp-receipt" value={form.receipt_number} onChange={(e) => set('receipt_number', e.target.value)} placeholder="Optional" className="mt-1.5" /></div>
        </form>
      </Modal>
    </div>
  );
}
