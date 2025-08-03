import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const FirebaseContext = createContext();

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock auth functions
  const signup = async (email, password, username) => {
    try {
      // Simulate Firebase signup
      const mockUser = {
        uid: `user_${Date.now()}`,
        email: email,
        displayName: username,
        username: username
      };
      setCurrentUser(mockUser);
      toast.success('Account created successfully!');
      return mockUser;
    } catch (error) {
      toast.error('Signup failed: ' + error.message);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      // Simulate Firebase login
      const mockUser = {
        uid: `user_${Date.now()}`,
        email: email,
        displayName: email.split('@')[0],
        username: email.split('@')[0]
      };
      setCurrentUser(mockUser);
      toast.success('Logged in successfully!');
      return mockUser;
    } catch (error) {
      toast.error('Login failed: ' + error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setCurrentUser(null);
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error('Logout failed: ' + error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error('Password reset failed: ' + error.message);
      throw error;
    }
  };

  // Mock Firestore functions
  const createUserProfile = async (userData) => {
    try {
      console.log('Mock: Creating user profile:', userData);
      return userData;
    } catch (error) {
      console.error('Mock: Error creating user profile:', error);
      throw error;
    }
  };

  const getUserProfile = async (uid) => {
    try {
      console.log('Mock: Getting user profile for:', uid);
      return {
        uid: uid,
        username: 'Demo User',
        email: 'demo@example.com',
        isOnline: true
      };
    } catch (error) {
      console.error('Mock: Error getting user profile:', error);
      throw error;
    }
  };

  const updateUserProfile = async (uid, updates) => {
    try {
      console.log('Mock: Updating user profile:', uid, updates);
      return { uid, ...updates };
    } catch (error) {
      console.error('Mock: Error updating user profile:', error);
      throw error;
    }
  };

  const getOnlineUsers = async () => {
    try {
      console.log('Mock: Getting online users');
      // Return mock online users
      return [
        { id: 'demo1', username: 'Sarah', isOnline: true, gender: 'female' },
        { id: 'demo2', username: 'John', isOnline: true, gender: 'male' },
        { id: 'demo3', username: 'Emma', isOnline: true, gender: 'female' }
      ];
    } catch (error) {
      console.error('Mock: Error getting online users:', error);
      return [
        { id: 'demo1', username: 'Sarah', isOnline: true, gender: 'female' },
        { id: 'demo2', username: 'John', isOnline: true, gender: 'male' }
      ];
    }
  };

  // Mock Realtime Database functions for chat
  const sendMessage = async (roomId, messageData) => {
    try {
      console.log('Mock: Sending message to room:', roomId, messageData);
      // Simulate successful message sending
      return `msg_${Date.now()}`;
    } catch (error) {
      console.error('Mock: Error sending message:', error);
      throw error;
    }
  };

  const listenToMessages = (roomId, callback) => {
    console.log('Mock: Listening to messages in room:', roomId);
    // Simulate real-time message listening
    const mockMessages = [
      {
        id: 'msg1',
        content: 'Hi! How are you doing today? 😊',
        sender: 'partner-123',
        senderName: 'Sarah',
        timestamp: new Date().toISOString()
      }
    ];
    
    // Simulate receiving messages after a delay
    setTimeout(() => {
      callback(mockMessages);
    }, 1000);

    // Return cleanup function
    return () => {
      console.log('Mock: Stopped listening to messages');
    };
  };

  const joinChatRoom = async (roomId, userData) => {
    try {
      console.log('Mock: Joining chat room:', roomId, userData);
      return true;
    } catch (error) {
      console.error('Mock: Error joining chat room:', error);
      throw error;
    }
  };

  const leaveChatRoom = async (roomId, uid) => {
    try {
      console.log('Mock: Leaving chat room:', roomId, uid);
      return true;
    } catch (error) {
      console.error('Mock: Error leaving chat room:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    getOnlineUsers,
    sendMessage,
    listenToMessages,
    joinChatRoom,
    leaveChatRoom
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}; 