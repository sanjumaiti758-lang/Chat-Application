import React from 'react';
import { 
  Users, 
  Image as ImageIcon, 
  FileText, 
  ShieldCheck, 
  Info, 
  X, 
  Hash, 
  Lock 
} from 'lucide-react';

export default function InfoPanel({
  activeRoom,
  channels = [],
  users = [],
  messages = [],
  currentUser,
  onClose,
  onOpenMedia
}) {
  const isDM = activeRoom?.startsWith('dm-');
  let roomName = activeRoom;
  let roomDesc = '';
  let category = '';

  if (isDM) {
    const parts = activeRoom.replace('dm-', '').split('-');
    const otherUserId = parts.find(id => id !== currentUser.id);
    const otherUser = users.find(u => u.id === otherUserId);
    roomName = otherUser ? `@${otherUser.username}` : 'Direct Chat';
    roomDesc = otherUser?.bio || 'Private 1-on-1 discussion';
  } else {
    const ch = channels.find(c => c.id === activeRoom);
    if (ch) {
      roomName = `#${ch.name}`;
      roomDesc = ch.description || 'Channel conversation';
      category = ch.category || 'General';
    }
  }

  // Filter attachments sent in this room
  const mediaFiles = messages
    .filter(m => m.attachment && m.attachment.url)
    .map(m => m.attachment);

  return (
    <aside className="info-panel animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={16} color="var(--primary-accent)" /> Details
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* Room Overview Card */}
      <div style={{
        padding: '14px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--bg-glass-border)',
        marginBottom: '20px'
      }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
          {roomName}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          {roomDesc}
        </p>
        {category && (
          <div style={{ marginTop: '8px' }}>
            <span className="badge badge-primary">{category}</span>
          </div>
        )}
      </div>

      {/* Active Room Members */}
      <div style={{ marginBottom: '24px' }}>
        <div className="section-label" style={{ marginBottom: '10px' }}>
          <Users size={14} /> MEMBERS ({users.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {users.map(u => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: 'var(--border-radius-md)',
                background: 'rgba(255, 255, 255, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative', fontSize: '1.1rem' }}>
                  {u.avatar}
                  <span className={`status-dot ${u.status}`} style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8 }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {u.username} {u.id === currentUser.id && '(You)'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{u.bio}</div>
                </div>
              </div>

              {u.id === currentUser.id && <ShieldCheck size={14} color="var(--primary-accent)" />}
            </div>
          ))}
        </div>
      </div>

      {/* Shared Media Gallery */}
      <div>
        <div className="section-label" style={{ marginBottom: '10px' }}>
          <ImageIcon size={14} /> SHARED MEDIA ({mediaFiles.length})
        </div>

        {mediaFiles.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            No media attachments shared in this channel yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
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
