import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import { 
  Send, 
  LogOut, 
  Users, 
  MessageCircle, 
  ArrowLeft, 
  RefreshCw,
  User,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

const ChatRoom = ({ user, socket, onLogout }) => {
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const [message, setMessage] = useState('')
  const [showGenderFilter, setShowGenderFilter] = useState(false)
  const [selectedGender, setSelectedGender] = useState('')
  
  const {
    messages,
    isConnected,
    currentPartner,
    isTyping,
    partnerTyping,
    chatType,
    roomId,
    participants,
    isSearching,
    sendMessage,
    startTyping,
    stopTyping,
    findPartner,
    joinRoom,
    leaveChat,
    nextPartner,
    setupSocketListeners
  } = useChat()

  useEffect(() => {
    setupSocketListeners(socket)
    
    // Auto-start searching for partner if not in a room
    if (chatType !== 'room') {
      findPartner(socket, user, chatType)
    }

    return () => {
      leaveChat(socket)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!message.trim()) return

    sendMessage(socket, message, user)
    setMessage('')
  }

  const handleTyping = (e) => {
    setMessage(e.target.value)
    if (e.target.value.length > 0) {
      startTyping(socket)
    } else {
      stopTyping(socket)
    }
  }

  const handleNextPartner = () => {
    nextPartner(socket, user)
  }

  const handleGenderFilter = (gender) => {
    setSelectedGender(gender)
    setShowGenderFilter(false)
    leaveChat(socket)
    setTimeout(() => {
      findPartner(socket, user, 'gender', gender)
    }, 1000)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const isOwnMessage = (messageSender) => {
    return messageSender === (user.username || user.email)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {chatType === 'room' ? 'Chat Room' : 'Random Chat'}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                {currentPartner && (
                  <>
                    <span>•</span>
                    <span>Chatting with {currentPartner.username}</span>
                  </>
                )}
                {chatType === 'room' && (
                  <>
                    <span>•</span>
                    <span>{participants.length} participants</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {chatType !== 'room' && (
              <button
                onClick={() => setShowGenderFilter(!showGenderFilter)}
                className="btn-outline text-sm"
              >
                <User className="w-4 h-4 mr-1" />
                Filter
              </button>
            )}
            <button
              onClick={handleNextPartner}
              disabled={isSearching}
              className="btn-outline text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isSearching ? 'animate-spin' : ''}`} />
              Next
            </button>
            <button
              onClick={onLogout}
              className="btn-outline text-sm"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          </div>
        </div>

        {/* Gender Filter Dropdown */}
        {showGenderFilter && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Gender</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleGenderFilter('male')}
                className={`px-3 py-1 rounded text-sm ${
                  selectedGender === 'male' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Male
              </button>
              <button
                onClick={() => handleGenderFilter('female')}
                className={`px-3 py-1 rounded text-sm ${
                  selectedGender === 'female' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Female
              </button>
              <button
                onClick={() => handleGenderFilter('any')}
                className={`px-3 py-1 rounded text-sm ${
                  selectedGender === 'any' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Any
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isSearching && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for a partner...</p>
          </div>
        )}

        {!isSearching && messages.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`flex ${isOwnMessage(msg.sender) ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${isOwnMessage(msg.sender) ? 'order-2' : 'order-1'}`}>
              <div className={`chat-bubble ${isOwnMessage(msg.sender) ? 'sent' : 'received'}`}>
                <div className="text-sm font-medium mb-1">
                  {msg.sender}
                </div>
                <div className="text-sm">
                  {msg.text}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {partnerTyping && (
          <div className="flex justify-start">
            <div className="chat-bubble received">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="Type your message..."
            className="flex-1 input-field"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSearching}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Safety Notice */}
      <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-3">
        <div className="flex items-center space-x-2 text-sm text-yellow-800">
          <Shield className="w-4 h-4" />
          <span>
            <strong>Safety Notice:</strong> Be careful with personal information. 
            Chatter's Paradise is not responsible for the individuals you meet or information shared.
          </span>
        </div>
      </div>
    </div>
  )
}

export default ChatRoom 