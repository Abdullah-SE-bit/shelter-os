'use client';

import { useState } from 'react';
import { HeartHandshake, RotateCw, Star, Building2, Frown, Pencil, Car, Home, Siren, Briefcase, Camera, HandHeart, Wrench } from 'lucide-react';
import { mockEmployees, mockShelterChangeRequests } from '@/lib/mock-data/users';
import { mockShelters } from '@/lib/mock-data/shelters';
import { useAuth } from '@/context/AuthContext';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/dateUtils';
import { initials } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const SKILL_ICONS = { Rescue: Siren, Transport: Car, 'Foster coordination': Home, 'Pet socialization': HandHeart, 'Dog walking': Briefcase, Photography: Camera, 'Adoption events': HeartHandshake };
const SKILLS = ['RESCUE', 'TRANSPORT', 'FOSTERING', 'FUNDRAISING', 'MEDICAL_ASSIST', 'EVENT_SUPPORT'];

function SkillPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-border-strong',
      )}
    >
      {children}
    </button>
  );
}

export default function EmployeeProfileView({ id }) {
  const { user } = useAuth();
  const isOwnProfile = !id;
  const baseVol = id ? mockEmployees.find((v) => v.id === id) : mockEmployees.find((v) => v.name === `${user?.profile?.first_name} ${user?.profile?.last_name}`) || mockEmployees[0];
  const isShelterAdmin = user?.role === 'SHELTER_ADMIN';

  const [changeOpen, setChangeOpen] = useState(false);
  const [toShelter, setToShelter] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [changeMsg, setChangeMsg] = useState('');
  const [pending, setPending] = useState(isOwnProfile ? mockShelterChangeRequests[0] : null);

  const [overrides, setOverrides] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const submitChange = () => {
    if (!toShelter) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setChangeMsg('Request submitted. A shelter admin will review it.');
      setPending({ id: 'new', status: 'PENDING' });
      setTimeout(() => setChangeOpen(false), 1000);
    }, 350);
  };

  if (!baseVol) return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <Frown className="size-12 text-muted-foreground" />
      <h2 className="font-display text-xl font-bold text-foreground">Employee not found</h2>
    </div>
  );

  const vol = { ...baseVol, ...overrides };

  const openEdit = () => {
    setEditErrors({});
    setEditForm({ name: vol.name, email: vol.email, phone: vol.phone, service_radius_km: vol.service_radius_km, skills: vol.skills || [], new_password: '' });
    setEditOpen(true);
  };

  const toggleEditSkill = (skill) => {
    setEditForm((f) => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill] }));
  };

  const submitEdit = () => {
    const errs = {};
    if (!editForm.name.trim()) errs.name = 'Name is required.';
    if (editForm.phone && !isValidPkMobile(editForm.phone)) errs.phone = 'Enter a valid Pakistani mobile number.';
    if (editForm.new_password && editForm.new_password.length < 8) errs.new_password = 'Password must be at least 8 characters.';
    if (Object.keys(errs).length) { setEditErrors(errs); return; }

    setEditSaving(true);
    setTimeout(() => {
      setOverrides((o) => ({ ...o, name: editForm.name, email: editForm.email, phone: editForm.phone, service_radius_km: editForm.service_radius_km, skills: editForm.skills }));
      setEditSaving(false);
      setEditOpen(false);
    }, 350);
  };

  const [first, ...rest] = vol.name.split(' ');
  const last = rest.join(' ');
  const stats = [
    { icon: HeartHandshake, label: 'Active', value: vol.active_assignments || 0 },
    { icon: RotateCw, label: 'Radius', value: `${vol.service_radius_km} km` },
    { icon: Star, label: 'Status', value: vol.is_approved ? 'Approved' : 'Pending' },
  ];

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <div className="relative mb-6 overflow-hidden rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, var(--brand-ink), var(--brand-teal))' }}>
        <div className="relative mx-auto mb-4 flex size-[88px] items-center justify-center overflow-hidden rounded-full border-4 border-white/25 bg-white/15 text-2xl font-bold text-white">
          {initials(first, last)}
          {vol.is_approved && <div className="absolute right-1 bottom-1 z-10 size-4 rounded-full border-2 border-white bg-success" title="Approved" />}
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{vol.name}</h1>
        <p className="mt-0.5 mb-3 text-sm text-white/70">{vol.availability}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className={`rounded-full border px-4 py-1 text-[13px] font-semibold ${vol.is_approved ? 'border-success/50 bg-success/25 text-white' : 'border-white/15 bg-white/10 text-white/70'}`}>
            {vol.is_approved ? 'Approved' : 'Pending approval'}
          </div>
          {isShelterAdmin && !isOwnProfile && (
            <Button size="sm" variant="secondary" onClick={openEdit}>
              <Pencil className="size-3.5" />
              Edit details
            </Button>
          )}
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
            pending
              ? <span className="rounded-full bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">Change requested — pending</span>
              : <Button size="sm" variant="secondary" onClick={() => { setChangeOpen(true); setChangeMsg(''); }}>Request shelter change</Button>
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
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-highlight-mint/20 px-3.5 py-1.5 text-sm font-semibold text-primary">
                  <Icon className="size-3.5" />
                  {s}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Details</h3>
        <div className="flex flex-col gap-2.5 text-sm">
          {[
            { label: 'Member since', value: formatDate(vol.joined_at) },
            { label: 'Email', value: vol.email },
            { label: 'Phone', value: vol.phone },
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
        {changeMsg && <div className="mb-4 text-sm font-medium text-success">{changeMsg}</div>}
        <p className="mt-0 mb-4 text-sm text-muted-foreground">Your request must be approved by the target shelter's admin before it takes effect.</p>
        <div className="mb-3.5">
          <Label>Move to shelter *</Label>
          <NativeSelect value={toShelter} onChange={(e) => setToShelter(e.target.value)} className="mt-1.5">
            <option value="">Select a shelter…</option>
            {mockShelters.filter((s) => s.id !== vol.shelter_id).map((s) => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
          </NativeSelect>
        </div>
        <div>
          <Label>Reason (optional)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Why do you want to change shelters?" className="mt-1.5" />
        </div>
      </Modal>

      {isShelterAdmin && editForm && (
        <Modal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit employee"
          footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={submitEdit} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save changes'}</Button></>}
        >
          <div className="flex flex-col gap-3.5">
            <div>
              <Label htmlFor="emp-edit-name">Name</Label>
              <Input id="emp-edit-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5" aria-invalid={!!editErrors.name} />
              {editErrors.name && <p className="mt-1 text-xs font-medium text-destructive">{editErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="emp-edit-email">Email</Label>
              <Input id="emp-edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Phone</Label>
              <div className="mt-1.5"><PhoneInput value={editForm.phone} onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))} error={editErrors.phone} /></div>
              {editErrors.phone && <p className="mt-1 text-xs font-medium text-destructive">{editErrors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="emp-edit-radius">Service radius (km)</Label>
              <Input id="emp-edit-radius" type="number" min="1" max="200" value={editForm.service_radius_km} onChange={(e) => setEditForm((f) => ({ ...f, service_radius_km: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Skills</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SKILLS.map((skill) => {
                  const label = skill.replace(/_/g, ' ');
                  return <SkillPill key={skill} active={editForm.skills.includes(label)} onClick={() => toggleEditSkill(label)}>{label}</SkillPill>;
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="emp-edit-password">Reset password (optional)</Label>
              <Input id="emp-edit-password" type="password" value={editForm.new_password} onChange={(e) => setEditForm((f) => ({ ...f, new_password: e.target.value }))} placeholder="Leave blank to keep current password" className="mt-1.5" aria-invalid={!!editErrors.new_password} />
              {editErrors.new_password && <p className="mt-1 text-xs font-medium text-destructive">{editErrors.new_password}</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
