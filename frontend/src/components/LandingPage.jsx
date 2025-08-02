import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Users, Shield, Star, ArrowRight, User, LogIn } from 'lucide-react'

const LandingPage = ({ onStartChat, onGenderFilter, onChatRoom, isAuthenticated, onLogin }) => {
  const [username, setUsername] = useState('')

  const handleStartChat = () => {
    if (!username.trim()) {
      alert('Please enter a username')
      return
    }
    localStorage.setItem('anonymousUsername', username)
    onStartChat()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Chatter's Paradise
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link to="/chat" className="btn-primary">
                  Go to Chat
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="btn-outline">
                    <LogIn className="w-4 h-4 mr-2" />
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
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect with
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {' '}Random People
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the thrill of anonymous conversations with people from around the world. 
              Start chatting instantly with no registration required.
            </p>

            {/* Quick Start Section */}
            <div className="max-w-md mx-auto mb-12">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Chatting Now</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                    maxLength={20}
                  />
                  <button
                    onClick={handleStartChat}
                    className="btn-primary w-full"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Start Free Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Experience
            </h2>
            <p className="text-lg text-gray-600">
              Different ways to connect with people around the world
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Chat */}
            <div className="card text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Random Chat</h3>
              <p className="text-gray-600 mb-4">
                Connect with random people instantly. No registration required.
              </p>
              <button
                onClick={handleStartChat}
                className="btn-outline"
              >
                Start Free
              </button>
            </div>

            {/* Gender Filter */}
            <div className="card text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gender Filter</h3>
              <p className="text-gray-600 mb-4">
                Connect with people based on gender preference. ₹10/day
              </p>
              <button
                onClick={onGenderFilter}
                className="btn-secondary"
              >
                ₹10/day
              </button>
            </div>

            {/* Chat Rooms */}
            <div className="card text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chat Rooms</h3>
              <p className="text-gray-600 mb-4">
                Join group chat rooms with multiple people. ₹5 per room
              </p>
              <button
                onClick={onChatRoom}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                ₹5/room
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Chatter's Paradise?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Safe & Secure</h3>
              <p className="text-gray-600">
                Your privacy is our priority. Anonymous chatting with safety features.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-secondary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Connection</h3>
              <p className="text-gray-600">
                Connect with people instantly. No waiting, no complicated setup.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Features</h3>
              <p className="text-gray-600">
                Enhanced experience with gender filters and chat rooms.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Community</h3>
              <p className="text-gray-600">
                Connect with people from around the world, anytime, anywhere.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Chatting?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of users who are already connecting on Chatter's Paradise
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartChat}
              className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Start Free Chat
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </button>
            <Link
              to="/signup"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Chatter's Paradise</h3>
              <p className="text-gray-400">
                Connect with random people around the world through anonymous chat.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Free Random Chat</li>
                <li>Gender Filter</li>
                <li>Chat Rooms</li>
                <li>Anonymous Messaging</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Report Issues</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li>Terms of Service</li>
                <li>Community Guidelines</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Chatter's Paradise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 