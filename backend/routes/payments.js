const express = require('express')
const router = express.Router()

// In-memory storage for demo (replace with database in production)
const payments = new Map()
const subscriptions = new Map()

// Payment plans
const PLANS = {
  gender_filter: {
    id: 'gender_filter',
    name: 'Gender Filter Plan',
    price: 10,
    currency: 'INR',
    duration: '1 day',
    features: [
      'Filter by male users',
      'Filter by female users',
      'Premium matching algorithm',
      'Priority connection'
    ]
  },
  chat_room: {
    id: 'chat_room',
    name: 'Chat Room Access',
    price: 5,
    currency: 'INR',
    duration: 'per room',
    features: [
      'Join group chat rooms',
      'Multiple participants',
      'Room-based conversations',
      'Enhanced social experience'
    ]
  }
}

// Process payment (simulated)
router.post('/process', async (req, res) => {
  try {
    const { userId, planId, paymentCode } = req.body

    if (!userId || !planId || !paymentCode) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const plan = PLANS[planId]
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    // For testing, accept "pass" as payment code
    if (paymentCode !== 'pass') {
      return res.status(400).json({ error: 'Invalid payment code. Use "pass" for testing.' })
    }

    // Create payment record
    const payment = {
      id: Date.now().toString(),
      userId,
      planId,
      amount: plan.price,
      currency: plan.currency,
      status: 'completed',
      createdAt: new Date(),
      expiresAt: planId === 'gender_filter' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
        : null
    }

    payments.set(payment.id, payment)

    // Create or update subscription
    const subscription = {
      userId,
      planId,
      isActive: true,
      startedAt: new Date(),
      expiresAt: payment.expiresAt,
      paymentId: payment.id
    }

    subscriptions.set(userId, subscription)

    res.json({
      message: 'Payment processed successfully',
      payment: {
        id: payment.id,
        planId: payment.planId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        expiresAt: payment.expiresAt
      },
      subscription: {
        planId: subscription.planId,
        isActive: subscription.isActive,
        expiresAt: subscription.expiresAt
      }
    })

  } catch (error) {
    console.error('Payment processing error:', error)
    res.status(500).json({ error: 'Payment processing failed' })
  }
})

// Get available plans
router.get('/plans', (req, res) => {
  try {
    res.json({
      plans: Object.values(PLANS)
    })
  } catch (error) {
    console.error('Get plans error:', error)
    res.status(500).json({ error: 'Failed to get plans' })
  }
})

// Get user subscription
router.get('/subscription/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const subscription = subscriptions.get(userId)

    if (!subscription) {
      return res.json({
        hasActiveSubscription: false,
        subscription: null
      })
    }

    // Check if subscription is expired
    if (subscription.expiresAt && new Date() > subscription.expiresAt) {
      subscription.isActive = false
      subscriptions.set(userId, subscription)
    }

    res.json({
      hasActiveSubscription: subscription.isActive,
      subscription: {
        planId: subscription.planId,
        isActive: subscription.isActive,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt
      }
    })

  } catch (error) {
    console.error('Get subscription error:', error)
    res.status(500).json({ error: 'Failed to get subscription' })
  }
})

// Get payment history
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const userPayments = Array.from(payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json({
      payments: userPayments.map(payment => ({
        id: payment.id,
        planId: payment.planId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        expiresAt: payment.expiresAt
      }))
    })

  } catch (error) {
    console.error('Get payment history error:', error)
    res.status(500).json({ error: 'Failed to get payment history' })
  }
})

// Cancel subscription
router.post('/cancel/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const subscription = subscriptions.get(userId)

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' })
    }

    subscription.isActive = false
    subscription.cancelledAt = new Date()
    subscriptions.set(userId, subscription)

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        planId: subscription.planId,
        isActive: subscription.isActive,
        cancelledAt: subscription.cancelledAt
      }
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

// Get payment statistics
router.get('/stats/overview', (req, res) => {
  try {
    const totalPayments = payments.size
    const completedPayments = Array.from(payments.values())
      .filter(payment => payment.status === 'completed').length
    
    const totalRevenue = Array.from(payments.values())
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0)

    const activeSubscriptions = Array.from(subscriptions.values())
      .filter(sub => sub.isActive).length

    res.json({
      totalPayments,
      completedPayments,
      totalRevenue,
      activeSubscriptions,
      successRate: totalPayments > 0 ? (completedPayments / totalPayments * 100).toFixed(2) : 0
    })

  } catch (error) {
    console.error('Get payment stats error:', error)
    res.status(500).json({ error: 'Failed to get payment statistics' })
  }
})

module.exports = router 