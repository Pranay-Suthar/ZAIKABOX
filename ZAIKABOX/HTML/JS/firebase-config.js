// ================= Firebase Imports and Initialization =================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: window.NETLIFY_ENV?.FIREBASE_API_KEY || "AIzaSyBHzADEpSrzJ6yYxPpDi_nmAz3FEkf2kH8",
  authDomain: window.NETLIFY_ENV?.FIREBASE_AUTH_DOMAIN || "food-recommendation-fea21.firebaseapp.com",
  projectId: window.NETLIFY_ENV?.FIREBASE_PROJECT_ID || "food-recommendation-fea21",
  storageBucket: window.NETLIFY_ENV?.FIREBASE_STORAGE_BUCKET || "food-recommendation-fea21.firebasestorage.app",
  messagingSenderId: window.NETLIFY_ENV?.FIREBASE_MESSAGING_SENDER_ID || "525389055882",
  appId: window.NETLIFY_ENV?.FIREBASE_APP_ID || "1:525389055882:web:db8e501a63b96ca9db6a73"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the auth object and db
export { auth, db };