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

    // Listen to online users
    const listenToOnlineUsers = async () => {
      try {
        const onlineUsers = await getOnlineUsers();
        dispatch({ type: 'SET_ONLINE_USERS', payload: onlineUsers });
        
        // Set up real-time listener for online users
        // This would be implemented with Firebase Realtime Database
        const interval = setInterval(async () => {
          const users = await getOnlineUsers();
          dispatch({ type: 'SET_ONLINE_USERS', payload: users });
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error listening to online users:', error);
      }
    };

    listenToOnlineUsers();
  }, [getOnlineUsers]);

  const joinChat = async (userData) => {
    if (!currentUser) return;
    
    try {
      console.log('Joining chat with user data:', userData);
      
      // Update user profile to show as online
      await updateUserProfile(currentUser.uid, {
        isOnline: true,
        lastSeen: new Date().toISOString(),
        ...userData
      });

      // Get online users for matching
      const onlineUsers = await getOnlineUsers();
      dispatch({ type: 'SET_ONLINE_USERS', payload: onlineUsers });
      
      toast.success('Joined chat successfully!');
    } catch (error) {
      console.error('Error joining chat:', error);
      toast.error('Failed to join chat');
    }
  };

  const findPartner = async (options = {}) => {
    // Check if we have any user (Firebase or guest)
    const hasUser = currentUser || state.currentPartner?.isGuest;
    
    if (!hasUser) {
      console.log('No user available, using demo mode');
      dispatch({ type: 'SET_SEARCHING', payload: true });
      toast.loading('Searching for partner...');
      
      // Demo mode - simulate finding a partner
      setTimeout(() => {
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
      }, 2000);
      return;
    }

    console.log('Finding partner with options:', options);
    dispatch({ type: 'SET_SEARCHING', payload: true });
    toast.loading('Searching for partner...');

    try {
      // Get online users
      const onlineUsers = await getOnlineUsers();
      const availableUsers = onlineUsers.filter(user => 
        user.uid !== (currentUser?.uid || 'guest') && 
        user.isOnline &&
        (!options.genderFilter || user.gender === options.genderFilter || user.gender === 'not_disclosed')
      );

      if (availableUsers.length > 0) {
        // Find a random partner
        const randomIndex = Math.floor(Math.random() * availableUsers.length);
        const partner = availableUsers[randomIndex];
        
        dispatch({ type: 'SET_PARTNER', payload: partner });
        toast.success(`Connected with ${partner.username || partner.displayName}!`);
        
        // Create or join chat room
        const roomId = `chat_${currentUser?.uid || 'guest'}_${partner.uid}`;
        await joinChatRoom(roomId, currentUser || { uid: 'guest' });
        
        // Listen to messages in this room
        if (messageListenerRef.current) {
          messageListenerRef.current();
        }
        
        messageListenerRef.current = listenToMessages(roomId, (messages) => {
          dispatch({ type: 'SET_MESSAGES', payload: messages });
        });
        
      } else {
        // No real users available, use demo partner
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
    } catch (error) {
      console.error('Error finding partner:', error);
      
      // Fallback to demo partner
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

    // Check if we have any user (Firebase or guest)
    const hasUser = currentUser || state.currentPartner?.isGuest;
    
    if (!hasUser) {
      console.log('No user available, using demo mode');
      
      // Demo mode - simulate sending and receiving message
      const demoMessage = {
        id: Date.now().toString(),
        from: 'guest',
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
          to: 'guest',
          content: randomResponse,
          timestamp: new Date().toISOString(),
          type: 'text'
        };
        dispatch({ type: 'ADD_MESSAGE', payload: partnerMessage });
      }, 1000 + Math.random() * 2000);
      
      return;
    }

    try {
      console.log('Sending message:', messageData);
      
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
        const roomId = `chat_${currentUser?.uid || 'guest'}_${state.currentPartner.uid}`;
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
    
    if (state.currentPartner && !state.currentPartner.isTestUser) {
      const roomId = `chat_${currentUser?.uid}_${state.currentPartner.uid}`;
      await leaveChatRoom(roomId, currentUser?.uid);
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
      dispatch({ type: 'SET_ACTIVE_USERS', payload: onlineUsers });
    } catch (error) {
      console.error('Error getting active users:', error);
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
    sendRoomMessage
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