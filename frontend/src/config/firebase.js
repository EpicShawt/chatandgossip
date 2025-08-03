import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtkPTObxrlchg-BPn8ZFQ-mZXcUKt6EdE",
  authDomain: "chatandgossip-cea9a.firebaseapp.com",
  projectId: "chatandgossip-cea9a",
  storageBucket: "chatandgossip-cea9a.firebasestorage.app",
  messagingSenderId: "952203566848",
  appId: "1:952203566848:web:10bc5da467281fd1815de5",
  measurementId: "G-S5GCH5PYPB",
  databaseURL: "https://chatandgossip-cea9a-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

// Initialize Analytics (optional)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.log('Analytics not available:', error.message);
}

export { analytics };

export default app; 