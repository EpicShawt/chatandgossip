const express = require('express')
const router = express.Router()

// In-memory storage for demo (replace with database in production)
const users = new Map()

// Get all users (admin only)
router.get('/', (req, res) => {
  try {
    const userList = Array.from(users.values()).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }))

    res.json({ users: userList })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// Get user by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const user = Array.from(users.values()).find(u => u.id === id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// Update user profile
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const { username, phone } = req.body

    const user = users.get(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update user
    if (username) user.username = username
    if (phone !== undefined) user.phone = phone

    users.set(id, user)

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Delete user
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    const user = users.get(id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    users.delete(id)

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// Get user statistics
router.get('/stats/overview', (req, res) => {
  try {
    const totalUsers = users.size
    const verifiedUsers = Array.from(users.values()).filter(u => u.isVerified).length
    const unverifiedUsers = totalUsers - verifiedUsers

    res.json({
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to get statistics' })
  }
})

module.exports = router 