import React, { useState } from 'react';
import { Hash, Lock, Plus, X } from 'lucide-react';

export default function CreateChannelModal({ onCreate, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim(),
      category,
      isPrivate
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel animate-fadeIn" style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash color="var(--primary-accent)" /> Create Channel
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Channel Name *
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. project-launch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Description
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="What is this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Category
            </label>
            <select
              className="glass-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ background: 'var(--bg-dark-elevated)' }}
            >
              <option value="Main">Main</option>
              <option value="Topics">Topics</option>
              <option value="Projects">Projects</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} color={isPrivate ? "var(--amber-accent)" : "var(--text-dim)"} />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Private Channel</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Only invited members can view</div>
              </div>
            </div>

            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="glass-btn" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="glass-btn glass-btn-primary" style={{ flex: 1 }}>
              <Plus size={16} /> Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
