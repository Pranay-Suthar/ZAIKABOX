import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig, initFirebase } from './firebase-config.js';

// Initialize Firebase
initFirebase();

// Get auth instance
const auth = getAuth();

// Toast notification system
function showToast(message, type = 'success', durationMs = 3200) {
    // Remove existing toast container if it exists
    let toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
        toastContainer.remove();
    }

    // Create toast container
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Add toast to container
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    // Remove toast after duration
    setTimeout(() => {
        if (toastContainer && toastContainer.parentNode) {
            toastContainer.remove();
        }
    }, durationMs);
}

// Check if user is authenticated
function requireAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log('User is authenticated:', user.email);
        } else {
            // User is signed out, redirect to login
            if (window.location.pathname !== '/login.html' && !window.location.pathname.includes('login.html')) {
                window.location.replace('./login.html');
            }
        }
    });
}

// Wire up logout button
function wireLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                showToast('Logged out successfully!', 'success');
                setTimeout(() => window.location.replace('./login.html'), 1000);
            } catch (error) {
                showToast('Logout failed: ' + error.message, 'error');
            }
        });
    }
}

// Handle signup form submission
async function handleSignupSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const termsChecked = document.getElementById('terms-checkbox').checked;
    
    if (!termsChecked) {
        showToast('Please agree to the terms of service', 'error');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => window.location.replace('./index.html'), 1000);
    } catch (error) {
        showToast(error.message || 'Signup failed', 'error');
    }
}

// Handle login form submission
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => window.location.replace('./index.html'), 1000);
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
    }
}

// Toggle between signup and login forms
function setupFormToggle() {
    const memberLink = document.getElementById('member-link');
    const signupForm = document.getElementById('signup-form');
    
    if (memberLink && signupForm) {
        memberLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Toggle form content
            if (signupForm.classList.contains('login-mode')) {
                // Switch to signup
                signupForm.classList.remove('login-mode');
                signupForm.innerHTML = `
                    <div class="form-field">
                        <label for="signup-email">E-MAIL</label>
                        <input type="email" id="signup-email" name="email" placeholder="Your e-mail goes here" required />
                    </div>
                    <div class="form-field">
                        <label for="signup-password">PASSWORD</label>
                        <input type="password" id="signup-password" name="password" placeholder="••••••••" minlength="6" required />
                    </div>
                    <div class="form-field checkbox-field">
                        <input type="checkbox" id="terms-checkbox" name="terms" required />
                        <label for="terms-checkbox">
                            I agree all statements in <a href="#" class="terms-link">terms of service</a>
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="submit">SIGN UP</button>
                    </div>
                    <div class="member-link">
                        <a href="#" id="member-link">I'm already member</a>
                    </div>
                `;
                
                // Re-attach event listeners
                setupFormToggle();
                setupFormSubmission();
            } else {
                // Switch to login
                signupForm.classList.add('login-mode');
                signupForm.innerHTML = `
                    <div class="form-field">
                        <label for="login-email">E-MAIL</label>
                        <input type="email" id="login-email" name="email" placeholder="Your e-mail goes here" required />
                    </div>
                    <div class="form-field">
                        <label for="login-password">PASSWORD</label>
                        <input type="password" id="login-password" name="password" placeholder="••••••••" required />
                    </div>
                    <div class="form-actions">
                        <button type="submit">SIGN IN</button>
                    </div>
                    <div class="member-link">
                        <a href="#" id="member-link">I'm already member</a>
                    </div>
                `;
                
                // Re-attach event listeners
                setupFormToggle();
                setupFormSubmission();
            }
        });
    }
}

// Setup left side triggers for SIGN UP and SIGN IN
function setupLeftSideTriggers() {
    const signupTrigger = document.querySelector('.signup-trigger');
    const signinTrigger = document.querySelector('.signin-trigger');
    const signupForm = document.getElementById('signup-form');
    
    if (signupTrigger && signinTrigger && signupForm) {
        // SIGN UP trigger
        signupTrigger.addEventListener('click', () => {
            console.log('SIGN UP clicked'); // Debug log
            // Update active states
            signupTrigger.classList.add('active');
            signinTrigger.classList.remove('active');
            
            // Animate form change to signup
            animateFormChange(signupForm, 'signup');
        });
        
        // SIGN IN trigger
        signinTrigger.addEventListener('click', () => {
            console.log('SIGN IN clicked'); // Debug log
            // Update active states
            signinTrigger.classList.add('active');
            signupTrigger.classList.remove('active');
            
            // Animate form change to signin
            animateFormChange(signupForm, 'signin');
        });
    } else {
        console.log('Triggers not found:', { signupTrigger, signinTrigger, signupForm }); // Debug log
    }
}

// Animate form change with smooth transition
function animateFormChange(form, mode) {
    console.log('Animating form change to:', mode); // Debug log
    
    // Add fade out effect
    form.classList.add('fade-out');
    
    setTimeout(() => {
        if (mode === 'signup') {
            // Switch to signup form
            form.classList.remove('login-mode');
            form.innerHTML = `
                <div class="form-field">
                    <label for="signup-email">E-MAIL</label>
                    <input type="email" id="signup-email" name="email" placeholder="Your e-mail goes here" required />
                </div>
                <div class="form-field">
                    <label for="signup-password">PASSWORD</label>
                    <input type="password" id="signup-password" name="password" placeholder="••••••••" minlength="6" required />
                </div>
                <div class="form-field checkbox-field">
                    <input type="checkbox" id="terms-checkbox" name="terms" required />
                    <label for="terms-checkbox">
                        I agree all statements in <a href="#" class="terms-link">terms of service</a>
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit">SIGN UP</button>
                </div>
                <div class="member-link">
                    <a href="#" id="member-link">I'm already member</a>
                </div>
            `;
        } else {
            // Switch to signin form
            form.classList.add('login-mode');
            form.innerHTML = `
                <div class="form-field">
                    <label for="login-email">E-MAIL</label>
                    <input type="email" id="login-email" name="email" placeholder="Your e-mail goes here" required />
                </div>
                <div class="form-field">
                    <label for="login-password">PASSWORD</label>
                    <input type="password" id="login-password" name="password" placeholder="••••••••" required />
                </div>
                <div class="form-actions">
                    <button type="submit">SIGN IN</button>
                </div>
                <div class="member-link">
                    <a href="#" id="member-link">I'm already member</a>
                </div>
            `;
        }
        
        // Re-attach event listeners
        setupFormToggle();
        setupFormSubmission();
        
        // Add fade in effect
        setTimeout(() => {
            form.classList.remove('fade-out');
            form.classList.add('fade-in');
            
            // Remove fade-in class after animation
            setTimeout(() => {
                form.classList.remove('fade-in');
            }, 400);
        }, 50);
    }, 200);
}

// Setup form submission handlers
function setupFormSubmission() {
    const signupForm = document.getElementById('signup-form');
    
    if (signupForm) {
        signupForm.addEventListener('submit', (event) => {
            if (signupForm.classList.contains('login-mode')) {
                handleLoginSubmit(event);
            } else {
                handleSignupSubmit(event);
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up...'); // Debug log
    
    // Check if we're on the login page
    if (document.body.classList.contains('login-page')) {
        console.log('On login page, setting up triggers...'); // Debug log
        
        // Small delay to ensure everything is rendered
        setTimeout(() => {
            setupFormToggle();
            setupFormSubmission();
            setupLeftSideTriggers(); // Initialize left side triggers
        }, 100);
    } else {
        // We're on the main page
        requireAuth();
        wireLogout();
    }
}); 