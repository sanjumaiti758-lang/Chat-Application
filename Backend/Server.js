import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve Frontend dist static assets if available
const frontendDist = path.join(__dirname, '../Frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// In-Memory Data Store
const defaultChannels = [
  { id: 'general', name: 'general', description: 'General discussion for everyone', isPrivate: false, category: 'Main' },
  { id: 'tech-talk', name: 'tech-talk', description: 'Tech, coding, and software architecture', isPrivate: false, category: 'Topics' },
  { id: 'random', name: 'random', description: 'Memes, jokes, and off-topic banter', isPrivate: false, category: 'Main' },
  { id: 'gaming', name: 'gaming', description: 'Game discussions and multiplayer lobbies', isPrivate: false, category: 'Topics' },
  { id: 'music', name: 'music', description: 'Share tunes, playlists, and recommendations', isPrivate: false, category: 'Topics' },
  { id: 'announcements', name: 'announcements', description: 'Official updates and news', isPrivate: false, category: 'Main' }
];

const channels = new Map(defaultChannels.map(c => [c.id, c]));
const activeUsers = new Map(); // socketId -> user object { id, username, avatar, status, customStatus, currentRoom }
const userRegistry = new Map(); // userId -> user profile object
const messages = new Map(); // roomId -> array of message objects

// Seed initial system welcome message in #general
messages.set('general', [
  {
    id: uuidv4(),
    roomId: 'general',
    sender: {
      id: 'system',
      username: 'ChatBot AI',
      avatar: '🤖',
      status: 'online'
    },
    text: '👋 **Welcome to ChatPulse!** Real-time messaging, channels, direct messages, media sharing & voice notes. Type your first message below to join the conversation!',
    timestamp: new Date().toISOString(),
    reactions: { '🚀': ['system'], '❤️': ['system'] },
    isSystem: true
  }
]);

// Initialize Socket.io Server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8 // 100 MB max for base64 audio/images
});

io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  // 1. User Login / Registration
  socket.on('user_login', (userData, callback) => {
    const userId = userData.id || uuidv4();
    const userProfile = {
      id: userId,
      socketId: socket.id,
      username: userData.username || 'Anonymous User',
      avatar: userData.avatar || '👤',
      bio: userData.bio || 'Available for chat',
      status: userData.status || 'online', // online, away, busy, offline
      joinedAt: new Date().toISOString()
    };

    activeUsers.set(socket.id, userProfile);
    userRegistry.set(userId, userProfile);

    // Join default room 'general'
    socket.join('general');
    userProfile.currentRoom = 'general';

    // Broadcast updated user list
    io.emit('users_update', Array.from(userRegistry.values()));
    io.emit('channels_update', Array.from(channels.values()));

    // Send history of general channel to newly logged in user
    const roomMessages = messages.get('general') || [];
    
    if (callback) {
      callback({
        success: true,
        user: userProfile,
        channels: Array.from(channels.values()),
        messages: roomMessages
      });
    }

    // Broadcast system notification in room
    socket.to('general').emit('user_joined_room', {
      user: userProfile,
      roomId: 'general',
      text: `${userProfile.username} joined the chat!`
    });
  });

  // 2. User Status Update (Online, Away, Busy)
  socket.on('user_status_change', (status) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      user.status = status;
      if (userRegistry.has(user.id)) {
        userRegistry.get(user.id).status = status;
      }
      io.emit('users_update', Array.from(userRegistry.values()));
    }
  });

  // 3. Switch / Join Room
  socket.on('join_room', (roomId, callback) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    // Leave previous room if any
    if (user.currentRoom) {
      socket.leave(user.currentRoom);
    }

    socket.join(roomId);
    user.currentRoom = roomId;

    if (!messages.has(roomId)) {
      messages.set(roomId, []);
    }

    const roomMessages = messages.get(roomId) || [];

    if (callback) {
      callback({
        success: true,
        roomId,
        messages: roomMessages
      });
    }
  });

  // 4. Create New Channel
  socket.on('create_channel', (channelData, callback) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const channelId = channelData.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    if (channels.has(channelId)) {
      if (callback) callback({ success: false, error: 'Channel name already exists' });
      return;
    }

    const newChannel = {
      id: channelId,
      name: channelData.name.toLowerCase().replace(/\s+/g, '-'),
      description: channelData.description || '',
      isPrivate: channelData.isPrivate || false,
      category: channelData.category || 'Custom',
      createdBy: user.username
    };

    channels.set(channelId, newChannel);
    messages.set(channelId, []);

    io.emit('channels_update', Array.from(channels.values()));

    if (callback) callback({ success: true, channel: newChannel });
  });

  // 5. Send Message
  socket.on('send_message', (data, callback) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { roomId, text, attachment, voiceNote, replyTo } = data;
    if (!roomId) return;

    const newMessage = {
      id: uuidv4(),
      roomId,
      sender: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        status: user.status
      },
      text: text || '',
      attachment: attachment || null, // { url, name, type, size }
      voiceNote: voiceNote || null,   // { url, duration }
      replyTo: replyTo || null,       // { id, username, text }
      timestamp: new Date().toISOString(),
      reactions: {},
      edited: false
    };

    if (!messages.has(roomId)) {
      messages.set(roomId, []);
    }
    messages.get(roomId).push(newMessage);

    // Limit memory history to 500 messages per room
    if (messages.get(roomId).length > 500) {
      messages.get(roomId).shift();
    }

    // Broadcast to everyone in the room (or direct message room)
    io.to(roomId).emit('new_message', newMessage);

    // Also broadcast to recipient if DM room
    if (roomId.startsWith('dm-')) {
      const parts = roomId.replace('dm-', '').split('-');
      const recipientId = parts.find(id => id !== user.id);
      if (recipientId) {
        // Find recipient's socket
        for (const [sId, u] of activeUsers.entries()) {
          if (u.id === recipientId) {
            io.to(sId).emit('dm_notification', {
              sender: user,
              message: newMessage
            });
          }
        }
      }
    }

    if (callback) callback({ success: true, message: newMessage });
  });

  // 6. Typing Indicators
  socket.on('typing_start', ({ roomId }) => {
    const user = activeUsers.get(socket.id);
    if (user && roomId) {
      socket.to(roomId).emit('user_typing_start', {
        userId: user.id,
        username: user.username,
        roomId
      });
    }
  });

  socket.on('typing_stop', ({ roomId }) => {
    const user = activeUsers.get(socket.id);
    if (user && roomId) {
      socket.to(roomId).emit('user_typing_stop', {
        userId: user.id,
        username: user.username,
        roomId
      });
    }
  });

  // 7. Add / Remove Reaction
  socket.on('add_reaction', ({ roomId, messageId, emoji }) => {
    const user = activeUsers.get(socket.id);
    if (!user || !roomId || !messageId) return;

    const roomMsgs = messages.get(roomId);
    if (!roomMsgs) return;

    const msg = roomMsgs.find(m => m.id === messageId);
    if (!msg) return;

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const userIndex = msg.reactions[emoji].indexOf(user.id);
    if (userIndex > -1) {
      // Toggle off if already reacted
      msg.reactions[emoji].splice(userIndex, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      // Add reaction
      msg.reactions[emoji].push(user.id);
    }

    io.to(roomId).emit('message_reaction_update', {
      roomId,
      messageId,
      reactions: msg.reactions
    });
  });

  // 8. Edit Message
  socket.on('edit_message', ({ roomId, messageId, newText }) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const roomMsgs = messages.get(roomId);
    if (!roomMsgs) return;

    const msg = roomMsgs.find(m => m.id === messageId);
    if (msg && msg.sender.id === user.id) {
      msg.text = newText;
      msg.edited = true;

      io.to(roomId).emit('message_updated', {
        roomId,
        messageId,
        newText,
        edited: true
      });
    }
  });

  // 9. Delete Message
  socket.on('delete_message', ({ roomId, messageId }) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const roomMsgs = messages.get(roomId);
    if (!roomMsgs) return;

    const msgIdx = roomMsgs.findIndex(m => m.id === messageId);
    if (msgIdx > -1 && roomMsgs[msgIdx].sender.id === user.id) {
      roomMsgs.splice(msgIdx, 1);

      io.to(roomId).emit('message_deleted', {
        roomId,
        messageId
      });
    }
  });

  // 10. Disconnect
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`[Socket] User disconnected: ${user.username} (${user.id})`);
      user.status = 'offline';
      if (userRegistry.has(user.id)) {
        userRegistry.get(user.id).status = 'offline';
      }
      activeUsers.delete(socket.id);

      io.emit('users_update', Array.from(userRegistry.values()));
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 ChatPulse Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.io WebSocket Engine Ready`);
  console.log(`==================================================`);
});
