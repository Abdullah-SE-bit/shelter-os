'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Search, Plus, Link2, Camera, MapPin } from 'lucide-react';
import { mockFoundReports, mockLostAlerts } from '@/lib/mock-data/lostFound';
import { mockBreeds } from '@/lib/mock-data/cats';
import usePagination from '@/hooks/usePagination';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import { timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const CAT_PLACEHOLDER = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80';
const STATUS_TONE = { OPEN: 'bg-success text-white', MATCHED: 'bg-warning text-warning-foreground', REUNITED: 'bg-success text-white', SHELTERED: 'bg-info text-white', CLOSED: 'bg-surface-muted text-muted-foreground' };
const BREED_DONT_KNOW = '__DONT_KNOW__';
const EMPTY_FORM = { description: '', breed_choice: '', breed_describe: '', color: '', found_latitude: '', found_longitude: '', contact_phone: '', contact_email: '', is_lost_cat: false, possible_lost_alert: '' };

export default function FoundReportsPage() {
  const router = useRouter();
  const { page, pageSize, nextPage, prevPage, goTo, reset } = usePagination(12);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const filtered = mockFoundReports.filter((r) => (statusFilter === 'ALL' || r.status === statusFilter) && (!search || r.description.toLowerCase().includes(search.toLowerCase())));
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const reports = filtered.slice((page - 1) * pageSize, page * pageSize);
  const lostOptions = mockLostAlerts.filter((a) => a.status === 'ACTIVE');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { set('found_latitude', String(pos.coords.latitude)); set('found_longitude', String(pos.coords.longitude)); setLocating(false); },
      () => setLocating(false),
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (form.contact_phone && !isValidPkMobile(form.contact_phone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the phone blank.');
      return;
    }
    setSaving(true); setError('');
    setTimeout(() => { setSaving(false); setAddOpen(false); router.push('/lost-found/found'); }, 400);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-xl bg-gradient-to-br from-success to-[#4A8A42] px-6 py-6 text-white sm:px-8">
        <ClipboardList className="pointer-events-none absolute right-4 -bottom-2 size-20 opacity-10" />
        <div>
          <h1 className="font-display text-[26px] font-bold">Found animal reports</h1>
          <p className="mt-1 text-sm opacity-85">Found an animal? Report it — we'll compare it with lost reports, or a shelter can take it in.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-white/30 bg-white/18 text-white hover:bg-white/28 hover:text-white" asChild><Link href="/lost-found"><Search className="size-4" />Lost animals</Link></Button>
          <Button variant="secondary" onClick={() => setAddOpen(true)}><Plus className="size-4" />Report found animal</Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card p-3.5">
        <Input type="search" value={search} onChange={(e) => { setSearch(e.target.value); reset(); }} placeholder="Search by description or breed…" className="min-w-[200px] flex-1" />
        <NativeSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); reset(); }} className="w-auto">
          <option value="OPEN">Open</option>
          <option value="MATCHED">Matched</option>
          <option value="REUNITED">Reunited</option>
          <option value="SHELTERED">Sheltered</option>
          <option value="ALL">All</option>
        </NativeSelect>
      </div>

      {reports.length === 0 && (
        <EmptyState icon={ClipboardList} title="No found animal reports" message="No one has reported a found animal here yet. If you find one, report it!"
          action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" />Report found animal</Button>} />
      )}

      {reports.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((rep) => (
            <Link key={rep.id} href={`/lost-found/found/${rep.id}`} className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative h-[160px] overflow-hidden bg-surface-muted">
                <img src={(rep.photos && rep.photos[0]) || CAT_PLACEHOLDER} alt="Found animal" className="size-full object-cover" onError={(e) => { e.currentTarget.src = CAT_PLACEHOLDER; }} />
                <span className={cn('absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold', STATUS_TONE[rep.status] || STATUS_TONE.OPEN)}>{rep.status}</span>
                {rep.match_count > 0 && <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[11px] font-bold text-warning-foreground"><Link2 className="size-3" />{rep.match_count} match{rep.match_count > 1 ? 'es' : ''}</span>}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{rep.description?.slice(0, 90)}{rep.description?.length > 90 ? '…' : ''}</p>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  {rep.breed_guess && <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold">{rep.breed_guess}</span>}
                  {(rep.color_tags || []).slice(0, 1).map((c) => <span key={c} className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold">{c}</span>)}
                </div>
                <div className="text-xs text-muted-foreground">Reported {timeAgo(rep.created_at)}{rep.reporter_name ? ` by ${rep.reporter_name}` : ''}</div>
                <span className="mt-auto pt-1 text-[13px] font-bold text-primary">View &amp; compare →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPrev={prevPage} onNext={nextPage} onGoTo={goTo} />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Report a found animal" size="md"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button form="found-form" type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit & compare'}</Button></>}
      >
        {error && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
        <form id="found-form" onSubmit={handleSave} className="flex flex-col gap-3.5">
          <div><Label>Description *</Label><Textarea required value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Appearance, markings, behavior, where you found it…" className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Breed (guess)</Label>
              <NativeSelect value={form.breed_choice} onChange={(e) => set('breed_choice', e.target.value)} className="mt-1.5">
                <option value="">Select breed</option>
                {mockBreeds.map((breed) => <option key={breed.id} value={breed.display_label}>{breed.display_label}</option>)}
                <option value={BREED_DONT_KNOW}>Don't know</option>
              </NativeSelect>
            </div>
            <div><Label>Color</Label><Input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="e.g. orange tabby" className="mt-1.5" /></div>
          </div>

          {form.breed_choice === BREED_DONT_KNOW && (
            <div>
              <Label>Describe the breed / appearance</Label>
              <Input value={form.breed_describe} onChange={(e) => set('breed_describe', e.target.value)} placeholder="e.g. long grey fur, flat face, medium size" className="mt-1.5" />
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Where did you find it?</Label>
              <Button type="button" size="sm" variant="secondary" onClick={getLocation} disabled={locating}><MapPin className="size-3.5" />{locating ? 'Getting…' : 'Use my location'}</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input value={form.found_latitude} onChange={(e) => set('found_latitude', e.target.value)} placeholder="Latitude" type="number" step="any" />
              <Input value={form.found_longitude} onChange={(e) => set('found_longitude', e.target.value)} placeholder="Longitude" type="number" step="any" />
            </div>
          </div>

          <div className="rounded-lg bg-surface-muted p-3.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-foreground">
              <Checkbox checked={form.is_lost_cat} onCheckedChange={(v) => set('is_lost_cat', !!v)} />
              I think this might be someone's lost pet
            </label>
            {form.is_lost_cat && (
              <div className="mt-2.5">
                <Label>Match it to a lost report (optional)</Label>
                <NativeSelect value={form.possible_lost_alert} onChange={(e) => set('possible_lost_alert', e.target.value)} className="mt-1.5">
                  <option value="">Let the system find matches automatically</option>
                  {lostOptions.map((a) => <option key={a.id} value={a.id}>{a.title}{a.cat_name ? ` — ${a.cat_name}` : ''}</option>)}
                </NativeSelect>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Your phone</Label><div className="mt-1.5"><PhoneInput value={form.contact_phone} onChange={(v) => set('contact_phone', v)} /></div></div>
            <div><Label>Your email</Label><Input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} className="mt-1.5" /></div>
          </div>

          <div>
            <Label>Photos</Label>
            <label className="mt-1.5 flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-sm font-semibold text-muted-foreground">
              <Camera className="size-6" strokeWidth={1.5} />
              {photos.length > 0 ? `${photos.length} photo(s)` : 'Upload photos'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setPhotos(Array.from(e.target.files))} />
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
