'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Beef, Pill, Wrench, SprayCan, BedDouble, Package, Plus, History } from 'lucide-react';
import { mockInventory } from '@/lib/mock-data/inventory';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const CATEGORIES = { FOOD: Beef, MEDICINE: Pill, EQUIPMENT: Wrench, CLEANING: SprayCan, BEDDING: BedDouble, OTHER: Package };

export default function InventoryListPage() {
  const [items, setItems] = useState(mockInventory);
  const [addOpen, setAddOpen] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);

  const filtered = items.filter((i) => (!category || i.category === category) && (!lowStock || i.is_low_stock));

  const handleStock = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const qty = Number(fd.get('qty'));
    setItems((all) => all.map((i) => {
      if (i.id !== stockModal.item.id) return i;
      const next = stockModal.mode === 'restock' ? i.current_quantity + qty : Math.max(0, i.current_quantity - qty);
      return { ...i, current_quantity: next, is_low_stock: next <= i.minimum_threshold };
    }));
    setStockModal(null);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Inventory"
        description={`${filtered.length} items · Track supplies and stock levels`}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add item</Button>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All categories</option>
          {Object.keys(CATEGORIES).map((k) => <option key={k} value={k}>{k}</option>)}
        </NativeSelect>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <Checkbox checked={lowStock} onCheckedChange={setLowStock} />
          Low stock only
        </label>
        <span className="ml-auto text-sm font-semibold text-muted-foreground">{filtered.length} items</span>
      </div>

      {filtered.length === 0 && (
        <EmptyState icon={Package} title="No inventory items" message={lowStock ? 'No low-stock items. Stock levels look good!' : 'No items in inventory yet.'}
          action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add item</Button>} />
      )}

      {filtered.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Min threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const Icon = CATEGORIES[item.category] || Package;
                return (
                  <TableRow key={item.id} className={cn(item.is_low_stock && 'bg-destructive/5')}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                    <TableCell>
                      <span className={cn('text-[15px] font-bold', item.is_low_stock ? 'text-destructive' : 'text-primary')}>{item.current_quantity}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{item.unit}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.minimum_threshold || '—'}</TableCell>
                    <TableCell>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', item.is_low_stock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
                        {item.is_low_stock ? 'Low' : 'OK'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => setStockModal({ item, mode: 'restock' })}>Restock</Button>
                        <Button size="sm" variant="secondary" onClick={() => setStockModal({ item, mode: 'use' })}>Use</Button>
                        <Button size="sm" variant="secondary" asChild><Link href={`/inventory/${item.id}/history`}><History className="size-3.5" /></Link></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        open={!!stockModal}
        onClose={() => setStockModal(null)}
        title={stockModal ? `${stockModal.mode === 'restock' ? 'Restock' : 'Use'}: ${stockModal.item.name}` : ''}
        footer={<><Button variant="secondary" onClick={() => setStockModal(null)}>Cancel</Button><Button form="stock-form" type="submit">{stockModal?.mode === 'restock' ? 'Add stock' : 'Reduce stock'}</Button></>}
      >
        {stockModal && (
          <form id="stock-form" onSubmit={handleStock} className="flex flex-col gap-4">
            <div className="rounded-lg bg-surface-muted p-3 text-sm text-muted-foreground">
              Current: <strong className="text-primary">{stockModal.item.current_quantity} {stockModal.item.unit}</strong>
            </div>
            <div>
              <Label htmlFor="stock-qty">{stockModal.mode === 'restock' ? 'Quantity to add' : 'Quantity to use'} *</Label>
              <Input id="stock-qty" type="number" name="qty" required min="0.01" step="0.01" placeholder="e.g. 10" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="stock-notes">Notes</Label>
              <Input id="stock-notes" name="notes" placeholder="Reason / reference…" className="mt-1.5" />
            </div>
          </form>
        )}
      </Modal>

      <AddItemModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={(item) => { setItems((all) => [item, ...all]); setAddOpen(false); }} />
    </div>
  );
}

function AddItemModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', category: 'FOOD', current_quantity: '', unit: 'units', minimum_threshold: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      const qty = Number(form.current_quantity) || 0;
      const min = Number(form.minimum_threshold) || 0;
      onSaved({ id: `inv-${Date.now()}`, name: form.name, category: form.category, unit: form.unit || 'units', current_quantity: qty, minimum_threshold: min, is_low_stock: qty <= min });
      setSaving(false);
    }, 350);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add inventory item"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="add-item-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add item'}</Button></>}
    >
      <form id="add-item-form" onSubmit={handleSave} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="inv-name">Item name *</Label><Input id="inv-name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Royal Canin Kitten" className="mt-1.5" /></div>
          <div>
            <Label htmlFor="inv-cat">Category</Label>
            <NativeSelect id="inv-cat" value={form.category} onChange={(e) => set('category', e.target.value)} className="mt-1.5">
              {Object.keys(CATEGORIES).map((k) => <option key={k} value={k}>{k}</option>)}
            </NativeSelect>
          </div>
          <div><Label htmlFor="inv-qty">Quantity *</Label><Input id="inv-qty" type="number" required min="0" step="0.01" value={form.current_quantity} onChange={(e) => set('current_quantity', e.target.value)} placeholder="50" className="mt-1.5" /></div>
          <div><Label htmlFor="inv-unit">Unit</Label><Input id="inv-unit" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="kg, units, bottles" className="mt-1.5" /></div>
          <div><Label htmlFor="inv-min">Min threshold</Label><Input id="inv-min" type="number" min="0" step="0.01" value={form.minimum_threshold} onChange={(e) => set('minimum_threshold', e.target.value)} placeholder="10" className="mt-1.5" /></div>
        </div>
      </form>
    </Modal>
  );
}
