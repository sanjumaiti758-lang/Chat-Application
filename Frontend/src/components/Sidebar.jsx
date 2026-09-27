import React, { useState } from 'react';
import { 
  Search, 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  LogOut,
  User,
  UserPlus
} from 'lucide-react';

export default function Sidebar({
  users = [],
  currentUser,
  activeRoom,
  onSelectRoom,
  unreadCounts = {},
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onLogout,
  onNewUserTab
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const otherUsers = users.filter(u => u.id !== currentUser.id &&
    (u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (u.bio && u.bio.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const getUnread = (roomId) => unreadCounts[roomId] || 0;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-title">
          <span>💬</span> Nexora
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="glass-btn"
            style={{ padding: '6px', color: 'var(--whatsapp-green)' }}
            onClick={onNewUserTab}
            title="Chat as Another User (New Tab)"
          >
            <UserPlus size={16} />
          </button>
          <button
            className="glass-btn"
            style={{ padding: '6px' }}
            onClick={onToggleSound}
            title={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
          >
            {soundEnabled ? <Volume2 size={16} color="var(--primary-accent)" /> : <VolumeX size={16} color="var(--text-dim)" />}
          </button>
          <button
            className="glass-btn"
            style={{ padding: '6px' }}
            onClick={onToggleTheme}
            title="Toggle Dark/Light theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="sidebar-section">
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="glass-input"
            style={{ paddingLeft: '32px', fontSize: '0.82rem', padding: '7px 10px 7px 32px' }}
            placeholder="Search or start new chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* WhatsApp Chats & Contacts List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="sidebar-section">
          <div className="section-label">
            <span>CHATS & CONTACTS ({otherUsers.length})</span>
          </div>

          {otherUsers.length === 0 ? (
            <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <MessageSquare size={24} style={{ marginBottom: '8px', color: 'var(--primary-accent)' }} />
              <p>No other contacts online yet.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Open a 2nd browser tab to test 1-on-1 direct chat!</p>
            </div>
          ) : (
            otherUsers.map(user => {
              const dmRoomId = `dm-${[currentUser.id, user.id].sort().join('-')}`;
              const isActive = activeRoom === dmRoomId;
              const unread = getUnread(dmRoomId);

              return (
                <div
                  key={user.id}
                  className={`user-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectRoom(dmRoomId)}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', fontSize: '1.4rem', flexShrink: 0 }}>
                      {user.avatar || '👤'}
                      <span
                        className={`status-dot ${user.status || 'online'}`}
                        style={{ position: 'absolute', bottom: -2, right: -2, width: 9, height: 9 }}
                      />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.username}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.bio || 'Available on WhatsApp'}
                      </div>
                    </div>
                  </div>

                  {unread > 0 && <span className="unread-badge">{unread}</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* User Profile Bar Footer */}
      <div className="user-profile-bar">
        <div className="user-avatar-wrapper">
          {currentUser.avatar}
          <span className={`status-dot ${currentUser.status}`} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.username} (You)
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentUser.bio}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="glass-btn"
            style={{ padding: '6px', color: 'var(--whatsapp-green)' }}
            onClick={onNewUserTab}
            title="Chat as another user in a new tab"
          >
            <UserPlus size={16} />
          </button>
          <button
            className="glass-btn"
            style={{ padding: '6px', color: 'var(--rose-accent)' }}
            onClick={onLogout}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
