import React from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function MediaLightbox({ mediaUrl, onClose }) {
  if (!mediaUrl) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        style={{ 
          position: 'relative', 
          maxWidth: '90vw', 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          position: 'absolute',
          top: -40,
          right: 0,
          display: 'flex',
          gap: '10px'
        }}>
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'white', background: 'rgba(0,0,0,0.5)', padding: '6px', borderRadius: '50%' }}
            title="Open in new tab"
          >
            <ExternalLink size={20} />
          </a>
          <button
            onClick={onClose}
            style={{ color: 'white', background: 'rgba(0,0,0,0.5)', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <img
          src={mediaUrl}
          alt="Expanded Media Preview"
          style={{
            maxWidth: '100%',
            maxHeight: '85vh',
            borderRadius: 'var(--border-radius-md)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            objectFit: 'contain'
          }}
        />
      </div>
    </div>
  );
}
