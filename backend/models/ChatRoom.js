const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  // Room identification
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Room creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Room settings
  maxParticipants: {
    type: Number,
    default: 10
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  // Session management
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }
  },
  lastExtended: {
    type: Date,
    default: Date.now
  },
  extendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Room status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Messages (for signed up users only)
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'system'],
      default: 'text'
    }
  }],
  
  // Room statistics
  totalMessages: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Update lastActivity on message addition
chatRoomSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
    this.totalMessages = this.messages.length;
  }
  next();
});

// Index for performance
chatRoomSchema.index({ isActive: 1, expiresAt: 1 });
chatRoomSchema.index({ createdBy: 1 });
chatRoomSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema); 