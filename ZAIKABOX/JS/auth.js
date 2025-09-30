// ================= Firebase Imports =================
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { auth } from '../JS/firebase-config.js';

// ================= Toast Notification Function =================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; // Don't run if the container isn't on the page

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
}

// ================= UI Element References =================
const authForm = document.querySelector('form');
const emailInput = document.getElementById('email-field');
const passwordInput = document.getElementById('password-field');
const submitButton = document.getElementById('submit-button');
const formTitle = document.getElementById('form-title');
const toggleContainer = document.getElementById('toggle-auth-mode');
const toggleAuthModeLink = toggleContainer ? toggleContainer.querySelector('a') : null;

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
// This code will only run on the login page where the form exists.
if (authForm) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (isSignUpMode) {
            // --- Handle Sign Up ---
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    showToast('Account created successfully!');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                })
                .catch((error) => {
                    let friendlyMessage = "Could not create account. Please try again.";
                    if (error.code === 'auth/email-already-in-use') {
                        friendlyMessage = "This email address is already in use.";
                    } else if (error.code === 'auth/weak-password') {
                        friendlyMessage = "Password should be at least 6 characters.";
                    }
                    showToast(friendlyMessage, 'error');
                });

        } else {
            // --- Handle Sign In ---
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    showToast('Login Successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                })
                .catch((error) => {
                    let friendlyMessage = "An error occurred. Please try again.";
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        friendlyMessage = "Incorrect email or password.";
                    }
                    showToast(friendlyMessage, 'error');
                });
        }
    });
}

// ================= Auth Guard and Logout Logic =================
// This listener runs on ANY page where this script is loaded.
onAuthStateChanged(auth, (user) => {
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.querySelector('.user-info h1');

    if (user) {
        // User is signed in. On the main page, show the logout button and their email.
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (userInfo) userInfo.textContent = `Hello, ${user.email}!`;
    } else {
        // No user is signed in. If they are on the main page (index.html), redirect to login.
        if (window.location.pathname.includes('index.html')) {
            window.location.replace('login.html');
        }
    }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth)
            .then(() => {
                showToast("You've been signed out.", "success");
                // The onAuthStateChanged listener above will automatically handle the redirect to login.html.
            })
            .catch((error) => {
                console.error('Sign Out Error:', error);
                showToast("Error signing out. Please try again.", "error");
            });
    });
}