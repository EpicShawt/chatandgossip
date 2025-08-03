import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Firebase SDK imports
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  onValue, 
  off,
  child,
  get 
} from 'firebase/database';
import { firebaseConfig } from '../firebase-config';

const FirebaseContext = createContext();

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export const FirebaseProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  // Check Firebase connection
  useEffect(() => {
    const checkFirebaseConnection = async () => {
      try {
        const testRef = ref(rtdb, 'test_connection');
        await set(testRef, { timestamp: Date.now() });
        await set(testRef, null); // Clean up
        setFirebaseConnected(true);
        console.log('Firebase connection successful');
      } catch (error) {
        console.error('Firebase connection failed:', error);
        setFirebaseConnected(false);
      }
    };
    
    checkFirebaseConnection();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Real-time online users listener
  useEffect(() => {
    console.log('Setting up real-time online users listener...');
    const onlineUsersRef = ref(rtdb, 'online_users');
    
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      console.log('Firebase online users snapshot received:', snapshot.val());
      const users = [];
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        console.log('Processing user:', childSnapshot.key, userData);
        if (userData && userData.isOnline) {
          users.push({
            uid: childSnapshot.key,
            ...userData
          });
        }
      });
      console.log('Final online users array:', users);
      setOnlineUsers(users);
    }, (error) => {
      console.error('Error in online users listener:', error);
    });

    return () => {
      console.log('Cleaning up online users listener');
      off(onlineUsersRef, 'value', unsubscribe);
    };
  }, []);

  const signup = async (email, password, username) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        username: username,
        displayName: username,
        createdAt: serverTimestamp(),
        isOnline: true,
        lastSeen: serverTimestamp()
      });

      // Add to online users
      await set(ref(rtdb, `online_users/${user.uid}`), {
        uid: user.uid,
        username: username,
        isOnline: true,
        lastSeen: Date.now()
      });

      toast.success('Account created successfully!');
      return user;
    } catch (error) {
      toast.error('Signup failed: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update online status
      await updateDoc(doc(db, 'users', user.uid), {
        isOnline: true,
        lastSeen: serverTimestamp()
      });

      // Add to online users
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      await set(ref(rtdb, `online_users/${user.uid}`), {
        uid: user.uid,
        username: userData?.username || user.email.split('@')[0],
        isOnline: true,
        lastSeen: Date.now()
      });

      toast.success('Logged in successfully!');
      return user;
    } catch (error) {
      toast.error('Login failed: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (currentUser) {
        // Remove from online users
        await set(ref(rtdb, `online_users/${currentUser.uid}`), null);
        
        // Update offline status
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      }
      
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error('Logout failed: ' + error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error('Password reset failed: ' + error.message);
      throw error;
    }
  };

  const createUserProfile = async (userData) => {
    try {
      await setDoc(doc(db, 'users', userData.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        isOnline: true,
        lastSeen: serverTimestamp()
      });
      return userData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const getUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { uid, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  };

  const updateUserProfile = async (uid, updates) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        lastSeen: serverTimestamp()
      });
      return { uid, ...updates };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const getOnlineUsers = async () => {
    try {
      const onlineUsersRef = ref(rtdb, 'online_users');
      const snapshot = await get(onlineUsersRef);
      
      const users = [];
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData && userData.isOnline) {
          users.push({
            uid: childSnapshot.key,
            ...userData
          });
        }
      });
      
      return users;
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  };

  const sendMessage = async (roomId, messageData) => {
    try {
      const messageRef = await addDoc(collection(db, `chat_rooms/${roomId}/messages`), {
        ...messageData,
        timestamp: serverTimestamp()
      });
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const listenToMessages = (roomId, callback) => {
    const messagesRef = collection(db, `chat_rooms/${roomId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(messages);
    });

    return unsubscribe;
  };

  const joinChatRoom = async (roomId, userData) => {
    try {
      // Create room if it doesn't exist
      await setDoc(doc(db, 'chat_rooms', roomId), {
        roomId,
        createdAt: serverTimestamp(),
        participants: [userData.uid],
        lastActivity: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error joining chat room:', error);
      throw error;
    }
  };

  const leaveChatRoom = async (roomId, uid) => {
    try {
      // Update room participants
      const roomRef = doc(db, 'chat_rooms', roomId);
      await updateDoc(roomRef, {
        lastActivity: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error leaving chat room:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    onlineUsers,
    firebaseConnected,
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