import Link from 'next/link';
import { cn } from '@/lib/utils';

const TONES = {
  primary: 'text-primary bg-highlight-mint/20',
  info: 'text-info bg-info/10',
  destructive: 'text-destructive bg-destructive/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
};

export default function StatCard({ icon: Icon, value, label, to, tone = 'primary' }) {
  const content = (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-border-strong">
      <div className={cn('mb-3 inline-flex size-9 items-center justify-center rounded-lg', TONES[tone])}>
        <Icon className="size-[18px]" strokeWidth={2} />
      </div>
      <div className="text-[28px] leading-none font-bold text-foreground">{value}</div>
      <div className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );

  if (!to) return content;
  return (
    <Link href={to} className="block">
      {content}
    </Link>
  );
}
