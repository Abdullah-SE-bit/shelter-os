import { useState } from 'react';
import { financeApi } from '../../api/financeApi';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

const CATEGORIES = ['FOOD','MEDICINE','UTILITIES','RENT','SALARIES','EQUIPMENT','TRANSPORT','MAINTENANCE','OTHER'];

export default function ExpensesPage() {
  const { page, pageSize, nextPage, prevPage, goTo } = usePagination(20);
  const [addOpen,   setAddOpen]   = useState(false);
  const [category,  setCategory]  = useState('');
  const [form, setForm] = useState({ amount: '', category: 'FOOD', description: '', incurred_at: new Date().toISOString().split('T')[0], payment_method: 'CASH', receipt_number: '' });
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useApi(
    () => financeApi.listExpenses({ page, page_size: pageSize, category: category || undefined }),
    null,
    [page, category]
  );

  const expenses    = data?.results || [];
  const total       = data?.count   || 0;
  const totalPages  = Math.ceil(total / pageSize);
  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await financeApi.createExpense(form);
      setAddOpen(false);
      refetch();
    } catch {}
    setSaving(false);
  };

  const CAT_ICONS = { FOOD: '🍖', MEDICINE: '💊', UTILITIES: '💡', RENT: '🏠', SALARIES: '💼', EQUIPMENT: '🔧', TRANSPORT: '🚗', MAINTENANCE: '🛠️', OTHER: '📋' };

  return (
    <div className="page-container">
      <PageHeader
        title="💸 Expenses"
        subtitle={`${total} expense records`}
        action={<button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Add Expense</button>}
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--cat-rust), var(--cat-red))', borderRadius: '14px', padding: '1.25rem', color: 'white' }}>
          <div style={{ fontSize: '1.625rem', fontWeight: 900 }}>{formatCurrency(totalAmount)}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total (this page)</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--cat-red)' }}>{total}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Records</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--cat-amber)' }}>
            {total > 0 ? formatCurrency(totalAmount / expenses.length) : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Average</div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {['', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            border: `1.5px solid ${category === c ? 'var(--cat-terra)' : 'var(--border-default)'}`,
            background: category === c ? 'var(--cat-terra)' : 'var(--surface-card)',
            color: category === c ? 'white' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}>
            {c ? `${CAT_ICONS[c] || '📋'} ${c}` : 'All'}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner text="Loading expenses…" />}
      {!loading && expenses.length === 0 && (
        <EmptyState icon="💸" title="No expenses" message="No expense records found."
          action={<button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Add Expense</button>} />
      )}

      {!loading && expenses.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: 600 }}>{exp.description || '—'}</td>
                  <td>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {CAT_ICONS[exp.category] || '📋'} {exp.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 900, color: 'var(--cat-red)', fontSize: '1rem' }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{formatDate(exp.incurred_at)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{exp.payment_method?.replace(/_/g,' ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="💸 Add Expense"
        footer={
          <>
            <button onClick={() => setAddOpen(false)} className="btn btn-secondary">Cancel</button>
            <button form="exp-form" type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : 'Add Expense'}</button>
          </>
        }
      >
        <form id="exp-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Amount (PKR) *</label>
              <input required type="number" min="1" value={form.amount} onChange={e => set('amount', e.target.value)} className="input-base" id="exp-amount" />
            </div>
            <div className="form-group">
              <label className="label-base">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input-base" id="exp-cat">
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="label-base">Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} className="input-base" placeholder="What was this expense for?" id="exp-desc" />
            </div>
            <div className="form-group">
              <label className="label-base">Date *</label>
              <input required type="date" value={form.incurred_at} onChange={e => set('incurred_at', e.target.value)} className="input-base" id="exp-date" />
            </div>
            <div className="form-group">
              <label className="label-base">Payment Method</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} className="input-base" id="exp-method">
                {['CASH','BANK_TRANSFER','JAZZCASH','EASYPAISA','CHEQUE','ONLINE'].map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="label-base">Receipt Number</label>
              <input value={form.receipt_number} onChange={e => set('receipt_number', e.target.value)} className="input-base" placeholder="Optional" id="exp-receipt" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}