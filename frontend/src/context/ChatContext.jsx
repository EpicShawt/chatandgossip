import React, { createContext, useContext, useReducer, useEffect } from 'react'
import toast from 'react-hot-toast'

const ChatContext = createContext()

const initialState = {
  messages: [],
  isConnected: false,
  currentPartner: null,
  isTyping: false,
  partnerTyping: false,
  chatType: 'random', // 'random', 'gender', 'room'
  roomId: null,
  participants: [],
  isSearching: false,
  genderFilter: null,
}

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload }
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      }
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    
    case 'SET_PARTNER':
      return { ...state, currentPartner: action.payload }
    
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload }
    
    case 'SET_PARTNER_TYPING':
      return { ...state, partnerTyping: action.payload }
    
    case 'SET_CHAT_TYPE':
      return { ...state, chatType: action.payload }
    
    case 'SET_ROOM_ID':
      return { ...state, roomId: action.payload }
    
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload }
    
    case 'SET_SEARCHING':
      return { ...state, isSearching: action.payload }
    
    case 'SET_GENDER_FILTER':
      return { ...state, genderFilter: action.payload }
    
    case 'CLEAR_CHAT':
      return {
        ...state,
        messages: [],
        currentPartner: null,
        isTyping: false,
        partnerTyping: false,
        roomId: null,
        participants: []
      }
    
    default:
      return state
  }
}

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  const sendMessage = (socket, message, user) => {
    if (!message.trim()) return

    const messageData = {
      id: Date.now(),
      text: message,
      sender: user.username || user.email,
      timestamp: new Date().toISOString(),
      type: 'message'
    }

    // Add message to local state
    dispatch({ type: 'ADD_MESSAGE', payload: messageData })

    // Send message through socket
    if (state.chatType === 'room') {
      socket.emit('room_message', {
        roomId: state.roomId,
        message: messageData
      })
    } else {
      socket.emit('private_message', {
        partnerId: state.currentPartner?.id,
        message: messageData
      })
    }

    // Clear typing indicator
    dispatch({ type: 'SET_TYPING', payload: false })
    socket.emit('stop_typing', { partnerId: state.currentPartner?.id })
  }

  const startTyping = (socket) => {
    dispatch({ type: 'SET_TYPING', payload: true })
    if (state.currentPartner) {
      socket.emit('typing', { partnerId: state.currentPartner.id })
    }
  }

  const stopTyping = (socket) => {
    dispatch({ type: 'SET_TYPING', payload: false })
    if (state.currentPartner) {
      socket.emit('stop_typing', { partnerId: state.currentPartner.id })
    }
  }

  const findPartner = (socket, user, chatType = 'random', genderFilter = null) => {
    dispatch({ type: 'SET_SEARCHING', payload: true })
    dispatch({ type: 'CLEAR_CHAT' })
    dispatch({ type: 'SET_CHAT_TYPE', payload: chatType })
    dispatch({ type: 'SET_GENDER_FILTER', payload: genderFilter })

    socket.emit('find_partner', {
      userId: user.id,
      username: user.username || user.email,
      chatType,
      genderFilter
    })
  }

  const joinRoom = (socket, user, roomId) => {
    dispatch({ type: 'SET_CHAT_TYPE', payload: 'room' })
    dispatch({ type: 'SET_ROOM_ID', payload: roomId })
    dispatch({ type: 'CLEAR_CHAT' })

    socket.emit('join_room', {
      roomId,
      user: {
        id: user.id,
        username: user.username || user.email
      }
    })
  }

  const leaveChat = (socket) => {
    if (state.currentPartner) {
      socket.emit('leave_chat', { partnerId: state.currentPartner.id })
    }
    if (state.roomId) {
      socket.emit('leave_room', { roomId: state.roomId })
    }
    dispatch({ type: 'CLEAR_CHAT' })
    dispatch({ type: 'SET_SEARCHING', payload: false })
  }

  const nextPartner = (socket, user) => {
    leaveChat(socket)
    setTimeout(() => {
      findPartner(socket, user, state.chatType, state.genderFilter)
    }, 1000)
  }

  // Socket event handlers
  const setupSocketListeners = (socket) => {
    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true })
      toast.success('Connected to chat server')
    })

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false })
      toast.error('Disconnected from chat server')
    })

    socket.on('partner_found', (partner) => {
      dispatch({ type: 'SET_PARTNER', payload: partner })
      dispatch({ type: 'SET_SEARCHING', payload: false })
      toast.success(`Connected with ${partner.username}`)
    })

    socket.on('partner_left', () => {
      dispatch({ type: 'SET_PARTNER', payload: null })
      toast.error('Partner disconnected')
    })

    socket.on('message_received', (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message })
    })

    socket.on('partner_typing', () => {
      dispatch({ type: 'SET_PARTNER_TYPING', payload: true })
    })

    socket.on('partner_stopped_typing', () => {
      dispatch({ type: 'SET_PARTNER_TYPING', payload: false })
    })

    socket.on('room_joined', (data) => {
      dispatch({ type: 'SET_PARTICIPANTS', payload: data.participants })
      toast.success(`Joined room: ${data.roomName}`)
    })

    socket.on('room_message', (data) => {
      dispatch({ type: 'ADD_MESSAGE', payload: data.message })
    })

    socket.on('participant_joined', (participant) => {
      toast.success(`${participant.username} joined the room`)
    })

    socket.on('participant_left', (participant) => {
      toast.error(`${participant.username} left the room`)
    })

    socket.on('error', (error) => {
      toast.error(error.message || 'An error occurred')
    })
  }

  const value = {
    ...state,
    dispatch,
    sendMessage,
    startTyping,
    stopTyping,
    findPartner,
    joinRoom,
    leaveChat,
    nextPartner,
    setupSocketListeners
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
} 