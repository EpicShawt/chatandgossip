const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

// Middleware to check if user is admin (you can implement proper auth later)
const isAdmin = (req, res, next) => {
  // For now, allow all requests. Implement proper admin authentication later
  next();
};

// Get all users with pagination and filters
router.get('/users', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, userType, isOnline, search } = req.query;
    
    const query = {};
    
    if (userType) query.userType = userType;
    if (isOnline !== undefined) query.isOnline = isOnline === 'true';
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user statistics
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          onlineUsers: { $sum: { $cond: ['$isOnline', 1, 0] } },
          tempUsers: { $sum: { $cond: [{ $eq: ['$userType', 'temp'] }, 1, 0] } },
          signedUpUsers: { $sum: { $cond: [{ $eq: ['$userType', 'signed_up'] }, 1, 0] } },
          premiumUsers: { $sum: { $cond: ['$isPremium', 1, 0] } }
        }
      }
    ]);
    
    const onlineUsers = await User.find({ isOnline: true }).countDocuments();
    const tempUsersExpiringSoon = await User.find({
      userType: 'temp',
      tempUserExpiry: { $lte: new Date(Date.now() + 60 * 60 * 1000) } // 1 hour
    }).countDocuments();
    
    res.json({
      ...stats[0],
      onlineUsers,
      tempUsersExpiringSoon
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get chat rooms
router.get('/chatrooms', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const chatRooms = await ChatRoom.find(query)
      .populate('createdBy', 'username userId')
      .populate('participants.user', 'username userId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ChatRoom.countDocuments(query);
    
    res.json({
      chatRooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// Delete temp users that have expired
router.delete('/cleanup/temp-users', isAdmin, async (req, res) => {
  try {
    const result = await User.deleteMany({
      userType: 'temp',
      tempUserExpiry: { $lte: new Date() }
    });
    
    res.json({ 
      message: `Deleted ${result.deletedCount} expired temp users`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up temp users:', error);
    res.status(500).json({ error: 'Failed to cleanup temp users' });
  }
});

// Mark offline users who haven't been active for 180 seconds
router.put('/cleanup/offline-users', isAdmin, async (req, res) => {
  try {
    const cutoffTime = new Date(Date.now() - 180 * 1000); // 180 seconds ago
    
    const result = await User.updateMany(
      {
        isOnline: true,
        lastSeen: { $lte: cutoffTime }
      },
      {
        $set: { isOnline: false }
      }
    );
    
    res.json({ 
      message: `Marked ${result.modifiedCount} users as offline`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking users offline:', error);
    res.status(500).json({ error: 'Failed to mark users offline' });
  }
});

// Get user details by ID
router.get('/users/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Delete user
router.delete('/users/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router; 