import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import io from 'socket.io-client'

// Components
import LandingPage from './components/LandingPage'
import ChatRoom from './components/ChatRoom'
import Login from './components/Login'
import Signup from './components/Signup'
import PaymentModal from './components/PaymentModal'
import PrivacyPolicy from './components/PrivacyPolicy'

// Context
import { ChatProvider } from './context/ChatContext'

// Socket connection
const socket = io('http://localhost:5000')

function App() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentType, setPaymentType] = useState(null)

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem('chattersParadiseUser')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('chattersParadiseUser', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('chattersParadiseUser')
  }

  const handlePayment = (type) => {
    setPaymentType(type)
    setShowPaymentModal(true)
  }

  return (
    <ChatProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
          <Routes>
            <Route 
              path="/" 
              element={
                <LandingPage 
                  onStartChat={() => handlePayment('free')}
                  onGenderFilter={() => handlePayment('gender')}
                  onChatRoom={() => handlePayment('room')}
                  isAuthenticated={isAuthenticated}
                  onLogin={() => setIsAuthenticated(true)}
                />
              } 
            />
            <Route 
              path="/chat" 
              element={
                isAuthenticated ? (
                  <ChatRoom 
                    user={user}
                    socket={socket}
                    onLogout={handleLogout}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/login" 
              element={
                <Login 
                  onLogin={handleLogin}
                  onBack={() => window.history.back()}
                />
              } 
            />
            <Route 
              path="/signup" 
              element={
                <Signup 
                  onSignup={handleLogin}
                  onBack={() => window.history.back()}
                />
              } 
            />
            <Route 
              path="/privacy" 
              element={<PrivacyPolicy />} 
            />
          </Routes>

          {/* Payment Modal */}
          {showPaymentModal && (
            <PaymentModal
              type={paymentType}
              onClose={() => setShowPaymentModal(false)}
              onSuccess={() => {
                setShowPaymentModal(false)
                // Handle successful payment
              }}
            />
          )}

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </ChatProvider>
  )
}

export default App 