// ================= Firebase Imports and Initialization =================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHzADEpSrzJ6yYxPpDi_nmAz3FEkf2kH8",
  authDomain: "food-recommendation-fea21.firebaseapp.com",
  projectId: "food-recommendation-fea21",
  storageBucket: "food-recommendation-fea21.firebasestorage.app",
  messagingSenderId: "525389055882",
  appId: "1:525389055882:web:db8e501a63b96ca9db6a73"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Export the auth object so other files can use it
export { auth };