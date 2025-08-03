// Firebase configuration
// Replace these values with your actual Firebase project credentials
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
};

// Instructions for setup:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing one
// 3. Enable Authentication (Email/Password)
// 4. Enable Firestore Database
// 5. Enable Realtime Database
// 6. Get your config from Project Settings > General > Your apps
// 7. Replace the values above with your actual config
// 8. Set up Firestore security rules to allow read/write
// 9. Set up Realtime Database rules to allow read/write 