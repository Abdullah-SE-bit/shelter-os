import { useState, useEffect, useRef } from 'react';
import { messagingApi } from '../../api/messagingApi';
import { accountsApi } from '../../api/accountsApi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { formatDate, timeAgo } from '../../utils/dateUtils';

export default function MessagingPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const messagesListRef = useRef(null);

  // Fetch conversations
  const { data: conversationsData, loading: conversationsLoading, refetch: refetchConversations } = useApi(
    () => messagingApi.listConversations()
  );
  const conversations = Array.isArray(conversationsData) ? conversationsData : (conversationsData?.data || []);

  // Fetch messages for selected conversation
  const { data: messagesData, loading: messagesLoading, refetch: refetchMessages } = useApi(
    () => messagingApi.getMessages(selectedConversation?.id),
    { skip: !selectedConversation },
    [selectedConversation?.id]
  );
  const [localMessages, setLocalMessages] = useState([]);

  useEffect(() => {
    if (messagesData) {
      const msgs = Array.isArray(messagesData) ? messagesData : (messagesData?.data || []);
      setLocalMessages(msgs);
    } else {
      setLocalMessages([]);
    }
  }, [messagesData]);

  // Clear messages immediately when switching conversations to prevent content flash
  useEffect(() => {
    setLocalMessages([]);
  }, [selectedConversation?.id]);

  // Keep the message list pinned to the newest message. We scroll ONLY this
  // container (not scrollIntoView, which scrolls the whole window) so polling
  // never makes the page jump.
  useEffect(() => {
    const el = messagesListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [localMessages]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!selectedConversation) return;
    
    const interval = setInterval(() => {
      refetchMessages();
      refetchConversations();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [selectedConversation, refetchMessages, refetchConversations]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation) {
      messagingApi.markConversationRead(selectedConversation.id).catch(console.error);
    }
  }, [selectedConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageBody.trim() || !selectedConversation) return;

    const text = newMessageBody.trim();
    setNewMessageBody('');

    // Create optimistic message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: { id: user.id, email: user.email },
      body: text,
      sent_at: new Date().toISOString(),
      is_read: false,
      isOptimistic: true,
    };

    // Prepend optimistic message (since list is ordered newest first)
    setLocalMessages(prev => [tempMessage, ...prev]);

    try {
      const response = await messagingApi.sendMessage(selectedConversation.id, text);
      const actualMessage = response.data?.data || response.data;
      
      // Replace temp message with actual message
      setLocalMessages(prev =>
        prev.map(m => m.id === tempMessage.id ? actualMessage : m)
      );
      
      refetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on failure
      setLocalMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      alert('Failed to send message. Please try again.');
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this conversation? This will permanently delete all messages."
    );
    if (!confirmDelete) return;

    try {
      await messagingApi.deleteConversation(selectedConversation.id);
      setSelectedConversation(null);
      refetchConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    }
  };

  const getOtherParticipants = (conversation) => {
    if (!conversation.participants) return [];
    return conversation.participants.filter(p => p.id !== user.id);
  };

  const getConversationTitle = (conversation) => {
    const others = getOtherParticipants(conversation);
    if (others.length > 0) {
      return others.map(p => p.name || p.email).join(', ');
    }
    const contextLabels = {
      SHELTER_VOLUNTEER: 'Shelter & Volunteer',
      SHELTER_ADOPTER: 'Shelter & Adopter',
      VET_OWNER: 'Vet & Owner',
      GENERAL: 'General',
    };
    return contextLabels[conversation.context_type] || 'Conversation';
  };

  // Round avatar: shows the participant's photo, else their initial.
  const Avatar = ({ participant, size = 40 }) => {
    const label = (participant?.name || participant?.email || '?').trim();
    const initial = label ? label[0].toUpperCase() : '?';
    const photo = participant?.profile_photo;
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 800, fontSize: `${Math.round(size * 0.4)}px`,
      }}>
        {photo
          ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initial}
      </div>
    );
  };

  const ConversationListItem = ({ conversation }) => {
    const isSelected = selectedConversation?.id === conversation.id;
    const others = getOtherParticipants(conversation);
    const label = getConversationTitle(conversation);

    return (
      <div
        onClick={() => setSelectedConversation(conversation)}
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          padding: '0.75rem',
          marginBottom: '0.625rem',
          borderRadius: '12px',
          cursor: 'pointer',
          background: isSelected ? 'rgba(201,123,84,0.10)' : 'var(--surface-card)',
          border: `1px solid ${isSelected ? 'var(--cat-terra)' : 'var(--border-default)'}`,
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--cat-terra)'; }}
        onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
      >
        <Avatar participant={others[0]} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name · time · unread */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              {conversation.last_message_at && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {timeAgo(conversation.last_message_at)}
                </span>
              )}
              {conversation.unread_count > 0 && (
                <span style={{
                  background: 'var(--cat-terra, #e06e3b)', color: 'white', borderRadius: '999px',
                  padding: '0.125rem 0.4rem', fontSize: '0.6875rem', fontWeight: 800,
                  minWidth: '1.25rem', textAlign: 'center', lineHeight: 1.2,
                }}>
                  {conversation.unread_count}
                </span>
              )}
            </div>
          </div>
          {/* Role + context — sits right under the name (no message preview) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {others.length > 0 ? others.map(o => o.role).join(', ') : 'No other participants'}
            </span>
            <span style={{ fontStyle: 'italic', flexShrink: 0 }}>
              {conversation.context_type ? conversation.context_type.replace('_', ' ') : ''}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const MessageBubble = ({ message }) => {
    const isOwnMessage = message.sender?.id === user.id || message.sender === user.id;
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
        opacity: message.isOptimistic ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}>
        <div style={{
          maxWidth: '70%',
          background: isOwnMessage ? 'var(--cat-terra)' : 'var(--surface-card)',
          color: isOwnMessage ? 'white' : 'var(--text-primary)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          border: isOwnMessage ? 'none' : '1px solid var(--border-default)',
        }}>
          {!isOwnMessage && (message.sender_name || message.sender_email || message.sender) && (
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              marginBottom: '0.25rem',
              opacity: 0.8,
            }}>
              {message.sender_name || message.sender_email || (typeof message.sender === 'object' ? message.sender.email : 'Unknown')}
            </div>
          )}
          <div style={{ fontSize: '0.875rem', lineHeight: 1.5, wordWrap: 'break-word' }}>
            {message.body}
          </div>
          <div style={{
            fontSize: '0.6875rem',
            marginTop: '0.375rem',
            opacity: 0.7,
            textAlign: isOwnMessage ? 'right' : 'left',
          }}>
            {formatDate(message.sent_at)}
          </div>
        </div>
      </div>
    );
  };

  const ComposeModal = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [recipient, setRecipient] = useState('');
    const [contextType, setContextType] = useState('GENERAL');
    const [messageBody, setMessageBody] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [sending, setSending] = useState(false);

    const handleSearchUsers = async (query) => {
      setSearchQuery(query);
      // Reset recipient when query changes so they must select from results
      setRecipient('');
      
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        // Note: This assumes a user search endpoint exists. If not, we'll need to add it
        // For now, using a placeholder. You may need to implement this endpoint in backend
        const response = await accountsApi.list({ search: query });
        setSearchResults(response.data?.data || []);
      } catch (error) {
        console.error('Failed to search users:', error);
      }
      setSearching(false);
    };

    const handleCreateConversation = async () => {
      if (!recipient || !messageBody.trim() || sending) return;

      setSending(true);
      try {
        const response = await messagingApi.createConversation({
          participant_ids: [recipient],
          context_type: contextType,
        });
        const newConversation = response.data?.data || response.data;
        
        await messagingApi.sendMessage(newConversation.id, messageBody.trim());
        
        setShowComposeModal(false);
        setSearchQuery('');
        setRecipient('');
        setMessageBody('');
        refetchConversations();
        setSelectedConversation(newConversation);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        alert('Failed to start conversation. Please try again.');
      } finally {
        setSending(false);
      }
    };

    return (
      <Modal
        open={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        title="💬 New Conversation"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowComposeModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateConversation} className="btn btn-primary" disabled={!recipient || !messageBody.trim() || sending}>
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Recipient
            </label>
            <input
              type="text"
              value={searchQuery}
              placeholder="Enter email to search..."
              onChange={(e) => handleSearchUsers(e.target.value)}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
            />
            {searchResults.length > 0 && (
              <div style={{
                marginTop: '0.5rem',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                maxHeight: '150px',
                overflowY: 'auto',
                background: 'var(--surface-card)',
              }}>
                {searchResults.map(usr => (
                  <div
                    key={usr.id}
                    onClick={() => {
                      setRecipient(usr.id);
                      setSearchQuery(usr.email);
                      setSearchResults([]);
                    }}
                    style={{
                      padding: '0.625rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    {usr.email} - {usr.role}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Context Type
            </label>
            <select
              value={contextType}
              onChange={(e) => setContextType(e.target.value)}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
            >
              <option value="GENERAL">General</option>
              <option value="SHELTER_VOLUNTEER">Shelter & Volunteer</option>
              <option value="SHELTER_ADOPTER">Shelter & Adopter</option>
              <option value="VET_OWNER">Vet & Owner</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Message
            </label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="page-container" style={{ maxWidth: '100%', padding: 0, height: 'calc(100vh - 90px)' }}>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Conversations Sidebar */}
        <div style={{
          width: '350px',
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-base)',
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--surface-card)',
          }}>
            <h1 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: 800 }}>
              💬 Messages
            </h1>
            <button
              onClick={() => setShowComposeModal(true)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              ✏️ New Message
            </button>
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {conversationsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <LoadingSpinner size="sm" />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
                <p style={{ fontSize: '0.875rem' }}>No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => (
                <ConversationListItem key={conv.id} conversation={conv} />
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-base)' }}>
          {!selectedConversation ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <EmptyState
                icon="💬"
                title="No conversation selected"
                message="Select a conversation from the list or start a new one"
              />
            </div>
          ) : (
            <>
              {/* Messages Header */}
              <div style={{
                padding: '1.25rem',
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <Avatar participant={getOtherParticipants(selectedConversation)[0]} size={44} />
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getConversationTitle(selectedConversation)}
                    </h2>
                    {getOtherParticipants(selectedConversation)[0]?.role && (
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {getOtherParticipants(selectedConversation)[0].role.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDeleteConversation}
                  className="btn btn-secondary"
                  style={{
                    color: 'var(--cat-red, #dc2626)',
                    borderColor: 'var(--cat-red, #dc2626)',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  🗑️ Delete Chat
                </button>
              </div>

              {/* Messages List */}
              <div ref={messagesListRef} style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                background: 'var(--surface-base)',
              }}>
                {messagesLoading && localMessages.length === 0 ? (
                  <LoadingSpinner />
                ) : localMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {localMessages.slice().reverse().map(msg => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                  </>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} style={{
                padding: '1.25rem',
                borderTop: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
              }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={newMessageBody}
                    onChange={(e) => setNewMessageBody(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-default)',
                      fontSize: '0.875rem',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessageBody.trim()}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <ComposeModal />
    </div>
  );
}
