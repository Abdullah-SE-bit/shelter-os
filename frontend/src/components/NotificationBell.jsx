import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../../api/notificationsApi2.js';
import useApi from '../../hooks/useApi.js';
import { timeAgo } from '../../utils/dateUtils.js';

export default function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Fetch unread count
  const { data: countData, loading: countLoading, refetch: refetchCount } = useApi(() => notificationsApi.unreadCount());
  const unreadCount = countData?.count || 0;
  
  // Fetch recent notifications for dropdown
  const { data: notificationsData, loading: notificationsLoading, refetch: refetchNotifications } = useApi(
    () => notificationsApi.list()
  );
  const notifications = notificationsData?.slice(0, 5) || [];

  // Refresh notifications list when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      refetchNotifications();
      refetchCount();
    }
  }, [showDropdown, refetchNotifications, refetchCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh count periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchCount]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationsApi.markRead(notificationId);
      refetchNotifications();
      refetchCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      refetchNotifications();
      refetchCount();
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      RESCUE: '🚨',
      ADOPTION: '❤️',
      MEDICAL: '⚕️',
      VACCINATION: '💉',
      SYSTEM: '⚙️',
      MESSAGING: '💬',
      DONATION: '💰',
    };
    return icons[category] || '🔔';
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          fontSize: '1.25rem',
          color: 'var(--text-primary)',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = 'var(--cat-terra)'; }}
        onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'var(--cat-red)',
            color: 'white',
            borderRadius: '999px',
            fontSize: '0.625rem',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: '380px',
          maxHeight: '500px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cat-terra)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notificationsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--border-light)',
                    background: notif.is_read ? 'transparent' : 'rgba(255, 186, 153, 0.08)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(255, 186, 153, 0.08)'; 
                  }}
                  onClick={(e) => handleMarkAsRead(notif.id, e)}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                      {getCategoryIcon(notif.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: notif.is_read ? 600 : 700,
                        fontSize: '0.8125rem',
                        marginBottom: '0.25rem',
                        color: 'var(--text-primary)',
                      }}>
                        {notif.title}
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {notif.body}
                      </p>
                      <div style={{
                        fontSize: '0.6875rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.375rem',
                      }}>
                        {timeAgo(notif.sent_at)}
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--cat-terra)',
                        flexShrink: 0,
                        marginTop: '0.25rem',
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '0.75rem',
              borderTop: '1px solid var(--border-default)',
              textAlign: 'center',
            }}>
              <Link
                to="/notifications"
                onClick={() => setShowDropdown(false)}
                style={{
                  color: 'var(--cat-terra)',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'block',
                  padding: '0.25rem',
                }}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
