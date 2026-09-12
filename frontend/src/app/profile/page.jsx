'use client';

import Link from 'next/link';
import { PawPrint, Crown, Home, HeartHandshake, Heart, User, Shield, CheckCircle2, XCircle, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/patterns/PageHeader';
import { formatDate } from '@/utils/dateUtils';
import { initials } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ROLE_META = {
  SUPER_ADMIN: { icon: Crown, label: 'Super Admin' },
  SHELTER_ADMIN: { icon: Home, label: 'Shelter Admin' },
  EMPLOYEE: { icon: HeartHandshake, label: 'Employee' },
  CUSTOMER: { icon: Heart, label: 'Customer' },
};

function InfoBlock({ label, value }) {
  return (
    <div>
      <div className="mb-0.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="text-[15px] font-semibold text-foreground">{value || '—'}</div>
    </div>
  );
}

const QUICK_LINKS = [
  { to: '/adoption/my-applications', Icon: Heart, label: 'My applications' },
  { to: '/pets', Icon: PawPrint, label: 'My pets' },
  { to: '/messages', Icon: MessageSquare, label: 'Messages' },
  { to: '/notifications', Icon: Bell, label: 'Notifications' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const p = user?.profile || {};
  const roleMeta = ROLE_META[user?.role] || { icon: User, label: user?.role };
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <PageHeader title="My profile" actions={<Button asChild><Link href="/profile/edit">Edit profile</Link></Button>} />

      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative h-[120px] bg-gradient-to-br from-[var(--brand-teal)] via-[var(--brand-ink)] to-[var(--brand-amber)]">
          <HeartHandshake className="pointer-events-none absolute right-6 -bottom-4 size-20 text-white opacity-15" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="-mt-11 mb-4 flex size-[88px] items-center justify-center rounded-full border-4 border-card bg-gradient-to-br from-[var(--brand-teal)] to-[var(--brand-ink)] text-3xl font-black text-white shadow-md">
            {p.profile_photo_url ? <img src={p.profile_photo_url} alt="avatar" className="size-full rounded-full object-cover" /> : initials(p.first_name, p.last_name)}
          </div>
          <h2 className="mb-1.5 text-2xl font-black text-foreground">{p.first_name} {p.last_name}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-highlight-mint/20 px-3 py-1 text-[13px] font-bold text-primary"><roleMeta.icon className="size-3.5" />{roleMeta.label}</span>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {[
          { title: 'Personal info', Icon: User, fields: [{ label: 'First name', value: p.first_name }, { label: 'Last name', value: p.last_name }, { label: 'Phone', value: p.phone }, { label: 'Date of birth', value: p.date_of_birth ? formatDate(p.date_of_birth) : null }] },
          { title: 'Account info', Icon: Shield, fields: [{ label: 'Email', value: user?.email }, { label: 'Role', value: roleMeta.label }, { label: 'Email verified', value: user?.is_email_verified ? 'Yes' : 'No', icon: user?.is_email_verified ? CheckCircle2 : XCircle }, { label: 'Member since', value: memberSince }] },
        ].map(({ title, Icon, fields }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase"><Icon className="size-3.5" />{title}</h3>
            <div className="flex flex-col gap-3.5">{fields.filter((f) => f.value).map((f) => <InfoBlock key={f.label} label={f.label} value={f.value} />)}</div>
          </div>
        ))}
      </div>

      {p.bio && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase"><HeartHandshake className="size-3.5" />Bio</h3>
          <p className="leading-relaxed text-muted-foreground">{p.bio}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_LINKS.map(({ to, Icon, label }) => (
          <Link key={to} href={to} className={cn('rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary')}>
            <Icon className="mx-auto mb-1.5 size-6 text-muted-foreground" />
            <div className="text-[13px] font-bold text-foreground">{label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
