const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');

class CleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.startCleanup();
  }

  startCleanup() {
    // Run cleanup every 30 seconds
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupOfflineUsers();
        await this.cleanupExpiredTempUsers();
        await this.cleanupExpiredChatRooms();
      } catch (error) {
        console.error('Cleanup service error:', error);
      }
    }, 30000); // 30 seconds
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  async cleanupOfflineUsers() {
    try {
      const cutoffTime = new Date(Date.now() - 180 * 1000); // 180 seconds ago
      
      const result = await User.updateMany(
        {
          isOnline: true,
          lastSeen: { $lte: cutoffTime }
        },
        {
          $set: { 
            isOnline: false,
            isSearching: false,
            currentChatRoom: null
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Marked ${result.modifiedCount} users as offline`);
      }
    } catch (error) {
      console.error('Error cleaning up offline users:', error);
    }
  }

  async cleanupExpiredTempUsers() {
    try {
      const result = await User.deleteMany({
        userType: 'temp',
        tempUserExpiry: { $lte: new Date() }
      });

      if (result.deletedCount > 0) {
        console.log(`Deleted ${result.deletedCount} expired temp users`);
      }
    } catch (error) {
      console.error('Error cleaning up expired temp users:', error);
    }
  }

  async cleanupExpiredChatRooms() {
    try {
      const result = await ChatRoom.updateMany(
        {
          isActive: true,
          expiresAt: { $lte: new Date() }
        },
        {
          $set: { isActive: false }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Deactivated ${result.modifiedCount} expired chat rooms`);
      }
    } catch (error) {
      console.error('Error cleaning up expired chat rooms:', error);
    }
  }

  async getCleanupStats() {
    try {
      const offlineUsers = await User.countDocuments({
        isOnline: true,
        lastSeen: { $lte: new Date(Date.now() - 180 * 1000) }
      });

      const expiredTempUsers = await User.countDocuments({
        userType: 'temp',
        tempUserExpiry: { $lte: new Date() }
      });

      const expiredChatRooms = await ChatRoom.countDocuments({
        isActive: true,
        expiresAt: { $lte: new Date() }
      });

      return {
        offlineUsers,
        expiredTempUsers,
        expiredChatRooms
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return { offlineUsers: 0, expiredTempUsers: 0, expiredChatRooms: 0 };
    }
  }
}

module.exports = CleanupService; 