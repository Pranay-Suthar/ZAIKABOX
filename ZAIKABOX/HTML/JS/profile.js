// ================= Profile Page Module =================
import { auth } from './firebase-config.js';
import { bookmarkManager } from './bookmarks.js';
import { onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const bookmarkCountEl = document.getElementById('bookmark-count');
    const joinDateEl = document.getElementById('join-date');
    const bookmarksGrid = document.getElementById('bookmarks-grid');
    const emptyBookmarks = document.getElementById('empty-bookmarks');
    const profileLoader = document.getElementById('profile-loader');
    const clearAllBtn = document.getElementById('clear-all-bookmarks');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmClearBtn = document.getElementById('confirm-clear');
    const cancelClearBtn = document.getElementById('cancel-clear');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const recipeModal = document.getElementById('recipe-modal');
    const modalContent = document.getElementById('modal-content');
    
    // Edit Name Elements
    const editNameBtn = document.getElementById('edit-name-btn');
    const editNameModal = document.getElementById('edit-name-modal');
    const editNameForm = document.getElementById('edit-name-form');
    const newNameInput = document.getElementById('new-name-input');
    const cancelEditNameBtn = document.getElementById('cancel-edit-name');

    // API Base URL
    const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';

    // State
    let userBookmarks = [];

    // Format instructions with proper line breaks and step numbering
    const formatInstructions = (instructions) => {
        if (!instructions) return '';
        
        // Clean up the instructions text
        let formatted = instructions
            .replace(/\r\n/g, '\n')
            .replace(/\n+/g, '\n')
            .trim();
        
        // Split by numbered steps (1., 2., 3., etc.) or by sentences ending with periods
        let steps = [];
        
        // First try to split by numbered steps
        const numberedSteps = formatted.split(/(?=\d+\.)/);
        
        if (numberedSteps.length > 1) {
            // Already has numbered steps
            steps = numberedSteps.filter(step => step.trim().length > 0);
        } else {
            // Split by sentences and group into logical steps
            const sentences = formatted.split(/(?<=\.)\s+/);
            let currentStep = '';
            
            sentences.forEach((sentence, index) => {
                currentStep += sentence.trim() + ' ';
                
                // Create a new step every 1-2 sentences or when we hit certain keywords
                if (sentence.includes('minutes') || sentence.includes('until') || 
                    sentence.includes('then') || sentence.includes('next') ||
                    currentStep.length > 200 || index === sentences.length - 1) {
                    if (currentStep.trim()) {
                        steps.push(currentStep.trim());
                        currentStep = '';
                    }
                }
            });
        }
        
        // Format each step with proper numbering and spacing
        return steps.map((step, index) => {
            const cleanStep = step.replace(/^\d+\.\s*/, '').trim();
            return `<div class="instruction-step">
                <span class="step-number">${index + 1}.</span>
                <span class="step-text">${cleanStep}</span>
            </div>`;
        }).join('');
    };

    // Recipe analysis functions (same as app.js)
    const estimateCookingTime = (instructions, ingredients) => {
        const instructionText = instructions.toLowerCase();
        const ingredientCount = ingredients.length;
        
        const longCookingKeywords = ['bake', 'roast', 'slow cook', 'simmer', 'braise', 'marinate'];
        const mediumCookingKeywords = ['fry', 'sauté', 'grill', 'steam', 'boil'];
        
        const timeMatches = instructionText.match(/(\d+)\s*(hour|hr|minute|min)/g);
        if (timeMatches) {
            const totalMinutes = timeMatches.reduce((total, match) => {
                const num = parseInt(match);
                const isHour = match.includes('hour') || match.includes('hr');
                return total + (isHour ? num * 60 : num);
            }, 0);
            
            if (totalMinutes > 60) return '1+ hours';
            if (totalMinutes > 30) return '30-60 min';
            return 'Under 30 min';
        }
        
        const hasLongKeywords = longCookingKeywords.some(keyword => instructionText.includes(keyword));
        const hasMediumKeywords = mediumCookingKeywords.some(keyword => instructionText.includes(keyword));
        
        if (hasLongKeywords || ingredientCount > 12) return '1+ hours';
        if (hasMediumKeywords || ingredientCount > 8) return '30-60 min';
        return 'Under 30 min';
    };

    const estimateDifficulty = (instructions, ingredients) => {
        const instructionText = instructions.toLowerCase();
        const ingredientCount = ingredients.length;
        const instructionLength = instructions.split('.').length;
        
        const expertKeywords = ['tempering', 'flambé', 'confit', 'sous vide', 'julienne', 'brunoise', 'chiffonade'];
        const intermediateKeywords = ['sauté', 'braise', 'reduce', 'emulsify', 'fold', 'whisk', 'knead'];
        
        const hasExpertKeywords = expertKeywords.some(keyword => instructionText.includes(keyword));
        const hasIntermediateKeywords = intermediateKeywords.some(keyword => instructionText.includes(keyword));
        
        if (hasExpertKeywords || ingredientCount > 15 || instructionLength > 10) return 'Expert';
        if (hasIntermediateKeywords || ingredientCount > 8 || instructionLength > 6) return 'Intermediate';
        return 'Beginner';
    };

    const estimateCalories = (ingredients, category) => {
        const categoryCalories = {
            'Dessert': 450, 'Beef': 520, 'Pork': 480, 'Seafood': 320,
            'Chicken': 380, 'Vegetarian': 280, 'Vegan': 260, 'Pasta': 420, 'Side': 180
        };
        
        let baseCalories = categoryCalories[category] || 350;
        const ingredientText = ingredients.map(ing => ing.name.toLowerCase()).join(' ');
        
        const highCalorieIngredients = ['butter', 'oil', 'cream', 'cheese', 'nuts', 'chocolate'];
        const lowCalorieIngredients = ['vegetables', 'herbs', 'spices', 'lettuce', 'spinach'];
        
        const highCalCount = highCalorieIngredients.filter(ing => ingredientText.includes(ing)).length;
        const lowCalCount = lowCalorieIngredients.filter(ing => ingredientText.includes(ing)).length;
        
        baseCalories += (highCalCount * 50) - (lowCalCount * 30);
        const lower = Math.max(150, baseCalories - 80);
        const upper = baseCalories + 80;
        
        return `${lower}-${upper} cal`;
    };

    const getCuisineFlag = (area) => {
        const flags = {
            'Italian': '🇮🇹', 'Mexican': '🇲🇽', 'Chinese': '🇨🇳', 'Indian': '🇮🇳',
            'French': '🇫🇷', 'Japanese': '🇯🇵', 'Thai': '🇹🇭', 'Greek': '🇬🇷',
            'Spanish': '🇪🇸', 'American': '🇺🇸', 'British': '🇬🇧', 'Turkish': '🇹🇷',
            'Moroccan': '🇲🇦', 'Lebanese': '🇱🇧', 'Russian': '🇷🇺', 'Korean': '🇰🇷', 'Vietnamese': '🇻🇳'
        };
        return flags[area] || '🌍';
    };

    // Initialize page
    const initializePage = () => {
        showLoader(true);
        
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Load profile info immediately (no async needed)
                loadUserProfile(user);
                // Load bookmarks in parallel
                loadUserBookmarks().finally(() => showLoader(false));
            } else {
                // Redirect to login if not authenticated
                window.location.replace('login.html');
            }
        });
    };

    // Load user profile information (synchronous - no need for async)
    const loadUserProfile = (user) => {
        userNameEl.textContent = user.displayName || 'Food Enthusiast';
        userEmailEl.textContent = user.email;
        
        // Calculate join date (using account creation date if available)
        const joinDate = user.metadata.creationTime 
            ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
              })
            : 'Recently';
        joinDateEl.textContent = joinDate;
    };

    // Load user bookmarks
    const loadUserBookmarks = async () => {
        try {
            userBookmarks = await bookmarkManager.getUserBookmarks();
            bookmarkCountEl.textContent = userBookmarks.length;
            
            if (userBookmarks.length > 0) {
                displayBookmarksGrid();
                clearAllBtn.disabled = false;
            } else {
                showEmptyState();
                clearAllBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            showEmptyState();
        }
    };

    // Display bookmarks in grid
    const displayBookmarksGrid = () => {
        bookmarksGrid.innerHTML = '';
        emptyBookmarks.classList.add('hidden');
        
        userBookmarks.forEach(bookmark => {
            const bookmarkCard = createBookmarkCard(bookmark);
            bookmarksGrid.appendChild(bookmarkCard);
        });
    };

    // Create bookmark card element
    const createBookmarkCard = (bookmark) => {
        const card = document.createElement('div');
        card.className = 'bookmark-recipe-card';
        card.dataset.mealId = bookmark.mealId;
        
        const bookmarkDate = bookmark.bookmarkedAt 
            ? (bookmark.bookmarkedAt.seconds 
                ? new Date(bookmark.bookmarkedAt.seconds * 1000).toLocaleDateString()
                : new Date(bookmark.bookmarkedAt).toLocaleDateString())
            : 'Unknown';
        
        card.innerHTML = `
            <img src="${bookmark.mealThumb}" alt="${bookmark.mealName}" class="bookmark-recipe-image" loading="lazy">
            <button class="bookmark-remove-btn" title="Remove bookmark">
                <i class="fa fa-times"></i>
            </button>
            <div class="bookmark-recipe-info">
                <h3 class="bookmark-recipe-title">${bookmark.mealName}</h3>
                <div class="bookmark-recipe-meta">
                    ${bookmark.mealCategory ? `<span class="bookmark-recipe-category">${bookmark.mealCategory}</span>` : ''}
                    ${bookmark.mealArea ? `<span class="bookmark-recipe-area">${bookmark.mealArea}</span>` : ''}
                </div>
                <div class="bookmark-recipe-date">Bookmarked: ${bookmarkDate}</div>
            </div>
        `;
        
        // Add click handler for viewing recipe
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.bookmark-remove-btn')) {
                fetchAndShowRecipeDetails(bookmark.mealId);
            }
        });
        
        // Add remove bookmark handler
        const removeBtn = card.querySelector('.bookmark-remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeBookmark(bookmark.mealId);
        });
        
        return card;
    };

    // Show empty state
    const showEmptyState = () => {
        bookmarksGrid.innerHTML = '';
        emptyBookmarks.classList.remove('hidden');
        clearAllBtn.disabled = true;
    };

    // Remove individual bookmark
    const removeBookmark = async (mealId) => {
        try {
            await bookmarkManager.removeBookmark(mealId);
            await loadUserBookmarks(); // Refresh the display
        } catch (error) {
            console.error('Error removing bookmark:', error);
        }
    };

    // Clear all bookmarks
    const clearAllBookmarks = async () => {
        try {
            showLoader(true);
            
            // Remove all bookmarks
            const removePromises = userBookmarks.map(bookmark => 
                bookmarkManager.removeBookmark(bookmark.mealId)
            );
            
            await Promise.all(removePromises);
            await loadUserBookmarks(); // Refresh the display
            
            bookmarkManager.showToast('All bookmarks cleared', 'success');
        } catch (error) {
            console.error('Error clearing bookmarks:', error);
            bookmarkManager.showToast('Failed to clear bookmarks', 'error');
        } finally {
            showLoader(false);
        }
    };

    // Fetch and show recipe details in modal
    const fetchAndShowRecipeDetails = async (mealId) => {
        showLoader(true);
        try {
            const response = await fetch(`${API_BASE_URL}lookup.php?i=${mealId}`);
            const data = await response.json();
            if (data.meals && data.meals[0]) {
                displayRecipeModal(data.meals[0]);
            }
        } catch (error) {
            console.error('Error fetching recipe details:', error);
            bookmarkManager.showToast('Failed to load recipe details', 'error');
        } finally {
            showLoader(false);
        }
    };

    // Display recipe modal (similar to main page)
    const displayRecipeModal = (meal) => {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push({ name: ingredient, amount: measure });
            } else {
                break;
            }
        }
        
        const ingredientsHtml = ingredients.map(ing => 
            `<li><span class="ingredient-name">${ing.name}</span><span class="ingredient-amount">${ing.amount || 'As needed'}</span></li>`
        ).join('');
        
        // Calculate recipe details
        const cookingTime = estimateCookingTime(meal.strInstructions, ingredients);
        const difficulty = estimateDifficulty(meal.strInstructions, ingredients);
        const calories = estimateCalories(ingredients, meal.strCategory);
        const cuisineFlag = getCuisineFlag(meal.strArea);
        
        modalContent.innerHTML = `
            <div class="recipe-primary-content">
                <button class="close-modal-btn" id="close-modal-btn">&times;</button>
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-image">
                <div class="recipe-tags">
                    ${meal.strCategory ? `<span><i class="fa fa-utensils"></i> ${meal.strCategory}</span>` : ''}
                    ${meal.strArea ? `<span><i class="fa fa-globe"></i> ${cuisineFlag} ${meal.strArea}</span>` : ''}
                </div>
                <div class="recipe-details">
                    <div class="recipe-detail-item">
                        <i class="fa fa-clock-o"></i>
                        <span class="detail-label">Cook Time</span>
                        <span class="detail-value">${cookingTime}</span>
                    </div>
                    <div class="recipe-detail-item">
                        <i class="fa fa-signal"></i>
                        <span class="detail-label">Difficulty</span>
                        <span class="detail-value difficulty-${difficulty.toLowerCase()}">${difficulty}</span>
                    </div>
                    <div class="recipe-detail-item">
                        <i class="fa fa-fire"></i>
                        <span class="detail-label">Calories</span>
                        <span class="detail-value">${calories}</span>
                    </div>
                    <div class="recipe-detail-item">
                        <i class="fa fa-users"></i>
                        <span class="detail-label">Servings</span>
                        <span class="detail-value">4-6</span>
                    </div>
                </div>
                <div class="recipe-actions">
                    <button class="bookmark-btn modal-bookmark bookmarked" data-meal-id="${meal.idMeal}" title="Remove from bookmarks">
                        <i class="fa fa-heart"></i> Remove Bookmark
                    </button>
                    ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" class="recipe-video-btn"><i class="fa fa-youtube-play"></i> Watch Video</a>` : ''}
                </div>
            </div>
            <div class="recipe-secondary-content">
                <h2 class="recipe-title">${meal.strMeal}</h2>
                <h3 class="recipe-section-title"><i class="fa fa-list"></i> Ingredients</h3>
                <ul class="recipe-ingredients-list">${ingredientsHtml}</ul>
            </div>
            <div class="recipe-instructions-section">
                <h3 class="recipe-section-title"><i class="fa fa-book"></i> Instructions</h3>
                <div class="recipe-instructions-text">${formatInstructions(meal.strInstructions)}</div>
            </div>
        `;
        
        // Add bookmark button handler for modal
        const modalBookmarkBtn = modalContent.querySelector('.modal-bookmark');
        modalBookmarkBtn.addEventListener('click', async () => {
            await bookmarkManager.removeBookmark(meal.idMeal);
            closeModal();
            await loadUserBookmarks(); // Refresh the display
        });
        
        recipeModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    };

    // Close recipe modal
    const closeModal = () => {
        recipeModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    };

    // Show/hide loader
    const showLoader = (show) => {
        profileLoader.classList.toggle('show', show);
    };

    // Edit Name Functions
    const showEditNameModal = () => {
        const currentName = auth.currentUser?.displayName || 'Food Enthusiast';
        newNameInput.value = currentName;
        editNameModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        newNameInput.focus();
        newNameInput.select();
    };

    const hideEditNameModal = () => {
        editNameModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        newNameInput.value = '';
    };

    const updateUserName = async (newName) => {
        if (!auth.currentUser) return false;
        
        try {
            showLoader(true);
            
            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName: newName.trim()
            });
            
            // Update the UI immediately
            userNameEl.textContent = newName.trim();
            
            // Show success message
            bookmarkManager.showToast('Name updated successfully!', 'success');
            
            return true;
        } catch (error) {
            console.error('Error updating name:', error);
            bookmarkManager.showToast('Failed to update name. Please try again.', 'error');
            return false;
        } finally {
            showLoader(false);
        }
    };

    // Show confirmation modal
    const showConfirmationModal = () => {
        confirmationModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    // Hide confirmation modal
    const hideConfirmationModal = () => {
        confirmationModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    };

    // Event Listeners
    clearAllBtn.addEventListener('click', showConfirmationModal);
    confirmClearBtn.addEventListener('click', async () => {
        hideConfirmationModal();
        await clearAllBookmarks();
    });
    cancelClearBtn.addEventListener('click', hideConfirmationModal);
    
    backToHomeBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Edit Name Event Listeners
    editNameBtn.addEventListener('click', showEditNameModal);
    cancelEditNameBtn.addEventListener('click', hideEditNameModal);
    
    editNameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = newNameInput.value.trim();
        
        if (!newName) {
            bookmarkManager.showToast('Please enter a valid name', 'error');
            return;
        }
        
        if (newName.length > 50) {
            bookmarkManager.showToast('Name must be 50 characters or less', 'error');
            return;
        }
        
        const success = await updateUserName(newName);
        if (success) {
            hideEditNameModal();
        }
    });

    // Modal event listeners
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) closeModal();
    });
    
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) hideConfirmationModal();
    });
    
    editNameModal.addEventListener('click', (e) => {
        if (e.target === editNameModal) hideEditNameModal();
    });

    // Keyboard event listeners
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (recipeModal.classList.contains('show')) closeModal();
            if (confirmationModal.classList.contains('show')) hideConfirmationModal();
            if (editNameModal.classList.contains('show')) hideEditNameModal();
        }
    });

    // Initialize the page
    initializePage();
});