import React from 'react';
import { 
  Image as ImageIcon, 
  FileText, 
  Info, 
  X,
  User,
  ShieldCheck
} from 'lucide-react';

export default function InfoPanel({
  activeRoom,
  users = [],
  messages = [],
  currentUser,
  onClose,
  onOpenMedia
}) {
  const parts = activeRoom?.startsWith('dm-') ? activeRoom.replace('dm-', '').split('-') : [];
  const otherUserId = parts.find(id => id !== currentUser.id) || 'system';
  const otherUser = users.find(u => u.id === otherUserId) || {
    id: 'system',
    username: 'ChatBot AI',
    avatar: '🤖',
    status: 'online',
    bio: 'Official Nexora AI Assistant'
  };

  // Filter attachments sent in this room
  const mediaFiles = messages
    .filter(m => m.attachment && m.attachment.url)
    .map(m => m.attachment);

  return (
    <aside className="info-panel animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={16} color="var(--primary-accent)" /> Contact Info
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* Contact Card */}
      <div style={{
        padding: '20px 14px',
        background: 'var(--bg-dark-header)',
        borderRadius: '12px',
        border: '1px solid var(--bg-glass-border)',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
          {otherUser.avatar || '👤'}
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '2px' }}>
          {otherUser.username}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--whatsapp-green)', fontWeight: 600, marginBottom: '8px' }}>
          {otherUser.status === 'online' ? '● Online' : 'Offline'}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
          "{otherUser.bio || 'Hey there! I am using Nexora.'}"
        </p>
      </div>

      {/* Shared Media Gallery */}
      <div>
        <div className="section-label" style={{ marginBottom: '10px' }}>
          <ImageIcon size={14} /> SHARED MEDIA ({mediaFiles.length})
        </div>

        {mediaFiles.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            No media attachments shared in this chat yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {mediaFiles.map((file, idx) => (
              <div
                key={idx}
                onClick={() => onOpenMedia(file.url)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 'var(--border-radius-sm)',
                  overflow: 'hidden',
                  border: '1px solid var(--bg-glass-border)',
                  cursor: 'pointer',
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {file.type?.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FileText size={20} color="var(--cyan-accent)" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
