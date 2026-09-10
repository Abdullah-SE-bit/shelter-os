import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../../api/inventoryApi';
import { sheltersApi } from '../../api/sheltersApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const CATEGORY_ICONS = {
  FOOD: '🍖', MEDICINE: '💊', EQUIPMENT: '🔧', CLEANING: '🧼', BEDDING: '🛏️', OTHER: '📦',
};

export default function InventoryListPage() {
  const [shelterId, setShelterId] = useState(null);
  const [shelterErr, setShelterErr] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [stockModal, setStockModal] = useState(null); // { item, mode: 'restock'|'use' }
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);

  // Resolve the current admin's shelter (super admin -> first shelter).
  useEffect(() => {
    sheltersApi.myDashboard()
      .then(res => setShelterId(res.data?.data?.shelter_id || null))
      .catch(() => setShelterErr('No shelter is associated with your account.'));
  }, []);

  const { data, loading, refetch } = useApi(
    () => inventoryApi.listByShelter(shelterId, { category: category || undefined }),
    { skip: !shelterId },
    [shelterId, category]
  );

  const allItems = Array.isArray(data) ? data : (data?.results || []);
  const items = lowStock ? allItems.filter(i => i.is_low_stock) : allItems;

  const handleStock = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const qty = Number(fd.get('qty'));
    const notes = fd.get('notes') || '';
    try {
      if (stockModal.mode === 'restock') {
        await inventoryApi.restock(stockModal.item.id, { quantity_added: qty, notes });
      } else {
        await inventoryApi.use(stockModal.item.id, { quantity_used: qty, notes });
      }
      setStockModal(null);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update stock.');
    }
  };

  if (shelterErr) {
    return (
      <div className="page-container">
        <PageHeader title="📦 Inventory" subtitle="Track supplies and stock levels" />
        <EmptyState icon="🏠" title="No shelter found" message={shelterErr} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="📦 Inventory"
        subtitle={`${items.length} items · Track supplies and stock levels`}
        action={<button onClick={() => setAddOpen(true)} className="btn btn-primary" disabled={!shelterId}>+ Add Item</button>}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', padding: '0.875rem 1.25rem', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px' }}>
        <select value={category} onChange={e => setCategory(e.target.value)} className="input-base" style={{ width: 'auto' }}>
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_ICONS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} style={{ accentColor: 'var(--cat-terra)' }} />
          ⚠️ Low stock only
        </label>
        <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>{items.length} items</span>
      </div>

      {(loading || !shelterId) && <LoadingSpinner text="Loading inventory…" />}

      {!loading && shelterId && items.length === 0 && (
        <EmptyState icon="📦" title="No inventory items" message={lowStock ? 'No low-stock items. Stock levels look good!' : 'No items in inventory yet.'}
          action={<button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Add Item</button>} />
      )}

      {!loading && items.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Min Threshold</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isLow = item.is_low_stock;
                return (
                  <tr key={item.id} style={{ background: isLow ? 'rgba(192,82,78,0.04)' : undefined }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{CATEGORY_ICONS[item.category] || '📦'}</span>
                        <span style={{ fontWeight: 700 }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.category}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: isLow ? 'var(--cat-red)' : 'var(--cat-terra)' }}>
                          {Number(item.current_quantity)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{Number(item.minimum_threshold) || '—'}</td>
                    <td>
                      <span style={{
                        background: isLow ? 'var(--cat-red-light)' : 'var(--cat-sage-light)',
                        color: isLow ? '#8B2C2A' : '#2E6B24',
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px',
                      }}>
                        {isLow ? '⚠️ Low' : '✅ OK'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => setStockModal({ item, mode: 'restock' })} className="btn btn-secondary btn-sm">+ Restock</button>
                        <button onClick={() => setStockModal({ item, mode: 'use' })} className="btn btn-secondary btn-sm">− Use</button>
                        <Link to={`/inventory/${item.id}/history`} className="btn btn-secondary btn-sm">📋</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Restock / Use modal */}
      <Modal open={!!stockModal} onClose={() => setStockModal(null)}
        title={stockModal ? `${stockModal.mode === 'restock' ? '+ Restock' : '− Use'}: ${stockModal.item.name}` : ''}
        footer={
          <>
            <button onClick={() => setStockModal(null)} className="btn btn-secondary">Cancel</button>
            <button form="stock-form" type="submit" className="btn btn-primary">
              {stockModal?.mode === 'restock' ? 'Add Stock' : 'Reduce Stock'}
            </button>
          </>
        }
      >
        {stockModal && (
          <form id="stock-form" onSubmit={handleStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--cat-linen)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Current: <strong style={{ color: 'var(--cat-terra)' }}>{Number(stockModal.item.current_quantity)} {stockModal.item.unit}</strong>
            </div>
            <div className="form-group">
              <label className="label-base">{stockModal.mode === 'restock' ? 'Quantity to add' : 'Quantity to use'} *</label>
              <input type="number" name="qty" required min="0.01" step="0.01" className="input-base" placeholder="e.g. 10" id="stock-qty" />
            </div>
            <div className="form-group">
              <label className="label-base">Notes</label>
              <input name="notes" className="input-base" placeholder="Reason / reference…" id="stock-notes" />
            </div>
          </form>
        )}
      </Modal>

      {/* Add item modal */}
      <AddItemModal open={addOpen} shelterId={shelterId} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); refetch(); }} />
    </div>
  );
}

function AddItemModal({ open, shelterId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', category: 'FOOD', current_quantity: '', unit: 'units', minimum_threshold: '', unit_cost: '', supplier_info: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await inventoryApi.createForShelter(shelterId, {
        name: form.name,
        category: form.category,
        unit: form.unit || 'units',
        current_quantity: Number(form.current_quantity) || 0,
        minimum_threshold: Number(form.minimum_threshold) || 0,
        unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
        supplier_info: form.supplier_info,
      });
      onSaved();
      setForm({ name: '', category: 'FOOD', current_quantity: '', unit: 'units', minimum_threshold: '', unit_cost: '', supplier_info: '' });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add item.');
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="📦 Add Inventory Item"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button form="add-item-form" type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : 'Add Item'}
          </button>
        </>
      }
    >
      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      <form id="add-item-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="label-base">Item Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} className="input-base" placeholder="Royal Canin Kitten" id="inv-name" />
          </div>
          <div className="form-group">
            <label className="label-base">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input-base" id="inv-cat">
              {Object.keys(CATEGORY_ICONS).map(k => <option key={k} value={k}>{CATEGORY_ICONS[k]} {k}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label-base">Quantity *</label>
            <input type="number" required min="0" step="0.01" value={form.current_quantity} onChange={e => set('current_quantity', e.target.value)} className="input-base" placeholder="50" id="inv-qty" />
          </div>
          <div className="form-group">
            <label className="label-base">Unit</label>
            <input value={form.unit} onChange={e => set('unit', e.target.value)} className="input-base" placeholder="kg, units, bottles" id="inv-unit" />
          </div>
          <div className="form-group">
            <label className="label-base">Min Threshold</label>
            <input type="number" min="0" step="0.01" value={form.minimum_threshold} onChange={e => set('minimum_threshold', e.target.value)} className="input-base" placeholder="10" id="inv-min" />
          </div>
          <div className="form-group">
            <label className="label-base">Unit Cost (optional)</label>
            <input type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} className="input-base" placeholder="0.00" id="inv-cost" />
          </div>
        </div>
        <div className="form-group">
          <label className="label-base">Supplier Info</label>
          <input value={form.supplier_info} onChange={e => set('supplier_info', e.target.value)} className="input-base" placeholder="Supplier name / contact" id="inv-supplier" />
        </div>
      </form>
    </Modal>
  );
}
