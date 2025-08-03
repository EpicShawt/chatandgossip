import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, Shield, ArrowRight, User, Zap } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { useChat } from '../context/ChatContext';
import toast from 'react-hot-toast';

const LandingPage = ({ 
  user, 
  isAuthenticated, 
  onLogin, 
  onLogout, 
  onPaymentRequest,
  onlineUsers = [],
  connectionStatus = 'connected'
}) => {
  const navigate = useNavigate();
  const { currentUser } = useFirebase();
  const { joinChat, getActiveUsers } = useChat();
  const [guestUsername, setGuestUsername] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // Update online count
    setOnlineCount(onlineUsers.length);
  }, [onlineUsers]);

  const handleGuestChat = () => {
    if (!guestUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (guestUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    // Create guest user data
    const guestUser = {
      uid: `guest_${Date.now()}`,
      username: guestUsername.trim(),
      email: `guest_${Date.now()}@chatandgossip.com`,
      isGuest: true,
      isOnline: true,
      lastSeen: new Date().toISOString()
    };

    // Navigate to chat immediately without any async operations
    navigate('/chat', { 
      state: { 
        user: guestUser,
        isGuest: true 
      } 
    });
    
    toast.success(`Welcome ${guestUsername}! Starting chat...`);
  };

  const handleAuthenticatedChat = () => {
    if (isAuthenticated && user) {
      navigate('/chat');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      {/* Header */}
      <div className="glass-effect sticky top-0 z-40">
        <div className="container-sm">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">ChatAndGossip</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Online Users Counter */}
              <div className="flex items-center space-x-2 bg-orange-100 px-3 py-1 rounded-full">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">
                  {onlineCount} online
                </span>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {user?.username}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="btn-outline text-xs sm:text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-outline text-xs sm:text-sm"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="btn-primary text-xs sm:text-sm"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-sm py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-6">
            Connect with
            <span className="text-orange-600"> Random People</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start chatting instantly with people around the world. 
            No registration required - just enter a username and start connecting!
          </p>

          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="max-w-md mx-auto mb-12">
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Start Chatting Now
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Your Username
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={guestUsername}
                    onChange={(e) => setGuestUsername(e.target.value)}
                    placeholder="Enter unique username..."
                    className="input-field flex-1"
                    maxLength={20}
                  />
                  <button
                    onClick={handleGuestChat}
                    disabled={!guestUsername.trim()}
                    className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Start Chat</span>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Choose a unique username to start chatting immediately
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-orange-100">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Or</p>
                <button
                  onClick={handleAuthenticatedChat}
                  className="btn-outline w-full"
                >
                  {isAuthenticated ? 'Continue as ' + user?.username : 'Login for More Features'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card text-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Connection</h3>
            <p className="text-gray-600 text-sm">
              Start chatting immediately with just a username. No registration required.
            </p>
          </div>

          <div className="card text-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real People</h3>
            <p className="text-gray-600 text-sm">
              Connect with real people online right now. See live user count.
            </p>
          </div>

          <div className="card text-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Safe & Secure</h3>
            <p className="text-gray-600 text-sm">
              Anonymous chatting with safety features. Your privacy matters.
            </p>
          </div>
        </div>

        {/* Online Users Preview */}
        {onlineCount > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-600" />
              <span>People Online Now ({onlineCount})</span>
            </h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {onlineCount}
              </div>
              <p className="text-sm text-gray-600">
                {onlineCount === 1 ? 'person is' : 'people are'} online and ready to chat
              </p>
            </div>
          </div>
        )}

        {/* Safety Notice */}
        <div className="mt-8 p-6 bg-orange-50 rounded-xl border border-orange-200">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-800 mb-1">Safety Reminder</h4>
              <p className="text-sm text-orange-700">
                Remember to never share personal information with strangers. 
                ChatAndGossip.com is not responsible for any information shared during conversations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 