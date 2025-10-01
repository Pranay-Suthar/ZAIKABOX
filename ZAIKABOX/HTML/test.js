// Test file to verify JS deployment and modules
console.log('JS files are working!');

// Test ES6 module import
import { auth } from './JS/firebase-config.js';
console.log('Firebase config loaded:', auth ? 'Success' : 'Failed');