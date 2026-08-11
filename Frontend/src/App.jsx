import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import LoginModal from './components/LoginModal';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InfoPanel from './components/InfoPanel';
import MediaLightbox from './components/MediaLightbox';
import CreateChannelModal from './components/CreateChannelModal';
import { sounds } from './utils/SoundEffects';

// Initialize Socket.io connection instance
const socket = io('/', {
  autoConnect: false,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('chatpulse_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeRoom, setActiveRoom] = useState('general');
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);

  // UI state toggles
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lightboxMediaUrl, setLightboxMediaUrl] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  const [theme, setTheme] = useState(() => localStorage.getItem('chatpulse_theme') || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const activeRoomRef = useRef(activeRoom);
  activeRoomRef.current = activeRoom;

  // Apply theme attribute to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chatpulse_theme', theme);
  }, [theme]);

  // Connect socket and listen for real-time events once user logs in
  useEffect(() => {
    if (!currentUser) return;

    socket.connect();

    // Authenticate with server
    socket.emit('user_login', currentUser, (response) => {
      if (response && response.success) {
        setChannels(response.channels || []);
        setMessages(response.messages || []);
      }
    });

    // Event Listeners
    socket.on('users_update', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on('channels_update', (updatedChannels) => {
      setChannels(updatedChannels);
    });

    socket.on('new_message', (newMsg) => {
      if (newMsg.roomId === activeRoomRef.current) {
        setMessages(prev => [...prev, newMsg]);
        if (newMsg.sender?.id !== currentUser.id) {
          sounds.playReceived();
        }
      } else {
        // Increment unread count for other rooms
        setUnreadCounts(prev => ({
          ...prev,
          [newMsg.roomId]: (prev[newMsg.roomId] || 0) + 1
        }));
        sounds.playReceived();
      }
    });

    socket.on('user_typing_start', ({ userId, username, roomId }) => {
      setTypingUsers(prev => {
        if (!prev.some(t => t.userId === userId && t.roomId === roomId)) {
          return [...prev, { userId, username, roomId }];
        }
        return prev;
      });
    });

    socket.on('user_typing_stop', ({ userId, roomId }) => {
      setTypingUsers(prev => prev.filter(t => !(t.userId === userId && t.roomId === roomId)));
    });

    socket.on('message_reaction_update', ({ roomId, messageId, reactions }) => {
      if (roomId === activeRoomRef.current) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
      }
    });

    socket.on('message_updated', ({ roomId, messageId, newText, edited }) => {
      if (roomId === activeRoomRef.current) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText, edited } : m));
      }
    });

    socket.on('message_deleted', ({ roomId, messageId }) => {
      if (roomId === activeRoomRef.current) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    });

    return () => {
      socket.off('users_update');
      socket.off('channels_update');
      socket.off('new_message');
      socket.off('user_typing_start');
      socket.off('user_typing_stop');
      socket.off('message_reaction_update');
      socket.off('message_updated');
      socket.off('message_deleted');
      socket.disconnect();
    };
  }, [currentUser]);

  // Handle Login submission
  const handleLogin = (userData) => {
    const userWithId = { ...userData, id: 'usr_' + Date.now() };
    setCurrentUser(userWithId);
    localStorage.setItem('chatpulse_user', JSON.stringify(userWithId));
  };

  // Handle Room / Channel / DM Switch
  const handleSelectRoom = (roomId) => {
    setActiveRoom(roomId);
    setReplyingTo(null);

    // Clear unread count for selected room
    setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));

    socket.emit('join_room', roomId, (response) => {
      if (response && response.success) {
        setMessages(response.messages || []);
      }
    });
  };

  // Create Channel
  const handleCreateChannel = (channelData) => {
    socket.emit('create_channel', channelData, (response) => {
      if (response && response.success) {
        setShowCreateModal(false);
        handleSelectRoom(response.channel.id);
      } else {
        alert(response?.error || 'Failed to create channel');
      }
    });
  };

  // Send Message
  const handleSendMessage = (msgPayload) => {
    socket.emit('send_message', {
      roomId: activeRoom,
      ...msgPayload
    }, (res) => {
      if (res && res.success) {
        sounds.playSent();
      }
    });
  };

  // Typing event triggers
  const handleTypingStart = () => {
    socket.emit('typing_start', { roomId: activeRoom });
  };

  const handleTypingStop = () => {
    socket.emit('typing_stop', { roomId: activeRoom });
  };

  // Add Reaction
  const handleAddReaction = (roomId, messageId, emoji) => {
    socket.emit('add_reaction', { roomId, messageId, emoji });
  };

  // Edit Message
  const handleEditMessage = (messageId, newText) => {
    socket.emit('edit_message', { roomId: activeRoom, messageId, newText });
  };

  // Delete Message
  const handleDeleteMessage = (roomId, messageId) => {
    socket.emit('delete_message', { roomId, messageId });
  };

  // Toggle Sound effects
  const handleToggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundEnabled(newState);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('chatpulse_user');
    setCurrentUser(null);
    socket.disconnect();
  };

  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Background Animated Ambient Orbs */}
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      {/* Navigation Sidebar */}
      <Sidebar
        channels={channels}
        users={users}
        currentUser={currentUser}
        activeRoom={activeRoom}
        onSelectRoom={handleSelectRoom}
        onOpenCreateChannel={() => setShowCreateModal(true)}
        unreadCounts={unreadCounts}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onLogout={handleLogout}
      />

      {/* Primary Chat Area */}
      <ChatArea
        activeRoom={activeRoom}
        channels={channels}
        users={users}
        messages={messages}
        currentUser={currentUser}
        typingUsers={typingUsers}
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        onAddReaction={handleAddReaction}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onReplyMessage={(msg) => setReplyingTo(msg)}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onToggleInfoPanel={() => setShowInfoPanel(prev => !prev)}
        onOpenMedia={(url) => setLightboxMediaUrl(url)}
      />

      {/* Channel / DM Details Drawer */}
      {showInfoPanel && (
        <InfoPanel
          activeRoom={activeRoom}
          channels={channels}
          users={users}
          messages={messages}
          currentUser={currentUser}
          onClose={() => setShowInfoPanel(false)}
          onOpenMedia={(url) => setLightboxMediaUrl(url)}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateChannelModal
          onCreate={handleCreateChannel}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {lightboxMediaUrl && (
        <MediaLightbox
          mediaUrl={lightboxMediaUrl}
          onClose={() => setLightboxMediaUrl(null)}
        />
      )}
    </div>
  );
}
