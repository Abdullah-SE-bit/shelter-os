'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, SquarePen, Trash2, Send } from 'lucide-react';
import { mockConversations, mockMessages } from '@/lib/mock-data/messaging';
import { mockUsers } from '@/lib/mock-data/users';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { formatDate, timeAgo } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

function Avatar({ label, size = 40 }) {
  const initial = (label || '?').trim()[0]?.toUpperCase() || '?';
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--brand-teal)] to-[var(--brand-ink)] font-extrabold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initial}
    </div>
  );
}

export default function MessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const messagesListRef = useRef(null);

  useEffect(() => {
    setLocalMessages(selectedConversation ? mockMessages[selectedConversation.id] || [] : []);
  }, [selectedConversation]);

  useEffect(() => {
    const el = messagesListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [localMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageBody.trim() || !selectedConversation) return;
    const text = newMessageBody.trim();
    setNewMessageBody('');
    const newMsg = { id: `m-${Date.now()}`, sender_name: 'You', is_mine: true, text, sent_at: new Date().toISOString() };
    setLocalMessages((prev) => [...prev, newMsg]);
    setConversations((cs) => cs.map((c) => (c.id === selectedConversation.id ? { ...c, last_message: text, last_message_at: newMsg.sent_at, unread_count: 0 } : c)));
  };

  const handleDeleteConversation = () => {
    if (!selectedConversation) return;
    if (!window.confirm('Are you sure you want to delete this conversation? This will permanently delete all messages.')) return;
    setConversations((cs) => cs.filter((c) => c.id !== selectedConversation.id));
    setSelectedConversation(null);
  };

  const ConversationListItem = ({ conversation }) => {
    const isSelected = selectedConversation?.id === conversation.id;
    return (
      <button
        onClick={() => setSelectedConversation(conversation)}
        className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors', isSelected ? 'border-primary bg-highlight-mint/20' : 'border-border bg-card hover:border-primary/50')}
      >
        <Avatar label={conversation.other_user_name} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-bold text-foreground">{conversation.other_user_name}</div>
            <div className="flex shrink-0 items-center gap-1.5">
              {conversation.last_message_at && <span className="text-[11px] text-muted-foreground">{timeAgo(conversation.last_message_at)}</span>}
              {conversation.unread_count > 0 && <span className="min-w-[1.25rem] rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] font-extrabold text-primary-foreground">{conversation.unread_count}</span>}
            </div>
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{conversation.last_message}</div>
        </div>
      </button>
    );
  };

  const MessageBubble = ({ message }) => (
    <div className={cn('mb-4 flex', message.is_mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[70%] rounded-xl px-4 py-3', message.is_mine ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground')}>
        {!message.is_mine && <div className="mb-1 text-xs font-semibold opacity-80">{message.sender_name}</div>}
        <div className="text-sm leading-relaxed break-words">{message.text}</div>
        <div className={cn('mt-1.5 text-[11px] opacity-70', message.is_mine ? 'text-right' : 'text-left')}>{formatDate(message.sent_at)}</div>
      </div>
    </div>
  );

  const ComposeModal = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [recipient, setRecipient] = useState(null);
    const [contextType, setContextType] = useState('GENERAL');
    const [messageBody, setMessageBody] = useState('');
    const results = searchQuery.trim() ? mockUsers.filter((u) => u.email.toLowerCase().includes(searchQuery.toLowerCase())) : [];

    const handleCreateConversation = () => {
      if (!recipient || !messageBody.trim()) return;
      const name = `${recipient.profile.first_name} ${recipient.profile.last_name}`;
      const newConv = { id: `conv-${Date.now()}`, other_user_name: name, other_user_role: recipient.role, unread_count: 0, last_message: messageBody.trim(), last_message_at: new Date().toISOString() };
      mockMessages[newConv.id] = [{ id: `m-${Date.now()}`, sender_name: 'You', is_mine: true, text: messageBody.trim(), sent_at: new Date().toISOString() }];
      setConversations((cs) => [newConv, ...cs]);
      setSelectedConversation(newConv);
      setShowComposeModal(false);
      setSearchQuery(''); setRecipient(null); setMessageBody('');
    };

    return (
      <Modal open={showComposeModal} onClose={() => setShowComposeModal(false)} title="New conversation"
        footer={<><Button variant="secondary" onClick={() => setShowComposeModal(false)}>Cancel</Button><Button onClick={handleCreateConversation} disabled={!recipient || !messageBody.trim()}>Send message</Button></>}
      >
        <div className="flex flex-col gap-4">
          <div>
            <Label>Recipient</Label>
            <Input value={recipient ? recipient.email : searchQuery} placeholder="Enter email to search…" onChange={(e) => { setSearchQuery(e.target.value); setRecipient(null); }} className="mt-1.5" />
            {results.length > 0 && !recipient && (
              <div className="mt-2 max-h-[150px] overflow-y-auto no-scrollbar rounded-lg border border-border bg-card">
                {results.map((usr) => (
                  <button key={usr.id} type="button" onClick={() => { setRecipient(usr); setSearchQuery(usr.email); }}
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
              <option value="SHELTER_EMPLOYEE">Shelter & Employee</option>
              <option value="SHELTER_ADOPTER">Shelter & Adopter</option>
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

        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          {conversations.length === 0 ? (
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
                <Avatar label={selectedConversation.other_user_name} size={44} />
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-bold text-foreground">{selectedConversation.other_user_name}</h2>
                  {selectedConversation.other_user_role && <p className="mt-0.5 text-[13px] font-semibold text-muted-foreground">{selectedConversation.other_user_role.replace(/_/g, ' ')}</p>}
                </div>
              </div>
              <Button variant="secondary" size="sm" className="text-destructive hover:text-destructive" onClick={handleDeleteConversation}><Trash2 className="size-3.5" />Delete chat</Button>
            </div>

            <div ref={messagesListRef} className="flex-1 overflow-y-auto no-scrollbar p-6">
              {localMessages.length === 0 ? (
                <div className="pt-8 text-center text-muted-foreground"><p>No messages yet. Start the conversation!</p></div>
              ) : (
                localMessages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
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
