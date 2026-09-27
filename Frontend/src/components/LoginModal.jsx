import React, { useState } from 'react';
import { User, Sparkles, Radio, Check } from 'lucide-react';

const AVATAR_PRESETS = ['🚀', '🦊', '⚡', '🐉', '👾', '💎', '🐱', '🐼', '🤖', '👑', '🌈', '🔥'];

export default function LoginModal({ onLogin }) {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('🚀');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('online');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a display name to enter the chat');
      return;
    }
    setError('');
    onLogin({
      username: username.trim(),
      avatar,
      bio: bio.trim() || 'Excited to chat!',
      status
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel animate-fadeIn">
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '2.5rem', 
            marginBottom: '10px',
            display: 'inline-block',
            padding: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            borderRadius: '50%',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            💬
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 800 }}>
            Join Nexora
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Enter your display name & pick an avatar to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Display Name *
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. Alex Sterling"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            {error && <p style={{ color: 'var(--rose-accent)', fontSize: '0.78rem', marginTop: '4px' }}>{error}</p>}
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Select Avatar Persona
            </label>
            <div className="avatar-grid">
              {AVATAR_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`avatar-choice ${avatar === emoji ? 'selected' : ''}`}
                  onClick={() => setAvatar(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Status Message (Optional)
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="What are you working on?"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Initial Status
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'online', label: 'Online', color: 'var(--emerald-accent)' },
                { id: 'away', label: 'Away', color: 'var(--amber-accent)' },
                { id: 'busy', label: 'Do Not Disturb', color: 'var(--rose-accent)' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--border-radius-md)',
                    border: `1px solid ${status === s.id ? s.color : 'var(--bg-glass-border)'}`,
                    background: status === s.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span className={`status-dot ${s.id}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="glass-btn glass-btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '10px', fontSize: '1rem' }}
          >
            <Sparkles size={18} /> Enter Workspace
          </button>
        </form>
      </div>
    </div>
  );
}
