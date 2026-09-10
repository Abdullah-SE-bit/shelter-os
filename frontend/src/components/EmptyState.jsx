import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: { circle: 'size-14', icon: 'size-6', title: 'text-sm', msg: 'text-xs', pad: 'py-8' },
  md: { circle: 'size-20', icon: 'size-9', title: 'text-base', msg: 'text-sm', pad: 'py-12' },
  lg: { circle: 'size-24', icon: 'size-11', title: 'text-lg', msg: 'text-sm', pad: 'py-16' },
};

// `icon` accepts either a Lucide icon component or a legacy emoji string
// (older, not-yet-migrated pages still pass emoji) — both render fine.
export default function EmptyState({ icon, title, message, action, size = 'md' }) {
  const s = SIZES[size] || SIZES.md;
  // Lucide icons are forwardRef components (typeof "object"), not plain
  // functions — so anything non-string/non-null is treated as a component.
  const IconComponent = icon && typeof icon !== 'string' ? icon : null;

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 text-center', s.pad)}>
      <div className={cn('flex items-center justify-center rounded-full border border-dashed border-border bg-surface-muted text-muted-foreground', s.circle)}>
        {IconComponent ? (
          <IconComponent className={s.icon} strokeWidth={1.5} />
        ) : icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <Inbox className={s.icon} strokeWidth={1.5} />
        )}
      </div>
      <div>
        <h3 className={cn('font-semibold text-foreground', s.title)}>{title}</h3>
        {message && <p className={cn('mx-auto mt-1 max-w-[380px] leading-relaxed text-muted-foreground', s.msg)}>{message}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
