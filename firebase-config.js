// Replace the placeholders with your Firebase project's config from the Firebase Console.
// Firebase Console > Project settings > General > Your apps > SDK setup and configuration

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

export const firebaseConfig = {
	apiKey: "AIzaSyBHzADEpSrzJ6yYxPpDi_nmAz3FEkf2kH8",
	authDomain: "food-recommendation-fea21.firebaseapp.com",
	projectId: "food-recommendation-fea21",
	storageBucket: "food-recommendation-fea21.firebasestorage.app",
	messagingSenderId: "525389055882",
	appId: "1:525389055882:web:db8e501a63b96ca9db6a73"
};

export function initFirebase() {
	const app = initializeApp(firebaseConfig);
	const auth = getAuth(app);
	return { app, auth };
} 