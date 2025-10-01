// Build script to replace Firebase config with environment variables
const fs = require('fs');
const path = require('path');

// Read the template file
const templatePath = path.join(__dirname, 'ZAIKABOX/HTML/JS/firebase-config.template.js');
const outputPath = path.join(__dirname, 'ZAIKABOX/HTML/JS/firebase-config.js');

let template = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders with environment variables
const replacements = {
  '{{FIREBASE_API_KEY}}': process.env.FIREBASE_API_KEY || 'AIzaSyBHzADEpSrzJ6yYxPpDi_nmAz3FEkf2kH8',
  '{{FIREBASE_AUTH_DOMAIN}}': process.env.FIREBASE_AUTH_DOMAIN || 'food-recommendation-fea21.firebaseapp.com',
  '{{FIREBASE_PROJECT_ID}}': process.env.FIREBASE_PROJECT_ID || 'food-recommendation-fea21',
  '{{FIREBASE_STORAGE_BUCKET}}': process.env.FIREBASE_STORAGE_BUCKET || 'food-recommendation-fea21.firebasestorage.app',
  '{{FIREBASE_MESSAGING_SENDER_ID}}': process.env.FIREBASE_MESSAGING_SENDER_ID || '525389055882',
  '{{FIREBASE_APP_ID}}': process.env.FIREBASE_APP_ID || '1:525389055882:web:db8e501a63b96ca9db6a73'
};

Object.keys(replacements).forEach(placeholder => {
  template = template.replace(new RegExp(placeholder, 'g'), replacements[placeholder]);
});

// Write the final config file
fs.writeFileSync(outputPath, template);
console.log('Firebase config generated successfully!');