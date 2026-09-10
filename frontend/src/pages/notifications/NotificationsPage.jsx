import { useState } from 'react';
import { notificationsApi } from '../../api/notificationsApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { formatDate, timeAgo } from '../../utils/dateUtils';

export default function NotificationsPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const { data, loading, refetch } = useApi(() => notificationsApi.list());
  
  const notifications = data || [];
  
  // Filter by category
  const filteredNotifications = selectedCategory === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.category === selectedCategory);

  const unreadNotifications = filteredNotifications.filter(n => !n.is_read);
  const readNotifications = filteredNotifications.filter(n => n.is_read);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      refetch();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      refetch();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const categories = [
    { value: 'ALL', label: 'All', icon: '📋' },
    { value: 'RESCUE', label: 'Rescue', icon: '🚨' },
    { value: 'ADOPTION', label: 'Adoption', icon: '❤️' },
    { value: 'MEDICAL', label: 'Medical', icon: '⚕️' },
    { value: 'VACCINATION', label: 'Vaccination', icon: '💉' },
    { value: 'MESSAGING', label: 'Messages', icon: '💬' },
    { value: 'SYSTEM', label: 'System', icon: '⚙️' },
    { value: 'DONATION', label: 'Donations', icon: '💰' },
  ];

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '🔔';
  };

  const NotificationCard = ({ notification }) => (
    <div
      style={{
        background: notification.is_read ? 'var(--surface-card)' : 'rgba(255, 186, 153, 0.08)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '0.75rem',
        transition: 'all 0.2s',
        borderLeft: notification.is_read ? '1px solid var(--border-default)' : '4px solid var(--cat-terra)',
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
          {getCategoryIcon(notification.category)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h3 style={{
              margin: 0,
              fontSize: '0.9375rem',
              fontWeight: notification.is_read ? 600 : 700,
              color: 'var(--text-primary)',
            }}>
              {notification.title}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}>
                {timeAgo(notification.sent_at)}
              </span>
              {!notification.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--cat-terra)',
                    color: 'var(--cat-terra)',
                    borderRadius: '6px',
                    padding: '0.25rem 0.625rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
          <p style={{
            margin: '0 0 0.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            {notification.body}
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>
              <strong>Category:</strong> {notification.category}
            </span>
            <span>
              <strong>Type:</strong> {notification.type}
            </span>
            {notification.read_at && (
              <span>
                <strong>Read:</strong> {formatDate(notification.read_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ position: 'absolute', right: '2rem', bottom: '-0.5rem', fontSize: '6rem', opacity: 0.1 }}>🔔</div>
        <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '2rem', fontFamily: 'Playfair Display, serif' }}>
          Notifications
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9375rem' }}>
          Stay updated with important activities and alerts
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
      }}>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            style={{
              background: selectedCategory === cat.value ? 'var(--cat-terra)' : 'var(--surface-card)',
              color: selectedCategory === cat.value ? 'white' : 'var(--text-primary)',
              border: selectedCategory === cat.value ? 'none' : '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: '0.625rem 1.125rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <span>
            <strong>{unreadNotifications.length}</strong> unread
          </span>
          <span>
            <strong>{readNotifications.length}</strong> read
          </span>
          <span>
            <strong>{filteredNotifications.length}</strong> total
          </span>
        </div>
        {unreadNotifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary btn-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading notifications..." />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications"
          message={selectedCategory === 'ALL' 
            ? "You're all caught up! No notifications at the moment." 
            : `No ${categories.find(c => c.value === selectedCategory)?.label} notifications.`}
        />
      ) : (
        <>
          {/* Unread Section */}
          {unreadNotifications.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '1rem',
              }}>
                Unread ({unreadNotifications.length})
              </h2>
              {unreadNotifications.map(notif => (
                <NotificationCard key={notif.id} notification={notif} />
              ))}
            </div>
          )}

          {/* Read Section */}
          {readNotifications.length > 0 && (
            <div>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '1rem',
              }}>
                Read ({readNotifications.length})
              </h2>
              {readNotifications.map(notif => (
                <NotificationCard key={notif.id} notification={notif} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
