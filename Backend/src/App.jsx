import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");





function App() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("Online_users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receive_message");
      socket.off("Online_users");
    };
  }, []);

  const joinChat = () => {
    if (!username.trim()) return;

    socket.emit("join_chat", username);
    setJoined(true);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", {
      user: username,
      message,
      time: new Date().toLocaleTimeString(),
    });

    setMessage("");
  };

  if (!joined) {
    return (
      <div className="join-container">
        <h1>Socket.IO Chat</h1>

        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") joinChat();
          }}
        />

        <button onClick={joinChat}>Join Chat</button>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Online Users</h2>

        {onlineUsers.map((user) => (
          <div key={user.id || user.name || Math.random()} className="user">
            🟢 {user.name || user.username}
          </div>
        ))}
      </aside>

      <main className="chat">
        <h2>Chat Room</h2>

        <div className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={
                msg.user === username
                  ? "my-message"
                  : msg.user === "System"
                    ? "system-message"
                    : "message"
              }
            >
              <strong>{msg.user}</strong>

              <p>{msg.message}</p>

              <small>{msg.time}</small>
            </div>
          ))}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Type message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button onClick={sendMessage}>Send</button>
        </div>
      </main>
    </div>
  );
}


export default App;