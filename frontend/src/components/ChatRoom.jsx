import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, ArrowLeft, Users, Filter, RefreshCw, Shield } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useFirebase } from '../context/FirebaseContext';
import toast from 'react-hot-toast';

const ChatRoom = ({ user, onLogout, onPaymentRequest }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [selectedGender, setSelectedGender] = useState('any');
  const [hasJoinedChat, setHasJoinedChat] = useState(false);
  const [hasStartedSearching, setHasStartedSearching] = useState(false);
  
  const {
    messages,
    currentPartner,
    isConnected,
    isSearching,
    typingUsers,
    activeUsers,
    findPartner,
    sendMessage,
    startTyping,
    stopTyping,
    leaveChat,
    nextPartner,
    joinChat,
    getActiveUsers,
    testFirebaseConnection,
    addMultipleTestUsers
  } = useChat();
  
  const { currentUser, onlineUsers } = useFirebase();

  // Get user from location state (for guest users) or props
  const currentUserData = location.state?.user || user;
  const isGuest = location.state?.isGuest || false;

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Start typing indicator
    if (message && currentPartner) {
      startTyping(currentPartner.uid || currentPartner.id);
      setIsTyping(true);
    } else {
      stopTyping();
      setIsTyping(false);
    }
  }, [message, currentPartner, startTyping, stopTyping]);

  // Join chat and find partner when component mounts
  useEffect(() => {
    if (!currentUserData) {
      navigate('/');
      return;
    }

    // Only join chat once
    if (!hasJoinedChat) {
      joinChat(currentUserData);
      setHasJoinedChat(true);
    }

    // Get active users immediately
    getActiveUsers();

    // Auto-find partner after a short delay with gender preference
    const timer = setTimeout(() => {
      if (!currentPartner && !isSearching && !hasStartedSearching) {
        const genderPreference = location.state?.genderPreference || 'any';
        console.log('Finding partner with gender preference:', genderPreference);
        findPartner({ genderFilter: genderPreference });
        setHasStartedSearching(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentUserData, currentPartner, isSearching, navigate, location.state, hasJoinedChat, hasStartedSearching]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Remove user from online list when leaving
      if (currentUserData) {
        const userId = currentUserData.uid;
        const { set, ref, getDatabase } = import('firebase/database');
        const { getApp } = import('firebase/app');
        
        Promise.all([set, ref, getDatabase, getApp]).then(([setFn, refFn, getDatabaseFn, getAppFn]) => {
          const app = getAppFn();
          const rtdb = getDatabaseFn(app);
          const onlineUsersRef = refFn(rtdb, `online_users/${userId}`);
          setFn(onlineUsersRef, null);
          console.log('Removed user from online list on unmount:', userId);
        });
      }
    };
  }, [currentUserData]);

  const handleSendMessage = () => {
    if (!message.trim() || !currentPartner) return;

    sendMessage({
      to: currentPartner.uid || currentPartner.id,
      content: message.trim()
    });
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFindPartner = (genderFilter = null) => {
    findPartner({ genderFilter });
  };

  const handleNextPartner = () => {
    console.log('Next Partner button clicked');
    
    if (currentPartner) {
      // If we have a partner, leave the current chat first
      leaveChat();
      setTimeout(() => {
        nextPartner();
      }, 1000);
    } else {
      // If no partner, start a new search immediately
      console.log('No current partner, starting new search');
      findPartner();
    }
  };

  const getProfilePicture = (gender, profilePicture = 'default1') => {
    const baseClass = "profile-picture";
    const pictureClass = profilePicture || 'default1';
    switch (gender) {
      case 'male': return `${baseClass} male ${pictureClass}`;
      case 'female': return `${baseClass} female ${pictureClass}`;
      default: return `${baseClass} not-disclosed ${pictureClass}`;
    }
  };

  const getGenderDisplay = (gender) => {
    switch (gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'not_disclosed': return 'Not Disclosed';
      default: return 'Not Disclosed';
    }
  };

  const getOnlineStatus = (partner) => {
    if (partner?.isTestUser) return 'Online';
    return partner?.isOnline ? 'Online' : 'Offline';
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      {/* Header */}
      <div className="glass-effect sticky top-0 z-40">
        <div className="container-sm">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative">
                                   <div className={getProfilePicture(currentUserData?.gender, currentUserData?.profilePicture)}>
                   {currentUserData?.username?.charAt(0).toUpperCase()}
                 </div>
                  <div className="online-indicator online"></div>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
                    @{currentUserData?.username}#{currentUserData?.userId || 'GUEST'}
                    {isGuest && (
                      <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                        Guest
                      </span>
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {isGuest ? 'Guest User' : 'You'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
                             {/* Online Users Counter */}
               <div className="flex items-center space-x-2 bg-orange-100 px-3 py-1 rounded-full">
                 <Users className="w-4 h-4 text-orange-600" />
                 <span className="text-sm font-medium text-orange-700">
                   {onlineUsers.length} online
                 </span>
                 <button
                   onClick={() => getActiveUsers()}
                   className="ml-1 p-1 hover:bg-orange-200 rounded transition-colors"
                   title="Refresh online users"
                 >
                   <RefreshCw className="w-3 h-3 text-orange-600" />
                 </button>
               </div>

              {currentPartner && (
                <button
                  onClick={() => setShowGenderFilter(true)}
                  className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                  title="Gender Filter (Premium)"
                >
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </button>
              )}
              
              <button
                onClick={onLogout}
                className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="container-sm py-6">
        <div className="card h-[500px] sm:h-[600px] flex flex-col">
          {/* Partner Info */}
          {currentPartner ? (
            <div className="flex items-center space-x-3 p-4 border-b border-orange-100">
                             <div className="relative">
                 <div className={getProfilePicture(currentPartner.gender, currentPartner.profilePicture)}>
                   {currentPartner.username.charAt(0).toUpperCase()}
                 </div>
                 <div className={`online-indicator ${currentPartner.isOnline ? 'online' : 'offline'}`}></div>
               </div>
               <div className="flex-1">
                 <h3 className="font-semibold text-gray-800">
                   @{currentPartner.username}#{currentPartner.userId}
                   {currentPartner.isTestUser && (
                     <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                       Test User
                     </span>
                   )}
                 </h3>
                <p className="text-sm text-gray-500">
                  {getGenderDisplay(currentPartner.gender)} • {getOnlineStatus(currentPartner)}
                </p>
              </div>
              <button
                onClick={handleNextPartner}
                className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                title="Next Partner"
              >
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </button>
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Searching for partner...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Users className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Partner Connected</h3>
                <p className="text-gray-600 mb-4">Click the button below to find someone to chat with</p>
                
                                 {/* Active Users Section */}
                 {onlineUsers.length > 0 && (
                   <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                     <h4 className="text-sm font-semibold text-orange-700 mb-2">
                       Active Users ({onlineUsers.length})
                     </h4>
                     <div className="space-y-1">
                                               {onlineUsers.map((activeUser) => (
                          <div key={activeUser.uid} className="flex items-center space-x-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${activeUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-gray-700">@{activeUser.username}#{activeUser.userId}</span>
                            <span className="text-gray-500">({getGenderDisplay(activeUser.gender)})</span>
                          </div>
                        ))}
                     </div>
                   </div>
                 )}
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleFindPartner()}
                    className="btn-primary"
                  >
                    Find Partner
                  </button>
                  <button
                    onClick={handleNextPartner}
                    className="btn-outline text-sm"
                    title="Find Next Partner"
                  >
                    🔄 Next Partner
                  </button>
                  
                  {/* Debug buttons - only show in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Debug Tools:</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => testFirebaseConnection()}
                          className="btn-secondary w-full text-xs"
                        >
                          Test Firebase
                        </button>
                        <button
                          onClick={() => addMultipleTestUsers()}
                          className="btn-secondary w-full text-xs"
                        >
                          Add Test Users
                        </button>
                        <button
                          onClick={() => getActiveUsers()}
                          className="btn-secondary w-full text-xs"
                        >
                          Refresh Users
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                         {messages.map((msg, index) => (
               <div
                 key={msg.messageId || index}
                 className={`flex ${msg.from === currentUserData?.id || msg.from === currentUserData?.uid ? 'justify-end' : 'justify-start'}`}
               >
                 <div className={`chat-bubble ${msg.from === currentUserData?.id || msg.from === currentUserData?.uid ? 'sent' : 'received'}`}>
                   <div className="flex items-end space-x-2">
                     {msg.from !== currentUserData?.id && msg.from !== currentUserData?.uid && (
                       <div className="flex-shrink-0">
                         <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold`}>
                           {currentPartner?.username?.charAt(0).toUpperCase()}
                         </div>
                       </div>
                     )}
                     <div className="flex-1">
                       <p className="text-sm">{msg.content}</p>
                       <p className="text-xs opacity-70 mt-1">
                         {new Date(msg.timestamp).toLocaleTimeString()}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="chat-bubble received">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {currentPartner && (
            <div className="p-4 border-t border-orange-100">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="input-field flex-1"
                  disabled={!currentPartner}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !currentPartner}
                  className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Safety Notice */}
        <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
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

      {/* Gender Filter Modal */}
      {showGenderFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Gender Filter (Premium)</h3>
            <p className="text-gray-600 mb-4">
              Connect with people of your preferred gender. This is a premium feature.
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setSelectedGender('male')}
                className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                  selectedGender === 'male' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-orange-200 hover:border-orange-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="profile-picture male">M</div>
                  <span>Male</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedGender('female')}
                className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                  selectedGender === 'female' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-orange-200 hover:border-orange-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="profile-picture female">F</div>
                  <span>Female</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedGender('any')}
                className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                  selectedGender === 'any' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-orange-200 hover:border-orange-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="profile-picture not-disclosed">?</div>
                  <span>Any Gender</span>
                </div>
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowGenderFilter(false);
                  onPaymentRequest('gender');
                }}
                className="btn-primary flex-1"
              >
                Get Premium (₹10/day)
              </button>
              <button
                onClick={() => setShowGenderFilter(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom; 