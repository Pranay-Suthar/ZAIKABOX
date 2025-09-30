// ================= Firebase Imports =================
// All imports are now consolidated here
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Import the configured auth object from your config file
import { auth } from '../JS/firebase-config.js'; 

// ================= UI Element References =================
const authForm = document.querySelector('form');
const emailInput = document.getElementById('email-field');
const passwordInput = document.getElementById('password-field');
const submitButton = document.getElementById('submit-button');
const formTitle = document.getElementById('form-title');
const errorMessage = document.getElementById('error-message');
const toggleContainer = document.getElementById('toggle-auth-mode');
const toggleAuthModeLink = toggleContainer.querySelector('a');

let isSignUpMode = false;

// ================= UI Toggling Logic =================
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        formTitle.textContent = "Create an account";
        submitButton.textContent = "Sign Up";
        toggleContainer.firstChild.textContent = "Already have an account? ";
        toggleAuthModeLink.textContent = "Sign In";
    } else {
        formTitle.textContent = "Have an account?";
        submitButton.textContent = "Sign In";
        toggleContainer.firstChild.textContent = "Don't have an account? ";
        toggleAuthModeLink.textContent = "Sign Up";
    }
}

if (toggleAuthModeLink) {
    toggleAuthModeLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}

// ================= Form Submission Handler =================
if (authForm) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        const email = emailInput.value;
        const password = passwordInput.value;
        errorMessage.textContent = ''; // Clear previous errors

        if (isSignUpMode) {
            // --- Handle Sign Up ---
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log('Successfully signed up!', userCredential.user);
                    alert('Account created successfully!');
                    // Redirect to the index page after successful sign-up
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error('Sign Up Error:', error.message);
                    errorMessage.textContent = error.message;
                });

        } else {
            // --- Handle Sign In ---
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log('Successfully signed in!', userCredential.user);
                    alert('Welcome back!');
                    // Redirect to the index page after successful sign-in
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error('Sign In Error:', error.message);
                    errorMessage.textContent = error.message;
                });
        }
    });
}

// ================= Auth Guard and Logout Logic =================
// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.querySelector('.user-info h1');

    // This logic should ideally be in a script that runs on the main app page (index.html),
    // but placing it here will work if `auth.js` is loaded on both pages.
    if (user) {
        // User is signed in. On pages with a logout button, show it.
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (userInfo) userInfo.textContent = `Hello, ${user.email}!`;
    } else {
        // No user is signed in.
        // If we are on a protected page (like index.html), redirect to login.
        if (window.location.pathname.includes('index.html')) {
            window.location.replace('login.html');
        }
    }
});

// Handle logout button click
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth)
            .then(() => {
                // Sign-out successful. The onAuthStateChanged listener will handle the redirect.
                console.log('User signed out.');
            })
            .catch((error) => {
                console.error('Sign Out Error:', error);
            });
    });
}