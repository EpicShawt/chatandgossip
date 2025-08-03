const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic user info
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: function() { return this.userType === 'signed_up'; }
  },
  
  // User identification
  userId: {
    type: String,
    unique: true,
    required: true,
    default: () => Math.random().toString(36).substring(2, 8).toUpperCase() // 6-letter ID
  },
  
  // User type and status
  userType: {
    type: String,
    enum: ['temp', 'signed_up'],
    default: 'temp'
  },
  
  // Profile information
  gender: {
    type: String,
    enum: ['male', 'female', 'not_disclosed'],
    default: 'not_disclosed'
  },
  profilePicture: {
    type: String,
    default: 'default1' // Will be 1-8 for cute pictures
  },
  
  // Online status and tracking
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: String,
  
  // IP tracking
  ipAddresses: [{
    ip: String,
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Chat room management
  currentChatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom'
  },
  isSearching: {
    type: Boolean,
    default: false
  },
  
  // Timer for temp users (6 hours)
  tempUserExpiry: {
    type: Date,
    default: function() {
      if (this.userType === 'temp') {
        return new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
      }
      return null;
    }
  },
  
  // Premium features
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiry: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for performance
userSchema.index({ isOnline: 1, lastSeen: 1 });
userSchema.index({ userType: 1, tempUserExpiry: 1 });
userSchema.index({ userId: 1 });

module.exports = mongoose.model('User', userSchema); 