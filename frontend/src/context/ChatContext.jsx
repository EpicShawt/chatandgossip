import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useFirebase } from './FirebaseContext';

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
    sendMessage: firebaseSendMessage, 
    listenToMessages, 
    joinChatRoom, 
    leaveChatRoom,
    getOnlineUsers,
    createUserProfile,
    updateUserProfile
  } = useFirebase();

  const messageListenerRef = useRef(null);
  const onlineUsersListenerRef = useRef(null);

  useEffect(() => {
    console.log('ChatContext: Firebase chat provider initialized');
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
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
      const { set, ref, getDatabase } = await import('firebase/database');
      const { getApp } = await import('firebase/app');
      
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
         isSearching: false
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
      const { set, ref, getDatabase } = await import('firebase/database');
      const { getApp } = await import('firebase/app');
      
      const app = getApp();
      const rtdb = getDatabase(app);
      const userRef = ref(rtdb, `online_users/${currentUserId}`);
      
      // Update user status to searching
      await set(userRef, {
        ...(await get(userRef)).val(),
        isSearching: true
      });
    } catch (error) {
      console.error('Error updating search status:', error);
    }

    // Set a 15-second timeout for demo fallback
    const demoTimeout = setTimeout(async () => {
      console.log('15 seconds passed, connecting to demo partner');
      
      // Mark user as no longer searching
      try {
        const { set, ref, getDatabase } = await import('firebase/database');
        const { getApp } = await import('firebase/app');
        
        const app = getApp();
        const rtdb = getDatabase(app);
        const userRef = ref(rtdb, `online_users/${currentUserId}`);
        
        await set(userRef, {
          ...(await get(userRef)).val(),
          isSearching: false
        });
      } catch (updateError) {
        console.error('Error updating search status:', updateError);
      }
      
      const demoPartner = {
        uid: 'demo-partner-123',
        username: 'Sarah',
        displayName: 'Sarah',
        gender: 'female',
        isTestUser: true,
        isOnline: true
      };
      
      dispatch({ type: 'SET_PARTNER', payload: demoPartner });
      dispatch({ type: 'SET_SEARCHING', payload: false });
      toast.success('Connected with demo partner (Sarah)!');
    }, 15000);

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
        !user.isSearching // Don't pair with users who are already searching
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
        // Clear the demo timeout since we found a real partner
        clearTimeout(demoTimeout);
        
        // Find a random partner from real users
        const randomIndex = Math.floor(Math.random() * availableUsers.length);
        const partner = availableUsers[randomIndex];
        
        console.log('Found real partner:', partner);
        
        // Create a unique room ID for this chat
        const roomId = `chat_${Math.min(currentUserId, partner.uid)}_${Math.max(currentUserId, partner.uid)}`;
        
        // Join the chat room
        await joinChatRoom(roomId, { uid: currentUserId });
        
        // Mark both users as no longer searching
        try {
          const { set, ref, getDatabase } = await import('firebase/database');
          const { getApp } = await import('firebase/app');
          
          const app = getApp();
          const rtdb = getDatabase(app);
          
          // Mark current user as no longer searching
          const currentUserRef = ref(rtdb, `online_users/${currentUserId}`);
          await set(currentUserRef, {
            ...(await get(currentUserRef)).val(),
            isSearching: false
          });
          
          // Mark partner as no longer searching
          const partnerRef = ref(rtdb, `online_users/${partner.uid}`);
          await set(partnerRef, {
            ...(await get(partnerRef)).val(),
            isSearching: false
          });
        } catch (error) {
          console.error('Error updating search status:', error);
        }
        
        // Set the partner
        dispatch({ type: 'SET_PARTNER', payload: partner });
        dispatch({ type: 'SET_SEARCHING', payload: false });
        toast.success(`Connected with ${partner.username || partner.displayName}!`);
        
        // Listen to messages in this room
        if (messageListenerRef.current) {
          messageListenerRef.current();
        }
        
        messageListenerRef.current = listenToMessages(roomId, (messages) => {
          dispatch({ type: 'SET_MESSAGES', payload: messages });
        });
        
      } else {
        // No real users available, but don't connect to demo yet
        // Let the timeout handle it after 15 seconds
        console.log('No real users available, waiting 15 seconds before demo fallback');
        console.log('This means either:');
        console.log('1. No other users are online');
        console.log('2. You are the only user online');
        console.log('3. Firebase connection issues');
      }
    } catch (error) {
      console.error('Error finding partner:', error);
      clearTimeout(demoTimeout);
      
      // Mark user as no longer searching
      try {
        const { set, ref, getDatabase } = await import('firebase/database');
        const { getApp } = await import('firebase/app');
        
        const app = getApp();
        const rtdb = getDatabase(app);
        const userRef = ref(rtdb, `online_users/${currentUserId}`);
        
        await set(userRef, {
          ...(await get(userRef)).val(),
          isSearching: false
        });
      } catch (updateError) {
        console.error('Error updating search status:', updateError);
      }
      
      // Fallback to demo partner immediately on error
      const demoPartner = {
        uid: 'demo-partner-123',
        username: 'Sarah',
        displayName: 'Sarah',
        gender: 'female',
        isTestUser: true,
        isOnline: true
      };
      
      dispatch({ type: 'SET_PARTNER', payload: demoPartner });
      dispatch({ type: 'SET_SEARCHING', payload: false });
      toast.success('Connected with demo partner (Sarah)!');
    }
  };

  const sendMessage = async (messageData) => {
    if (!state.currentPartner) {
      toast.error('No partner connected');
      return;
    }

    console.log('Sending message:', messageData);
    
    try {
      if (state.currentPartner.isTestUser) {
        // Demo mode - simulate sending and receiving message
        const demoMessage = {
          id: Date.now().toString(),
          from: currentUser?.uid || 'guest',
          to: 'demo-partner-123',
          content: messageData.content,
          timestamp: new Date().toISOString(),
          type: 'text'
        };
        dispatch({ type: 'ADD_MESSAGE', payload: demoMessage });
        
        // Simulate partner response
        setTimeout(() => {
          const responses = [
            "That's interesting! Tell me more about that.",
            "I love chatting with new people! What do you like to do for fun?",
            "That's cool! I'm Sarah, nice to meet you! 👋",
            "What's your favorite music? I'm really into indie these days!",
            "Do you like traveling? I've been to some amazing places!",
            "That's awesome! I'm always up for a good conversation.",
            "What's your dream job? I'm curious about different career paths!",
            "I love trying new foods! What's your favorite cuisine?",
            "That's so interesting! I love learning about different perspectives.",
            "Hey! How's your day going? 😊"
          ];
          
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          const partnerMessage = {
            id: (Date.now() + 1).toString(),
            from: 'demo-partner-123',
            to: currentUser?.uid || 'guest',
            content: randomResponse,
            timestamp: new Date().toISOString(),
            type: 'text'
          };
          dispatch({ type: 'ADD_MESSAGE', payload: partnerMessage });
        }, 1000 + Math.random() * 2000);
        
             } else {
         // Real user - send via Firebase
         const currentUserId = currentUser?.uid || 'guest';
         const roomId = `chat_${Math.min(currentUserId, state.currentPartner.uid)}_${Math.max(currentUserId, state.currentPartner.uid)}`;
         await firebaseSendMessage(roomId, {
           ...messageData,
           from: currentUser?.uid || 'guest',
           to: state.currentPartner.uid,
           timestamp: new Date().toISOString()
         });
       }
      
      toast.success('Message sent!');
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
    
    // Remove user from online users
    try {
      const userId = currentUser?.uid || 'guest';
      const { set, ref, getDatabase } = await import('firebase/database');
      const { getApp } = await import('firebase/app');
      
      const app = getApp();
      const rtdb = getDatabase(app);
      const onlineUsersRef = ref(rtdb, `online_users/${userId}`);
      await set(onlineUsersRef, null);
      
      console.log('Removed user from online list:', userId);
    } catch (error) {
      console.error('Error removing user from online list:', error);
    }
    
         if (state.currentPartner && !state.currentPartner.isTestUser) {
       const currentUserId = currentUser?.uid || 'guest';
       const roomId = `chat_${Math.min(currentUserId, state.currentPartner.uid)}_${Math.max(currentUserId, state.currentPartner.uid)}`;
       await leaveChatRoom(roomId, currentUserId);
     }
    
    dispatch({ type: 'CLEAR_CHAT' });
  };

  const nextPartner = () => {
    console.log('Finding next partner');
    leaveChat();
    setTimeout(() => {
      findPartner();
    }, 1000);
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

  const joinRoom = async (roomId) => {
    console.log('Joining room:', roomId);
    try {
      await joinChatRoom(roomId, currentUser);
      dispatch({ type: 'SET_ROOM_INFO', payload: { roomId, roomName: `Room ${roomId}` } });
      toast.success(`Joined room: Room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    }
  };

  const leaveRoom = (roomId) => {
    console.log('Leaving room:', roomId);
    leaveChatRoom(roomId, currentUser?.uid);
    dispatch({ type: 'SET_ROOM_INFO', payload: null });
  };

  const sendRoomMessage = async (content, roomId) => {
    console.log('Sending room message:', content);
    try {
      const messageData = {
        content,
        sender: currentUser?.uid || 'anonymous',
        timestamp: new Date().toISOString()
      };
      await firebaseSendMessage(roomId, messageData);
      toast.success('Message sent successfully!');
    } catch (error) {
      console.warn('Message sending error:', error.message);
      toast.error('Failed to send message');
    }
  };

  const addTestUser = async () => {
    try {
      const testUserId = `test_user_${Date.now()}`;
      const { set, ref, getDatabase } = await import('firebase/database');
      const { getApp } = await import('firebase/app');
      
      const app = getApp();
      const rtdb = getDatabase(app);
      const onlineUsersRef = ref(rtdb, `online_users/${testUserId}`);
      
      await set(onlineUsersRef, {
        uid: testUserId,
        username: `TestUser${Date.now()}`,
        isOnline: true,
        lastSeen: Date.now(),
        isGuest: true
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
        { username: 'John', gender: 'male' },
        { username: 'Emma', gender: 'female' },
        { username: 'Alex', gender: 'not_disclosed' },
        { username: 'Sarah', gender: 'female' },
        { username: 'Mike', gender: 'male' }
      ];
      
      const { set, ref, getDatabase } = await import('firebase/database');
      const { getApp } = await import('firebase/app');
      
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
          gender: testUsers[i].gender
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
      const { set, ref, getDatabase } = await import('firebase/database');
      const { getApp } = await import('firebase/app');
      
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
    joinRoom,
    leaveRoom,
    sendRoomMessage,
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