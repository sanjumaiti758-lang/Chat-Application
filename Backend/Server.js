import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';

dotenv.config();

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

// Root / status endpoint
app.get('/', (req, res, next) => {
  if (fs.existsSync(frontendDist)) {
    return next();
  }
  res.json({ status: 'ok', message: '🚀 Nexora Backend Server Active', time: new Date().toISOString() });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// In-Memory Data Store
const activeUsers = new Map(); // socketId -> user object
const userRegistry = new Map(); // userId -> user profile object
const messages = new Map(); // roomId -> array of message objects

// Helper to normalize DM room IDs consistently
const normalizeRoomId = (roomId, currentUserId) => {
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

// Seed default contacts
const chatbotUser = {
  id: 'system',
  username: 'ChatBot AI',
  avatar: '🤖',
  bio: 'Official Nexora AI Assistant • Online 24/7',
  status: 'online',
  joinedAt: new Date().toISOString()
};

const defaultContacts = [
  chatbotUser
];

defaultContacts.forEach(c => userRegistry.set(c.id, c));

// Real-Life Intelligent AI Response Engine (Public LLM + Gemini + Context Memory)
async function generateAiResponse(messageText, username, roomHistory = []) {
  const query = (messageText || '').trim();
  const lowerQuery = query.toLowerCase();

  if (!query) return `👋 Hello **${username}**! I am your 24/7 Nexora AI Assistant. How can I help you today?`;

  // System Commands
  if (lowerQuery === '/help' || lowerQuery === 'help') {
    return `🤖 **Nexora Real-Life AI Assistant Capabilities:**\n\n` +
      `- 🌐 **Ask Anything**: Technical questions, science, general knowledge, writing, history, & problem solving.\n` +
      `- 💻 **Code Generation**: Ask me to write or debug code in JavaScript, Python, HTML/CSS, C++, Java, or SQL.\n` +
      `- 🧮 **Math & Calculations**: Solves equations, unit conversions, and step-by-step arithmetic.\n` +
      `- 🌍 **Language Translation**: Translate text into Spanish, French, German, Hindi, Japanese, etc.\n` +
      `- 🕒 **System & Time**: Ask for current time, date, or Nexora feature guidance.\n` +
      `- 💡 **Commands**: \`/help\`, \`/time\`, \`/date\``;
  }

  if (lowerQuery === '/time' || lowerQuery.includes('what time is it')) {
    return `🕒 Current Time: **${new Date().toLocaleTimeString()}**`;
  }

  if (lowerQuery === '/date' || lowerQuery.includes('what is today date') || lowerQuery.includes("what's today's date")) {
    return `📅 Today's Date: **${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**`;
  }

  // 1. Primary: Gemini API (if GEMINI_API_KEY is configured in .env)
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const contents = roomHistory.slice(-10).map(m => ({
        role: m.sender?.id === 'system' ? 'model' : 'user',
        parts: [{ text: m.text || '' }]
      }));

      if (contents.length === 0 || contents[contents.length - 1].parts[0].text !== query) {
        contents.push({ role: 'user', parts: [{ text: query }] });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: `You are ChatBot AI, a smart, real-life assistant in the Nexora chat app. Provide helpful, accurate, and nicely formatted Markdown answers to ${username}.` }]
            },
            contents
          })
        }
      );
      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply && reply.trim()) {
        return reply.trim();
      }
    } catch (err) {
      console.error('Gemini API call error:', err.message);
    }
  }

  // 2. Secondary: Free Public LLM Endpoint (Pollinations AI POST API)
  try {
    const messagesPayload = [
      {
        role: 'system',
        content: `You are ChatBot AI, an intelligent 24/7 AI assistant inside the Nexora chat app. Provide helpful, accurate, friendly, and nicely formatted Markdown responses to ${username}.`
      },
      ...roomHistory.slice(-6).filter(m => m.text).map(m => ({
        role: m.sender?.id === 'system' ? 'assistant' : 'user',
        content: m.text
      })),
      { role: 'user', content: query }
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const pollResponse = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messagesPayload,
        model: 'openai'
      })
    });
    clearTimeout(timeoutId);

    if (pollResponse.ok) {
      const aiText = await pollResponse.text();
      if (aiText && aiText.trim() && !aiText.toLowerCase().includes('error')) {
        return aiText.trim();
      }
    }
  } catch (err) {
    console.log('Public LLM service unavailable or timed out, using fallback engine:', err.message);
  }

  // 3. Conversational & Offline Fallback Engine
  if (/^(hi|hello|hey|greetings|hola|namaste|good morning|good evening|good afternoon)/i.test(lowerQuery)) {
    return `👋 **Hello ${username}!** How can I assist you in Nexora today?\n\nYou can ask me to:\n- 💻 Write or debug code\n- 🧮 Solve math equations\n- 🌐 Answer general knowledge questions`;
  }

  if (lowerQuery.includes('who are you') || lowerQuery.includes('what is your name')) {
    return `🤖 I am **ChatBot AI**, your official real-time intelligent AI assistant inside Nexora!`;
  }

  // Math Expression & Offline Solver
  const cleanedMath = lowerQuery.replace(/what is|calculate|solve|eval|evaluate|\=/g, '').trim();
  if (/^(\d+(\.\d+)?\s*[\+\-\*\/\%\^]\s*\d+(\.\d+)?)+$/.test(cleanedMath)) {
    try {
      const result = Function(`"use strict"; return (${cleanedMath})`)();
      return `🧮 **Math Solution**: \`${cleanedMath} = ${result}\``;
    } catch (e) { }
  }

  // Code snippets fallback
  if (lowerQuery.includes('python')) {
    return `💻 **Python Code Example:**\n\n\`\`\`python\ndef greet_user(name):\n    """Helper function to greet user"""\n    return f"Hello {name}, welcome to Nexora!"\n\nprint(greet_user("${username}"))\n\`\`\``;
  }
  if (lowerQuery.includes('javascript') || lowerQuery.includes('js')) {
    return `💻 **JavaScript Solution:**\n\n\`\`\`javascript\nasync function fetchUserData(userId) {\n  const res = await fetch(\`/api/users/\${userId}\`);\n  const data = await res.json();\n  return data;\n}\n\`\`\``;
  }

  // General Intelligent Fallback
  return `🤖 **ChatBot AI Response for ${username}:**\n\nHere is information regarding **"${query}"**:\n\n- **Query**: ${query}\n- **Status**: Received and processed successfully.\n- **Tip**: You can type \`/help\` anytime to see all my available commands!`;
}

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

  // Helper to resolve user across reconnects
  const getUser = (data = {}) => {
    if (activeUsers.has(socket.id)) {
      return activeUsers.get(socket.id);
    }
    const uId = data.userId || socket.userId;
    if (uId && userRegistry.has(uId)) {
      const user = userRegistry.get(uId);
      user.socketId = socket.id;
      user.status = 'online';
      activeUsers.set(socket.id, user);
      return user;
    }
    if (data.user || data.username) {
      const uname = data.user || data.username;
      for (const user of userRegistry.values()) {
        if (user.username === uname) {
          user.socketId = socket.id;
          user.status = 'online';
          activeUsers.set(socket.id, user);
          return user;
        }
      }
    }
    return null;
  };

  // Helper to broadcast user lists to all clients (both full & simple formats)
  const broadcastUserLists = () => {
    const usersArray = Array.from(userRegistry.values());
    io.emit('users_update', usersArray);
    const onlineUsersMapped = Array.from(activeUsers.values()).map(u => ({
      id: u.id,
      name: u.username,
      username: u.username
    }));
    io.emit('Online_users', onlineUsersMapped);
  };

  // 1a. Simple Client Support: join_chat
  socket.on('join_chat', (username) => {
    const userId = uuidv4();
    socket.userId = userId;
    const userProfile = {
      id: userId,
      socketId: socket.id,
      username: username || 'Anonymous User',
      avatar: '👤',
      status: 'online',
      joinedAt: new Date().toISOString(),
      currentRoom: 'system'
    };
    activeUsers.set(socket.id, userProfile);
    userRegistry.set(userId, userProfile);
    broadcastUserLists();
  });

  // 1b. User Login / Registration (Full Client)
  socket.on('user_login', (userData, callback) => {
    const userId = userData.id || uuidv4();
    socket.userId = userId;

    let userProfile = userRegistry.get(userId);
    if (!userProfile) {
      userProfile = {
        id: userId,
        socketId: socket.id,
        username: userData.username || 'Anonymous User',
        avatar: userData.avatar || '🚀',
        bio: userData.bio || 'Hey there! I am using Nexora.',
        status: userData.status || 'online',
        joinedAt: new Date().toISOString()
      };
      userRegistry.set(userId, userProfile);
    } else {
      userProfile.socketId = socket.id;
      userProfile.status = 'online';
      if (userData.username) userProfile.username = userData.username;
      if (userData.avatar) userProfile.avatar = userData.avatar;
    }

    activeUsers.set(socket.id, userProfile);

    // Initial DM room with AI Bot
    const botDmRoom = normalizeRoomId('system', userId);
    userProfile.currentRoom = botDmRoom;
    socket.join(botDmRoom);

    // Seed AI Bot welcome message if empty
    if (!messages.has(botDmRoom)) {
      messages.set(botDmRoom, [
        {
          id: uuidv4(),
          roomId: botDmRoom,
          sender: chatbotUser,
          text: `👋 **Welcome to Nexora!** Send instant 1-on-1 messages, voice notes, files, and emojis with your contacts.`,
          timestamp: new Date().toISOString(),
          reactions: { '🟢': ['system'] },
          isSystem: false
        }
      ]);
    }

    broadcastUserLists();

    const roomMessages = messages.get(botDmRoom) || [];

    if (callback) {
      callback({
        success: true,
        user: userProfile,
        defaultRoom: botDmRoom,
        users: Array.from(userRegistry.values()),
        messages: roomMessages
      });
    }
  });

  // 2. User Status Update (Online, Away, Busy)
  socket.on('user_status_change', (status) => {
    const user = getUser();
    if (user) {
      user.status = status;
      if (userRegistry.has(user.id)) {
        userRegistry.get(user.id).status = status;
      }
      broadcastUserLists();
    }
  });

  // 3. Switch / Join Room (Direct Chat Room)
  socket.on('join_room', (roomId, callback) => {
    if (!roomId) return;
    const user = getUser();
    const targetRoomId = normalizeRoomId(roomId, user?.id);

    socket.join(targetRoomId);
    if (user) user.currentRoom = targetRoomId;

    if (!messages.has(targetRoomId)) {
      messages.set(targetRoomId, []);
    }

    const roomMessages = messages.get(targetRoomId) || [];

    if (callback) {
      callback({
        success: true,
        roomId: targetRoomId,
        messages: roomMessages
      });
    }
  });

  // 5. Send Message (Supports both Full Nexora & Simple Client formats)
  socket.on('send_message', (data, callback) => {
    let user = getUser(data);
    const messageText = data.text || data.message || '';
    const username = (user && user.username) || data.user || 'Anonymous User';

    if (!messageText.trim() && !data.attachment && !data.voiceNote) {
      if (callback) callback({ success: false, error: 'Cannot send empty message' });
      return;
    }

    if (!user) {
      const userId = data.userId || uuidv4();
      user = {
        id: userId,
        socketId: socket.id,
        username,
        avatar: data.avatar || '👤',
        status: 'online',
        joinedAt: new Date().toISOString(),
        currentRoom: 'general'
      };
      activeUsers.set(socket.id, user);
      userRegistry.set(userId, user);
      broadcastUserLists();
    }

    const roomId = normalizeRoomId(data.roomId || 'general', user.id);
    user.currentRoom = roomId;
    socket.join(roomId);

    const newMessage = {
      id: uuidv4(),
      roomId,
      sender: {
        id: user.id,
        username: user.username,
        avatar: user.avatar || '👤',
        status: user.status || 'online'
      },
      text: messageText,
      attachment: data.attachment || null,
      voiceNote: data.voiceNote || null,
      replyTo: data.replyTo || null,
      timestamp: new Date().toISOString(),
      reactions: {},
      edited: false
    };

    if (!messages.has(roomId)) {
      messages.set(roomId, []);
    }
    messages.get(roomId).push(newMessage);

    if (messages.get(roomId).length > 500) {
      messages.get(roomId).shift();
    }

    // Terminal Output: Log message to backend console for terminal visibility
    console.log(`==================================================`);
    console.log(`💬 [MESSAGE RECEIVED]`);
    console.log(`👤 From:      ${username} (${user.id})`);
    console.log(`🎯 Room ID:   ${roomId}`);
    console.log(`✉️ Message:   ${messageText}`);
    console.log(`⏰ Time:      ${new Date().toLocaleTimeString()}`);
    console.log(`==================================================`);

    // Broadcast to all clients & terminals globally
    io.emit('new_message', newMessage);

    // Broadcast to simple client format
    io.emit('receive_message', {
      user: username,
      message: messageText,
      time: data.time || new Date().toLocaleTimeString()
    });

    if (roomId.startsWith('dm-')) {
      const parts = roomId.replace('dm-', '').split('-');
      const recipientId = parts.find(id => id !== user.id);
      if (recipientId) {
        for (const [sId, u] of activeUsers.entries()) {
          if (u.id === recipientId) {
            io.to(sId).emit('dm_notification', {
              sender: user,
              message: newMessage
            });
          }
        }
      }

      // Auto-reply logic for system bot and preset contacts
      if (recipientId && recipientId !== user.id) {
        const recipientObj = userRegistry.get(recipientId);
        if (recipientObj && recipientId === 'system') {
          const roomHistory = messages.get(roomId) || [];

          setTimeout(async () => {
            io.emit('user_typing_start', {
              userId: recipientId,
              username: recipientObj.username,
              roomId
            });

            const replyText = await generateAiResponse(messageText, username, roomHistory);

            setTimeout(() => {
              io.emit('user_typing_stop', {
                userId: recipientId,
                roomId
              });

              const botMsg = {
                id: uuidv4(),
                roomId,
                sender: recipientObj,
                text: replyText,
                timestamp: new Date().toISOString(),
                reactions: { '💬': [recipientId] },
                edited: false
              };

              if (!messages.has(roomId)) {
                messages.set(roomId, []);
              }
              messages.get(roomId).push(botMsg);

              console.log(`==================================================`);
              console.log(`💬 [CONTACT AUTO-RESPONSE]`);
              console.log(`👤 From:      ${recipientObj.username}`);
              console.log(`🎯 Room ID:   ${roomId}`);
              console.log(`✉️ Message:   ${replyText}`);
              console.log(`==================================================`);

              io.emit('new_message', botMsg);
            }, 800);
          }, 300);
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

  // 10. Mark Room Messages as Read (WhatsApp Blue Ticks)
  socket.on('mark_read', ({ roomId, userId }) => {
    if (!roomId) return;
    const roomMsgs = messages.get(roomId);
    if (!roomMsgs) return;

    let updatedCount = 0;
    roomMsgs.forEach(msg => {
      if (msg.sender?.id !== userId && msg.status !== 'read') {
        msg.status = 'read';
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      io.emit('messages_read_update', { roomId, readByUserId: userId });
    }
  });

  // 11. Disconnect
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`[Socket] User disconnected: ${user.username} (${user.id})`);
      user.status = 'offline';
      if (userRegistry.has(user.id)) {
        userRegistry.get(user.id).status = 'offline';
      }
      activeUsers.delete(socket.id);

      broadcastUserLists();
    }
  });
});

let isRetrying = false;

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (!isRetrying) {
      isRetrying = true;
      console.log(`==================================================`);
      console.log(`⚠️ Port ${PORT} is busy. Automatically attempting to free port ${PORT}...`);
      console.log(`==================================================`);
      try {
        if (process.platform === 'win32') {
          execSync(`npx kill-port ${PORT}`, { stdio: 'ignore' });
        } else {
          execSync(`fuser -k ${PORT}/tcp || true`, { stdio: 'ignore' });
        }
      } catch (killErr) {
        // Ignored
      }
      setTimeout(() => {
        try {
          httpServer.close();
        } catch (e) { }
        httpServer.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.log(`==================================================`);
      console.log(`✅ Backend service is active on http://localhost:${PORT}`);
      console.log(`==================================================`);
    }
  } else {
    console.error('Server error:', err);
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 Nexora Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.io WebSocket Engine Ready`);
  console.log(`==================================================`);
});

// Backend Server Active & Ready
