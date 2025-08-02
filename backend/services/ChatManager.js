const { v4: uuidv4 } = require('uuid');

class ChatManager {
  constructor() {
    this.users = new Map();
    this.waitingUsers = new Map();
    this.chatPairs = new Map();
    this.rooms = new Map();
    this.userRooms = new Map();
    
    // Test user for automatic replies
    this.testUser = {
      id: 'test-user-001',
      username: 'Sarah',
      gender: 'female',
      isOnline: true,
      isTestUser: true,
      socketId: null
    };
    
    // Add test user to users map
    this.users.set(this.testUser.id, this.testUser);
  }

  addUser(socketId, userData) {
    const userId = userData.id || uuidv4();
    const user = {
      id: userId,
      socketId,
      username: userData.username || `User${Math.floor(Math.random() * 1000)}`,
      gender: userData.gender || 'not_disclosed',
      isOnline: true,
      isTestUser: false,
      joinedAt: new Date(),
      lastSeen: new Date()
    };
    
    this.users.set(userId, user);
    return user;
  }

  removeUser(socketId) {
    let userToRemove = null;
    
    for (const [userId, user] of this.users) {
      if (user.socketId === socketId) {
        userToRemove = user;
        break;
      }
    }
    
    if (userToRemove) {
      userToRemove.isOnline = false;
      userToRemove.lastSeen = new Date();
      this.users.set(userToRemove.id, userToRemove);
      
      // Remove from waiting list
      this.waitingUsers.delete(userToRemove.id);
      
      // Handle chat disconnection
      this.leaveChat(userToRemove.id);
    }
  }

  findPartner(userId, genderFilter = null) {
    const user = this.users.get(userId);
    if (!user || user.isTestUser) return null;

    // If user wants to chat with test user, pair them
    if (genderFilter === 'female' || !genderFilter) {
      return this.testUser;
    }

    // Look for real users in waiting list
    for (const [waitingUserId, waitingUser] of this.waitingUsers) {
      if (waitingUserId === userId) continue;
      
      // Check gender compatibility
      if (genderFilter && waitingUser.gender !== genderFilter && waitingUser.gender !== 'not_disclosed') {
        continue;
      }
      
      // Check if user wants this gender
      if (waitingUser.genderFilter && waitingUser.genderFilter !== user.gender && user.gender !== 'not_disclosed') {
        continue;
      }
      
      return waitingUser;
    }
    
    return null;
  }

  pairUsers(user1, user2) {
    const pairId = uuidv4();
    this.chatPairs.set(pairId, {
      id: pairId,
      user1: user1.id,
      user2: user2.id,
      messages: [],
      createdAt: new Date()
    });
    
    // Remove from waiting lists
    this.waitingUsers.delete(user1.id);
    this.waitingUsers.delete(user2.id);
    
    return pairId;
  }

  sendPrivateMessage(fromUserId, toUserId, message) {
    const chatPair = this.findChatPair(fromUserId, toUserId);
    if (!chatPair) return null;
    
    const messageObj = {
      id: uuidv4(),
      from: fromUserId,
      to: toUserId,
      content: message,
      timestamp: new Date(),
      type: 'text'
    };
    
    chatPair.messages.push(messageObj);
    return messageObj;
  }

  // Auto-reply for test user
  getTestUserReply(message) {
    const replies = [
      "Hey! How's your day going? 😊",
      "That's interesting! Tell me more about that.",
      "I love chatting with new people! What do you like to do for fun?",
      "That's cool! I'm Sarah, nice to meet you! 👋",
      "What's your favorite music? I'm really into indie these days!",
      "Do you like traveling? I've been to some amazing places!",
      "That's awesome! I'm always up for a good conversation.",
      "What's your dream job? I'm curious about different career paths!",
      "I love trying new foods! What's your favorite cuisine?",
      "That's so interesting! I love learning about different perspectives."
    ];
    
    // Simple keyword-based responses
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      return "Hello! Nice to meet you! How are you doing today? 😊";
    }
    if (message.toLowerCase().includes('how are you')) {
      return "I'm doing great, thanks for asking! How about you?";
    }
    if (message.toLowerCase().includes('name')) {
      return "I'm Sarah! What's your name? Nice to meet you! 👋";
    }
    if (message.toLowerCase().includes('age')) {
      return "I'm 24! How old are you? Age is just a number though! 😄";
    }
    if (message.toLowerCase().includes('work') || message.toLowerCase().includes('job')) {
      return "I work in marketing! It's pretty exciting. What do you do?";
    }
    if (message.toLowerCase().includes('music')) {
      return "I love indie and pop music! What's your favorite genre?";
    }
    if (message.toLowerCase().includes('food')) {
      return "I'm a foodie! Love trying new restaurants. What's your favorite food?";
    }
    
    // Random reply if no keywords match
    return replies[Math.floor(Math.random() * replies.length)];
  }

  findChatPair(userId1, userId2) {
    for (const [pairId, pair] of this.chatPairs) {
      if ((pair.user1 === userId1 && pair.user2 === userId2) ||
          (pair.user1 === userId2 && pair.user2 === userId1)) {
        return pair;
      }
    }
    return null;
  }

  handleTyping(userId, isTyping) {
    const user = this.users.get(userId);
    if (!user) return;
    
    user.isTyping = isTyping;
    this.users.set(userId, user);
  }

  leaveChat(userId) {
    // Find and remove chat pair
    for (const [pairId, pair] of this.chatPairs) {
      if (pair.user1 === userId || pair.user2 === userId) {
        this.chatPairs.delete(pairId);
        break;
      }
    }
  }

  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        name: `Room ${roomId}`,
        users: new Set(),
        messages: [],
        createdAt: new Date()
      });
    }
    
    const room = this.rooms.get(roomId);
    room.users.add(userId);
    this.userRooms.set(userId, roomId);
  }

  leaveRoom(userId) {
    const roomId = this.userRooms.get(userId);
    if (roomId && this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      room.users.delete(userId);
      this.userRooms.delete(userId);
    }
  }

  sendRoomMessage(userId, roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    const user = this.users.get(userId);
    if (!user) return null;
    
    const messageObj = {
      id: uuidv4(),
      from: userId,
      fromUsername: user.username,
      content: message,
      timestamp: new Date(),
      type: 'text'
    };
    
    room.messages.push(messageObj);
    return messageObj;
  }

  getStats() {
    return {
      totalUsers: this.users.size,
      onlineUsers: Array.from(this.users.values()).filter(u => u.isOnline).length,
      waitingUsers: this.waitingUsers.size,
      activeChats: this.chatPairs.size,
      activeRooms: this.rooms.size
    };
  }

  getOnlineUsers() {
    return Array.from(this.users.values())
      .filter(user => user.isOnline)
      .map(user => ({
        id: user.id,
        username: user.username,
        gender: user.gender,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }));
  }
}

module.exports = ChatManager; 