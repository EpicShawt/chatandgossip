const { v4: uuidv4 } = require('uuid')

class ChatManager {
  constructor(io) {
    this.io = io
    this.users = new Map() // socketId -> userData
    this.waitingUsers = new Map() // userId -> socketId
    this.chatPairs = new Map() // socketId -> partnerSocketId
    this.rooms = new Map() // roomId -> { users: [], messages: [] }
    this.userRooms = new Map() // socketId -> roomId
  }

  addUser(socketId, userData) {
    this.users.set(socketId, {
      ...userData,
      socketId,
      connectedAt: new Date()
    })
    console.log(`User added: ${userData.username || userData.email}`)
  }

  removeUser(socketId) {
    const user = this.users.get(socketId)
    if (user) {
      // Remove from waiting list
      this.waitingUsers.delete(user.id || user.email)
      
      // Notify partner if in chat
      const partnerSocketId = this.chatPairs.get(socketId)
      if (partnerSocketId) {
        this.io.to(partnerSocketId).emit('partner_left')
        this.chatPairs.delete(socketId)
        this.chatPairs.delete(partnerSocketId)
      }

      // Remove from room
      const roomId = this.userRooms.get(socketId)
      if (roomId) {
        this.leaveRoom(socketId, { roomId })
      }

      this.users.delete(socketId)
      console.log(`User removed: ${user.username || user.email}`)
    }
  }

  findPartner(socketId, data) {
    const user = this.users.get(socketId)
    if (!user) return

    const { chatType = 'random', genderFilter = null } = data

    // Remove from any existing chat
    this.leaveChat(socketId, {})

    // Add to waiting list
    this.waitingUsers.set(user.id || user.email, socketId)

    // Find compatible partner
    const partner = this.findCompatiblePartner(user, chatType, genderFilter)
    
    if (partner) {
      this.pairUsers(socketId, partner.socketId)
    } else {
      this.io.to(socketId).emit('searching', { message: 'Searching for partner...' })
    }
  }

  findCompatiblePartner(user, chatType, genderFilter) {
    for (const [waitingUserId, waitingSocketId] of this.waitingUsers) {
      if (waitingSocketId === user.socketId) continue

      const waitingUser = this.users.get(waitingSocketId)
      if (!waitingUser) continue

      // Check if users are compatible
      if (this.areUsersCompatible(user, waitingUser, chatType, genderFilter)) {
        return waitingUser
      }
    }
    return null
  }

  areUsersCompatible(user1, user2, chatType, genderFilter) {
    // Don't match with same user
    if (user1.id === user2.id || user1.email === user2.email) {
      return false
    }

    // Gender filter logic
    if (chatType === 'gender' && genderFilter) {
      if (genderFilter !== 'any') {
        // In a real app, you'd check actual gender data
        // For demo, we'll use a simple check
        const user1Gender = user1.gender || 'unknown'
        const user2Gender = user2.gender || 'unknown'
        
        if (genderFilter === 'male' && user2Gender !== 'male') return false
        if (genderFilter === 'female' && user2Gender !== 'female') return false
      }
    }

    return true
  }

  pairUsers(socketId1, socketId2) {
    const user1 = this.users.get(socketId1)
    const user2 = this.users.get(socketId2)

    if (!user1 || !user2) return

    // Remove from waiting lists
    this.waitingUsers.delete(user1.id || user1.email)
    this.waitingUsers.delete(user2.id || user2.email)

    // Create chat pair
    this.chatPairs.set(socketId1, socketId2)
    this.chatPairs.set(socketId2, socketId1)

    // Notify both users
    this.io.to(socketId1).emit('partner_found', {
      id: user2.id || user2.email,
      username: user2.username || user2.email,
      gender: user2.gender
    })

    this.io.to(socketId2).emit('partner_found', {
      id: user1.id || user1.email,
      username: user1.username || user1.email,
      gender: user1.gender
    })

    console.log(`Users paired: ${user1.username || user1.email} <-> ${user2.username || user2.email}`)
  }

  sendPrivateMessage(socketId, data) {
    const partnerSocketId = this.chatPairs.get(socketId)
    if (!partnerSocketId) return

    const message = {
      ...data.message,
      timestamp: new Date().toISOString()
    }

    // Send to partner
    this.io.to(partnerSocketId).emit('message_received', message)
  }

  handleTyping(socketId, data, isTyping) {
    const partnerSocketId = this.chatPairs.get(socketId)
    if (!partnerSocketId) return

    if (isTyping) {
      this.io.to(partnerSocketId).emit('partner_typing')
    } else {
      this.io.to(partnerSocketId).emit('partner_stopped_typing')
    }
  }

  leaveChat(socketId, data) {
    const partnerSocketId = this.chatPairs.get(socketId)
    if (partnerSocketId) {
      this.io.to(partnerSocketId).emit('partner_left')
      this.chatPairs.delete(socketId)
      this.chatPairs.delete(partnerSocketId)
    }
  }

  // Room management
  joinRoom(socketId, data) {
    const { roomId, user } = data
    const userData = this.users.get(socketId)
    if (!userData) return

    // Leave any existing room
    this.leaveRoom(socketId, { roomId: this.userRooms.get(socketId) })

    // Create room if doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        name: `Room ${roomId}`,
        users: [],
        messages: [],
        createdAt: new Date()
      })
    }

    const room = this.rooms.get(roomId)
    
    // Add user to room
    room.users.push({
      id: user.id,
      username: user.username,
      socketId
    })

    this.userRooms.set(socketId, roomId)

    // Join socket room
    this.io.sockets.sockets.get(socketId).join(roomId)

    // Notify room
    this.io.to(roomId).emit('participant_joined', {
      id: user.id,
      username: user.username
    })

    // Send room info to user
    this.io.to(socketId).emit('room_joined', {
      roomId,
      roomName: room.name,
      participants: room.users
    })

    console.log(`User ${user.username} joined room ${roomId}`)
  }

  leaveRoom(socketId, data) {
    const roomId = data.roomId || this.userRooms.get(socketId)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room) return

    const userData = this.users.get(socketId)
    if (!userData) return

    // Remove user from room
    room.users = room.users.filter(user => user.socketId !== socketId)

    // Leave socket room
    this.io.sockets.sockets.get(socketId).leave(roomId)

    // Remove from user rooms
    this.userRooms.delete(socketId)

    // Notify other users
    this.io.to(roomId).emit('participant_left', {
      id: userData.id || userData.email,
      username: userData.username || userData.email
    })

    // Delete room if empty
    if (room.users.length === 0) {
      this.rooms.delete(roomId)
      console.log(`Room ${roomId} deleted (empty)`)
    }

    console.log(`User ${userData.username || userData.email} left room ${roomId}`)
  }

  sendRoomMessage(socketId, data) {
    const { roomId, message } = data
    const room = this.rooms.get(roomId)
    if (!room) return

    const userData = this.users.get(socketId)
    if (!userData) return

    const roomMessage = {
      ...message,
      roomId,
      timestamp: new Date().toISOString()
    }

    // Add to room messages
    room.messages.push(roomMessage)

    // Send to all users in room
    this.io.to(roomId).emit('room_message', {
      message: roomMessage
    })
  }

  // Utility methods
  getWaitingCount() {
    return this.waitingUsers.size
  }

  getActiveChats() {
    return this.chatPairs.size / 2
  }

  getRoomCount() {
    return this.rooms.size
  }

  getStats() {
    return {
      totalUsers: this.users.size,
      waitingUsers: this.getWaitingCount(),
      activeChats: this.getActiveChats(),
      rooms: this.getRoomCount()
    }
  }
}

module.exports = ChatManager 