import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

const ChatContext = createContext();

const initialState = {
  messages: [],
  currentPartner: null,
  isConnected: false,
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

export const ChatProvider = ({ children, socket }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  useEffect(() => {
    if (!socket) {
      console.log('No socket provided to ChatProvider');
      return;
    }

    console.log('Setting up socket listeners');

    // Connection events
    socket.on('connect', () => {
      console.log('ChatContext: Connected to server');
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
      toast.success('Connected to chat server');
    });

    socket.on('disconnect', () => {
      console.log('ChatContext: Disconnected from server');
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
      toast.error('Disconnected from chat server');
    });

    // User events
    socket.on('user_joined', (userData) => {
      console.log('ChatContext: User joined:', userData);
    });

    // Partner events
    socket.on('partner_found', (partnerData) => {
      console.log('ChatContext: Partner found:', partnerData);
      dispatch({ type: 'SET_PARTNER', payload: partnerData });
      toast.success(`Connected with ${partnerData.username}!`);
    });

    socket.on('partner_left', () => {
      console.log('ChatContext: Partner left');
      dispatch({ type: 'SET_PARTNER', payload: null });
      toast.error('Partner disconnected');
    });

    // Message events
    socket.on('message_received', (message) => {
      console.log('ChatContext: Message received:', message);
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socket.on('message_sent', (message) => {
      console.log('ChatContext: Message sent:', message);
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    // Typing events
    socket.on('partner_typing', (data) => {
      console.log('ChatContext: Partner typing:', data);
      dispatch({ type: 'SET_TYPING_USERS', payload: [data.from] });
    });

    socket.on('partner_stopped_typing', () => {
      console.log('ChatContext: Partner stopped typing');
      dispatch({ type: 'SET_TYPING_USERS', payload: [] });
    });

    // Search events
    socket.on('searching', (data) => {
      console.log('ChatContext: Searching for partner:', data);
      dispatch({ type: 'SET_SEARCHING', payload: true });
      toast.loading(data.message || 'Searching for partner...');
    });

    // Room events
    socket.on('room_joined', (roomData) => {
      console.log('ChatContext: Room joined:', roomData);
      dispatch({ type: 'SET_ROOM_INFO', payload: roomData });
      toast.success(`Joined room: ${roomData.roomName}`);
    });

    socket.on('room_message', (message) => {
      console.log('ChatContext: Room message:', message);
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socket.on('participant_joined', (participant) => {
      console.log('ChatContext: Participant joined:', participant);
      toast.success(`${participant.username} joined the room`);
    });

    socket.on('participant_left', (participant) => {
      console.log('ChatContext: Participant left:', participant);
      toast.error(`${participant.username} left the room`);
    });

    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('user_joined');
      socket.off('partner_found');
      socket.off('partner_left');
      socket.off('message_received');
      socket.off('message_sent');
      socket.off('partner_typing');
      socket.off('partner_stopped_typing');
      socket.off('searching');
      socket.off('room_joined');
      socket.off('room_message');
      socket.off('participant_joined');
      socket.off('participant_left');
    };
  }, [socket]);

  const findPartner = (options = {}) => {
    console.log('ChatContext: Finding partner with options:', options);
    if (!socket || !state.isConnected) {
      console.log('ChatContext: Not connected to server');
      toast.error('Not connected to server');
      return;
    }

    dispatch({ type: 'SET_SEARCHING', payload: true });
    socket.emit('find_partner', options);
  };

  const sendMessage = (messageData) => {
    console.log('ChatContext: Sending message:', messageData);
    if (!socket || !state.currentPartner) {
      console.log('ChatContext: No partner connected');
      toast.error('No partner connected');
      return;
    }

    socket.emit('private_message', messageData);
  };

  const startTyping = (partnerId) => {
    console.log('ChatContext: Starting typing to partner:', partnerId);
    if (!socket || !state.currentPartner) return;
    
    socket.emit('typing', { to: partnerId });
  };

  const stopTyping = () => {
    console.log('ChatContext: Stopping typing');
    if (!socket || !state.currentPartner) return;
    
    socket.emit('stop_typing', { to: state.currentPartner.id });
  };

  const leaveChat = () => {
    console.log('ChatContext: Leaving chat');
    if (!socket) return;
    
    socket.emit('leave_chat');
    dispatch({ type: 'CLEAR_CHAT' });
  };

  const nextPartner = () => {
    console.log('ChatContext: Finding next partner');
    leaveChat();
    setTimeout(() => {
      findPartner();
    }, 1000);
  };

  const joinRoom = (roomId) => {
    console.log('ChatContext: Joining room:', roomId);
    if (!socket) return;
    
    socket.emit('join_room', { roomId });
  };

  const leaveRoom = (roomId) => {
    console.log('ChatContext: Leaving room:', roomId);
    if (!socket) return;
    
    socket.emit('leave_room', { roomId });
    dispatch({ type: 'SET_ROOM_INFO', payload: null });
  };

  const sendRoomMessage = (content, roomId) => {
    console.log('ChatContext: Sending room message:', content);
    if (!socket) return;
    
    socket.emit('room_message', { content, roomId });
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