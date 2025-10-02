// ================= Authentication Guard System =================
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

class AuthGuard {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.limitedFeatures = [
            'pantry-search-btn',
            'profile-btn',
            'single-random-meal'
        ];
        this.init();
    }

    init() {
        // Listen for authentication state changes
        onAuthStateChanged(auth, (user) => {
            this.isAuthenticated = !!user;
            this.user = user;
            this.updateUI();
        });
    }

    updateUI() {
        if (this.isAuthenticated) {
            this.enableFullAccess();
        } else {
            this.enableLimitedAccess();
        }
    }

    enableLimitedAccess() {
        // Show login prompt overlay
        this.showLoginPrompt();
        
        // Disable premium features
        this.limitedFeatures.forEach(featureId => {
            const element = document.getElementById(featureId);
            if (element) {
                element.addEventListener('click', this.showLoginModal.bind(this));
                element.style.position = 'relative';
                element.setAttribute('data-requires-auth', 'true');
            }
        });

        // Limit recipe viewing
        this.limitRecipeAccess();
        
        // Update navigation
        this.updateNavigation(false);
    }

    enableFullAccess() {
        // Remove login prompt
        this.hideLoginPrompt();
        
        // Enable all features
        this.limitedFeatures.forEach(featureId => {
            const element = document.getElementById(featureId);
            if (element) {
                element.removeEventListener('click', this.showLoginModal.bind(this));
                element.removeAttribute('data-requires-auth');
            }
        });

        // Enable full recipe access
        this.enableFullRecipeAccess();
        
        // Update navigation
        this.updateNavigation(true);
    }

    showLoginPrompt() {
        // Create floating login prompt
        if (!document.getElementById('auth-prompt')) {
            const prompt = document.createElement('div');
            prompt.id = 'auth-prompt';
            prompt.innerHTML = `
                <div class="auth-prompt-content">
                    <div class="auth-prompt-icon">🔒</div>
                    <h3>Welcome to ZaikaBox!</h3>
                    <p>Sign in to unlock all features:</p>
                    <ul>
                        <li>✨ Unlimited recipe access</li>
                        <li>🥘 Pantry search feature</li>
                        <li>❤️ Bookmark your favorites</li>
                        <li>👤 Personal profile</li>
                    </ul>
                    <button class="auth-prompt-btn" onclick="window.location.href='login.html'">
                        Sign In Now
                    </button>
                    <button class="auth-prompt-close" onclick="this.parentElement.parentElement.remove()">
                        ×
                    </button>
                </div>
            `;
            document.body.appendChild(prompt);
        }
    }

    hideLoginPrompt() {
        const prompt = document.getElementById('auth-prompt');
        if (prompt) {
            prompt.remove();
        }
    }

    showLoginModal(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'auth-required-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <button class="auth-modal-close">&times;</button>
                <div class="auth-modal-icon">🔐</div>
                <h2>Authentication Required</h2>
                <p>This feature requires you to be signed in to your ZaikaBox account.</p>
                <div class="auth-modal-benefits">
                    <h4>Sign in to enjoy:</h4>
                    <ul>
                        <li>🍳 Unlimited recipe generation</li>
                        <li>🥘 Smart pantry search</li>
                        <li>❤️ Save favorite recipes</li>
                        <li>👤 Personalized experience</li>
                    </ul>
                </div>
                <div class="auth-modal-actions">
                    <a href="login.html" class="auth-modal-btn primary">Sign In</a>
                    <button class="auth-modal-btn secondary" onclick="this.closest('.auth-required-modal').remove()">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;
        
        // Add close functionality
        modal.querySelector('.auth-modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        document.body.appendChild(modal);
    }

    limitRecipeAccess() {
        // Allow viewing only 3 recipes without login
        let viewedRecipes = parseInt(localStorage.getItem('guestRecipeViews') || '0');
        
        // Override recipe modal opening
        const originalModalOpen = window.openRecipeModal;
        window.openRecipeModal = (meal) => {
            if (!this.isAuthenticated) {
                viewedRecipes++;
                localStorage.setItem('guestRecipeViews', viewedRecipes.toString());
                
                if (viewedRecipes > 3) {
                    this.showRecipeLimitModal();
                    return;
                }
            }
            
            if (originalModalOpen) {
                originalModalOpen(meal);
            }
        };
    }

    enableFullRecipeAccess() {
        // Remove recipe viewing limits
        localStorage.removeItem('guestRecipeViews');
    }

    showRecipeLimitModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-required-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <button class="auth-modal-close">&times;</button>
                <div class="auth-modal-icon">📚</div>
                <h2>Recipe Limit Reached</h2>
                <p>You've viewed your free recipe limit! Sign in to continue exploring our amazing collection.</p>
                <div class="auth-modal-benefits">
                    <h4>Unlimited access includes:</h4>
                    <ul>
                        <li>🍳 Thousands of recipes</li>
                        <li>📱 Mobile-friendly experience</li>
                        <li>🔍 Advanced search features</li>
                        <li>❤️ Personal recipe collection</li>
                    </ul>
                </div>
                <div class="auth-modal-actions">
                    <a href="login.html" class="auth-modal-btn primary">Sign In for Free</a>
                    <button class="auth-modal-btn secondary" onclick="this.closest('.auth-required-modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        modal.querySelector('.auth-modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        document.body.appendChild(modal);
    }

    updateNavigation(isAuthenticated) {
        const profileBtn = document.getElementById('profile-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (isAuthenticated) {
            if (profileBtn) profileBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
        } else {
            if (profileBtn) {
                profileBtn.innerHTML = '<i class="fa fa-sign-in"></i> Sign In';
                profileBtn.onclick = () => window.location.href = 'login.html';
            }
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }
}

// Export the auth guard instance
export const authGuard = new AuthGuard();