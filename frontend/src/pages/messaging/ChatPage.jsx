import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { messagingApi } from '../../api/messagingApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import { timeAgo } from '../../utils/dateUtils';
import { initials } from '../../utils/formatters';

export default function ChatPage() {
  const { id }         = useParams();
  const { user }       = useAuth();
  const bottomRef      = useRef(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);

  const { data: conv, loading } = useApi(() => messagingApi.getConversation(id), null, [id]);

  useEffect(() => {
    if (!id) return;
    messagingApi.getMessages(id)
      .then(r => setMessages(r.data?.data || r.data?.results || r.data || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const { data } = await messagingApi.sendMessage(id, { body: message });
      setMessages(ms => [...ms, data?.data || data]);
      setMessage('');
    } catch {}
    setSending(false);
  };

  const otherPerson = conv?.participants?.find(p => p.user !== user?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
      }}>
        <Link to="/messages" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1.25rem', lineHeight: 1 }}>←</Link>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: '0.9rem',
          flexShrink: 0,
        }}>
          {initials(otherPerson?.first_name, otherPerson?.last_name) || '?'}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            {otherPerson ? `${otherPerson.first_name} ${otherPerson.last_name}` : 'Conversation'}
          </div>
          {conv?.subject && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{conv.subject}</div>}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--cat-cream)' }}>
        {loading && <LoadingSpinner text="Loading messages…" />}

        {messages.map(msg => {
          const isMe = msg.sender === user?.id;
          return (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: isMe ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '70%',
                background: isMe
                  ? 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))'
                  : 'var(--surface-card)',
                color: isMe ? 'white' : 'var(--text-primary)',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '0.75rem 1rem',
                boxShadow: 'var(--shadow-sm)',
                border: isMe ? 'none' : '1px solid var(--border-default)',
              }}>
                <p style={{ margin: '0 0 0.25rem', lineHeight: 1.5, fontSize: '0.9375rem' }}>{msg.body}</p>
                <div style={{ fontSize: '0.7rem', opacity: 0.7, textAlign: 'right' }}>
                  {timeAgo(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💬</div>
            <p style={{ fontWeight: 600 }}>No messages yet. Say hello! 🐾</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        padding: '1rem 1.5rem',
        background: 'var(--surface-card)',
        borderTop: '1px solid var(--border-default)',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
      }}>
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="input-base"
          placeholder="Type a message…"
          style={{ flex: 1, borderRadius: '999px' }}
          id="chat-input"
          autoComplete="off"
        />
        <button type="submit" disabled={sending || !message.trim()} className="btn btn-primary" style={{ borderRadius: '50%', width: '44px', height: '44px', padding: 0, flexShrink: 0 }}>
          {sending ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  );
}