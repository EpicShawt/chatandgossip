import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const ChatContext = createContext();

const initialState = {
  messages: [],
  currentPartner: null,
  isConnected: false,
  isSearching: false,
  typingUsers: [],
  chatType: 'random',
  roomInfo: null,
  participants: [],
  activeUsers: [],
  socket: null
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
    
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.io connection for real-time chat
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;
    dispatch({ type: 'SET_SOCKET', payload: socket });

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server');
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
    });

    // User events
    socket.on('user_joined', (user) => {
      console.log('User joined:', user);
    });

    socket.on('user_online', (user) => {
      console.log('User online:', user);
      // Update active users list
      socket.emit('get_active_users');
    });

    socket.on('user_offline', (user) => {
      console.log('User offline:', user);
      // Update active users list
      socket.emit('get_active_users');
    });

    socket.on('active_users', (users) => {
      console.log('Active users received:', users);
      dispatch({ type: 'SET_ACTIVE_USERS', payload: users });
    });

    // Partner matching events
    socket.on('partner_found', (partner) => {
      console.log('Partner found:', partner);
      dispatch({ type: 'SET_PARTNER', payload: partner });
      toast.success(`Connected with ${partner.username}!`);
    });

    socket.on('searching', (data) => {
      console.log('Searching for partner:', data);
      dispatch({ type: 'SET_SEARCHING', payload: true });
      toast.loading('Searching for partner...');
    });

    socket.on('partner_left', () => {
      console.log('Partner left');
      dispatch({ type: 'CLEAR_CHAT' });
      toast.error('Partner disconnected');
    });

    // Message events
    socket.on('message_received', (message) => {
      console.log('Message received:', message);
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socket.on('message_sent', (message) => {
      console.log('Message sent:', message);
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    // Typing events
    socket.on('partner_typing', (data) => {
      console.log('Partner typing:', data);
      dispatch({ type: 'SET_TYPING_USERS', payload: [data.from] });
    });

    socket.on('partner_stopped_typing', (data) => {
      console.log('Partner stopped typing:', data);
      dispatch({ type: 'SET_TYPING_USERS', payload: [] });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Connection error');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinChat = (userData) => {
    if (!socketRef.current) return;
    
    console.log('Joining chat with user data:', userData);
    socketRef.current.emit('user_join', userData);
  };

  const findPartner = (options = {}) => {
    if (!socketRef.current) {
      toast.error('Not connected to server');
      return;
    }

    console.log('Finding partner with options:', options);
    dispatch({ type: 'SET_SEARCHING', payload: true });
    toast.loading('Searching for partner...');
    
    socketRef.current.emit('find_partner', {
      genderFilter: options.genderFilter || null
    });
  };

  const sendMessage = async (messageData) => {
    if (!state.currentPartner) {
      toast.error('No partner connected');
      return;
    }

    if (!socketRef.current) {
      toast.error('Not connected to server');
      return;
    }

    console.log('Sending message:', messageData);
    
    socketRef.current.emit('private_message', {
      to: state.currentPartner.id,
      content: messageData.content
    });
  };

  const startTyping = (partnerId) => {
    if (!socketRef.current || !state.currentPartner) return;
    
    console.log('Starting typing to partner:', partnerId);
    socketRef.current.emit('typing', {
      to: state.currentPartner.id
    });
  };

  const stopTyping = () => {
    if (!socketRef.current || !state.currentPartner) return;
    
    console.log('Stopping typing');
    socketRef.current.emit('stop_typing', {
      to: state.currentPartner.id
    });
  };

  const leaveChat = () => {
    if (!socketRef.current) return;
    
    console.log('Leaving chat');
    socketRef.current.emit('leave_chat');
    dispatch({ type: 'CLEAR_CHAT' });
  };

  const nextPartner = () => {
    console.log('Finding next partner');
    leaveChat();
    setTimeout(() => {
      findPartner();
    }, 1000);
  };

  const getActiveUsers = () => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('get_active_users');
  };

  const joinRoom = async (roomId) => {
    if (!socketRef.current) return;
    
    console.log('Joining room:', roomId);
    socketRef.current.emit('join_room', { roomId });
  };

  const leaveRoom = (roomId) => {
    if (!socketRef.current) return;
    
    console.log('Leaving room:', roomId);
    socketRef.current.emit('leave_room', { roomId });
    dispatch({ type: 'SET_ROOM_INFO', payload: null });
  };

  const sendRoomMessage = async (content, roomId) => {
    if (!socketRef.current) return;
    
    console.log('Sending room message:', content);
    socketRef.current.emit('room_message', {
      roomId,
      content
    });
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