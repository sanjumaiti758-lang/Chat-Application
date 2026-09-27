import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import LoginModal from './components/LoginModal';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InfoPanel from './components/InfoPanel';
import MediaLightbox from './components/MediaLightbox';
import { sounds } from './utils/SoundEffects';

// Initialize Socket.io connection instance
const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.port && window.location.port !== '5000') {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const socket = io(getSocketUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

// Helper to normalize DM room IDs consistently across frontend
export const normalizeRoomId = (roomId, currentUserId) => {
  if (!roomId) return 'general';
  if (roomId === 'system' || roomId === 'dm-system') {
    if (currentUserId) {
      return `dm-${[currentUserId, 'system'].sort().join('-')}`;
    }
    return 'dm-system';
  }
  if (roomId.startsWith('dm-')) {
    const raw = roomId.slice(3);
    const parts = raw.split('-');
    if (parts.length === 2) {
      return `dm-${parts.sort().join('-')}`;
    }
  }
  return roomId;
};

const DEFAULT_CONTACTS = [
  { id: 'system', username: 'ChatBot AI', avatar: '🤖', bio: 'Official Nexora AI Assistant • Online 24/7', status: 'online' }
];

const mergeUsersWithDefaults = (fetchedUsers = []) => {
  const map = new Map();
  DEFAULT_CONTACTS.forEach(u => map.set(u.id, u));
  fetchedUsers.forEach(u => map.set(u.id, u));
  return Array.from(map.values());
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const sessionSaved = sessionStorage.getItem('nexora_user') || sessionStorage.getItem('chatpulse_user');
    if (sessionSaved) {
      try { return JSON.parse(sessionSaved); } catch (e) {}
    }
    const localSaved = localStorage.getItem('nexora_user') || localStorage.getItem('chatpulse_user');
    if (localSaved) {
      try {
        const u = JSON.parse(localSaved);
        sessionStorage.setItem('nexora_user', JSON.stringify(u));
        return u;
      } catch (e) {}
    }
    return null;
  });

  const [activeRoom, setActiveRoom] = useState(() => {
    return currentUser ? normalizeRoomId('system', currentUser.id) : 'dm-system';
  });
  const [users, setUsers] = useState(DEFAULT_CONTACTS);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);

  // UI state toggles
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [lightboxMediaUrl, setLightboxMediaUrl] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  const [theme, setTheme] = useState(() => localStorage.getItem('nexora_theme') || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const activeRoomRef = useRef(activeRoom);
  activeRoomRef.current = activeRoom;

  // Apply theme attribute to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexora_theme', theme);
  }, [theme]);

  // Connect socket and listen for real-time events once user logs in
  useEffect(() => {
    if (!currentUser) return;

    const onConnect = () => {
      socket.emit('user_login', currentUser, (response) => {
        if (response && response.success) {
          if (response.users) setUsers(mergeUsersWithDefaults(response.users));
          const defaultRoom = normalizeRoomId(response.defaultRoom || 'system', currentUser.id);
          
          setActiveRoom(defaultRoom);
          activeRoomRef.current = defaultRoom;

          socket.emit('join_room', defaultRoom, (roomRes) => {
            if (roomRes && roomRes.success) {
              setMessages(roomRes.messages || []);
            }
          });
        }
      });
    };

    socket.on('connect', onConnect);
    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    // Event Listeners
    socket.on('users_update', (updatedUsers) => {
      setUsers(mergeUsersWithDefaults(updatedUsers));
    });

    socket.on('new_message', (newMsg) => {
      if (!newMsg || !currentUser) return;

      const normMsgRoom = normalizeRoomId(newMsg.roomId, currentUser.id);
      const normActiveRoom = normalizeRoomId(activeRoomRef.current, currentUser.id);

      // If this is a DM room, ensure the current user is a participant
      if (normMsgRoom.startsWith('dm-') && !normMsgRoom.includes(currentUser.id)) {
        return;
      }

      const isCurrentRoom = (normMsgRoom === normActiveRoom);

      if (isCurrentRoom) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender?.id !== currentUser.id) {
          sounds.playReceived();
        }
      } else {
        // Increment unread count for other participating rooms
        setUnreadCounts(prev => ({
          ...prev,
          [normMsgRoom]: (prev[normMsgRoom] || 0) + 1
        }));
        sounds.playReceived();
      }
    });

    socket.on('user_typing_start', ({ userId, username, roomId }) => {
      const normRoom = normalizeRoomId(roomId, currentUser.id);
      setTypingUsers(prev => {
        if (!prev.some(t => t.userId === userId && normalizeRoomId(t.roomId, currentUser.id) === normRoom)) {
          return [...prev, { userId, username, roomId: normRoom }];
        }
        return prev;
      });
    });

    socket.on('user_typing_stop', ({ userId, roomId }) => {
      const normRoom = normalizeRoomId(roomId, currentUser.id);
      setTypingUsers(prev => prev.filter(t => !(t.userId === userId && normalizeRoomId(t.roomId, currentUser.id) === normRoom)));
    });

    socket.on('message_reaction_update', ({ roomId, messageId, reactions }) => {
      if (normalizeRoomId(roomId, currentUser.id) === normalizeRoomId(activeRoomRef.current, currentUser.id)) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
      }
    });

    socket.on('message_updated', ({ roomId, messageId, newText, edited }) => {
      if (normalizeRoomId(roomId, currentUser.id) === normalizeRoomId(activeRoomRef.current, currentUser.id)) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText, edited } : m));
      }
    });

    socket.on('message_deleted', ({ roomId, messageId }) => {
      if (normalizeRoomId(roomId, currentUser.id) === normalizeRoomId(activeRoomRef.current, currentUser.id)) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('users_update');
      socket.off('new_message');
      socket.off('user_typing_start');
      socket.off('user_typing_stop');
      socket.off('message_reaction_update');
      socket.off('message_updated');
      socket.off('message_deleted');
    };
  }, [currentUser]);

  // Handle Login submission
  const handleLogin = (userData) => {
    const userWithId = { ...userData, id: 'usr_' + Date.now() };
    const defaultRoom = normalizeRoomId('system', userWithId.id);
    setCurrentUser(userWithId);
    setActiveRoom(defaultRoom);
    activeRoomRef.current = defaultRoom;
    sessionStorage.setItem('nexora_user', JSON.stringify(userWithId));
    localStorage.setItem('nexora_user', JSON.stringify(userWithId));
  };

  // Handle Room / Contact Switch
  const handleSelectRoom = (roomId) => {
    const targetRoom = normalizeRoomId(roomId, currentUser?.id);

    setActiveRoom(targetRoom);
    activeRoomRef.current = targetRoom;
    setReplyingTo(null);

    // Clear unread count for selected room
    setUnreadCounts(prev => ({ ...prev, [targetRoom]: 0, [roomId]: 0 }));

    socket.emit('join_room', targetRoom, (response) => {
      if (response && response.success) {
        const finalRoom = normalizeRoomId(response.roomId || targetRoom, currentUser?.id);
        if (finalRoom !== activeRoomRef.current) {
          setActiveRoom(finalRoom);
          activeRoomRef.current = finalRoom;
        }
        setMessages(response.messages || []);
      }
    });
  };

  // Send Message
  const handleSendMessage = (msgPayload) => {
    if (!currentUser) return;
    if (!socket.connected) {
      socket.connect();
    }

    const currentRoom = normalizeRoomId(activeRoomRef.current || activeRoom, currentUser.id);

    socket.emit('send_message', {
      roomId: currentRoom,
      userId: currentUser.id,
      user: currentUser.username,
      avatar: currentUser.avatar,
      ...msgPayload
    }, (res) => {
      if (res && res.success && res.message) {
        sounds.playSent();
        const msgRoom = normalizeRoomId(res.message.roomId || currentRoom, currentUser.id);
        if (msgRoom !== normalizeRoomId(activeRoomRef.current, currentUser.id)) {
          setActiveRoom(msgRoom);
          activeRoomRef.current = msgRoom;
        }
        setMessages(prev => {
          if (prev.some(m => m.id === res.message.id)) return prev;
          return [...prev, res.message];
        });
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
    sessionStorage.removeItem('nexora_user');
    localStorage.removeItem('nexora_user');
    setCurrentUser(null);
    socket.disconnect();
  };

  // Open 2nd user chat session in a new tab without logging out
  const handleNewUserTab = () => {
    const newWindow = window.open(window.location.origin, '_blank');
    if (newWindow) {
      newWindow.sessionStorage?.clear();
    }
  };

  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Navigation Sidebar (WhatsApp Contacts & Chats) */}
      <Sidebar
        users={users}
        currentUser={currentUser}
        activeRoom={activeRoom}
        onSelectRoom={handleSelectRoom}
        unreadCounts={unreadCounts}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onLogout={handleLogout}
        onNewUserTab={handleNewUserTab}
      />

      {/* Primary Chat Area */}
      <ChatArea
        activeRoom={activeRoom}
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

      {/* Contact Details Drawer */}
      {showInfoPanel && (
        <InfoPanel
          activeRoom={activeRoom}
          users={users}
          messages={messages}
          currentUser={currentUser}
          onClose={() => setShowInfoPanel(false)}
          onOpenMedia={(url) => setLightboxMediaUrl(url)}
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
