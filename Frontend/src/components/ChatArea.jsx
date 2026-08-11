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
  channels = [],
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

  // Determine channel or DM details
  let roomTitle = activeRoom;
  let roomDesc = '';
  let isPrivate = false;
  let isDM = activeRoom?.startsWith('dm-');

  if (isDM) {
    const parts = activeRoom.replace('dm-', '').split('-');
    const otherUserId = parts.find(id => id !== currentUser.id);
    const otherUser = users.find(u => u.id === otherUserId);

    roomTitle = otherUser ? `Chat with @${otherUser.username}` : 'Direct Message';
    roomDesc = otherUser ? `${otherUser.status} • ${otherUser.bio || 'Direct message'}` : 'Private 1-on-1 chat';
  } else {
    const ch = channels.find(c => c.id === activeRoom);
    if (ch) {
      roomTitle = `#${ch.name}`;
      roomDesc = ch.description || 'Channel discussion';
      isPrivate = ch.isPrivate;
    }
  }

  // Filter typing users for current room
  const activeTypingInRoom = typingUsers.filter(t => t.roomId === activeRoom && t.userId !== currentUser.id);

  return (
    <main className="chat-main">
      {/* Header Bar */}
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="channel-title-text">
            {isDM ? (
              <span style={{ fontSize: '1.2rem' }}>💬</span>
            ) : isPrivate ? (
              <Lock size={18} color="var(--amber-accent)" />
            ) : (
              <Hash size={18} color="var(--primary-accent)" />
            )}
            <span>{roomTitle}</span>
          </div>
          <span style={{ color: 'var(--text-dim)' }}>|</span>
          <span className="channel-desc">{roomDesc}</span>
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

      {/* Pinned Welcome Banner */}
      <div style={{
        padding: '8px 20px',
        background: 'rgba(99, 102, 241, 0.1)',
        borderBottom: '1px solid var(--bg-glass-border)',
        fontSize: '0.82rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-muted)'
      }}>
        <Pin size={14} color="var(--primary-accent)" />
        <span><strong>Pinned Note:</strong> Real-time WebSockets connected. Send messages, emojis, media, or voice notes!</span>
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
