import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { financeApi } from '../../api/financeApi';
import { sheltersApi } from '../../api/sheltersApi';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

export default function DonationsPage({ recordMode = false }) {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { page, pageSize, nextPage, prevPage, goTo } = usePagination(20);
  const [addOpen, setAddOpen] = useState(false);
  const [form,    setForm]    = useState({ amount: '', donor_name: '', donor_email: '', payment_method: 'BANK_TRANSFER', notes: '', received_at: new Date().toISOString().split('T')[0], scope: 'SHELTER', shelter: '', campaign: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Super admins pick which shelter (or app-wide) a donation is registered against.
  const { data: shelterData } = useApi(() => sheltersApi.list(), { skip: !isSuperAdmin }, [isSuperAdmin]);
  const shelters = shelterData?.results || shelterData || [];

  // Donations can be directed at an active campaign; this is what fills the
  // campaign's progress ring on the donate page.
  const { data: campaignData } = useApi(() => financeApi.listCampaigns({ page_size: 100 }), null, []);
  const campaigns = (campaignData?.results || []).filter(c => c.status === 'ACTIVE');

  // When reached via the "Register Donation" sidebar item, open the form immediately.
  useEffect(() => {
    if (recordMode) setAddOpen(true);
  }, [recordMode]);

  const closeModal = () => {
    setAddOpen(false);
    if (recordMode) navigate('/finance/donations');
  };

  const { data, loading, refetch } = useApi(() => financeApi.listDonations({ page, page_size: pageSize }), null, [page]);

  const donations   = data?.results || [];
  const total       = data?.count   || 0;
  const totalPages  = Math.ceil(total / pageSize);
  const totalAmount = donations.reduce((s, d) => s + Number(d.amount || 0), 0);

  const METHODS = ['BANK_TRANSFER','JAZZCASH','EASYPAISA','CASH','CHEQUE','ONLINE'];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        amount: form.amount,
        donor_name: form.donor_name,
        donor_email: form.donor_email,
        payment_method: form.payment_method,
        notes: form.notes,
        received_at: form.received_at,
      };
      if (isSuperAdmin) {
        // Register for the whole app or a specific shelter.
        if (form.scope === 'APP') payload.is_app_level = true;
        else if (form.shelter) payload.shelter = form.shelter;
      }
      if (form.campaign) payload.campaign = form.campaign;
      await financeApi.createDonation(payload);
      setForm({ amount: '', donor_name: '', donor_email: '', payment_method: 'BANK_TRANSFER', notes: '', received_at: new Date().toISOString().split('T')[0], scope: 'SHELTER', shelter: '', campaign: '' });
      closeModal();
      refetch();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to record donation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="💝 Donations"
        subtitle={`${total} donations recorded`}
      />

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))', borderRadius: '14px', padding: '1.25rem', color: 'white' }}>
          <div style={{ fontSize: '1.625rem', fontWeight: 900 }}>{formatCurrency(totalAmount)}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total (this page)</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--cat-terra)' }}>{total}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Donations</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '1.25rem' }}>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--cat-sage)' }}>
            {total > 0 ? formatCurrency(totalAmount / donations.length) : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Average Donation</div>
        </div>
      </div>

      {loading && <LoadingSpinner text="Loading donations…" />}

      {!loading && donations.length === 0 && (
        <EmptyState icon="💝" title="No donations yet" message="Record your first donation to start tracking finances."
          action={<button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Record Donation</button>} />
      )}

      {!loading && donations.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 700 }}>{d.donor_name || 'Anonymous'}</div>
                      {d.donor_email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.donor_email}</div>}
                    </div>
                  </td>
                  <td style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--cat-terra)' }}>{formatCurrency(d.amount)}</td>
                  <td>
                    <span style={{
                      background: 'var(--cat-linen)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                    }}>
                      {d.payment_method?.replace(/_/g,' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{formatDate(d.received_at)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      {/* Add Donation Modal */}
      <Modal open={addOpen} onClose={closeModal} title="💝 Record Donation"
        footer={
          <>
            <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button form="donation-form" type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving…' : 'Record Donation'}
            </button>
          </>
        }
      >
        {error && <div className="form-error" style={{ marginBottom: '1rem' }}>🙀 {error}</div>}
        <form id="donation-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {isSuperAdmin && (
            <>
              <div className="form-group">
                <label className="label-base">Donation For *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { key: 'APP', icon: '🌐', label: 'App-wide' },
                    { key: 'SHELTER', icon: '🏠', label: 'A Shelter' },
                  ].map(opt => {
                    const selected = form.scope === opt.key;
                    return (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => set('scope', opt.key)}
                        style={{
                          padding: '0.625rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${selected ? 'var(--cat-terra)' : 'var(--border-default)'}`,
                          background: selected ? 'rgba(201,123,84,0.1)' : 'var(--surface-card)',
                          color: selected ? 'var(--cat-terra)' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {form.scope === 'SHELTER' && (
                <div className="form-group">
                  <label className="label-base">Shelter *</label>
                  <select required value={form.shelter} onChange={e => set('shelter', e.target.value)} className="input-base" id="don-shelter">
                    <option value="">Select a shelter…</option>
                    {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </>
          )}
          <div className="form-group">
            <label className="label-base">Campaign (optional)</label>
            <select value={form.campaign} onChange={e => set('campaign', e.target.value)} className="input-base" id="don-campaign">
              <option value="">General donation (no campaign)</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}{c.is_app_level ? ' · App-wide' : c.shelter_name ? ` · ${c.shelter_name}` : ''}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Linking a donation to a campaign advances its progress bar.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Amount (PKR) *</label>
              <input type="number" required min="1" value={form.amount} onChange={e => set('amount', e.target.value)} className="input-base" placeholder="5000" id="don-amount" />
            </div>
            <div className="form-group">
              <label className="label-base">Date Received</label>
              <input type="date" value={form.received_at} onChange={e => set('received_at', e.target.value)} className="input-base" id="don-date" />
            </div>
            <div className="form-group">
              <label className="label-base">Donor Name</label>
              <input value={form.donor_name} onChange={e => set('donor_name', e.target.value)} className="input-base" placeholder="Leave blank for anonymous" id="don-name" />
            </div>
            <div className="form-group">
              <label className="label-base">Donor Email</label>
              <input type="email" value={form.donor_email} onChange={e => set('donor_email', e.target.value)} className="input-base" placeholder="Optional" id="don-email" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="label-base">Payment Method</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} className="input-base" id="don-method">
                {METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="label-base">Notes</label>
              <input value={form.notes} onChange={e => set('notes', e.target.value)} className="input-base" placeholder="Any additional notes…" id="don-notes" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}