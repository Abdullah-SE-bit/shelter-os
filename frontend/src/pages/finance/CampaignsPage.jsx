import { useState, useEffect } from 'react';
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
import { formatDate, timeAgo } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

function ProgressRing({ pct, size = 80, stroke = 8, color = 'var(--cat-terra)' }) {
  const r  = (size - stroke) / 2;
  const c  = 2 * Math.PI * r;
  const p  = Math.min(100, pct || 0);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--cat-linen)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${(p / 100) * c} ${c}`} strokeLinecap="round" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: color, fontSize: '14px', fontWeight: 900, fontFamily: 'Nunito, sans-serif', transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {Math.round(p)}%
      </text>
    </svg>
  );
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'SHELTER_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { page, pageSize, nextPage, prevPage, goTo } = usePagination(9);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', target_amount: '', start_date: new Date().toISOString().split('T')[0],
    end_date: '', is_active: true, shelter: '', scope: 'SHELTER',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Poll periodically so campaigns that just completed or expired update their
  // card state and then drop off once the server retires them.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const { data, loading, refetch } = useApi(() => financeApi.listCampaigns({ page, page_size: pageSize }), null, [page, tick]);
  // Super admins must pick which shelter a campaign belongs to.
  const { data: shelterData } = useApi(() => sheltersApi.list(), { skip: !isSuperAdmin }, [isSuperAdmin]);
  const shelters = shelterData?.results || shelterData || [];

  const campaigns  = data?.results || [];
  const total      = data?.count   || 0;
  const totalPages = Math.ceil(total / pageSize);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        title: form.title,
        description: form.description,
        target_amount: form.target_amount,
        start_date: form.start_date,
        end_date: form.end_date,
        is_active: form.is_active,
      };
      if (isSuperAdmin) {
        // Super admins choose app-wide or a specific shelter.
        if (form.scope === 'APP') payload.is_app_level = true;
        else if (form.shelter) payload.shelter = form.shelter;
      }
      await financeApi.createCampaign(payload);
      setAddOpen(false);
      setForm({ title: '', description: '', target_amount: '', start_date: new Date().toISOString().split('T')[0], end_date: '', is_active: true, shelter: '', scope: 'SHELTER' });
      refetch();
    } catch (err) {
      const detail = err.response?.data?.error?.details;
      if (detail && typeof detail === 'object') {
        setErrors(detail);
      } else {
        setErrors({ _general: err.response?.data?.error?.message || 'Failed to create campaign.' });
      }
    }
    setSaving(false);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="🎯 Fundraising Campaigns"
        subtitle={`${total} campaigns · Raise funds for cats in need`}
        action={canManage && <button onClick={() => setAddOpen(true)} className="btn btn-primary">+ New Campaign</button>}
      />

      {loading && <LoadingSpinner size="lg" text="Loading campaigns…" />}

      {!loading && campaigns.length === 0 && (
        <EmptyState
          icon="🎯"
          title="No campaigns yet"
          message="Create your first fundraising campaign to start collecting donations."
          action={canManage && <button onClick={() => setAddOpen(true)} className="btn btn-primary">+ Create Campaign</button>}
        />
      )}

      {!loading && campaigns.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {campaigns.map(camp => {
            const raised = Number(camp.collected_amount || 0);
            const goal   = Number(camp.target_amount || 1);
            const isCompleted  = camp.status === 'COMPLETED';
            const isIncomplete = camp.status === 'INCOMPLETE';
            const rawPct = (raised / goal) * 100;
            const pct    = isCompleted ? 100 : Math.min(100, rawPct);
            const isOver = isCompleted || rawPct >= 100;
            const daysLeft = camp.end_date
              ? Math.max(0, Math.ceil((new Date(camp.end_date) - new Date()) / 86400000))
              : null;
            const color = isIncomplete
              ? 'var(--cat-red)'
              : isOver ? 'var(--cat-sage)' : rawPct >= 60 ? 'var(--cat-amber)' : 'var(--cat-terra)';
            const scopeLabel = camp.is_app_level
              ? '🌐 App Campaign'
              : camp.shelter_name ? `🏠 Shelter Campaign · ${camp.shelter_name}` : '🏠 Shelter Campaign';

            return (
              <div key={camp.id} style={{
                background: 'var(--surface-card)',
                border: `1px solid ${isIncomplete ? 'rgba(184,58,58,0.4)' : isOver ? 'rgba(123,173,110,0.4)' : 'var(--border-default)'}`,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Header gradient */}
                <div style={{
                  background: isIncomplete
                    ? 'linear-gradient(135deg, var(--cat-red), #8B2C2A)'
                    : isOver
                    ? 'linear-gradient(135deg, var(--cat-sage), #5A9B50)'
                    : 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
                  padding: '1.25rem 1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', right: '0.75rem', bottom: '-0.5rem', fontSize: '4rem', opacity: 0.12 }}>
                    {isCompleted ? '🎉' : isIncomplete ? '😿' : '🎯'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.22)', color: 'white', fontSize: '0.6875rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '999px', marginBottom: '0.4rem', letterSpacing: '0.02em' }}>
                        {scopeLabel}
                      </span>
                      <h3 style={{ color: 'white', margin: '0 0 0.375rem', fontSize: '1.0625rem', fontWeight: 800, lineHeight: 1.3 }}>
                        {camp.title}
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.8125rem', lineHeight: 1.4 }}>
                        {camp.description?.slice(0, 60)}{camp.description?.length > 60 ? '…' : ''}
                      </p>
                    </div>
                    <ProgressRing pct={pct} size={72} stroke={6} color="rgba(255,255,255,0.9)" />
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Amount */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.375rem', color, lineHeight: 1 }}>
                        {formatCurrency(raised)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        of {formatCurrency(goal)} goal
                      </div>
                    </div>
                    {isCompleted && (
                      <span style={{ background: 'var(--cat-sage-light)', color: '#2E6B24', fontWeight: 800, fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '999px' }}>
                        ✅ Completed
                      </span>
                    )}
                    {isIncomplete && (
                      <span style={{ background: 'var(--cat-red-light)', color: '#8B2C2A', fontWeight: 800, fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '999px' }}>
                        ⚠️ Incomplete
                      </span>
                    )}
                    {!isCompleted && !isIncomplete && isOver && (
                      <span style={{ background: 'var(--cat-sage-light)', color: '#2E6B24', fontWeight: 800, fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '999px' }}>
                        🎉 Goal Reached!
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: '8px', background: 'var(--cat-linen)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                      borderRadius: '999px',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>

                  {/* Footer info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>📅 {formatDate(camp.start_date)}</span>
                    {camp.status === 'ACTIVE' && daysLeft !== null && (
                      <span style={{ fontWeight: 700, color: daysLeft <= 3 ? 'var(--cat-red)' : 'var(--text-muted)' }}>
                        {daysLeft === 0 ? '⚠️ Ends today' : `${daysLeft}d left`}
                      </span>
                    )}
                    {isCompleted && (
                      <span style={{ color: 'var(--cat-sage)', fontWeight: 700 }}>🎉 100% funded</span>
                    )}
                    {isIncomplete && (
                      <span style={{ color: 'var(--cat-red)', fontWeight: 700 }}>{Math.round(rawPct)}% · Not funded</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      {/* Create campaign modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="🎯 Create Campaign" size="md"
        footer={
          <>
            <button onClick={() => setAddOpen(false)} className="btn btn-secondary">Cancel</button>
            <button form="camp-form" type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Creating…' : 'Create Campaign'}
            </button>
          </>
        }
      >
        {errors._general && <div className="form-error" style={{ marginBottom: '1rem' }}>🙀 {errors._general}</div>}
        <form id="camp-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {isSuperAdmin && (
            <div className="form-group">
              <label className="label-base">Campaign For *</label>
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
          )}
          {isSuperAdmin && form.scope === 'SHELTER' && (
            <div className="form-group">
              <label className="label-base">Shelter *</label>
              <select required value={form.shelter} onChange={e => set('shelter', e.target.value)}
                className="input-base" id="camp-shelter">
                <option value="">Select a shelter…</option>
                {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.shelter && <div className="form-error">{Array.isArray(errors.shelter) ? errors.shelter[0] : errors.shelter}</div>}
            </div>
          )}
          <div className="form-group">
            <label className="label-base">Campaign Title *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              className="input-base" placeholder="e.g. Winter Cat Care Fund 2025" id="camp-title" />
            {errors.title && <div className="form-error">{Array.isArray(errors.title) ? errors.title[0] : errors.title}</div>}
          </div>
          <div className="form-group">
            <label className="label-base">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="input-base" rows={3} placeholder="What will the funds be used for?" id="camp-desc" style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label-base">Goal Amount (PKR) *</label>
              <input required type="number" min="1" value={form.target_amount} onChange={e => set('target_amount', e.target.value)}
                className="input-base" placeholder="100000" id="camp-goal" />
              {errors.target_amount && <div className="form-error">{Array.isArray(errors.target_amount) ? errors.target_amount[0] : errors.target_amount}</div>}
            </div>
            <div className="form-group">
              <label className="label-base">Start Date *</label>
              <input required type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className="input-base" id="camp-start" />
              {errors.start_date && <div className="form-error">{Array.isArray(errors.start_date) ? errors.start_date[0] : errors.start_date}</div>}
            </div>
            <div className="form-group">
              <label className="label-base">End Date *</label>
              <input required type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                className="input-base" id="camp-end" />
              {errors.end_date && <div className="form-error">{Array.isArray(errors.end_date) ? errors.end_date[0] : errors.end_date}</div>}
            </div>
            <div className="form-group">
              <label className="label-base" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
                  style={{ accentColor: 'var(--cat-terra)', width: '16px', height: '16px' }} id="camp-active" />
                Activate immediately
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}