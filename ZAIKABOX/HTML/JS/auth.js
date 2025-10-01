// ================= Firebase Imports =================
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
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
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email-field');
const passwordInput = document.getElementById('password-field');
const confirmPasswordInput = document.getElementById('confirm-password-field');
const confirmPasswordGroup = document.getElementById('confirm-password-group');
const submitButton = document.getElementById('submit-button');
const formTitle = document.getElementById('form-title');
const toggleContainer = document.getElementById('toggle-auth-mode');
const toggleAuthModeLink = toggleContainer ? toggleContainer.querySelector('a') : null;

// New elements
const togglePasswordBtn = document.getElementById('toggle-password');
const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const forgotPasswordModal = document.getElementById('forgot-password-modal');
const closeForgotModal = document.getElementById('close-forgot-modal');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const forgotEmailInput = document.getElementById('forgot-email-field');
const googleSigninBtn = document.getElementById('google-signin');

// Error elements
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmPasswordError = document.getElementById('confirm-password-error');
const forgotEmailError = document.getElementById('forgot-email-error');

let isSignUpMode = false;

// ================= Utility Functions =================
function showFieldError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function hideFieldError(errorElement) {
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

function clearAllErrors() {
    hideFieldError(emailError);
    hideFieldError(passwordError);
    hideFieldError(confirmPasswordError);
    hideFieldError(forgotEmailError);
}

function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnSpinner = button.querySelector('.btn-spinner');
    
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        if (btnSpinner) btnSpinner.style.display = 'inline-block';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// ================= UI Toggling Logic =================
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    clearAllErrors();
    
    if (isSignUpMode) {
        formTitle.textContent = "Create an account";
        submitButton.querySelector('.btn-text').textContent = "Sign Up";
        toggleContainer.firstChild.textContent = "Already have an account? ";
        toggleAuthModeLink.textContent = "Sign In";
        confirmPasswordGroup.style.display = 'block';
    } else {
        formTitle.textContent = "Have an account?";
        submitButton.querySelector('.btn-text').textContent = "Sign In";
        toggleContainer.firstChild.textContent = "Don't have an account? ";
        toggleAuthModeLink.textContent = "Sign Up";
        confirmPasswordGroup.style.display = 'none';
    }
}

// ================= Event Listeners =================
if (toggleAuthModeLink) {
    toggleAuthModeLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}

// Password toggle functionality
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.classList.toggle('fa-eye');
        togglePasswordBtn.classList.toggle('fa-eye-slash');
    });
}

if (toggleConfirmPasswordBtn) {
    toggleConfirmPasswordBtn.addEventListener('click', () => {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        toggleConfirmPasswordBtn.classList.toggle('fa-eye');
        toggleConfirmPasswordBtn.classList.toggle('fa-eye-slash');
    });
}

// Forgot password modal
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        forgotEmailInput.focus();
    });
}

if (closeForgotModal) {
    closeForgotModal.addEventListener('click', () => {
        forgotPasswordModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        hideFieldError(forgotEmailError);
        forgotEmailInput.value = '';
    });
}

// Close modal when clicking outside
if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) {
            forgotPasswordModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            hideFieldError(forgotEmailError);
            forgotEmailInput.value = '';
        }
    });
}

// Google Sign In
if (googleSigninBtn) {
    googleSigninBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            setButtonLoading(googleSigninBtn, true);
            const result = await signInWithPopup(auth, provider);
            showToast('Google sign-in successful!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            console.error('Google sign-in error:', error);
            let errorMessage = 'Google sign-in failed. Please try again.';
            
            if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup was blocked. Please allow popups and try again.';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in was cancelled.';
            } else if (error.code === 'auth/unauthorized-domain') {
                errorMessage = 'This domain is not authorized for Google sign-in.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Google sign-in is not enabled. Please contact support.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            showToast(errorMessage, 'error');
        } finally {
            setButtonLoading(googleSigninBtn, false);
        }
    });
}

// ================= Form Submission Handler =================
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validation
        let hasErrors = false;

        if (!email) {
            showFieldError(emailError, 'Email is required');
            hasErrors = true;
        } else if (!validateEmail(email)) {
            showFieldError(emailError, 'Please enter a valid email address');
            hasErrors = true;
        }

        if (!password) {
            showFieldError(passwordError, 'Password is required');
            hasErrors = true;
        } else if (!validatePassword(password)) {
            showFieldError(passwordError, 'Password must be at least 6 characters');
            hasErrors = true;
        }

        if (isSignUpMode) {
            if (!confirmPassword) {
                showFieldError(confirmPasswordError, 'Please confirm your password');
                hasErrors = true;
            } else if (password !== confirmPassword) {
                showFieldError(confirmPasswordError, 'Passwords do not match');
                hasErrors = true;
            }
        }

        if (hasErrors) return;

        setButtonLoading(submitButton, true);

        try {
            if (isSignUpMode) {
                // --- Handle Sign Up ---
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Set default display name
                await updateProfile(userCredential.user, {
                    displayName: 'Food Enthusiast'
                });
                
                showToast('Account created successfully!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                // --- Handle Sign In ---
                await signInWithEmailAndPassword(auth, email, password);
                showToast('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Auth error:', error);
            
            if (isSignUpMode) {
                if (error.code === 'auth/email-already-in-use') {
                    showFieldError(emailError, 'This email address is already in use');
                } else if (error.code === 'auth/weak-password') {
                    showFieldError(passwordError, 'Password should be at least 6 characters');
                } else {
                    showToast('Could not create account. Please try again.', 'error');
                }
            } else {
                if (error.code === 'auth/user-not-found' || 
                    error.code === 'auth/wrong-password' || 
                    error.code === 'auth/invalid-credential') {
                    showFieldError(emailError, 'Incorrect email or password');
                } else if (error.code === 'auth/too-many-requests') {
                    showToast('Too many failed attempts. Please try again later.', 'error');
                } else {
                    showToast('An error occurred. Please try again.', 'error');
                }
            }
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}

// ================= Forgot Password Handler =================
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideFieldError(forgotEmailError);

        const email = forgotEmailInput.value.trim();

        if (!email) {
            showFieldError(forgotEmailError, 'Email is required');
            return;
        }

        if (!validateEmail(email)) {
            showFieldError(forgotEmailError, 'Please enter a valid email address');
            return;
        }

        const sendResetBtn = document.getElementById('send-reset-btn');
        setButtonLoading(sendResetBtn, true);

        try {
            await sendPasswordResetEmail(auth, email);
            showToast('Password reset email sent! Check your inbox.');
            forgotPasswordModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            forgotEmailInput.value = '';
        } catch (error) {
            console.error('Password reset error:', error);
            
            if (error.code === 'auth/user-not-found') {
                showFieldError(forgotEmailError, 'No account found with this email address');
            } else if (error.code === 'auth/too-many-requests') {
                showFieldError(forgotEmailError, 'Too many requests. Please try again later');
            } else {
                showFieldError(forgotEmailError, 'Failed to send reset email. Please try again');
            }
        } finally {
            setButtonLoading(sendResetBtn, false);
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
        
        // Load user bookmarks if bookmarkManager is available
        if (window.bookmarkManager) {
            window.bookmarkManager.loadUserBookmarks();
        }
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