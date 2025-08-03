const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
require('dotenv').config();

const ChatManager = require('./services/ChatManager');
const User = require('./models/User');
const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    methods: ["GET", "POST"]
  }
});

// Initialize Firebase
initializeFirebase();

// Initialize chat manager
const chatManager = new ChatManager();

// Connect to MongoDB (keeping for migration)
connectDB().then(async () => {
      // Create test user in database if it doesn't exist
    try {
      let testUser = await User.findOne({ username: 'Sarah' });
      if (!testUser) {
        const { generateUniqueId } = require('./utils/idGenerator');
        const uniqueId = await generateUniqueId();
        testUser = new User({
          uniqueId: uniqueId,
          username: 'Sarah',
          email: 'sarah@test.com',
          password: 'testpassword123',
          gender: 'female',
          isOnline: true,
          isAnonymous: false,
          isTestUser: true,
          isVerified: true,
          lastSeen: new Date()
        });
        await testUser.save();
        console.log('Test user Sarah created in database');
      } else {
        // Update existing user to be test user and online
        testUser.isOnline = true;
        testUser.lastSeen = new Date();
        testUser.isTestUser = true;
        if (!testUser.uniqueId) {
          const { generateUniqueId } = require('./utils/idGenerator');
          testUser.uniqueId = await generateUniqueId();
        }
        if (!testUser.email) {
          testUser.email = 'sarah@test.com';
        }
        if (!testUser.password) {
          testUser.password = 'testpassword123';
        }
        if (!testUser.isVerified) {
          testUser.isVerified = true;
        }
        await testUser.save();
        console.log('Test user Sarah is online');
      }
    
    // Update ChatManager's test user with database ID
    chatManager.testUser.id = testUser._id.toString();
    chatManager.testUser._id = testUser._id;
    chatManager.users.set(testUser._id.toString(), chatManager.testUser);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    stats: chatManager.getStats(),
    database: 'MongoDB Atlas'
  });
});



// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins with their data
  socket.on('user_join', async (userData) => {
    console.log('Received user_join event:', userData);
    try {
      let user;
      
      // Check if user exists
      if (userData.email) {
        user = await User.findOne({ email: userData.email });
        if (user) {
          user.isOnline = true;
          user.socketId = socket.id;
          user.lastSeen = new Date();
          await user.save();
        }
      }
      
      // If no existing user, create anonymous user
      if (!user) {
        console.log('Creating new anonymous user:', userData);
        user = new User({
          username: userData.username,
          gender: userData.gender || 'not_disclosed',
          isOnline: true,
          isAnonymous: !userData.email,
          socketId: socket.id,
          lastSeen: new Date()
        });
        await user.save();
        console.log('New user created:', user._id, user.username);
      }
      
      socket.userId = user._id;
      socket.emit('user_joined', user);
      
      // Broadcast online status
      console.log('Broadcasting user online:', user.username);
      io.emit('user_online', {
        id: user._id,
        username: user.username,
        gender: user.gender,
        isOnline: true
      });
    } catch (error) {
      console.error('Error in user_join:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  // Find partner
  socket.on('find_partner', async (data) => {
    console.log('Received find_partner event:', data);
    try {
      const user = await User.findById(socket.userId);
      if (!user) return;

      // Add to waiting list
      chatManager.waitingUsers.set(user._id.toString(), user);
      
      // Look for partner
      const partner = chatManager.findPartner(user._id.toString(), data.genderFilter);
      
      if (partner) {
        // Pair users
        const pairId = chatManager.pairUsers(user, partner);
        
        // Notify both users
        socket.emit('partner_found', {
          id: partner._id || partner.id,
          username: partner.username,
          gender: partner.gender,
          isTestUser: partner.isTestUser
        });
        
        // If partner is test user, send welcome message
        if (partner.isTestUser) {
          setTimeout(async () => {
            const welcomeMessage = chatManager.getTestUserReply("hello");
            const messageObj = await chatManager.sendPrivateMessage(partner.id, user._id.toString(), welcomeMessage);
            socket.emit('message_received', messageObj);
          }, 1000);
        }
      } else {
        socket.emit('searching', { message: 'Searching for partner...' });
      }
    } catch (error) {
      console.error('Error in find_partner:', error);
      socket.emit('error', { message: 'Failed to find partner' });
    }
  });

  // Send private message
  socket.on('private_message', async (data) => {
    try {
      const user = await User.findById(socket.userId);
      if (!user) return;

      // Find current partner
      const chatPair = chatManager.findChatPair(user._id.toString(), data.to);
      if (!chatPair) return;

      // Save message to database
      const message = new Message({
        from: user._id,
        to: data.to,
        content: data.content,
        messageType: 'text'
      });
      await message.save();

      // Send message
      const messageObj = chatManager.sendPrivateMessage(user._id.toString(), data.to, data.content);
      
      // Emit to sender
      socket.emit('message_sent', messageObj);
      
      // Emit to receiver
      const partnerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === data.to);
      
      if (partnerSocket) {
        partnerSocket.emit('message_received', messageObj);
      }

      // If sending to test user, get auto-reply
      const partner = chatManager.users.get(data.to);
      if (partner && partner.isTestUser) {
        setTimeout(async () => {
          const reply = chatManager.getTestUserReply(data.content);
          const replyObj = await chatManager.sendPrivateMessage(partner.id, user._id.toString(), reply);
          
          // Save reply to database
          const replyMessage = new Message({
            from: partner.id,
            to: user._id,
            content: reply,
            messageType: 'text'
          });
          await replyMessage.save();
          
          socket.emit('message_received', replyObj);
        }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
      }
    } catch (error) {
      console.error('Error in private_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing', (data) => {
    const user = chatManager.users.get(socket.userId);
    if (!user) return;

    chatManager.handleTyping(user.id, true);
    
    // Find partner and notify
    const chatPair = chatManager.findChatPair(user.id, data.to);
    if (chatPair) {
      const partnerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === data.to);
      
      if (partnerSocket) {
        partnerSocket.emit('partner_typing', { from: user.id });
      }
    }
  });

  socket.on('stop_typing', (data) => {
    const user = chatManager.users.get(socket.userId);
    if (!user) return;

    chatManager.handleTyping(user.id, false);
    
    // Find partner and notify
    const chatPair = chatManager.findChatPair(user.id, data.to);
    if (chatPair) {
      const partnerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === data.to);
      
      if (partnerSocket) {
        partnerSocket.emit('partner_stopped_typing', { from: user.id });
      }
    }
  });

  // Leave chat
  socket.on('leave_chat', () => {
    const user = chatManager.users.get(socket.userId);
    if (!user) return;

    chatManager.leaveChat(user.id);
    
    // Notify partner
    const chatPair = Array.from(chatManager.chatPairs.values())
      .find(pair => pair.user1 === user.id || pair.user2 === user.id);
    
    if (chatPair) {
      const partnerId = chatPair.user1 === user.id ? chatPair.user2 : chatPair.user1;
      const partnerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === partnerId);
      
      if (partnerSocket) {
        partnerSocket.emit('partner_left');
      }
    }
  });

  // Room management
  socket.on('join_room', async (data) => {
    try {
      const user = await User.findById(socket.userId);
      if (!user) return;

      let room = await ChatRoom.findById(data.roomId);
      if (!room) {
        room = new ChatRoom({
          _id: data.roomId,
          name: `Room ${data.roomId}`,
          participants: [user._id]
        });
        await room.save();
      } else {
        if (!room.participants.includes(user._id)) {
          room.participants.push(user._id);
          await room.save();
        }
      }

      chatManager.joinRoom(user._id.toString(), data.roomId);
      socket.join(data.roomId);
      
      socket.emit('room_joined', {
        roomId: data.roomId,
        user: user
      });
    } catch (error) {
      console.error('Error in join_room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('leave_room', async (data) => {
    try {
      const user = await User.findById(socket.userId);
      if (!user) return;

      const room = await ChatRoom.findById(data.roomId);
      if (room) {
        room.participants = room.participants.filter(p => p.toString() !== user._id.toString());
        await room.save();
      }

      chatManager.leaveRoom(user._id.toString());
      socket.leave(data.roomId);
    } catch (error) {
      console.error('Error in leave_room:', error);
    }
  });

  socket.on('room_message', async (data) => {
    try {
      const user = await User.findById(socket.userId);
      if (!user) return;

      const room = await ChatRoom.findById(data.roomId);
      if (!room) return;

      // Add message to room
      room.messages.push({
        from: user._id,
        content: data.content,
        messageType: 'text'
      });
      await room.save();

      const messageObj = chatManager.sendRoomMessage(user._id.toString(), data.roomId, data.content);
      
      if (messageObj) {
        io.to(data.roomId).emit('room_message', messageObj);
      }
    } catch (error) {
      console.error('Error in room_message:', error);
      socket.emit('error', { message: 'Failed to send room message' });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.userId) {
      try {
        const user = await User.findById(socket.userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          user.socketId = null;
          await user.save();
          
          // Broadcast offline status
          io.emit('user_offline', {
            id: user._id,
            username: user.username,
            lastSeen: user.lastSeen
          });
        }
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }
    
    chatManager.removeUser(socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Chat manager initialized with test user: Sarah`);
  console.log(`Database: MongoDB Atlas`);
}); 