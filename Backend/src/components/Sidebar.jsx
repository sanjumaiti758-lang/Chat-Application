import React, { useState } from 'react';
import { 
  Hash, 
  Lock, 
  Plus, 
  Search, 
  MessageSquare, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function Sidebar({
  channels = [],
  users = [],
  currentUser,
  activeRoom,
  onSelectRoom,
  onOpenCreateChannel,
  unreadCounts = {},
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onLogout
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const otherUsers = users.filter(u => u.id !== currentUser.id &&
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search channels or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Channels Section */}
        <div className="sidebar-section">
          <div className="section-label">
            <span>CHANNELS ({filteredChannels.length})</span>
            <button
              onClick={onOpenCreateChannel}
              style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Create new channel"
            >
              <Plus size={16} />
            </button>
          </div>

          {filteredChannels.map(channel => {
            const isActive = activeRoom === channel.id;
            const unread = getUnread(channel.id);

            return (
              <div
                key={channel.id}
                className={`channel-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectRoom(channel.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  {channel.isPrivate ? <Lock size={15} color="var(--amber-accent)" /> : <Hash size={15} color="var(--primary-accent)" />}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {channel.name}
                  </span>
                </div>
                {unread > 0 && <span className="unread-badge">{unread}</span>}
              </div>
            );
          })}
        </div>

        {/* Direct Messages Section */}
        <div className="sidebar-section" style={{ marginTop: '10px' }}>
          <div className="section-label">
            <span>DIRECT MESSAGES ({otherUsers.length})</span>
          </div>

          {otherUsers.length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', padding: '0 8px' }}>
              No other users online yet. Open another browser tab to test 1-on-1 chat!
            </p>
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
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative', fontSize: '1.1rem' }}>
                      {user.avatar}
                      <span
                        className={`status-dot ${user.status}`}
                        style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8 }}
                      />
                    </div>
                    <span style={{ fontSize: '0.88rem' }}>{user.username}</span>
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
              {currentUser.username}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentUser.bio}
          </p>
        </div>

        <button
          className="glass-btn"
          style={{ padding: '6px', color: 'var(--rose-accent)' }}
          onClick={onLogout}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
