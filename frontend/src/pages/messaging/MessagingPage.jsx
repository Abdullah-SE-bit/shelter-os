import { useState, useEffect, useRef } from 'react';
import { MessageSquare, SquarePen, Trash2, Send, Loader2 } from 'lucide-react';
import { messagingApi } from '@/api/messagingApi';
import { accountsApi } from '@/api/accountsApi';
import useApi from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { formatDate, timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

function Avatar({ participant, size = 40 }) {
  const label = (participant?.name || participant?.email || '?').trim();
  const initial = label ? label[0].toUpperCase() : '?';
  const photo = participant?.profile_photo;
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--brand-rust)] to-[var(--brand-ink)] font-extrabold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {photo ? <img src={photo} alt="" className="size-full object-cover" /> : initial}
    </div>
  );
}

export default function MessagingPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const messagesListRef = useRef(null);

  const { data: conversationsData, loading: conversationsLoading, refetch: refetchConversations } = useApi(() => messagingApi.listConversations());
  const conversations = Array.isArray(conversationsData) ? conversationsData : (conversationsData?.data || []);

  const { data: messagesData, loading: messagesLoading, refetch: refetchMessages } = useApi(
    () => messagingApi.getMessages(selectedConversation?.id),
    { skip: !selectedConversation },
    [selectedConversation?.id],
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

  useEffect(() => { setLocalMessages([]); }, [selectedConversation?.id]);

  useEffect(() => {
    const el = messagesListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [localMessages]);

  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => { refetchMessages(); refetchConversations(); }, 10000);
    return () => clearInterval(interval);
  }, [selectedConversation, refetchMessages, refetchConversations]);

  useEffect(() => {
    if (selectedConversation) messagingApi.markConversationRead(selectedConversation.id).catch(console.error);
  }, [selectedConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageBody.trim() || !selectedConversation) return;

    const text = newMessageBody.trim();
    setNewMessageBody('');

    const tempMessage = { id: `temp-${Date.now()}`, sender: { id: user.id, email: user.email }, body: text, sent_at: new Date().toISOString(), is_read: false, isOptimistic: true };
    setLocalMessages((prev) => [tempMessage, ...prev]);

    try {
      const response = await messagingApi.sendMessage(selectedConversation.id, text);
      const actualMessage = response.data?.data || response.data;
      setLocalMessages((prev) => prev.map((m) => (m.id === tempMessage.id ? actualMessage : m)));
      refetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      setLocalMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      alert('Failed to send message. Please try again.');
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    if (!window.confirm('Are you sure you want to delete this conversation? This will permanently delete all messages.')) return;
    try {
      await messagingApi.deleteConversation(selectedConversation.id);
      setSelectedConversation(null);
      refetchConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const getOtherParticipants = (conversation) => (conversation.participants || []).filter((p) => p.id !== user.id);

  const getConversationTitle = (conversation) => {
    const others = getOtherParticipants(conversation);
    if (others.length > 0) return others.map((p) => p.name || p.email).join(', ');
    const contextLabels = { SHELTER_VOLUNTEER: 'Shelter & Volunteer', SHELTER_ADOPTER: 'Shelter & Adopter', VET_OWNER: 'Vet & Owner', GENERAL: 'General' };
    return contextLabels[conversation.context_type] || 'Conversation';
  };

  const ConversationListItem = ({ conversation }) => {
    const isSelected = selectedConversation?.id === conversation.id;
    const others = getOtherParticipants(conversation);
    const label = getConversationTitle(conversation);

    return (
      <button
        onClick={() => setSelectedConversation(conversation)}
        className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors', isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50')}
      >
        <Avatar participant={others[0]} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-bold text-foreground">{label}</div>
            <div className="flex shrink-0 items-center gap-1.5">
              {conversation.last_message_at && <span className="text-[11px] text-muted-foreground">{timeAgo(conversation.last_message_at)}</span>}
              {conversation.unread_count > 0 && <span className="min-w-[1.25rem] rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] font-extrabold text-primary-foreground">{conversation.unread_count}</span>}
            </div>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">{others.length > 0 ? others.map((o) => o.role).join(', ') : 'No other participants'}</span>
            <span className="shrink-0 italic">{conversation.context_type ? conversation.context_type.replace('_', ' ') : ''}</span>
          </div>
        </div>
      </button>
    );
  };

  const MessageBubble = ({ message }) => {
    const isOwnMessage = message.sender?.id === user.id || message.sender === user.id;
    return (
      <div className={cn('mb-4 flex', isOwnMessage ? 'justify-end' : 'justify-start', message.isOptimistic && 'opacity-70')}>
        <div className={cn('max-w-[70%] rounded-xl px-4 py-3', isOwnMessage ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground')}>
          {!isOwnMessage && (message.sender_name || message.sender_email || message.sender) && (
            <div className="mb-1 text-xs font-semibold opacity-80">{message.sender_name || message.sender_email || (typeof message.sender === 'object' ? message.sender.email : 'Unknown')}</div>
          )}
          <div className="text-sm leading-relaxed break-words">{message.body}</div>
          <div className={cn('mt-1.5 text-[11px] opacity-70', isOwnMessage ? 'text-right' : 'text-left')}>{formatDate(message.sent_at)}</div>
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
      setRecipient('');
      if (!query.trim()) { setSearchResults([]); return; }
      setSearching(true);
      try {
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
        const response = await messagingApi.createConversation({ participant_ids: [recipient], context_type: contextType });
        const newConversation = response.data?.data || response.data;
        await messagingApi.sendMessage(newConversation.id, messageBody.trim());
        setShowComposeModal(false);
        setSearchQuery(''); setRecipient(''); setMessageBody('');
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
      <Modal open={showComposeModal} onClose={() => setShowComposeModal(false)} title="New conversation"
        footer={<><Button variant="secondary" onClick={() => setShowComposeModal(false)}>Cancel</Button><Button onClick={handleCreateConversation} disabled={!recipient || !messageBody.trim() || sending}>{sending ? 'Sending…' : 'Send message'}</Button></>}
      >
        <div className="flex flex-col gap-4">
          <div>
            <Label>Recipient</Label>
            <Input value={searchQuery} placeholder="Enter email to search…" onChange={(e) => handleSearchUsers(e.target.value)} className="mt-1.5" />
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-[150px] overflow-y-auto rounded-lg border border-border bg-card">
                {searchResults.map((usr) => (
                  <button key={usr.id} type="button" onClick={() => { setRecipient(usr.id); setSearchQuery(usr.email); setSearchResults([]); }}
                    className="block w-full border-b border-border px-3 py-2.5 text-left text-sm last:border-0 hover:bg-surface-muted">
                    {usr.email} - {usr.role}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label>Context type</Label>
            <NativeSelect value={contextType} onChange={(e) => setContextType(e.target.value)} className="mt-1.5">
              <option value="GENERAL">General</option>
              <option value="SHELTER_VOLUNTEER">Shelter & Volunteer</option>
              <option value="SHELTER_ADOPTER">Shelter & Adopter</option>
              <option value="VET_OWNER">Vet & Owner</option>
            </NativeSelect>
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Type your message…" rows={4} className="mt-1.5" />
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex w-[340px] shrink-0 flex-col border-r border-border bg-background">
        <div className="border-b border-border p-5">
          <h1 className="mb-3 flex items-center gap-2 text-xl font-extrabold text-foreground"><MessageSquare className="size-5" />Messages</h1>
          <Button className="w-full" onClick={() => setShowComposeModal(true)}><SquarePen className="size-4" />New message</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {conversationsLoading ? (
            <div className="p-8 text-center"><LoadingSpinner size="sm" /></div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 size-10" strokeWidth={1.5} />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map((conv) => <ConversationListItem key={conv.id} conversation={conv} />)}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-background">
        {!selectedConversation ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <EmptyState icon={MessageSquare} title="No conversation selected" message="Select a conversation from the list or start a new one" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border bg-card p-5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar participant={getOtherParticipants(selectedConversation)[0]} size={44} />
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-bold text-foreground">{getConversationTitle(selectedConversation)}</h2>
                  {getOtherParticipants(selectedConversation)[0]?.role && <p className="mt-0.5 text-[13px] font-semibold text-muted-foreground">{getOtherParticipants(selectedConversation)[0].role.replace(/_/g, ' ')}</p>}
                </div>
              </div>
              <Button variant="secondary" size="sm" className="text-destructive hover:text-destructive" onClick={handleDeleteConversation}><Trash2 className="size-3.5" />Delete chat</Button>
            </div>

            <div ref={messagesListRef} className="flex-1 overflow-y-auto p-6">
              {messagesLoading && localMessages.length === 0 ? (
                <LoadingSpinner />
              ) : localMessages.length === 0 ? (
                <div className="pt-8 text-center text-muted-foreground"><p>No messages yet. Start the conversation!</p></div>
              ) : (
                localMessages.slice().reverse().map((msg) => <MessageBubble key={msg.id} message={msg} />)
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-3 border-t border-border bg-card p-5">
              <Input value={newMessageBody} onChange={(e) => setNewMessageBody(e.target.value)} placeholder="Type a message…" className="h-11 flex-1 rounded-full" />
              <Button type="submit" disabled={!newMessageBody.trim()} size="icon" className="size-11 shrink-0 rounded-full"><Send className="size-4" /></Button>
            </form>
          </>
        )}
      </div>

      <ComposeModal />
    </div>
  );
}
