import { useState, useEffect } from 'react';
import { Target, Globe2, Building2, Plus, PartyPopper, Frown, CalendarDays, TriangleAlert } from 'lucide-react';
import { financeApi } from '@/api/financeApi';
import { sheltersApi } from '@/api/sheltersApi';
import { useAuth } from '@/context/AuthContext';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

function ProgressRing({ pct, size = 72, stroke = 6, color = 'white' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, pct || 0);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${(p / 100) * c} ${c}`} strokeLinecap="round" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fill: color, fontSize: '13px', fontWeight: 800, transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {Math.round(p)}%
      </text>
    </svg>
  );
}

// Tailwind's content scanner needs full literal class strings — `text-${tone}`
// would never be generated — so tones resolve through this lookup instead.
const TONE_TEXT = { primary: 'text-primary', success: 'text-success', warning: 'text-warning', destructive: 'text-destructive' };
const TONE_BG = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', destructive: 'bg-destructive' };

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{Array.isArray(children) ? children[0] : children}</p>;
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

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const { data, loading, refetch } = useApi(() => financeApi.listCampaigns({ page, page_size: pageSize }), null, [page, tick]);
  const { data: shelterData } = useApi(() => sheltersApi.list(), { skip: !isSuperAdmin }, [isSuperAdmin]);
  const shelters = shelterData?.results || shelterData || [];

  const campaigns = data?.results || [];
  const total = data?.count || 0;
  const totalPages = Math.ceil(total / pageSize);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        title: form.title, description: form.description, target_amount: form.target_amount,
        start_date: form.start_date, end_date: form.end_date, is_active: form.is_active,
      };
      if (isSuperAdmin) {
        if (form.scope === 'APP') payload.is_app_level = true;
        else if (form.shelter) payload.shelter = form.shelter;
      }
      await financeApi.createCampaign(payload);
      setAddOpen(false);
      setForm({ title: '', description: '', target_amount: '', start_date: new Date().toISOString().split('T')[0], end_date: '', is_active: true, shelter: '', scope: 'SHELTER' });
      refetch();
    } catch (err) {
      const detail = err.response?.data?.error?.details;
      setErrors(detail && typeof detail === 'object' ? detail : { _general: err.response?.data?.error?.message || 'Failed to create campaign.' });
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        title="Fundraising campaigns"
        description={`${total} campaigns · Raise funds for cats in need`}
        actions={canManage && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />New campaign</Button>}
      />

      {loading && <LoadingSpinner size="lg" text="Loading campaigns…" />}

      {!loading && campaigns.length === 0 && (
        <EmptyState icon={Target} title="No campaigns yet" message="Create your first fundraising campaign to start collecting donations."
          action={canManage && <Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Create campaign</Button>} />
      )}

      {!loading && campaigns.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((camp) => {
            const raised = Number(camp.collected_amount || 0);
            const goal = Number(camp.target_amount || 1);
            const isCompleted = camp.status === 'COMPLETED';
            const isIncomplete = camp.status === 'INCOMPLETE';
            const rawPct = (raised / goal) * 100;
            const pct = isCompleted ? 100 : Math.min(100, rawPct);
            const isOver = isCompleted || rawPct >= 100;
            const daysLeft = camp.end_date ? Math.max(0, Math.ceil((new Date(camp.end_date) - new Date()) / 86400000)) : null;
            const tone = isIncomplete ? 'destructive' : isOver ? 'success' : rawPct >= 60 ? 'warning' : 'primary';
            const scopeLabel = camp.is_app_level ? 'App campaign' : camp.shelter_name ? `Shelter · ${camp.shelter_name}` : 'Shelter campaign';
            const HeaderIcon = isCompleted ? PartyPopper : isIncomplete ? Frown : Target;

            return (
              <div key={camp.id} className={cn(
                'flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm',
                isIncomplete ? 'border-destructive/30' : isOver ? 'border-success/30' : 'border-border',
              )}>
                <div className={cn(
                  'relative overflow-hidden px-5 py-4',
                  isIncomplete ? 'bg-destructive' : isOver ? 'bg-success' : 'bg-primary',
                )}>
                  <HeaderIcon className="pointer-events-none absolute right-3 -bottom-2 size-16 text-white/15" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="mb-1.5 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">{scopeLabel}</span>
                      <h3 className="text-[17px] leading-tight font-bold text-white">{camp.title}</h3>
                      <p className="mt-1 text-[13px] leading-snug text-white/75">
                        {camp.description?.slice(0, 60)}{camp.description?.length > 60 ? '…' : ''}
                      </p>
                    </div>
                    <ProgressRing pct={pct} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className={cn('text-xl font-bold leading-none', TONE_TEXT[tone])}>{formatCurrency(raised)}</div>
                      <div className="mt-1 text-xs font-medium text-muted-foreground">of {formatCurrency(goal)} goal</div>
                    </div>
                    {isCompleted && <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">Completed</span>}
                    {isIncomplete && <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">Incomplete</span>}
                    {!isCompleted && !isIncomplete && isOver && <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">Goal reached!</span>}
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div className={cn('h-full rounded-full transition-all', TONE_BG[tone])} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{formatDate(camp.start_date)}</span>
                    {camp.status === 'ACTIVE' && daysLeft !== null && (
                      <span className={cn('flex items-center gap-1 font-semibold', daysLeft <= 3 && 'text-destructive')}>
                        {daysLeft === 0 && <TriangleAlert className="size-3.5" />}
                        {daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
                      </span>
                    )}
                    {isCompleted && <span className="font-semibold text-success">100% funded</span>}
                    {isIncomplete && <span className="font-semibold text-destructive">{Math.round(rawPct)}% · Not funded</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Create campaign"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button form="camp-form" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create campaign'}</Button>
          </>
        }
      >
        {errors._general && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{errors._general}</div>}
        <form id="camp-form" onSubmit={handleSave} className="flex flex-col gap-3.5">
          {isSuperAdmin && (
            <div>
              <Label>Campaign for *</Label>
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
          )}
          {isSuperAdmin && form.scope === 'SHELTER' && (
            <div>
              <Label htmlFor="camp-shelter">Shelter *</Label>
              <NativeSelect id="camp-shelter" required value={form.shelter} onChange={(e) => set('shelter', e.target.value)} className="mt-1.5">
                <option value="">Select a shelter…</option>
                {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </NativeSelect>
              <FieldError>{errors.shelter}</FieldError>
            </div>
          )}
          <div>
            <Label htmlFor="camp-title">Campaign title *</Label>
            <Input id="camp-title" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Winter Cat Care Fund 2026" className="mt-1.5" />
            <FieldError>{errors.title}</FieldError>
          </div>
          <div>
            <Label htmlFor="camp-desc">Description</Label>
            <Textarea id="camp-desc" value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="What will the funds be used for?" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="camp-goal">Goal amount (PKR) *</Label>
              <Input id="camp-goal" required type="number" min="1" value={form.target_amount} onChange={(e) => set('target_amount', e.target.value)} placeholder="100000" className="mt-1.5" />
              <FieldError>{errors.target_amount}</FieldError>
            </div>
            <div>
              <Label htmlFor="camp-start">Start date *</Label>
              <Input id="camp-start" required type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className="mt-1.5" />
              <FieldError>{errors.start_date}</FieldError>
            </div>
            <div>
              <Label htmlFor="camp-end">End date *</Label>
              <Input id="camp-end" required type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} className="mt-1.5" />
              <FieldError>{errors.end_date}</FieldError>
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 pb-1.5 text-sm font-medium text-foreground">
                <Checkbox checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
                Activate immediately
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
