// ================= Dietary Preference System =================
import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

class DietaryPreference {
    constructor() {
        this.userPreference = null;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await this.checkAndShowPreferenceModal(user);
            }
        });
    }

    async checkAndShowPreferenceModal(user) {
        try {
            // Check if user has already set their preference
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists() || !userDoc.data().dietaryPreference) {
                // First time user - show preference modal
                this.showDietaryPreferenceModal(user);
            } else {
                // Load existing preference
                this.userPreference = userDoc.data().dietaryPreference;
                this.applyDietaryFilter();
            }
        } catch (error) {
            console.error('Error checking dietary preference:', error);
        }
    }

    showDietaryPreferenceModal(user) {
        const modal = document.createElement('div');
        modal.className = 'dietary-preference-modal';
        modal.innerHTML = `
            <div class="dietary-modal-content">
                <div class="dietary-modal-header">
                    <div class="dietary-icon">🍽️</div>
                    <h2>Welcome to ZaikaBox!</h2>
                    <p>Let's personalize your recipe experience</p>
                </div>
                
                <div class="dietary-options">
                    <h3>What's your dietary preference?</h3>
                    <div class="dietary-cards">
                        <div class="dietary-card" data-preference="non-veg">
                            <div class="dietary-card-icon">🍖</div>
                            <h4>Non-Vegetarian</h4>
                            <p>All recipes including meat, seafood, and poultry</p>
                        </div>
                        
                        <div class="dietary-card" data-preference="vegetarian">
                            <div class="dietary-card-icon">🥗</div>
                            <h4>Vegetarian</h4>
                            <p>Plant-based recipes with dairy and eggs</p>
                        </div>
                        
                        <div class="dietary-card" data-preference="vegan">
                            <div class="dietary-card-icon">🌱</div>
                            <h4>Vegan</h4>
                            <p>100% plant-based recipes only</p>
                        </div>
                    </div>
                </div>
                
                <div class="dietary-note">
                    <small>💡 You can change this anytime in your profile settings</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click handlers for dietary cards
        const cards = modal.querySelectorAll('.dietary-card');
        cards.forEach(card => {
            card.addEventListener('click', async () => {
                const preference = card.dataset.preference;
                await this.saveDietaryPreference(user, preference);
                modal.remove();
            });
        });
    }

    async saveDietaryPreference(user, preference) {
        try {
            await setDoc(doc(db, 'users', user.uid), {
                dietaryPreference: preference,
                email: user.email,
                displayName: user.displayName,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            this.userPreference = preference;
            this.applyDietaryFilter();
            
            // Show success message
            this.showSuccessMessage(preference);
        } catch (error) {
            console.error('Error saving dietary preference:', error);
        }
    }

    applyDietaryFilter() {
        // Dispatch custom event that app.js can listen to
        window.dispatchEvent(new CustomEvent('dietaryPreferenceSet', {
            detail: { preference: this.userPreference }
        }));
    }

    showSuccessMessage(preference) {
        const preferenceNames = {
            'non-veg': 'Non-Vegetarian',
            'vegetarian': 'Vegetarian',
            'vegan': 'Vegan'
        };
        
        const toast = document.createElement('div');
        toast.className = 'dietary-success-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">✅</span>
                <span class="toast-message">Preference set to ${preferenceNames[preference]}!</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async getUserPreference() {
        if (this.userPreference) {
            return this.userPreference;
        }
        
        const user = auth.currentUser;
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    this.userPreference = userDoc.data().dietaryPreference;
                    return this.userPreference;
                }
            } catch (error) {
                console.error('Error getting user preference:', error);
            }
        }
        
        return null;
    }

    filterRecipesByPreference(meals) {
        if (!this.userPreference || this.userPreference === 'non-veg') {
            return meals; // Show all recipes
        }
        
        // Filter based on preference
        return meals.filter(meal => {
            const category = meal.strCategory?.toLowerCase() || '';
            
            if (this.userPreference === 'vegetarian') {
                return category === 'vegetarian';
            }
            
            if (this.userPreference === 'vegan') {
                return category === 'vegan';
            }
            
            return true;
        });
    }
}

// Export the dietary preference instance
export const dietaryPreference = new DietaryPreference();
