const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use('/api/', limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const paymentRoutes = require('./routes/payments')

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/payments', paymentRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Socket.io connection handling
const ChatManager = require('./services/ChatManager')
const chatManager = new ChatManager(io)

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Handle user joining
  socket.on('join', (userData) => {
    chatManager.addUser(socket.id, userData)
    socket.emit('connected', { message: 'Connected to chat server' })
  })

  // Handle finding a partner
  socket.on('find_partner', (data) => {
    chatManager.findPartner(socket.id, data)
  })

  // Handle private messages
  socket.on('private_message', (data) => {
    chatManager.sendPrivateMessage(socket.id, data)
  })

  // Handle typing indicators
  socket.on('typing', (data) => {
    chatManager.handleTyping(socket.id, data, true)
  })

  socket.on('stop_typing', (data) => {
    chatManager.handleTyping(socket.id, data, false)
  })

  // Handle room operations
  socket.on('join_room', (data) => {
    chatManager.joinRoom(socket.id, data)
  })

  socket.on('room_message', (data) => {
    chatManager.sendRoomMessage(socket.id, data)
  })

  socket.on('leave_room', (data) => {
    chatManager.leaveRoom(socket.id, data)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
    chatManager.removeUser(socket.id)
  })

  // Handle leaving chat
  socket.on('leave_chat', (data) => {
    chatManager.leaveChat(socket.id, data)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
  console.log(`🔌 Socket.io server ready`)
})

module.exports = { app, server, io } 