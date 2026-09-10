import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Beef, Pill, Wrench, SprayCan, BedDouble, Package, Plus, History, Building2 } from 'lucide-react';
import { inventoryApi } from '@/api/inventoryApi';
import { sheltersApi } from '@/api/sheltersApi';
import useApi from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
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

const CATEGORIES = {
  FOOD: Beef, MEDICINE: Pill, EQUIPMENT: Wrench, CLEANING: SprayCan, BEDDING: BedDouble, OTHER: Package,
};

export default function InventoryListPage() {
  const [shelterId, setShelterId] = useState(null);
  const [shelterErr, setShelterErr] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);

  useEffect(() => {
    sheltersApi.myDashboard().then((res) => setShelterId(res.data?.data?.shelter_id || null)).catch(() => setShelterErr('No shelter is associated with your account.'));
  }, []);

  const { data, loading, refetch } = useApi(
    () => inventoryApi.listByShelter(shelterId, { category: category || undefined }),
    { skip: !shelterId },
    [shelterId, category],
  );

  const allItems = Array.isArray(data) ? data : (data?.results || []);
  const items = lowStock ? allItems.filter((i) => i.is_low_stock) : allItems;

  const handleStock = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const qty = Number(fd.get('qty'));
    const notes = fd.get('notes') || '';
    try {
      if (stockModal.mode === 'restock') await inventoryApi.restock(stockModal.item.id, { quantity_added: qty, notes });
      else await inventoryApi.use(stockModal.item.id, { quantity_used: qty, notes });
      setStockModal(null);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update stock.');
    }
  };

  if (shelterErr) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <PageHeader title="Inventory" description="Track supplies and stock levels" />
        <EmptyState icon={Building2} title="No shelter found" message={shelterErr} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Inventory"
        description={`${items.length} items · Track supplies and stock levels`}
        actions={<Button onClick={() => setAddOpen(true)} disabled={!shelterId}><Plus className="size-4" />Add item</Button>}
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
        <span className="ml-auto text-sm font-semibold text-muted-foreground">{items.length} items</span>
      </div>

      {(loading || !shelterId) && <LoadingSpinner text="Loading inventory…" />}

      {!loading && shelterId && items.length === 0 && (
        <EmptyState icon={Package} title="No inventory items" message={lowStock ? 'No low-stock items. Stock levels look good!' : 'No items in inventory yet.'}
          action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Add item</Button>} />
      )}

      {!loading && items.length > 0 && (
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
              {items.map((item) => {
                const isLow = item.is_low_stock;
                const Icon = CATEGORIES[item.category] || Package;
                return (
                  <TableRow key={item.id} className={cn(isLow && 'bg-destructive/5')}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                    <TableCell>
                      <span className={cn('text-[15px] font-bold', isLow ? 'text-destructive' : 'text-primary')}>{Number(item.current_quantity)}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{item.unit}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{Number(item.minimum_threshold) || '—'}</TableCell>
                    <TableCell>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', isLow ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
                        {isLow ? 'Low' : 'OK'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => setStockModal({ item, mode: 'restock' })}>Restock</Button>
                        <Button size="sm" variant="secondary" onClick={() => setStockModal({ item, mode: 'use' })}>Use</Button>
                        <Button size="sm" variant="secondary" asChild><Link to={`/inventory/${item.id}/history`}><History className="size-3.5" /></Link></Button>
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
        footer={
          <>
            <Button variant="secondary" onClick={() => setStockModal(null)}>Cancel</Button>
            <Button form="stock-form" type="submit">{stockModal?.mode === 'restock' ? 'Add stock' : 'Reduce stock'}</Button>
          </>
        }
      >
        {stockModal && (
          <form id="stock-form" onSubmit={handleStock} className="flex flex-col gap-4">
            <div className="rounded-lg bg-surface-muted p-3 text-sm text-muted-foreground">
              Current: <strong className="text-primary">{Number(stockModal.item.current_quantity)} {stockModal.item.unit}</strong>
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

      <AddItemModal open={addOpen} shelterId={shelterId} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); refetch(); }} />
    </div>
  );
}

function AddItemModal({ open, shelterId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', category: 'FOOD', current_quantity: '', unit: 'units', minimum_threshold: '', unit_cost: '', supplier_info: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await inventoryApi.createForShelter(shelterId, {
        name: form.name, category: form.category, unit: form.unit || 'units',
        current_quantity: Number(form.current_quantity) || 0, minimum_threshold: Number(form.minimum_threshold) || 0,
        unit_cost: form.unit_cost ? Number(form.unit_cost) : null, supplier_info: form.supplier_info,
      });
      onSaved();
      setForm({ name: '', category: 'FOOD', current_quantity: '', unit: 'units', minimum_threshold: '', unit_cost: '', supplier_info: '' });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add item.');
    }
    setSaving(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add inventory item"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="add-item-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add item'}</Button></>}
    >
      {error && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
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
          <div><Label htmlFor="inv-cost">Unit cost (optional)</Label><Input id="inv-cost" type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => set('unit_cost', e.target.value)} placeholder="0.00" className="mt-1.5" /></div>
        </div>
        <div><Label htmlFor="inv-supplier">Supplier info</Label><Input id="inv-supplier" value={form.supplier_info} onChange={(e) => set('supplier_info', e.target.value)} placeholder="Supplier name / contact" className="mt-1.5" /></div>
      </form>
    </Modal>
  );
}
