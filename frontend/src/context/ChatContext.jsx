import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useFirebase } from './FirebaseContext';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  push, 
  onValue, 
  off 
} from 'firebase/database';
import { getApp } from 'firebase/app';

const ChatContext = createContext();

const initialState = {
  messages: [],
  currentPartner: null,
  isConnected: true, // Firebase is always connected
  isSearching: false,
  typingUsers: [],
  chatType: 'random',
  roomInfo: null,
  participants: [],
  activeUsers: [],
  onlineUsers: []
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    
    case 'SET_SEARCHING':
      return { ...state, isSearching: action.payload };
    
    case 'SET_PARTNER':
      return { 
        ...state, 
        currentPartner: action.payload,
        isSearching: false,
        messages: action.payload ? [] : state.messages
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    
    case 'CLEAR_CHAT':
      return { ...state, messages: [], currentPartner: null };
    
    case 'SET_ROOM_INFO':
      return { ...state, roomInfo: action.payload };
    
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    
    case 'SET_ACTIVE_USERS':
      return { ...state, activeUsers: action.payload };
    
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  // Expose dispatch globally for FirebaseContext to access
  useEffect(() => {
    window.chatContextDispatch = dispatch;
    return () => {
      delete window.chatContextDispatch;
    };
  }, []);
  
  const { 
    currentUser, 
    getOnlineUsers,
    createUserProfile,
    updateUserProfile
  } = useFirebase();

  const messageListenerRef = useRef(null);
  const onlineUsersListenerRef = useRef(null);

  // Initialize Firebase chat provider
  useEffect(() => {
    console.log('ChatContext: Firebase chat provider initialized');
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
    
    // Set up periodic cleanup of stale partner connections
    const cleanupInterval = setInterval(async () => {
      try {
        const app = getApp();
        const rtdb = getDatabase(app);
        const onlineUsersRef = ref(rtdb, 'online_users');
        
        const snapshot = await get(onlineUsersRef);
        if (snapshot.exists()) {
          const users = snapshot.val();
          let cleanedCount = 0;
          
          for (const [userId, userData] of Object.entries(users)) {
            if (userData.currentPartner) {
              // Check if the partner still exists and has this user as their partner
              const partnerRef = ref(rtdb, `online_users/${userData.currentPartner}`);
              const partnerSnapshot = await get(partnerRef);
              
              if (!partnerSnapshot.exists() || 
                  partnerSnapshot.val().currentPartner !== userId) {
                // Partner doesn't exist or doesn't have this user as partner - clear the connection
                await set(ref(rtdb, `online_users/${userId}`), {
                  ...userData,
                  currentPartner: null,
                  isSearching: false
                });
                cleanedCount++;
                console.log(`Cleaned stale partner connection for user: ${userId}`);
              }
            }
          }
          
          if (cleanedCount > 0) {
            console.log(`Cleaned ${cleanedCount} stale partner connections`);
          }
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }, 30000); // Run every 30 seconds
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  const joinChat = async (userData) => {
    try {
      console.log('Joining chat with user data:', userData);
      
      // Handle both authenticated and guest users
      const userId = currentUser?.uid || userData?.uid || `guest_${Date.now()}`;
      const username = userData?.username || 'Guest User';
      
      console.log('User ID for online tracking:', userId);
      console.log('Username for online tracking:', username);
      
      // Add user to online users in Firebase Realtime Database
      const app = getApp();
      const rtdb = getDatabase(app);
      const onlineUsersRef = ref(rtdb, `online_users/${userId}`);
      
      const userOnlineData = {
        uid: userId,
        username: username,
        isOnline: true,
        lastSeen: Date.now(),
        isGuest: !currentUser,
        gender: userData?.gender || 'not_disclosed',
        isSearching: false,
        currentPartner: null, // Prevent multiple connections
        profilePicture: userData?.profilePicture || 'default1',
        userId: userData?.userId || Math.random().toString(36).substring(2, 8).toUpperCase()
      };
      
      console.log('Adding user to online list:', userOnlineData);
      await set(onlineUsersRef, userOnlineData);
      console.log('Successfully added user to online list');

      // Update user profile if authenticated
      if (currentUser) {
        await updateUserProfile(currentUser.uid, {
          isOnline: true,
          lastSeen: new Date().toISOString(),
          ...userData
        });
      }

      // Get online users for matching
      const onlineUsers = await getOnlineUsers();
      console.log('Current online users after joining:', onlineUsers);
      dispatch({ type: 'SET_ONLINE_USERS', payload: onlineUsers });
      
      toast.success('Joined chat successfully!');
    } catch (error) {
      console.error('Error joining chat:', error);
      toast.error('Failed to join chat');
    }
  };

  const findPartner = async (options = {}) => {
    console.log('findPartner called with options:', options);
    console.log('Current state - isSearching:', state.isSearching, 'currentPartner:', state.currentPartner);
    
    // Prevent multiple simultaneous searches
    if (state.isSearching) {
      console.log('Already searching for partner, skipping...');
      return;
    }
    
    // If already have a partner, don't search again
    if (state.currentPartner) {
      console.log('Already have a partner, skipping search...');
      return;
    }
    
    console.log('Finding partner with options:', options);
    console.log('Current user:', currentUser);
    dispatch({ type: 'SET_SEARCHING', payload: true });
    toast.loading('Searching for partner...');

    // Mark current user as searching
    const currentUserId = currentUser?.uid || 'guest';
    try {
      const app = getApp();
      const rtdb = getDatabase(app);
      const userRef = ref(rtdb, `online_users/${currentUserId}`);
      
      // Get current user data first
      const userSnapshot = await get(userRef);
      const currentUserData = userSnapshot.val() || {};
      
      // Update user status to searching
      await set(userRef, {
        ...currentUserData,
        isSearching: true,
        currentPartner: null
      });
    } catch (error) {
      console.error('Error updating search status:', error);
    }

    // Set a 30-second timeout for manual next partner option
    const searchTimeout = setTimeout(async () => {
      console.log('30 seconds passed, no real partners found');
      
      // Mark user as no longer searching
      try {
        const app = getApp();
        const rtdb = getDatabase(app);
        const userRef = ref(rtdb, `online_users/${currentUserId}`);
        
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};
        
        await set(userRef, {
          ...userData,
          isSearching: false
        });
      } catch (updateError) {
        console.error('Error updating search status:', updateError);
      }
      
      dispatch({ type: 'SET_SEARCHING', payload: false });
      toast.error('No partners found. Try clicking "Next Partner" to search again.');
    }, 30000);

    try {
      // Get real online users from Firebase
      const onlineUsers = await getOnlineUsers();
      console.log('Available online users from Firebase:', onlineUsers);
      
      // Get current user ID (authenticated or guest)
      const currentUserId = currentUser?.uid || 'guest';
      console.log('Current user ID:', currentUserId);
      
      // Filter out current user and find available partners
      let availableUsers = onlineUsers.filter(user => 
        user.uid !== currentUserId && 
        user.isOnline &&
        !user.isSearching && // Don't pair with users who are already searching
        !user.currentPartner // Don't pair with users who already have a partner
      );

      // Apply gender filter if specified
      if (options.genderFilter && options.genderFilter !== 'any') {
        availableUsers = availableUsers.filter(user => 
          user.gender === options.genderFilter || user.gender === 'not_disclosed'
        );
      }

      console.log('Available partners after filtering:', availableUsers);
      console.log('Total online users:', onlineUsers.length);
      console.log('Available partners count:', availableUsers.length);

      if (availableUsers.length > 0) {
        // Clear the search timeout since we found a real partner
        clearTimeout(searchTimeout);
        
        // Find a random partner from real users
        const randomIndex = Math.floor(Math.random() * availableUsers.length);
        const partner = availableUsers[randomIndex];
        
        console.log('Found real partner:', partner);
        
        // Create a unique room ID for this chat
        const roomId = `chat_${Math.min(currentUserId, partner.uid)}_${Math.max(currentUserId, partner.uid)}`;
        
        // Create chat room in Realtime Database instead of Firestore
        try {
          const app = getApp();
          const rtdb = getDatabase(app);
          const chatRoomRef = ref(rtdb, `chat_rooms/${roomId}`);
          
          await set(chatRoomRef, {
            roomId,
            participants: [currentUserId, partner.uid],
            createdAt: Date.now(),
            lastActivity: Date.now()
          });
        } catch (error) {
          console.error('Error creating chat room:', error);
        }
        
        // Mark both users as no longer searching and set current partner
        try {
          const app = getApp();
          const rtdb = getDatabase(app);
          
          // Mark current user as no longer searching and set partner
          const currentUserRef = ref(rtdb, `online_users/${currentUserId}`);
          const currentUserSnapshot = await get(currentUserRef);
          const currentUserData = currentUserSnapshot.val() || {};
          await set(currentUserRef, {
            ...currentUserData,
            isSearching: false,
            currentPartner: partner.uid
          });
          
          // Mark partner as no longer searching and set current partner
          const partnerRef = ref(rtdb, `online_users/${partner.uid}`);
          const partnerSnapshot = await get(partnerRef);
          const partnerData = partnerSnapshot.val() || {};
          await set(partnerRef, {
            ...partnerData,
            isSearching: false,
            currentPartner: currentUserId
          });
        } catch (error) {
          console.error('Error updating search status:', error);
        }
        
        // Set the partner
        dispatch({ type: 'SET_PARTNER', payload: partner });
        dispatch({ type: 'SET_SEARCHING', payload: false });
        toast.success(`Connected with @${partner.username}#${partner.userId}!`);
        
        // Listen to messages in this room using Realtime Database
        if (messageListenerRef.current) {
          messageListenerRef.current();
        }
        
        try {
          const app = getApp();
          const rtdb = getDatabase(app);
          const messagesRef = ref(rtdb, `chat_rooms/${roomId}/messages`);
          
          messageListenerRef.current = onValue(messagesRef, (snapshot) => {
            const messages = [];
            snapshot.forEach((childSnapshot) => {
              messages.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
              });
            });
            dispatch({ type: 'SET_MESSAGES', payload: messages });
            
            // Mark received messages as read
            const currentUserId = currentUser?.uid || 'guest';
            messages.forEach(async (msg) => {
              if (msg.from !== currentUserId && msg.status !== 'read') {
                await markMessageAsRead(roomId, msg.messageId);
              }
            });
          });
        } catch (error) {
          console.error('Error setting up message listener:', error);
        }
        
      } else {
        // No real users available, wait for timeout or manual next partner
        console.log('No real users available, waiting for timeout or manual next partner');
        console.log('This means either:');
        console.log('1. No other users are online');
        console.log('2. You are the only user online');
        console.log('3. Firebase connection issues');
        console.log('4. All available users are already searching or have partners');
      }
    } catch (error) {
      console.error('Error finding partner:', error);
      clearTimeout(searchTimeout);
      
      // Mark user as no longer searching
      try {
        const app = getApp();
        const rtdb = getDatabase(app);
        const userRef = ref(rtdb, `online_users/${currentUserId}`);
        
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};
        
        await set(userRef, {
          ...userData,
          isSearching: false
        });
      } catch (updateError) {
        console.error('Error updating search status:', updateError);
      }
      
      dispatch({ type: 'SET_SEARCHING', payload: false });
      toast.error('Failed to find partner. Try clicking "Next Partner" to search again.');
    }
  };

  const sendMessage = async (messageData) => {
    if (!state.currentPartner) {
      toast.error('No partner connected');
      return;
    }

    console.log('Sending message:', messageData);
    
    try {
      // Real user - send via Realtime Database
      const currentUserId = currentUser?.uid || 'guest';
      const roomId = `chat_${Math.min(currentUserId, state.currentPartner.uid)}_${Math.max(currentUserId, state.currentPartner.uid)}`;
      
      const app = getApp();
      const rtdb = getDatabase(app);
      const messagesRef = ref(rtdb, `chat_rooms/${roomId}/messages`);
      
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      await push(messagesRef, {
        ...messageData,
        from: currentUser?.uid || 'guest',
        to: state.currentPartner.uid,
        timestamp: Date.now(),
        messageId: messageId,
        status: 'sent' // Initial status
      });
      
      // Update message status to delivered after a short delay
      setTimeout(async () => {
        try {
          const messageRef = ref(rtdb, `chat_rooms/${roomId}/messages/${messageId}`);
          await set(messageRef, {
            ...messageData,
            from: currentUser?.uid || 'guest',
            to: state.currentPartner.uid,
            timestamp: Date.now(),
            messageId: messageId,
            status: 'delivered'
          });
        } catch (error) {
          console.error('Error updating message status to delivered:', error);
        }
      }, 1000);
      
      // Don't show success toast for every message
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const startTyping = (partnerId) => {
    console.log('Starting typing to partner:', partnerId);
    // Firebase typing implementation would go here
  };

  const stopTyping = () => {
    console.log('Stopping typing');
    // Firebase typing implementation would go here
  };

  const leaveChat = async () => {
    console.log('Leaving chat');
    
    if (messageListenerRef.current) {
      messageListenerRef.current();
      messageListenerRef.current = null;
    }
    
    const currentUserId = currentUser?.uid || 'guest';
    
    // Clear current partner status for both users
    if (state.currentPartner) {
      try {
        const app = getApp();
        const rtdb = getDatabase(app);
        
        // Clear current user's partner status
        const currentUserRef = ref(rtdb, `online_users/${currentUserId}`);
        const currentUserSnapshot = await get(currentUserRef);
        const currentUserData = currentUserSnapshot.val() || {};
        await set(currentUserRef, {
          ...currentUserData,
          currentPartner: null,
          isSearching: false
        });
        
        // Clear partner's partner status
        const partnerRef = ref(rtdb, `online_users/${state.currentPartner.uid}`);
        const partnerSnapshot = await get(partnerRef);
        const partnerData = partnerSnapshot.val() || {};
        await set(partnerRef, {
          ...partnerData,
          currentPartner: null,
          isSearching: false
        });
        
        console.log('Cleared partner status for both users');
      } catch (error) {
        console.error('Error clearing partner status:', error);
      }
    }
    
    // Remove user from online users
    try {
      const app = getApp();
      const rtdb = getDatabase(app);
      const onlineUsersRef = ref(rtdb, `online_users/${currentUserId}`);
      await set(onlineUsersRef, null);
      
      console.log('Removed user from online list:', currentUserId);
    } catch (error) {
      console.error('Error removing user from online list:', error);
    }
    
    if (state.currentPartner) {
      const roomId = `chat_${Math.min(currentUserId, state.currentPartner.uid)}_${Math.max(currentUserId, state.currentPartner.uid)}`;
      
      try {
        const app = getApp();
        const rtdb = getDatabase(app);
        const chatRoomRef = ref(rtdb, `chat_rooms/${roomId}`);
        
        // Update last activity
        await set(chatRoomRef, {
          lastActivity: Date.now()
        });
      } catch (error) {
        console.error('Error leaving chat room:', error);
      }
    }
    
    dispatch({ type: 'CLEAR_CHAT' });
  };

  const nextPartner = async () => {
    console.log('Finding next partner');
    
    const currentUserId = currentUser?.uid || 'guest';
    
    // Clear current chat
    if (messageListenerRef.current) {
      messageListenerRef.current();
      messageListenerRef.current = null;
    }
    
    // Clear current partner status for both users
    if (state.currentPartner) {
      try {
        const app = getApp();
        const rtdb = getDatabase(app);
        
        // Clear current user's partner status
        const currentUserRef = ref(rtdb, `online_users/${currentUserId}`);
        const currentUserSnapshot = await get(currentUserRef);
        const currentUserData = currentUserSnapshot.val() || {};
        await set(currentUserRef, {
          ...currentUserData,
          currentPartner: null,
          isSearching: false
        });
        
        // Clear partner's partner status
        const partnerRef = ref(rtdb, `online_users/${state.currentPartner.uid}`);
        const partnerSnapshot = await get(partnerRef);
        const partnerData = partnerSnapshot.val() || {};
        await set(partnerRef, {
          ...partnerData,
          currentPartner: null,
          isSearching: false
        });
        
        console.log('Cleared partner status for both users in nextPartner');
      } catch (error) {
        console.error('Error clearing partner status in nextPartner:', error);
      }
    }
    
    // Clear current partner
    dispatch({ type: 'CLEAR_CHAT' });
    
    // Reset searching state
    dispatch({ type: 'SET_SEARCHING', payload: false });
    
    // Wait a moment then start new search
    setTimeout(() => {
      console.log('Starting new partner search from nextPartner');
      findPartner();
    }, 500);
  };

  const getActiveUsers = async () => {
    try {
      const onlineUsers = await getOnlineUsers();
      console.log('Retrieved active users:', onlineUsers);
      dispatch({ type: 'SET_ACTIVE_USERS', payload: onlineUsers });
      return onlineUsers;
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  };

  const addTestUser = async () => {
    try {
      const testUserId = `test_user_${Date.now()}`;
      const app = getApp();
      const rtdb = getDatabase(app);
      const onlineUsersRef = ref(rtdb, `online_users/${testUserId}`);
      
      await set(onlineUsersRef, {
        uid: testUserId,
        username: `TestUser${Date.now()}`,
        isOnline: true,
        lastSeen: Date.now(),
        isGuest: true,
        userId: Math.random().toString(36).substring(2, 8).toUpperCase(),
        profilePicture: 'default1'
      });
      
      console.log('Added test user to online list:', testUserId);
      toast.success('Test user added to online list');
    } catch (error) {
      console.error('Error adding test user:', error);
      toast.error('Failed to add test user');
    }
  };

  const addMultipleTestUsers = async () => {
    try {
      const testUsers = [
        { username: 'John', gender: 'male', profilePicture: 'default2' },
        { username: 'Emma', gender: 'female', profilePicture: 'default3' },
        { username: 'Alex', gender: 'not_disclosed', profilePicture: 'default4' },
        { username: 'Sarah', gender: 'female', profilePicture: 'default5' },
        { username: 'Mike', gender: 'male', profilePicture: 'default6' }
      ];
      
      const app = getApp();
      const rtdb = getDatabase(app);
      
      for (let i = 0; i < testUsers.length; i++) {
        const testUserId = `test_user_${Date.now()}_${i}`;
        const onlineUsersRef = ref(rtdb, `online_users/${testUserId}`);
        
        await set(onlineUsersRef, {
          uid: testUserId,
          username: testUsers[i].username,
          isOnline: true,
          lastSeen: Date.now(),
          isGuest: true,
          gender: testUsers[i].gender,
          userId: Math.random().toString(36).substring(2, 8).toUpperCase(),
          profilePicture: testUsers[i].profilePicture
        });
        
        console.log('Added test user:', testUsers[i].username);
      }
      
      toast.success(`Added ${testUsers.length} test users to online list`);
      
      // Refresh active users after adding test users
      await getActiveUsers();
    } catch (error) {
      console.error('Error adding multiple test users:', error);
      toast.error('Failed to add test users');
    }
  };

  const testFirebaseConnection = async () => {
    try {
      const app = getApp();
      const rtdb = getDatabase(app);
      const testRef = ref(rtdb, 'test_connection');
      
      await set(testRef, { timestamp: Date.now() });
      await set(testRef, null); // Clean up
      
      toast.success('Firebase connection test successful!');
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      toast.error('Firebase connection test failed');
      return false;
    }
  };

  const markMessageAsRead = async (roomId, messageId) => {
    try {
      const app = getApp();
      const rtdb = getDatabase(app);
      const messageRef = ref(rtdb, `chat_rooms/${roomId}/messages/${messageId}`);
      
      // Get current message data
      const messageSnapshot = await get(messageRef);
      if (messageSnapshot.exists()) {
        const messageData = messageSnapshot.val();
        await set(messageRef, {
          ...messageData,
          status: 'read'
        });
        console.log(`Message ${messageId} in room ${roomId} marked as read.`);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const value = {
    ...state,
    joinChat,
    findPartner,
    sendMessage,
    startTyping,
    stopTyping,
    leaveChat,
    nextPartner,
    getActiveUsers,
    addTestUser,
    addMultipleTestUsers,
    testFirebaseConnection
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 