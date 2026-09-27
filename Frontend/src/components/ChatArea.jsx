import React, { useRef, useEffect } from 'react';
import { 
  Hash, 
  Lock, 
  Search, 
  Phone, 
  Video, 
  Info, 
  Pin, 
  Users, 
  Sparkles
} from 'lucide-react';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

export default function ChatArea({
  activeRoom,
  users = [],
  messages = [],
  currentUser,
  typingUsers = [],
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onAddReaction,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  replyingTo,
  onCancelReply,
  onToggleInfoPanel,
  onOpenMedia
}) {
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Determine Contact details
  const parts = activeRoom?.startsWith('dm-') ? activeRoom.replace('dm-', '').split('-') : [];
  const otherUserId = parts.find(id => id !== currentUser.id) || 'system';
  const otherUser = users.find(u => u.id === otherUserId) || {
    id: 'system',
    username: 'ChatBot AI',
    avatar: '🤖',
    status: 'online',
    bio: 'Official WhatsApp AI Assistant'
  };

  const contactName = otherUser.username;
  const contactAvatar = otherUser.avatar || '👤';
  const contactStatus = otherUser.status || 'online';
  const contactBio = otherUser.bio || 'Available on WhatsApp';

  // Filter typing users for current room
  const activeTypingInRoom = typingUsers.filter(t => t.roomId === activeRoom && t.userId !== currentUser.id);

  return (
    <main className="chat-main">
      {/* Header Bar (WhatsApp Contact Header) */}
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', fontSize: '1.5rem' }}>
            {contactAvatar}
            <span className={`status-dot ${contactStatus}`} style={{ position: 'absolute', bottom: -2, right: -2 }} />
          </div>
          <div>
            <div className="channel-title-text" style={{ fontSize: '1rem', fontWeight: 700 }}>
              {contactName}
            </div>
            <div className="channel-desc" style={{ fontSize: '0.78rem' }}>
              {activeTypingInRoom.length > 0 ? (
                <span style={{ color: 'var(--whatsapp-green)', fontStyle: 'italic', fontWeight: 600 }}>typing...</span>
              ) : (
                <span>{contactStatus === 'online' ? 'online' : contactBio}</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="glass-btn"
            style={{ padding: '8px' }}
            onClick={() => alert('Starting voice call mockup...')}
            title="Start Audio Call"
          >
            <Phone size={16} color="var(--emerald-accent)" />
          </button>
          <button
            className="glass-btn"
            style={{ padding: '8px' }}
            onClick={() => alert('Starting video call mockup...')}
            title="Start Video Call"
          >
            <Video size={16} color="var(--primary-accent)" />
          </button>
          <button
            className="glass-btn"
            style={{ padding: '8px' }}
            onClick={onToggleInfoPanel}
            title="Toggle Info Panel"
          >
            <Info size={16} />
          </button>
        </div>
      </header>

      {/* WhatsApp Welcome Banner */}
      <div style={{
        padding: '6px 16px',
        background: 'var(--bg-dark-header)',
        borderBottom: '1px solid var(--bg-glass-border)',
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: 'var(--text-muted)',
        zIndex: 5
      }}>
        <Lock size={12} color="var(--primary-accent)" />
        <span>Messages are end-to-end encrypted across connected tabs.</span>
      </div>

      {/* Scrollable Message Feed */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', padding: '40px 20px', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💬</div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', fontSize: '1.2rem' }}>
              No messages in this chat yet
            </h3>
            <p style={{ fontSize: '0.88rem', marginTop: '4px' }}>
              Be the first to break the ice and start the conversation!
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageItem
              key={msg.id}
              message={msg}
              currentUser={currentUser}
              onAddReaction={onAddReaction}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              onReplyMessage={onReplyMessage}
              onOpenMedia={onOpenMedia}
            />
          ))
        )}

        {/* Live Typing Indicator */}
        {activeTypingInRoom.length > 0 && (
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px'
          }}>
            <span className="status-dot online" style={{ animation: 'pulse 1s infinite' }} />
            <span>
              {activeTypingInRoom.map(t => t.username).join(', ')} {activeTypingInRoom.length > 1 ? 'are' : 'is'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer Footer */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        activeRoom={activeRoom}
      />
    </main>
  );
}
