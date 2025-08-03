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
  }, []);

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
    console.log('Finding partner with options:', options);
    dispatch({ type: 'SET_SEARCHING', payload: true });
    toast.loading('Searching for partner...');

    // Use demo partner immediately for now
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
  };

  const sendMessage = async (messageData) => {
    if (!state.currentPartner) {
      toast.error('No partner connected');
      return;
    }

    console.log('Sending message:', messageData);
    
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
    
    toast.success('Message sent!');
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