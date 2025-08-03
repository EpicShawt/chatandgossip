import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

import LandingPage from './components/LandingPage';
import ChatRoom from './components/ChatRoom';
import Login from './components/Login';
import Signup from './components/Signup';
import PrivacyPolicy from './components/PrivacyPolicy';
import PaymentModal from './components/PaymentModal';
import { ChatProvider } from './context/ChatContext';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';

// Separate component that uses Firebase hooks
function AppContent() {
  const { currentUser, logout: firebaseLogout, getOnlineUsers } = useFirebase();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Fetch online users function
  const fetchOnlineUsers = async () => {
    try {
      const users = await getOnlineUsers();
      console.log('Online users:', users);
      setOnlineUsers(users);
    } catch (err) {
      console.error('Error fetching online users:', err);
      // Don't show error toast for this, as it might be expected
    }
  };

  useEffect(() => {
    // Update user state when Firebase auth changes
    if (currentUser) {
      setUser({
        id: currentUser.uid,
        username: currentUser.displayName || currentUser.email?.split('@')[0],
        email: currentUser.email
      });
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }

    // Fetch online users initially
    fetchOnlineUsers();
    
    // Set up periodic refresh of online users
    const interval = setInterval(fetchOnlineUsers, 10000); // Refresh every 10 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleLogin = (userData) => {
    console.log('Logging in user:', userData);
    // User state will be updated by Firebase auth listener
  };

  const handleLogout = async () => {
    console.log('Logging out user');
    try {
      await firebaseLogout();
      // User state will be cleared by Firebase auth listener
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear user state manually
      setUser(null);
      setIsAuthenticated(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      <ChatProvider>
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
  );
}

// Main App component that provides Firebase context
function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </Router>
  );
}

export default App; 