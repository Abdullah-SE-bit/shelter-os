import { useState } from 'react';
import { Bell, ClipboardList, Siren, Heart, Stethoscope, Syringe, MessageSquare, Settings, Gift } from 'lucide-react';
import { notificationsApi } from '@/api/notificationsApi';
import useApi from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { formatDate, timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'ALL', label: 'All', icon: ClipboardList },
  { value: 'RESCUE', label: 'Rescue', icon: Siren },
  { value: 'ADOPTION', label: 'Adoption', icon: Heart },
  { value: 'MEDICAL', label: 'Medical', icon: Stethoscope },
  { value: 'VACCINATION', label: 'Vaccination', icon: Syringe },
  { value: 'MESSAGING', label: 'Messages', icon: MessageSquare },
  { value: 'SYSTEM', label: 'System', icon: Settings },
  { value: 'DONATION', label: 'Donations', icon: Gift },
];

export default function NotificationsPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const { data, loading, refetch } = useApi(() => notificationsApi.list());

  const notifications = data || [];
  const filteredNotifications = selectedCategory === 'ALL' ? notifications : notifications.filter((n) => n.category === selectedCategory);
  const unreadNotifications = filteredNotifications.filter((n) => !n.is_read);
  const readNotifications = filteredNotifications.filter((n) => n.is_read);

  const handleMarkAsRead = async (id) => {
    try { await notificationsApi.markRead(id); refetch(); } catch (error) { console.error('Failed to mark as read:', error); }
  };
  const handleMarkAllRead = async () => {
    try { await notificationsApi.markAllRead(); refetch(); } catch (error) { console.error('Failed to mark all as read:', error); }
  };

  const getCategoryIcon = (category) => CATEGORIES.find((c) => c.value === category)?.icon || Bell;

  const NotificationCard = ({ notification }) => {
    const Icon = getCategoryIcon(notification.category);
    return (
      <div className={cn('mb-3 flex gap-4 rounded-xl border border-border bg-card p-5', !notification.is_read && 'border-l-4 border-l-primary bg-primary/5')}>
        <Icon className="size-6 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <h3 className={cn('text-[15px] text-foreground', notification.is_read ? 'font-semibold' : 'font-bold')}>{notification.title}</h3>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs whitespace-nowrap text-muted-foreground">{timeAgo(notification.sent_at)}</span>
              {!notification.is_read && <Button size="xs" variant="outline" onClick={() => handleMarkAsRead(notification.id)}>Mark read</Button>}
            </div>
          </div>
          <p className="mb-2 text-sm leading-relaxed text-muted-foreground">{notification.body}</p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span><strong className="font-semibold text-foreground">Category:</strong> {notification.category}</span>
            <span><strong className="font-semibold text-foreground">Type:</strong> {notification.type}</span>
            {notification.read_at && <span><strong className="font-semibold text-foreground">Read:</strong> {formatDate(notification.read_at)}</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--brand-rust)] to-[var(--brand-ink)] px-6 py-6 text-white sm:px-8">
        <Bell className="pointer-events-none absolute right-4 -bottom-2 size-20 opacity-10" />
        <h1 className="font-display text-[26px] font-bold">Notifications</h1>
        <p className="mt-1 text-sm opacity-80">Stay updated with important activities and alerts</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button key={cat.value} onClick={() => setSelectedCategory(cat.value)}
            className={cn('flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors', selectedCategory === cat.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}>
            <cat.icon className="size-3.5" />{cat.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-5 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{unreadNotifications.length}</strong> unread</span>
          <span><strong className="text-foreground">{readNotifications.length}</strong> read</span>
          <span><strong className="text-foreground">{filteredNotifications.length}</strong> total</span>
        </div>
        {unreadNotifications.length > 0 && <Button size="sm" variant="secondary" onClick={handleMarkAllRead}>Mark all as read</Button>}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading notifications…" />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message={selectedCategory === 'ALL' ? "You're all caught up! No notifications at the moment." : `No ${CATEGORIES.find((c) => c.value === selectedCategory)?.label} notifications.`} />
      ) : (
        <>
          {unreadNotifications.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">Unread ({unreadNotifications.length})</h2>
              {unreadNotifications.map((notif) => <NotificationCard key={notif.id} notification={notif} />)}
            </div>
          )}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">Read ({readNotifications.length})</h2>
              {readNotifications.map((notif) => <NotificationCard key={notif.id} notification={notif} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
