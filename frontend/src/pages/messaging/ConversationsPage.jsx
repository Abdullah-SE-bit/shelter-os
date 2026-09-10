import { useState } from 'react';
import { Link } from 'react-router-dom';
import { messagingApi } from '../../api/messagingApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { timeAgo } from '../../utils/dateUtils';
import { initials, truncate } from '../../utils/formatters';

export default function ConversationsPage() {
  const { user } = useAuth();
  const { data, loading } = useApi(() => messagingApi.listConversations());
  const conversations = data?.results || data || [];

  return (
    <div className="page-container-sm">
      <PageHeader title="💬 Messages" subtitle={`${conversations.length} conversations`} />

      {loading && <LoadingSpinner text="Loading conversations…" />}

      {!loading && conversations.length === 0 && (
        <EmptyState
          icon="💬"
          title="No messages yet"
          message="Your conversations with shelter staff, adopters, and volunteers will appear here."
        />
      )}

      {!loading && conversations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {conversations.map(conv => {
            const other = conv.participants?.find(p => p.user !== user?.id);
            const hasUnread = conv.unread_count > 0;
            return (
              <Link key={conv.id} to={`/messages/${conv.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: hasUnread ? 'rgba(201,123,84,0.06)' : 'var(--surface-card)',
                  border: `1px solid ${hasUnread ? 'rgba(201,123,84,0.25)' : 'var(--border-default)'}`,
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  gap: '0.875rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s',
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cat-terra)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = hasUnread ? 'rgba(201,123,84,0.25)' : 'var(--border-default)'; e.currentTarget.style.transform = 'none'; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '1rem',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    {initials(other?.first_name, other?.last_name) || '?'}
                    {hasUnread && (
                      <div style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'var(--cat-terra)',
                        border: '2px solid var(--cat-cream)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        color: 'white',
                        fontWeight: 900,
                      }}>
                        {conv.unread_count}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: hasUnread ? 800 : 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {other ? `${other.first_name} ${other.last_name}` : 'Conversation'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {timeAgo(conv.last_message_at || conv.created_at)}
                      </span>
                    </div>
                    {conv.subject && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--cat-terra)', fontWeight: 700, marginBottom: '0.15rem' }}>
                        {conv.subject}
                      </div>
                    )}
                    {conv.last_message && (
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: hasUnread ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: hasUnread ? 600 : 400 }}>
                        {truncate(conv.last_message, 70)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}