'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, User, Bell, Mail, Smartphone, MessageSquareText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/patterns/PageHeader';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import { initials } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const NOTIF_PREFS = [
  { key: 'notification_email', Icon: Mail, label: 'Email notifications', desc: 'Receive updates via email' },
  { key: 'notification_push', Icon: Smartphone, label: 'Push notifications', desc: 'Alerts in the browser / app' },
  { key: 'notification_sms', Icon: MessageSquareText, label: 'SMS notifications', desc: 'Text alerts to your phone' },
];

export default function EditProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const p = user?.profile || {};

  const [form, setForm] = useState({
    first_name: p.first_name || '', last_name: p.last_name || '', email: user?.email || '', phone: p.phone || '', bio: p.bio || '', date_of_birth: p.date_of_birth || '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(p.profile_photo_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.phone && !isValidPkMobile(form.phone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the phone blank.');
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    setTimeout(() => {
      updateProfile({
        first_name: form.first_name, last_name: form.last_name, phone: form.phone,
        bio: form.bio, date_of_birth: form.date_of_birth, profile_photo_url: preview || p.profile_photo_url,
      });
      setLoading(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => router.push('/profile'), 1000);
    }, 350);
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title="Edit profile" backTo="/profile" backLabel="Profile" />

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
      {success && <div className="mb-5 rounded-lg border border-success/25 bg-success/10 px-5 py-3.5 text-sm font-bold text-success">{success}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="relative mb-4 inline-block">
              <div className="mx-auto flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-surface-muted bg-gradient-to-br from-[var(--brand-rust)] to-[var(--brand-ink)] text-3xl font-black text-white">
                {preview ? <img src={preview} alt="" className="size-full object-cover" /> : initials(form.first_name, form.last_name) || <User className="size-8" />}
              </div>
              <label htmlFor="photo-upload" className="absolute -right-0.5 -bottom-0.5 flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                <Camera className="size-4" />
              </label>
              <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <p className="text-[13px] font-semibold text-muted-foreground">Click the camera icon to change your photo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="size-4" />Personal information</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name</Label><Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className="mt-1.5" /></div>
              <div><Label>Last name</Label><Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className="mt-1.5" /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} disabled title="Email cannot be changed here" className="mt-1.5 opacity-70" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><div className="mt-1.5"><PhoneInput value={form.phone} onChange={(v) => set('phone', v)} /></div></div>
              <div><Label>Date of birth</Label><Input type="date" value={form.date_of_birth || ''} onChange={(e) => set('date_of_birth', e.target.value)} max={new Date().toISOString().split('T')[0]} className="mt-1.5" /></div>
            </div>
            <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={3} placeholder="Tell us a bit about yourself and your love for animals…" className="mt-1.5" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="size-4" />Notification preferences</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {NOTIF_PREFS.map(({ key, Icon, label, desc }) => (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-surface-muted px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-bold text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </div>
                <Switch checked={!!form[key]} onCheckedChange={(v) => set(key, v)} />
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="h-11 flex-1" onClick={() => router.push('/profile')}>Cancel</Button>
          <Button type="submit" disabled={loading} className="h-11 flex-[2] text-base">{loading ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>
    </div>
  );
}
