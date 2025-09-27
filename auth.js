// ================= Firebase Imports =================
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Import the configured auth object from your (untracked) config file
import { auth } from './firebase-config.js'; 
// ================= UI Element References =================
// Using querySelector('form') to be more robust, as your form may not have an ID
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
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// The auth variable is already defined in your file
// const auth = getAuth(app); 

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.querySelector('.user-info h1');

    if (user) {
        // User is signed in, show the logout button and user info
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (userInfo) userInfo.textContent = `Hello, ${user.email}!`;
    } else {
        // No user is signed in, redirect to login page
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