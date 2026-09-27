import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  FileText, 
  Smile, 
  Trash2, 
  Edit3, 
  CornerUpLeft, 
  Check, 
  X,
  Volume2
} from 'lucide-react';

const QUICK_REACTIONS = ['❤️', '👍', '🔥', '😂', '🚀', '🎉'];

export default function MessageItem({
  message,
  currentUser,
  onAddReaction,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  onOpenMedia
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRef, setAudioRef] = useState(null);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');

  const isOwnMessage = message.sender?.id === currentUser?.id;

  // Toggle Audio Voice Note Playback
  const handleToggleAudio = () => {
    if (!message.voiceNote?.url) return;
    
    if (audioRef) {
      if (isPlayingAudio) {
        audioRef.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.play();
        setIsPlayingAudio(true);
      }
    } else {
      const audio = new Audio(message.voiceNote.url);
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
      setAudioRef(audio);
      setIsPlayingAudio(true);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEditMessage(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  // Full Markdown & Multi-line Code Block Formatter
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    // Handle code blocks (```lang ... ```)
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: rawText.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'codeblock', lang: match[1] || 'code', content: match[2].trim() });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < rawText.length) {
      parts.push({ type: 'text', content: rawText.slice(lastIndex) });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'codeblock') {
        return (
          <div key={pIdx} style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            margin: '8px 0',
            fontFamily: 'Fira Code, Consolas, monospace',
            fontSize: '0.85rem',
            overflowX: 'auto',
            color: '#e2e8f0',
            lineHeight: 1.5
          }}>
            {part.lang && (
              <div style={{ fontSize: '0.72rem', color: 'var(--cyan-accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                {part.lang}
              </div>
            )}
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{part.content}</pre>
          </div>
        );
      }

      // Format inline elements: newlines, bold, inline code, links
      const lines = part.content.split('\n');
      return lines.map((line, lIdx) => {
        const tokens = line.split(/(\*\*.*?\*\*|`.*?`|https?:\/\/[^\s]+)/g);
        const formattedLine = tokens.map((token, tIdx) => {
          if (token.startsWith('**') && token.endsWith('**')) {
            return <strong key={tIdx}>{token.slice(2, -2)}</strong>;
          }
          if (token.startsWith('`') && token.endsWith('`')) {
            return (
              <code key={tIdx} style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'Fira Code, monospace',
                fontSize: '0.84rem',
                color: 'var(--cyan-accent)'
              }}>
                {token.slice(1, -1)}
              </code>
            );
          }
          if (token.match(/^https?:\/\//)) {
            return (
              <a key={tIdx} href={token} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan-accent)', textDecoration: 'underline' }}>
                {token}
              </a>
            );
          }
          return token;
        });

        return (
          <React.Fragment key={lIdx}>
            {formattedLine}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      });
    });
  };

  if (message.isSystem) {
    return (
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <span style={{ 
          fontSize: '0.78rem', 
          background: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid var(--bg-glass-border)', 
          padding: '4px 14px', 
          borderRadius: '20px', 
          color: 'var(--text-muted)' 
        }}>
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`message-card ${isOwnMessage ? 'own-message' : ''}`}>
      {/* Sender Avatar */}
      <div className="message-avatar">
        {message.sender?.avatar || '👤'}
      </div>

      <div className="message-content-box">
        {/* Message Meta Header */}
        {!isOwnMessage && (
          <div className="message-meta">
            <span className="sender-name">{message.sender?.username}</span>
          </div>
        )}

        {/* Message Bubble Container */}
        <div className="message-bubble">
          {/* Reply Context Banner */}
          {message.replyTo && (
            <div style={{
              fontSize: '0.78rem',
              background: 'rgba(0,0,0,0.2)',
              borderLeft: '3px solid var(--primary-accent)',
              padding: '4px 8px',
              borderRadius: '4px',
              marginBottom: '6px',
              color: 'var(--text-muted)'
            }}>
              Replying to <strong style={{ color: 'var(--text-main)' }}>@{message.replyTo.username}</strong>: "{message.replyTo.text.slice(0, 40)}..."
            </div>
          )}

          {/* Text Content / Edit Field */}
          {isEditing ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                className="glass-input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                autoFocus
              />
              <button className="glass-btn" style={{ padding: '6px' }} onClick={handleSaveEdit}>
                <Check size={14} color="var(--emerald-accent)" />
              </button>
              <button className="glass-btn" style={{ padding: '6px' }} onClick={() => setIsEditing(false)}>
                <X size={14} color="var(--rose-accent)" />
              </button>
            </div>
          ) : (
            <div>
              <span>{renderFormattedText(message.text)}</span>
              <span className="bubble-footer">
                <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {message.edited && <span style={{ fontStyle: 'italic', opacity: 0.7 }}>(edited)</span>}
                {isOwnMessage && (
                  <span className="whatsapp-ticks" style={{ color: message.status === 'read' ? '#53bdeb' : 'var(--text-dim)', fontWeight: 600 }}>
                    {message.status === 'sent' ? '✓' : '✓✓'}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Attachment Preview (Image / File) */}
          {message.attachment && (
            <div style={{ marginTop: '8px' }}>
              {message.attachment.type?.startsWith('image/') ? (
                <img
                  src={message.attachment.url}
                  alt={message.attachment.name}
                  onClick={() => onOpenMedia(message.attachment.url)}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '260px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--bg-glass-border)',
                    cursor: 'pointer',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <a
                  href={message.attachment.url}
                  download={message.attachment.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 14px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--bg-glass-border)',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  <FileText size={18} color="var(--cyan-accent)" />
                  <span style={{ fontWeight: 600 }}>{message.attachment.name}</span>
                  <Download size={14} color="var(--text-dim)" />
                </a>
              )}
            </div>
          )}

          {/* Voice Note Audio Player */}
          {message.voiceNote && (
            <div className="voice-note-card">
              <button className="play-pause-btn" onClick={handleToggleAudio}>
                {isPlayingAudio ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Volume2 size={14} color="var(--primary-accent)" /> Voice Audio Clip
                </div>
                <div style={{
                  height: '4px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '2px',
                  marginTop: '4px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: isPlayingAudio ? '100%' : '0%',
                    height: '100%',
                    background: 'var(--primary-accent)',
                    transition: isPlayingAudio ? 'width 5s linear' : 'none'
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick Hover Message Action Buttons */}
          <div style={{
            position: 'absolute',
            top: -12,
            right: isOwnMessage ? 'auto' : 10,
            left: isOwnMessage ? 10 : 'auto',
            display: 'flex',
            gap: '2px',
            background: 'var(--bg-dark-elevated)',
            border: '1px solid var(--bg-glass-border)',
            borderRadius: '16px',
            padding: '2px 6px',
            boxShadow: 'var(--shadow-glass)',
            opacity: showReactionsMenu ? 1 : 0.85
          }}>
            {QUICK_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => onAddReaction(message.roomId, message.id, emoji)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '2px' }}
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}

            <button
              onClick={() => onReplyMessage(message)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px' }}
              title="Reply"
            >
              <CornerUpLeft size={13} />
            </button>

            {isOwnMessage && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px' }}
                  title="Edit message"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => onDeleteMessage(message.roomId, message.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose-accent)', padding: '2px' }}
                  title="Delete message"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Active Emoji Reactions Pills */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="reactions-bar">
            {Object.entries(message.reactions).map(([emoji, usersList]) => {
              const hasReacted = usersList.includes(currentUser?.id);
              return (
                <button
                  key={emoji}
                  className={`reaction-pill ${hasReacted ? 'user-reacted' : ''}`}
                  onClick={() => onAddReaction(message.roomId, message.id, emoji)}
                >
                  <span>{emoji}</span>
                  <span style={{ fontWeight: 700 }}>{usersList.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
