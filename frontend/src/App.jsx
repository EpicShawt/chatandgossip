import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

import LandingPage from './components/LandingPage';
import ChatRoom from './components/ChatRoom';
import Login from './components/Login';
import Signup from './components/Signup';
import PrivacyPolicy from './components/PrivacyPolicy';
import PaymentModal from './components/PaymentModal';
import { ChatProvider } from './context/ChatContext';

// Initialize socket connection
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('chatandgossip_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
      toast.success('Connected to chat server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
      toast.error('Disconnected from chat server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      toast.error('Failed to connect to server. Please make sure the backend is running.');
    });

    socket.on('user_online', (userData) => {
      console.log('User online:', userData);
      setOnlineUsers(prev => {
        const existing = prev.find(u => u.id === userData.id);
        if (existing) {
          return prev.map(u => u.id === userData.id ? { ...u, ...userData } : u);
        }
        return [...prev, userData];
      });
    });

    socket.on('user_offline', (userData) => {
      console.log('User offline:', userData);
      setOnlineUsers(prev => prev.map(u => 
        u.id === userData.id ? { ...u, isOnline: false, lastSeen: userData.lastSeen } : u
      ));
    });

    // Fetch initial online users with better error handling
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/online');
        if (response.ok) {
          const users = await response.json();
          console.log('Online users:', users);
          setOnlineUsers(users);
        } else {
          console.error('Failed to fetch online users:', response.status);
        }
      } catch (err) {
        console.error('Error fetching online users:', err);
        // Don't show error toast for this, as it might be expected
      }
    };

    // Try to fetch online users after a short delay
    setTimeout(fetchOnlineUsers, 1000);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, []);

  const handleLogin = (userData) => {
    console.log('Logging in user:', userData);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('chatandgossip_user', JSON.stringify(userData));
    
    // Join socket with user data
    socket.emit('user_join', userData);
  };

  const handleLogout = () => {
    console.log('Logging out user');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('chatandgossip_user');
  };

  const handlePaymentRequest = (type) => {
    setPaymentType(type);
    setShowPaymentModal(true);
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setPaymentType(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
        <ChatProvider socket={socket}>
          <Routes>
            <Route 
              path="/" 
              element={
                <LandingPage 
                  user={user}
                  isAuthenticated={isAuthenticated}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  onPaymentRequest={handlePaymentRequest}
                  onlineUsers={onlineUsers}
                  connectionStatus={connectionStatus}
                />
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ChatRoom 
                  user={user}
                  onLogout={handleLogout}
                  onPaymentRequest={handlePaymentRequest}
                  connectionStatus={connectionStatus}
                />
              } 
            />
            <Route 
              path="/login" 
              element={
                <Login 
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                />
              } 
            />
            <Route 
              path="/signup" 
              element={
                <Signup 
                  onLogin={handleLogin}
                />
              } 
            />
            <Route 
              path="/privacy" 
              element={<PrivacyPolicy />} 
            />
          </Routes>
        </ChatProvider>

        {showPaymentModal && (
          <PaymentModal
            type={paymentType}
            onClose={handlePaymentClose}
          />
        )}

        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #fbbf24',
            },
            success: {
              iconTheme: {
                primary: '#f59e0b',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App; 