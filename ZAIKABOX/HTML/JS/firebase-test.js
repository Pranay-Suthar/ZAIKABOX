// Simple Firebase connection test
import { auth, db } from './firebase-config.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Test Firebase connection
export const testFirebaseConnection = () => {
    console.log('Testing Firebase connection...');
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User authenticated:', user.uid);
            
            try {
                // Test Firestore write
                const testRef = doc(db, 'test', 'connection');
                await setDoc(testRef, {
                    message: 'Firebase connection test',
                    timestamp: serverTimestamp(),
                    userId: user.uid
                });
                console.log('✅ Firestore write test successful');
            } catch (error) {
                console.error('❌ Firestore write test failed:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
            }
        } else {
            console.log('User not authenticated');
        }
    });
};

// Auto-run test if this file is imported
if (typeof window !== 'undefined') {
    window.testFirebaseConnection = testFirebaseConnection;
}