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
            'single-random-meal',
            'search-type',
            'search-value',
            'filter-value-container'
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
                    <div class="auth-prompt-icon">🍳</div>
                    <h3>Welcome to ZaikaBox!</h3>
                    <p><strong>Limited Access:</strong> You can only view 1 recipe without signing in.</p>
                    <div class="auth-prompt-features">
                        <h4>🔓 Sign in for FREE to unlock:</h4>
                        <ul>
                            <li>🍽️ <strong>Unlimited recipes</strong> - Access thousands of dishes</li>
                            <li>🔍 <strong>Advanced search</strong> - Filter by category, area & ingredients</li>
                            <li>🥘 <strong>Pantry search</strong> - Find recipes with your ingredients</li>
                            <li>🎲 <strong>Random generator</strong> - Discover new favorites</li>
                            <li>❤️ <strong>Save favorites</strong> - Bookmark recipes you love</li>
                            <li>👤 <strong>Personal profile</strong> - Track your cooking journey</li>
                        </ul>
                    </div>
                    <button class="auth-prompt-btn" onclick="window.location.href='login.html'">
                        🚀 Sign In Free - Unlock Everything!
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
        
        // Determine which feature was clicked
        const featureNames = {
            'pantry-search-btn': 'Pantry Search',
            'single-random-meal': 'Random Recipe Generator',
            'search-type': 'Advanced Search',
            'search-value': 'Recipe Filtering'
        };
        
        const featureName = featureNames[event.target.id] || 'Premium Feature';
        const featureId = event.target.id;
        
        // Determine if "Maybe Later" should be shown (only for random recipe generator)
        const showMaybeLater = featureId === 'single-random-meal';
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'auth-required-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <button class="auth-modal-close">&times;</button>
                <div class="auth-modal-icon">🔒</div>
                <h2>${featureName} - Sign In Required</h2>
                <p>This premium feature is available to registered users only. Join thousands of home cooks already using ZaikaBox!</p>
                <div class="auth-modal-benefits">
                    <h4>🎉 Free account includes:</h4>
                    <ul>
                        <li>🍳 <strong>Unlimited Recipes</strong> - Access our complete collection</li>
                        <li>🔍 <strong>Smart Search</strong> - Find recipes by category, area & ingredients</li>
                        <li>🥘 <strong>Pantry Magic</strong> - Recipes from what you have at home</li>
                        <li>🎲 <strong>Random Discovery</strong> - Try something new every day</li>
                        <li>❤️ <strong>Save Favorites</strong> - Never lose a great recipe</li>
                        <li>👤 <strong>Personal Profile</strong> - Track your cooking journey</li>
                    </ul>
                </div>
                <div class="auth-modal-actions">
                    <a href="login.html" class="auth-modal-btn primary">🚀 Sign Up Free</a>
                    ${showMaybeLater ? `
                    <button class="auth-modal-btn secondary" onclick="this.closest('.auth-required-modal').remove()">
                        Maybe Later
                    </button>
                    ` : ''}
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
        // Allow viewing only 1 recipe without login
        let viewedRecipes = parseInt(localStorage.getItem('guestRecipeViews') || '0');
        
        // Override recipe modal opening
        const originalModalOpen = window.openRecipeModal;
        window.openRecipeModal = (meal) => {
            if (!this.isAuthenticated) {
                viewedRecipes++;
                localStorage.setItem('guestRecipeViews', viewedRecipes.toString());
                
                if (viewedRecipes > 1) {
                    this.showRecipeLimitModal();
                    return;
                }
            }
            
            if (originalModalOpen) {
                originalModalOpen(meal);
            }
        };
        
        // Also limit recipe card interactions
        this.limitRecipeCardAccess();
    }

    limitRecipeCardAccess() {
        // Add click handlers to all recipe cards to check auth
        document.addEventListener('click', (e) => {
            const recipeCard = e.target.closest('.meal-card');
            if (recipeCard && !this.isAuthenticated) {
                const viewedRecipes = parseInt(localStorage.getItem('guestRecipeViews') || '0');
                if (viewedRecipes >= 1) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showRecipeLimitModal();
                    return false;
                }
            }
        });
        
        // Limit search functionality
        this.limitSearchAccess();
    }
    
    limitSearchAccess() {
        // Disable search dropdowns for non-authenticated users
        const searchType = document.getElementById('search-type');
        const searchValue = document.getElementById('search-value');
        
        if (searchType) {
            searchType.addEventListener('change', (e) => {
                if (!this.isAuthenticated) {
                    e.preventDefault();
                    this.showLoginModal(e);
                    searchType.value = '';
                }
            });
        }
        
        if (searchValue) {
            searchValue.addEventListener('change', (e) => {
                if (!this.isAuthenticated) {
                    e.preventDefault();
                    this.showLoginModal(e);
                }
            });
        }
    }

    enableFullRecipeAccess() {
        // Remove recipe viewing limits
        localStorage.removeItem('guestRecipeViews');
        
        // Remove search restrictions
        const searchType = document.getElementById('search-type');
        const searchValue = document.getElementById('search-value');
        
        if (searchType) {
            searchType.disabled = false;
        }
        if (searchValue) {
            searchValue.disabled = false;
        }
    }

    showRecipeLimitModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-required-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <button class="auth-modal-close">&times;</button>
                <div class="auth-modal-icon">🔒</div>
                <h2>Free Recipe Limit Reached!</h2>
                <p><strong>You've used your 1 free recipe view.</strong> Join thousands of home cooks who've unlocked the full ZaikaBox experience!</p>
                <div class="auth-modal-benefits">
                    <h4>🎉 Sign up FREE and get instant access to:</h4>
                    <ul>
                        <li>🍽️ <strong>1000+ Recipes</strong> - From appetizers to desserts</li>
                        <li>🔍 <strong>Smart Search</strong> - Find exactly what you're craving</li>
                        <li>🥘 <strong>Pantry Magic</strong> - Recipes from your ingredients</li>
                        <li>❤️ <strong>Save Favorites</strong> - Never lose a great recipe again</li>
                        <li>📱 <strong>Mobile Optimized</strong> - Cook with your phone in the kitchen</li>
                        <li>🎲 <strong>Random Discovery</strong> - Try something new every day</li>
                    </ul>
                    <div class="auth-modal-testimonial">
                        <em>"Finally found a recipe site that actually works! Made the chicken curry last night and my family couldn't stop asking for seconds."</em>
                        <strong>- Priya S.</strong>
                    </div>
                </div>
                <div class="auth-modal-actions">
                    <a href="login.html" class="auth-modal-btn primary">🚀 Join Free - Unlock Everything!</a>
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