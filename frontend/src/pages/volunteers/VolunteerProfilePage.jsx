import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HeartHandshake, RotateCw, Star, Building2, Frown, Stethoscope, Car, Home, Siren, Briefcase, Camera, HandHeart, Wrench } from 'lucide-react';
import { volunteerApi } from '@/api/volunteersApi';
import { sheltersApi } from '@/api/sheltersApi';
import useApi from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/dateUtils';
import { initials } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';

const SKILL_ICONS = { MEDICAL: Stethoscope, TRANSPORT: Car, SOCIALIZING: HandHeart, FOSTERING: Home, RESCUE: Siren, ADMIN: Briefcase, PHOTOGRAPHY: Camera };

export default function VolunteerProfilePage() {
  const { id } = useParams();
  const isOwnProfile = !id;
  const { data, loading } = useApi(() => (id ? volunteerApi.getProfile(id) : volunteerApi.getMyProfile()), null, [id]);
  const vol = data?.data || data;

  const [changeOpen, setChangeOpen] = useState(false);
  const [shelters, setShelters] = useState([]);
  const [toShelter, setToShelter] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeMsg, setChangeMsg] = useState('');
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    if (isOwnProfile && changeOpen && shelters.length === 0) {
      sheltersApi.list().then((res) => {
        const list = res.data?.data?.results || res.data?.data || res.data?.results || res.data || [];
        setShelters(Array.isArray(list) ? list : []);
      }).catch(() => {});
    }
  }, [isOwnProfile, changeOpen, shelters.length]);

  useEffect(() => {
    if (isOwnProfile) {
      volunteerApi.myShelterChangeRequests().then((res) => setMyRequests(res.data?.data || [])).catch(() => {});
    }
  }, [isOwnProfile, data]);

  const submitChange = async () => {
    if (!toShelter) { setChangeError('Please select a shelter.'); return; }
    setSaving(true); setChangeError(''); setChangeMsg('');
    try {
      await volunteerApi.requestShelterChange({ to_shelter: toShelter, reason });
      setChangeMsg('Request submitted. A shelter admin will review it.');
      setToShelter(''); setReason('');
      volunteerApi.myShelterChangeRequests().then((res) => setMyRequests(res.data?.data || [])).catch(() => {});
      setTimeout(() => setChangeOpen(false), 1200);
    } catch (err) {
      setChangeError(err.response?.data?.error?.message || 'Failed to submit request.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><LoadingSpinner size="lg" text="Loading volunteer profile…" /></div>;
  if (!vol) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Volunteer not found</h2>
    </div>
  );

  const pendingRequest = myRequests.find((r) => r.status === 'PENDING');
  const stats = [
    { icon: HeartHandshake, label: 'Completed', value: vol.completed_assignments || 0 },
    { icon: RotateCw, label: 'Active', value: vol.active_assignments || 0 },
    { icon: Star, label: 'Rating', value: vol.avg_rating ? `${Number(vol.avg_rating).toFixed(1)}/5` : '—' },
  ];

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <div className="relative mb-6 overflow-hidden rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, var(--brand-ink), var(--brand-rust))' }}>
        <div className="relative mx-auto mb-4 flex size-[88px] items-center justify-center overflow-hidden rounded-full border-4 border-white/25 bg-white/15 text-2xl font-bold text-white">
          {vol.profile_photo ? <img src={vol.profile_photo} alt="" className="size-full object-cover" /> : initials(vol.first_name, vol.last_name)}
          {vol.is_online && <div className="absolute right-1 bottom-1 z-10 size-4 rounded-full border-2 border-white bg-success" title="Online now" />}
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{vol.first_name} {vol.last_name}</h1>
        {vol.city && <p className="mt-0.5 mb-3 text-sm text-white/70">{vol.city}</p>}
        <div className={`inline-block rounded-full border px-4 py-1 text-[13px] font-semibold ${vol.is_online ? 'border-success/50 bg-success/25 text-white' : 'border-white/15 bg-white/10 text-white/70'}`}>
          {vol.is_online ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <s.icon className="mx-auto mb-1.5 size-4 text-primary" />
            <div className="text-2xl leading-none font-bold text-foreground">{s.value}</div>
            <div className="mt-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Shelter</h3>
            <div className="flex items-center gap-1.5 font-semibold text-foreground"><Building2 className="size-4" />{vol.shelter_name || 'Not assigned'}</div>
          </div>
          {isOwnProfile && (
            pendingRequest
              ? <span className="rounded-full bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">Change requested — pending</span>
              : <Button size="sm" variant="secondary" onClick={() => { setChangeOpen(true); setChangeError(''); setChangeMsg(''); }}>Request shelter change</Button>
          )}
        </div>
      </div>

      {vol.skills && vol.skills.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {vol.skills.map((s) => {
              const Icon = SKILL_ICONS[s] || Wrench;
              return (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary">
                  <Icon className="size-3.5" />
                  {s}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {vol.bio && (
        <div className="mb-4 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">About</h3>
          <p className="text-[15px] leading-relaxed text-muted-foreground">{vol.bio}</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Details</h3>
        <div className="flex flex-col gap-2.5 text-sm">
          {[
            { label: 'Member since', value: formatDate(vol.joined_at) },
            { label: 'Max cats (foster)', value: vol.max_foster_cats ?? '—' },
            { label: 'Emergency contact', value: vol.emergency_contact_name || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between border-b border-border pb-2 last:border-0">
              <span className="font-medium text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        title="Request shelter change"
        footer={<><Button variant="secondary" onClick={() => setChangeOpen(false)}>Cancel</Button><Button onClick={submitChange} disabled={saving}>{saving ? 'Submitting…' : 'Submit request'}</Button></>}
      >
        {changeError && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{changeError}</div>}
        {changeMsg && <div className="mb-4 text-sm font-medium text-success">{changeMsg}</div>}
        <p className="mt-0 mb-4 text-sm text-muted-foreground">Your request must be approved by the target shelter's admin before it takes effect.</p>
        <div className="mb-3.5">
          <Label>Move to shelter *</Label>
          <NativeSelect value={toShelter} onChange={(e) => setToShelter(e.target.value)} className="mt-1.5">
            <option value="">Select a shelter…</option>
            {shelters.filter((s) => String(s.id) !== String(vol.shelter)).map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}</option>)}
          </NativeSelect>
        </div>
        <div>
          <Label>Reason (optional)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Why do you want to change shelters?" className="mt-1.5" />
        </div>
      </Modal>
    </div>
  );
}
