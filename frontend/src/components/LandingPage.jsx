import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Users, Shield, Star, ArrowRight, User, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const LandingPage = ({ user, isAuthenticated, onLogin, onLogout, onPaymentRequest, onlineUsers }) => {
  const [anonymousUsername, setAnonymousUsername] = useState('');
  const [selectedGender, setSelectedGender] = useState('not_disclosed');
  const [showGenderModal, setShowGenderModal] = useState(false);

  const handleAnonymousChat = () => {
    if (!anonymousUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }
    
    // Create anonymous user
    const anonymousUser = {
      id: `anon_${Date.now()}`,
      username: anonymousUsername,
      gender: selectedGender,
      isAnonymous: true
    };
    
    onLogin(anonymousUser);
    window.location.href = '/chat';
  };

  const handleGenderSelection = (gender) => {
    setSelectedGender(gender);
    setShowGenderModal(false);
  };

  const getGenderDisplay = (gender) => {
    switch (gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'not_disclosed': return 'Not Disclosed';
      default: return 'Not Disclosed';
    }
  };

  const getProfilePicture = (gender) => {
    const baseClass = "profile-picture";
    switch (gender) {
      case 'male': return `${baseClass} male`;
      case 'female': return `${baseClass} female`;
      default: return `${baseClass} not-disclosed`;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-8 h-8 text-orange-600" />
              <h1 className="text-2xl font-bold gradient-text">ChatAndGossip.com</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className={getProfilePicture(user?.gender)}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className={`online-indicator ${user?.isOnline ? 'online' : 'offline'}`}></div>
                  </div>
                  <span className="text-gray-700 font-medium">{user?.username}</span>
                  <button
                    onClick={onLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="btn-outline">
                    Login
                  </Link>
                  <Link to="/signup" className="btn-primary">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
              Connect with the World
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Join millions of people chatting anonymously on ChatAndGossip.com. 
              Make new friends, share stories, and discover amazing conversations.
            </p>
            
            {/* Online Users Display */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 font-medium">
                  {onlineUsers.length} people online now
                </span>
              </div>
              
              {/* Online Users Preview */}
              <div className="flex justify-center space-x-2 mb-6">
                {onlineUsers.slice(0, 5).map((user, index) => (
                  <div key={user.id} className="relative">
                    <div className={getProfilePicture(user.gender)}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="online-indicator online"></div>
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
                    <span className="text-orange-600 font-bold">+{onlineUsers.length - 5}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Start */}
            <div className="card max-w-md mx-auto mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Start Chatting Now</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={anonymousUsername}
                  onChange={(e) => setAnonymousUsername(e.target.value)}
                  className="input-field"
                  maxLength={20}
                />
                
                <button
                  onClick={() => setShowGenderModal(true)}
                  className="w-full btn-outline text-left flex items-center justify-between"
                >
                  <span>Gender: {getGenderDisplay(selectedGender)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleAnonymousChat}
                  className="w-full btn-primary"
                >
                  Start Free Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Why Choose ChatAndGossip?</h2>
            <p className="text-xl text-gray-600">Experience the best random chat platform</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center animate-slide-up">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Random Chat</h3>
              <p className="text-gray-600">Connect with random people instantly. No registration required!</p>
            </div>
            
            <div className="card text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gender Filter</h3>
              <p className="text-gray-600">Premium feature to connect with specific gender (₹10/day)</p>
            </div>
            
            <div className="card text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
              <p className="text-gray-600">Your privacy is our priority. Chat anonymously with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Premium Features</h2>
            <p className="text-xl text-gray-600">Unlock advanced features for better experience</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-orange-500 mr-2" />
                <h3 className="text-xl font-semibold">Gender Filter</h3>
              </div>
              <p className="text-gray-600 mb-4">Connect with people of your preferred gender for more meaningful conversations.</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">₹10/day</span>
                <button
                  onClick={() => onPaymentRequest('gender')}
                  className="btn-secondary"
                >
                  Get Premium
                </button>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-orange-500 mr-2" />
                <h3 className="text-xl font-semibold">Chat Rooms</h3>
              </div>
              <p className="text-gray-600 mb-4">Join exciting group chat rooms and meet multiple people at once.</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">₹5/room</span>
                <button
                  onClick={() => onPaymentRequest('room')}
                  className="btn-secondary"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Ready to Start Chatting?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of users who are already making new friends on ChatAndGossip.com
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  if (!anonymousUsername) {
                    setAnonymousUsername('Anonymous' + Math.floor(Math.random() * 1000));
                  }
                  handleAnonymousChat();
                }}
                className="btn-primary text-lg px-8 py-4"
              >
                Start Free Chat Now
              </button>
              <Link to="/signup" className="btn-outline text-lg px-8 py-4">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ChatAndGossip.com</h3>
              <p className="text-gray-400">Connect with the world through anonymous chat.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Free Random Chat</li>
                <li>Gender Filter</li>
                <li>Chat Rooms</li>
                <li>Anonymous Mode</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Report Issue</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-orange-400">Privacy Policy</Link></li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ChatAndGossip.com. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Gender Selection Modal */}
      {showGenderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Select Your Gender</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleGenderSelection('male')}
                className="w-full p-3 text-left rounded-lg border-2 border-orange-200 hover:border-orange-500 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="profile-picture male">M</div>
                  <span>Male</span>
                </div>
              </button>
              <button
                onClick={() => handleGenderSelection('female')}
                className="w-full p-3 text-left rounded-lg border-2 border-orange-200 hover:border-orange-500 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="profile-picture female">F</div>
                  <span>Female</span>
                </div>
              </button>
              <button
                onClick={() => handleGenderSelection('not_disclosed')}
                className="w-full p-3 text-left rounded-lg border-2 border-orange-200 hover:border-orange-500 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="profile-picture not-disclosed">?</div>
                  <span>Not Disclosed</span>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowGenderModal(false)}
              className="w-full mt-4 btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage; 