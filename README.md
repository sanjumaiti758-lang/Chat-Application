# 💬 ChatPulse — Real-Time Glassmorphism Chat Application

ChatPulse is a high-performance, feature-rich real-time messaging application built with Node.js, Express, Socket.io, React 18, Vite, and custom CSS glassmorphism styling.

![ChatPulse Features](https://img.shields.io/badge/Stack-Node.js%20%7C%20Socket.io%20%7C%20React%2018%20%7C%20Vite-6366F1?style=for-the-badge)

---

## ✨ Features

- ⚡ **Real-Time WebSockets Engine**: Instant message delivery, online status tracking, user presence, and typing indicators using Socket.io.
- 🎨 **Obsidian Glassmorphism Design System**: Tailored HSL dark/light modes, ambient animated gradient backgrounds, glass card containers, luminous borders, and micro-interactions.
- 💬 **Multi-Channel & Direct Messaging**:
  - Pre-seeded public channels (`#general`, `#tech-talk`, `#random`, `#gaming`, `#music`, `#announcements`).
  - Create custom public or private channels.
  - Private 1-on-1 Direct Messaging (DMs) between online or registered users.
- 🎙️ **Voice Notes Recording**: Record high-quality audio clips directly in your browser using the MediaRecorder API and share them instantly with audio waveform visualizers.
- 🖼️ **Media & File Attachments**: Drag-and-drop or select images, documents, and videos with full-screen Lightbox modal preview.
- 😀 **Emoji Reactions & Markdown**: React to messages with emojis (`❤️`, `👍`, `🔥`, `😂`, `🚀`, `🎉`), format text with bold or code blocks, and trigger celebratory confetti effects.
- ✏️ **Message Edit & Delete**: Edit or remove your sent messages in real time across all connected clients.
- 🔔 **Web Audio Synthesizer**: Subtle sound effects for message sent, message received, and channel notifications without external audio assets.

---

## 🛠️ Tech Stack

### Backend (`Backend/`)
- **Node.js & Express**: Fast REST and static media upload API server.
- **Socket.io**: Real-time bi-directional event-driven WebSockets communications engine.
- **Multer**: Secure multipart file handling for images and attachments.
- **UUID**: Unique ID generation for messages, channels, and users.

### Frontend (`Frontend/`)
- **React 18**: UI rendering engine using hooks and modern component patterns.
- **Vite**: Ultra-fast module bundler and dev server.
- **Socket.io-Client**: Real-time client subscription engine.
- **Lucide React**: Crisp, modern icon library.
- **Canvas-Confetti**: Interactive particle celebrations.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Install Dependencies

```bash
# Install Backend dependencies
cd Backend
npm install

# Install Frontend dependencies
cd ../Frontend
npm install
```

### 2. Running Locally

Start the Backend Server (Port 5000):
```bash
cd Backend
npm run dev
```

Start the Frontend Client (Port 3000):
```bash
cd Frontend
npm run dev
```

Open `http://localhost:3000` in your web browser. Open multiple tabs or windows to test real-time multi-user chat!

---

## 🔌 Socket.io Real-Time Events API

| Event Name | Type | Description |
| :--- | :--- | :--- |
| `user_login` | Client ➔ Server | Registers a user handle, avatar, and status |
| `user_status_change` | Client ➔ Server | Updates status (Online, Away, Busy, Offline) |
| `join_room` | Client ➔ Server | Switches active channel or DM conversation |
| `create_channel` | Client ➔ Server | Creates new custom channel room |
| `send_message` | Client ➔ Server | Broadcasts new text, media, or voice note message |
| `typing_start` / `typing_stop` | Client ➔ Server | Broadcasts live typing indicator |
| `add_reaction` | Client ➔ Server | Toggles emoji reaction on target message |
| `edit_message` / `delete_message` | Client ➔ Server | Edits or deletes message in real time |