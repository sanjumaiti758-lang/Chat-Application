import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Mic, 
  Square, 
  X, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

const POPULAR_EMOJIS = [
  '😀', '😂', '😍', '🔥', '🚀', '👍', '❤️', '🎉', 
  '✨', '🙌', '😎', '💡', '💯', '🥳', '🤯', '⭐',
  '💻', '☕', '⚡', '🐉', '🤖', '👑', '🌈', '🍕'
];

export default function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  replyingTo,
  onCancelReply,
  activeRoom
}) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle typing event triggers
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (onTypingStart) {
      onTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingStop) onTypingStop();
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent && e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Upload file attachment via backend API
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (response.ok) {
        setAttachment(data);
      } else {
        alert('File upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Voice Recording with MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          // Send voice note message
          onSendMessage({
            text: '🎙️ Voice note',
            voiceNote: { url: base64Audio, duration: recordingSeconds }
          });
        };
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Unable to access microphone. Please grant browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && !attachment) return;

    // Trigger celebratory confetti burst on party emoji or launch!
    if (text.includes('🎉') || text.includes('🚀') || text.includes('🔥')) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    }

    onSendMessage({
      text: text.trim(),
      attachment,
      replyTo: replyingTo ? { id: replyingTo.id, username: replyingTo.sender?.username, text: replyingTo.text } : null
    });

    setText('');
    setAttachment(null);
    setShowEmojiPicker(false);
    if (onCancelReply) onCancelReply();
    if (onTypingStop) onTypingStop();
  };

  return (
    <div className="input-container">
      {/* Reply Banner */}
      {replyingTo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'rgba(99, 102, 241, 0.15)',
          borderRadius: 'var(--border-radius-sm)',
          borderLeft: '3px solid var(--primary-accent)',
          marginBottom: '8px',
          fontSize: '0.82rem'
        }}>
          <span>Replying to <strong style={{ color: 'var(--primary-accent)' }}>@{replyingTo.sender?.username}</strong>: "{replyingTo.text.slice(0, 50)}..."</span>
          <button onClick={onCancelReply} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attachment Preview Banner */}
      {attachment && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid var(--bg-glass-border)',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '8px',
          fontSize: '0.82rem'
        }}>
          <Paperclip size={14} color="var(--cyan-accent)" />
          <span style={{ fontWeight: 600 }}>{attachment.name}</span>
          <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: 'var(--rose-accent)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="emoji-popover">
          {POPULAR_EMOJIS.map(emoji => (
            <button
              key={emoji}
              className="emoji-btn"
              onClick={() => {
                setText(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Field */}
      <div className="composer-box">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button
          className="glass-btn"
          style={{ padding: '8px', borderRadius: '50%' }}
          onClick={() => fileInputRef.current?.click()}
          title="Attach File / Image"
          disabled={isUploading}
        >
          <Paperclip size={18} color={attachment ? "var(--cyan-accent)" : "var(--text-muted)"} />
        </button>

        <button
          className="glass-btn"
          style={{ padding: '8px', borderRadius: '50%' }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Emoji Picker"
        >
          <Smile size={18} color="var(--amber-accent)" />
        </button>

        {isRecording ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--rose-accent)', fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--rose-accent)', animation: 'pulse 1s infinite' }} />
            Recording voice message ({recordingSeconds}s)...
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder={`Message ${activeRoom ? (activeRoom.startsWith('dm-') ? 'Direct Message' : `#${activeRoom}`) : 'chat'}...`}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
          />
        )}

        {isRecording ? (
          <button className="glass-btn" style={{ padding: '8px', borderRadius: '50%', background: 'var(--rose-accent)' }} onClick={stopRecording}>
            <Square size={16} color="white" />
          </button>
        ) : (
          <button
            className="glass-btn"
            style={{ padding: '8px', borderRadius: '50%' }}
            onClick={startRecording}
            title="Record Voice Note"
          >
            <Mic size={18} color="var(--text-muted)" />
          </button>
        )}

        <button
          className="glass-btn glass-btn-primary"
          style={{ padding: '8px 14px', borderRadius: 'var(--border-radius-md)' }}
          onClick={handleSubmit}
          disabled={!text.trim() && !attachment}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
