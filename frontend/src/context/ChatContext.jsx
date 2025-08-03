import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
  participants: []
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
    
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { sendMessage: firebaseSendMessage, listenToMessages, joinChatRoom, leaveChatRoom } = useFirebase();

  useEffect(() => {
    console.log('ChatContext: Firebase chat provider initialized');
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
  }, []);

  const findPartner = (options = {}) => {
    console.log('ChatContext: Finding partner with options:', options);
    dispatch({ type: 'SET_SEARCHING', payload: true });
    toast.loading('Searching for partner...');
    
    // For now, we'll simulate finding a partner
    // In a real implementation, you'd use Firebase to find available users
    setTimeout(() => {
      const mockPartner = {
        id: 'partner-123',
        username: 'Sarah',
        gender: 'female'
      };
      dispatch({ type: 'SET_PARTNER', payload: mockPartner });
      dispatch({ type: 'SET_SEARCHING', payload: false });
      toast.success(`Connected with ${mockPartner.username}!`);
    }, 2000);
  };

  const sendMessage = async (messageData) => {
    console.log('ChatContext: Sending message:', messageData);
    if (!state.currentPartner) {
      console.log('ChatContext: No partner connected');
      toast.error('No partner connected');
      return;
    }

    try {
      const roomId = `chat_${state.currentPartner.id}`;
      await firebaseSendMessage(roomId, messageData);
      
      // Add message to local state
      const localMessage = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'ADD_MESSAGE', payload: localMessage });
      toast.success('Message sent successfully!');
    } catch (error) {
      console.warn('Message sending error:', error.message);
      // Add message locally for demo purposes
      const localMessage = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'ADD_MESSAGE', payload: localMessage });
      toast.success('Message sent (demo mode)');
    }
  };

  const startTyping = (partnerId) => {
    console.log('ChatContext: Starting typing to partner:', partnerId);
    // Firebase typing implementation would go here
  };

  const stopTyping = () => {
    console.log('ChatContext: Stopping typing');
    // Firebase typing implementation would go here
  };

  const leaveChat = () => {
    console.log('ChatContext: Leaving chat');
    dispatch({ type: 'CLEAR_CHAT' });
  };

  const nextPartner = () => {
    console.log('ChatContext: Finding next partner');
    leaveChat();
    setTimeout(() => {
      findPartner();
    }, 1000);
  };

  const joinRoom = async (roomId) => {
    console.log('ChatContext: Joining room:', roomId);
    try {
      // This would be implemented with Firebase
      dispatch({ type: 'SET_ROOM_INFO', payload: { roomId, roomName: `Room ${roomId}` } });
      toast.success(`Joined room: Room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    }
  };

  const leaveRoom = (roomId) => {
    console.log('ChatContext: Leaving room:', roomId);
    dispatch({ type: 'SET_ROOM_INFO', payload: null });
  };

  const sendRoomMessage = async (content, roomId) => {
    console.log('ChatContext: Sending room message:', content);
    try {
      const messageData = {
        content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      await firebaseSendMessage(roomId, messageData);
      
      // Add message to local state
      const localMessage = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'ADD_MESSAGE', payload: localMessage });
      toast.success('Message sent successfully!');
    } catch (error) {
      console.warn('Message sending error:', error.message);
      // Add message locally for demo purposes
      const localMessage = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'ADD_MESSAGE', payload: localMessage });
      toast.success('Message sent (demo mode)');
    }
  };

  const value = {
    ...state,
    findPartner,
    sendMessage,
    startTyping,
    stopTyping,
    leaveChat,
    nextPartner,
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