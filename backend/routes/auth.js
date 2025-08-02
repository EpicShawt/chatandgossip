const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const router = express.Router()

// In-memory storage for demo (replace with database in production)
const users = new Map()
const otpStore = new Map()

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP (simulated)
const sendOTP = async (email, otp) => {
  // In production, use a real email service like SendGrid or Nodemailer
  console.log(`OTP ${otp} sent to ${email}`)
  return true
}

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be provided' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      phone: phone || null,
      createdAt: new Date(),
      isVerified: false
    }

    // Store user
    users.set(email, user)

    // Generate and send OTP
    const otp = generateOTP()
    otpStore.set(email, {
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    })

    await sendOTP(email, otp)

    res.status(201).json({
      message: 'User registered successfully. Please check your email for OTP.',
      userId: user.id
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' })
    }

    const storedOTP = otpStore.get(email)
    if (!storedOTP) {
      return res.status(400).json({ error: 'OTP not found or expired' })
    }

    if (new Date() > storedOTP.expiresAt) {
      otpStore.delete(email)
      return res.status(400).json({ error: 'OTP has expired' })
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' })
    }

    // Mark user as verified
    const user = users.get(email)
    if (user) {
      user.isVerified = true
      users.set(email, user)
    }

    // Remove OTP from store
    otpStore.delete(email)

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isVerified: true
      },
      token
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    res.status(500).json({ error: 'OTP verification failed' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = users.get(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified
      },
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const user = users.get(email)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate new OTP
    const otp = generateOTP()
    otpStore.set(email, {
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    })

    await sendOTP(email, otp)

    res.json({ message: 'OTP resent successfully' })

  } catch (error) {
    console.error('Resend OTP error:', error)
    res.status(500).json({ error: 'Failed to resend OTP' })
  }
})

// Google OAuth (simulated)
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId } = req.body

    // In production, verify the Google token
    let user = users.get(email)

    if (!user) {
      // Create new user
      user = {
        id: Date.now().toString(),
        username: name,
        email,
        googleId,
        isVerified: true,
        createdAt: new Date()
      }
      users.set(email, user)
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Google login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      },
      token
    })

  } catch (error) {
    console.error('Google login error:', error)
    res.status(500).json({ error: 'Google login failed' })
  }
})

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    const user = users.get(decoded.email)

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
    console.error('Profile error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
})

module.exports = router 