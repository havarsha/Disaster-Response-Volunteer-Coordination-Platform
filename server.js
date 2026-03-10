const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible in routes
app.set('io', io);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/disaster_platform')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Socket.IO
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} authenticated`);
  });

  socket.on('join_role_room', (role) => {
    socket.join(`role_${role}`);
    console.log(`📢 ${socket.id} joined ${role} room`);
  });

  socket.on('send_message', (data) => {
    io.to(`chat_${data.roomId}`).emit('receive_message', {
      ...data,
      timestamp: new Date(),
    });
  });

  socket.on('join_chat', (roomId) => {
    socket.join(`chat_${roomId}`);
  });

  socket.on('volunteer_location_update', (data) => {
    io.to('role_admin').emit('volunteer_location', data);
  });

  socket.on('disconnect', () => {
    if (socket.userId) connectedUsers.delete(socket.userId);
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Broadcast SOS to volunteers (exported for use in routes)
app.locals.broadcastSOS = (sosRequest) => {
  io.to('role_volunteer').emit('new_sos', sosRequest);
  io.to('role_admin').emit('new_sos', sosRequest);
};

app.locals.broadcastResourceUpdate = (resource) => {
  io.to('role_admin').emit('resource_update', resource);
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = { app, io };
