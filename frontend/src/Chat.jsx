import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import io from "socket.io-client";
import "./Chat.css";
const socket = io.connect("http://localhost:5000");

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prevMessages) => {
        if (!prevMessages.some((msg) => msg.id === data.id)) {
          return [...prevMessages, data];
        }
        return prevMessages;
      });
    });

    socket.on("user_typing", (user) => {
      setTypingUser(user);
      setTimeout(() => setTypingUser(""), 2000);
    });

    socket.on("user_joined", (message) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), system: true, text: message },
      ]);
    });

    socket.on("user_left", (message) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), system: true, text: message },
      ]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        username,
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit("send_message", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
    }
  };

  const handleTyping = () => {
    socket.emit("typing", username);
  };

  const handleSetUsername = () => {
    if (username.trim()) {
      socket.emit("set_username", username);
      setIsUsernameSet(true);
    }
  };

  return (
    <div className="chat-container">
      {!isUsernameSet ? (
        <div className="username-container">
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleSetUsername}>
            Join Chat
          </motion.button>
        </div>
      ) : (
        <>
          <div className="messages">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={msg.system ? "system-message" : "message"}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.system ? (
                  <span className="system-message">{msg.text}</span>
                ) : (
                  <div className="user-message">
                    <span className="username">{msg.username}:</span>
                    <span className="message-text">{msg.text}</span>
                  </div>
                )}
                {!msg.system && (
                  <span className="timestamp">{msg.timestamp}</span>
                )}
              </motion.div>
            ))}
          </div>

          {typingUser && (
            <motion.p
              className="typing-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {typingUser} is typing...
            </motion.p>
          )}

          <div className="input-container">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleTyping}
              placeholder="Type a message..."
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={sendMessage}>
              Send
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
