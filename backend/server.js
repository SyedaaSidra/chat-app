const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

let users = {};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("set_username", (username) => {
    users[socket.id] = { username, id: socket.id };
    io.emit("active_users", users);
    io.emit("user_joined", `${username} joined the chat`);
  });

  socket.on("send_message", (data) => {
    io.emit("receive_message", data);
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("user_typing", username);
  });

  socket.on("disconnect", () => {
    if (users[socket.id]) {
      io.emit("user_left", `${users[socket.id].username} left the chat`);
      delete users[socket.id];
    }
    console.log(`User Disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
