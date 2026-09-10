import { PawPrint } from 'lucide-react';

export default function GreetingBanner({ name, title, subtitle }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      className="relative mb-6 overflow-hidden rounded-xl border border-border px-6 py-7 sm:px-8"
      style={{ background: 'linear-gradient(135deg, var(--brand-rust), var(--brand-ink))' }}
    >
      <PawPrint className="pointer-events-none absolute -right-4 -bottom-6 size-32 text-white/10" strokeWidth={1.5} />
      <p className="text-sm font-medium text-white/70">
        {greeting}
        {name ? `, ${name}` : ''}
      </p>
      <h1 className="mt-1 font-display text-[26px] font-bold text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
    </div>
  );
}
