// Firebase v10 Configuration for Audifyx
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration object
// You'll need to replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "audifyx-demo.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "audifyx-demo",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "audifyx-demo.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:demo"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const storage = getStorage(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

// Export the app instance
export default app;

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey !== "demo-api-key" &&
    firebaseConfig.projectId !== "audifyx-demo" &&
    firebaseConfig.storageBucket !== "audifyx-demo.appspot.com"
  );
};

// Debug function to show current configuration status
export const getFirebaseStatus = () => {
  return {
    configured: isFirebaseConfigured(),
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    hasApiKey: !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "demo-api-key"
  };
};