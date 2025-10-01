import { bookmarkManager } from './bookmarks.js';
// Uncomment the line below for Firebase debugging
// import { testFirebaseConnection } from './firebase-test.js';
// import './debug-bookmarks.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const allSliders = document.querySelectorAll('.meal-slider-container');
    const sliderContainer = document.getElementById('random-slider');
    const toastLoader = document.getElementById('toast-loader');
    const recipeModal = document.getElementById('recipe-modal');
    const modalContent = document.getElementById('modal-content');
    const searchTypeSelect = document.getElementById('search-type');
    const searchValueSelect = document.getElementById('search-value');
    const searchValueContainer = document.getElementById('filter-value-container');
    const randomMealBtn = document.getElementById('single-random-meal');
    
    // New sections
    const seasonalSlider = document.getElementById('seasonal-slider');
    const seasonalTitle = document.getElementById('seasonal-title');
    const trendingSlider = document.getElementById('trending-slider');

    // Pantry Elements
    const pantrySearchBtn = document.getElementById('pantry-search-btn');
    const pantryModal = document.getElementById('pantry-modal');
    const closePantryModalBtn = document.getElementById('close-pantry-modal');
    const pantryIngredientInput = document.getElementById('pantry-ingredient-input');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const pantryTagsContainer = document.getElementById('pantry-tags');
    const searchPantryBtn = document.getElementById('search-pantry-btn');

    // --- NEW: Results Containers ---
    const pantryResultsContainer = document.getElementById('pantry-results-container');
    const pantryResultsSlider = document.getElementById('pantry-results-slider');
    const manualSearchContainer = document.getElementById('manual-search-container');
    const manualSearchSlider = document.getElementById('manual-search-slider');
    const randomMealContainer = document.getElementById('random-meal-container');
    const randomMealContent = document.querySelector('.random-meal-content');
    const profileBtn = document.getElementById('profile-btn');


    // --- State ---
    const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';
    let sliderIntervals = new Map();
    let pantryIngredients = [];

    // --- Core Functions ---

    const toggleLoader = (show) => {
        toastLoader.classList.toggle('show', show);
    };

    // Recipe analysis functions
    const estimateCookingTime = (instructions, ingredients) => {
        const instructionText = instructions.toLowerCase();
        const ingredientCount = ingredients.length;
        
        // Keywords that suggest longer cooking times
        const longCookingKeywords = ['bake', 'roast', 'slow cook', 'simmer', 'braise', 'marinate'];
        const mediumCookingKeywords = ['fry', 'sauté', 'grill', 'steam', 'boil'];
        const quickKeywords = ['mix', 'blend', 'toss', 'combine', 'serve'];
        
        // Check for time mentions in instructions
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
        
        // Estimate based on keywords and complexity
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
        
        // Complex cooking techniques
        const expertKeywords = ['tempering', 'flambé', 'confit', 'sous vide', 'julienne', 'brunoise', 'chiffonade'];
        const intermediateKeywords = ['sauté', 'braise', 'reduce', 'emulsify', 'fold', 'whisk', 'knead'];
        const beginnerKeywords = ['mix', 'combine', 'toss', 'serve', 'heat', 'warm'];
        
        const hasExpertKeywords = expertKeywords.some(keyword => instructionText.includes(keyword));
        const hasIntermediateKeywords = intermediateKeywords.some(keyword => instructionText.includes(keyword));
        
        if (hasExpertKeywords || ingredientCount > 15 || instructionLength > 10) return 'Expert';
        if (hasIntermediateKeywords || ingredientCount > 8 || instructionLength > 6) return 'Intermediate';
        return 'Beginner';
    };

    const estimateCalories = (ingredients, category) => {
        // Base calories by category
        const categoryCalories = {
            'Dessert': 450,
            'Beef': 520,
            'Pork': 480,
            'Seafood': 320,
            'Chicken': 380,
            'Vegetarian': 280,
            'Vegan': 260,
            'Pasta': 420,
            'Side': 180
        };
        
        let baseCalories = categoryCalories[category] || 350;
        
        // Adjust based on ingredients
        const highCalorieIngredients = ['butter', 'oil', 'cream', 'cheese', 'nuts', 'chocolate'];
        const lowCalorieIngredients = ['vegetables', 'herbs', 'spices', 'lettuce', 'spinach'];
        
        const ingredientText = ingredients.map(ing => ing.name.toLowerCase()).join(' ');
        
        const highCalCount = highCalorieIngredients.filter(ing => ingredientText.includes(ing)).length;
        const lowCalCount = lowCalorieIngredients.filter(ing => ingredientText.includes(ing)).length;
        
        baseCalories += (highCalCount * 50) - (lowCalCount * 30);
        
        // Return range
        const lower = Math.max(150, baseCalories - 80);
        const upper = baseCalories + 80;
        
        return `${lower}-${upper} cal`;
    };

    const getCuisineFlag = (area) => {
        const flags = {
            'Italian': '🇮🇹',
            'Mexican': '🇲🇽',
            'Chinese': '🇨🇳',
            'Indian': '🇮🇳',
            'French': '🇫🇷',
            'Japanese': '🇯🇵',
            'Thai': '🇹🇭',
            'Greek': '🇬🇷',
            'Spanish': '🇪🇸',
            'American': '🇺🇸',
            'British': '🇬🇧',
            'Turkish': '🇹🇷',
            'Moroccan': '🇲🇦',
            'Lebanese': '🇱🇧',
            'Russian': '🇷🇺',
            'Korean': '🇰🇷',
            'Vietnamese': '🇻🇳'
        };
        return flags[area] || '🌍';
    };

    // Seasonal content functions
    const getCurrentSeason = () => {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    };

    const getSeasonalData = (season) => {
        const seasonalContent = {
            spring: {
                title: '🌸 Spring Fresh',
                categories: ['Vegetarian', 'Seafood'],
                emoji: '🌱',
                className: 'season-spring'
            },
            summer: {
                title: '☀️ Summer Delights',
                categories: ['Seafood', 'Vegetarian'],
                emoji: '🏖️',
                className: 'season-summer'
            },
            autumn: {
                title: '🍂 Autumn Favorites',
                categories: ['Beef', 'Pork'],
                emoji: '🎃',
                className: 'season-autumn'
            },
            winter: {
                title: '❄️ Winter Warmers',
                categories: ['Beef', 'Chicken'],
                emoji: '🔥',
                className: 'season-winter'
            }
        };
        return seasonalContent[season];
    };

    const loadSeasonalContent = async () => {
        const season = getCurrentSeason();
        const seasonData = getSeasonalData(season);
        
        // Update title and styling
        seasonalTitle.textContent = seasonData.title;
        const seasonalSection = document.querySelector('.seasonal-section');
        seasonalSection.className = `category-showcase seasonal-section ${seasonData.className}`;
        
        showSkeletonLoader(seasonalSlider);
        
        try {
            // Get recipes from seasonal categories
            const categoryPromises = seasonData.categories.map(category => 
                fetch(`${API_BASE_URL}filter.php?c=${category}`).then(res => res.json())
            );
            
            const results = await Promise.all(categoryPromises);
            const allMeals = results.flatMap(result => result.meals || []);
            
            if (allMeals.length > 0) {
                const shuffledMeals = shuffleArray(allMeals).slice(0, 15);
                displayInfiniteSlider(shuffledMeals, seasonalSlider);
            }
        } catch (error) {
            console.error('Error loading seasonal content:', error);
            seasonalSlider.classList.add('loaded');
        }
    };

    const loadTrendingContent = async () => {
        showSkeletonLoader(trendingSlider);
        
        try {
            // Simulate trending by mixing popular categories
            const trendingCategories = ['Chicken', 'Pasta', 'Dessert'];
            const categoryPromises = trendingCategories.map(category => 
                fetch(`${API_BASE_URL}filter.php?c=${category}`).then(res => res.json())
            );
            
            const results = await Promise.all(categoryPromises);
            const allMeals = results.flatMap(result => result.meals || []);
            
            if (allMeals.length > 0) {
                // Simulate "trending" by taking random popular recipes
                const trendingMeals = shuffleArray(allMeals).slice(0, 20);
                displayTrendingSlider(trendingMeals, trendingSlider);
            }
        } catch (error) {
            console.error('Error loading trending content:', error);
            trendingSlider.classList.add('loaded');
        }
    };

    // Shuffle array function for randomizing content
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const createSkeletonCard = () => {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'skeleton-card';
        return skeletonCard;
    };

    const showSkeletonLoader = (container, count = 6) => {
        container.innerHTML = '';
        container.classList.remove('loaded');
        
        const skeletonContainer = document.createElement('div');
        skeletonContainer.className = 'skeleton-container';
        
        for (let i = 0; i < count; i++) {
            skeletonContainer.appendChild(createSkeletonCard());
        }
        
        container.appendChild(skeletonContainer);
        container.style.opacity = '1'; // Show skeleton immediately
    };

    const startSliderAnimation = (slider) => {
        stopSliderAnimation(slider);
        const intervalId = setInterval(() => {
            if (slider.scrollLeft >= slider.scrollWidth / 2) {
                slider.scrollLeft = 0;
            } else {
                slider.scrollLeft += 1;
            }
        }, 30);
        sliderIntervals.set(slider, intervalId);
    };

    const stopSliderAnimation = (slider) => {
        if (sliderIntervals.has(slider)) {
            clearInterval(sliderIntervals.get(slider));
            sliderIntervals.delete(slider);
        }
    };

    const createMealCard = (meal, isTrending = false) => {
        const mealCard = document.createElement('div');
        mealCard.className = 'meal-card';
        mealCard.dataset.mealId = meal.idMeal;
        
        const trendingBadge = isTrending ? '<div class="trending-badge">🔥 Trending</div>' : '';
        
        mealCard.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-card-background" loading="lazy">
            ${trendingBadge}
            <button class="bookmark-btn" data-meal-id="${meal.idMeal}" title="Add to bookmarks">
                <i class="fa fa-heart-o"></i>
            </button>
            <div class="meal-card-overlay">
                <div class="meal-card-info">
                    <h3 class="meal-card-title">${meal.strMeal}</h3>
                    <span class="meal-card-cta">View Recipe</span>
                </div>
            </div>
        `;

        // Add click handler for the card (but not the bookmark button)
        mealCard.addEventListener('click', (e) => {
            if (!e.target.closest('.bookmark-btn')) {
                fetchAndShowRecipeDetails(meal.idMeal);
            }
        });

        // Add bookmark button handler
        const bookmarkBtn = mealCard.querySelector('.bookmark-btn');
        bookmarkBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // Disable button during operation
            bookmarkBtn.disabled = true;
            const originalHTML = bookmarkBtn.innerHTML;
            bookmarkBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
            
            try {
                if (bookmarkManager.isBookmarked(meal.idMeal)) {
                    await bookmarkManager.removeBookmark(meal.idMeal);
                } else {
                    await bookmarkManager.addBookmark(meal.idMeal, meal);
                }
            } catch (error) {
                console.error('Bookmark operation failed:', error);
            } finally {
                // Re-enable button and restore original state
                bookmarkBtn.disabled = false;
                bookmarkBtn.innerHTML = originalHTML;
                // Update button state
                setTimeout(() => bookmarkManager.updateBookmarkButtons(), 100);
            }
        });

        return mealCard;
    };

    const displayRecipesInSlider = (meals, container) => {
        // Clear skeleton and prepare for content
        container.innerHTML = '';
        container.classList.remove('loaded');
        
        meals.forEach(meal => {
            container.appendChild(createMealCard(meal));
        });
        
        // Show the container smoothly after content is loaded
        setTimeout(() => {
            container.classList.add('loaded');
        }, 100);
    };

    const displayInfiniteSlider = (meals, container) => {
        // Clear skeleton and prepare for content
        container.innerHTML = '';
        container.classList.remove('loaded');
        
        const fragment = document.createDocumentFragment();
        meals.forEach(meal => {
            fragment.appendChild(createMealCard(meal));
        });
        
        // Add the content and duplicate it for infinite scroll
        container.appendChild(fragment.cloneNode(true));
        container.prepend(fragment);
        
        // Show the container smoothly after content is loaded
        setTimeout(() => {
            container.classList.add('loaded');
        }, 100);
    };

    const displayTrendingSlider = (meals, container) => {
        // Clear skeleton and prepare for content
        container.innerHTML = '';
        container.classList.remove('loaded');
        
        const fragment = document.createDocumentFragment();
        meals.forEach(meal => {
            fragment.appendChild(createMealCard(meal, true)); // true for trending badge
        });
        
        // Add the content and duplicate it for infinite scroll
        container.appendChild(fragment.cloneNode(true));
        container.prepend(fragment);
        
        // Show the container smoothly after content is loaded
        setTimeout(() => {
            container.classList.add('loaded');
        }, 100);
    };

    const fetchAndShowRecipeDetails = async (mealId) => {
        toggleLoader(true);
        try {
            const response = await fetch(`${API_BASE_URL}lookup.php?i=${mealId}`);
            const data = await response.json();
            if (data.meals && data.meals[0]) {
                displayRecipeModal(data.meals[0]);
            }
        } catch (error) {
            console.error('Error fetching recipe details:', error);
        } finally {
            toggleLoader(false);
        }
    };

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
        const ingredientsHtml = ingredients.map(ing => `<li><span class="ingredient-name">${ing.name}</span><span class="ingredient-amount">${ing.amount || 'As needed'}</span></li>`).join('');
        
        // Calculate recipe details
        const cookingTime = estimateCookingTime(meal.strInstructions, ingredients);
        const difficulty = estimateDifficulty(meal.strInstructions, ingredients);
        const calories = estimateCalories(ingredients, meal.strCategory);
        const cuisineFlag = getCuisineFlag(meal.strArea);
        
        const isBookmarked = bookmarkManager.isBookmarked(meal.idMeal);
        
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
                    <button class="bookmark-btn modal-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-meal-id="${meal.idMeal}" title="${isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}">
                        <i class="fa fa-heart${isBookmarked ? '' : '-o'}"></i> ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                    ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" class="recipe-video-btn"><i class="fa fa-youtube-play"></i> Watch Video</a>` : ''}
                </div>
            </div>
            <div class="recipe-secondary-content">
                <h2 class="recipe-title">${meal.strMeal}</h2>
                <h3 class="recipe-section-title"><i class="fa fa-list"></i> Ingredients</h3>
                <ul class="recipe-ingredients-list">${ingredientsHtml}</ul>
                <h3 class="recipe-section-title"><i class="fa fa-book"></i> Instructions</h3>
                <p class="recipe-instructions-text">${meal.strInstructions.replace(/\r\n/g, '\n\n')}</p>
            </div>`;

        // Add bookmark button handler for modal
        const modalBookmarkBtn = modalContent.querySelector('.modal-bookmark');
        modalBookmarkBtn.addEventListener('click', async () => {
            const btn = modalBookmarkBtn;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;
            
            try {
                if (bookmarkManager.isBookmarked(meal.idMeal)) {
                    await bookmarkManager.removeBookmark(meal.idMeal);
                    btn.classList.remove('bookmarked');
                    btn.innerHTML = '<i class="fa fa-heart-o"></i> Bookmark';
                    btn.title = 'Add to bookmarks';
                } else {
                    await bookmarkManager.addBookmark(meal.idMeal, meal);
                    btn.classList.add('bookmarked');
                    btn.innerHTML = '<i class="fa fa-heart"></i> Bookmarked';
                    btn.title = 'Remove from bookmarks';
                }
            } catch (error) {
                btn.innerHTML = originalText;
                console.error('Bookmark operation failed:', error);
            } finally {
                btn.disabled = false;
            }
        });
        recipeModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    };

    const closeModal = () => {
        recipeModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    };

    const hideAllDynamicSections = () => {
        pantryResultsContainer.classList.add('hidden');
        manualSearchContainer.classList.add('hidden');
        randomMealContainer.classList.add('hidden');
    };

    const fetchAndPopulateFilterOptions = async (type) => {
        toggleLoader(true);
        try {
            const response = await fetch(`${API_BASE_URL}list.php?${type}=list`);
            const data = await response.json();
            searchValueSelect.innerHTML = `<option value="">Select a value...</option>`;
            let options;
            if (type === 'c') options = data.meals.map(item => item.strCategory);
            if (type === 'a') options = data.meals.map(item => item.strArea);
            if (type === 'i') options = data.meals.map(item => item.strIngredient);
            options.sort().forEach(optionValue => {
                const option = document.createElement('option');
                option.value = optionValue;
                option.textContent = optionValue;
                searchValueSelect.appendChild(option);
            });
            searchValueContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching filter options:', error);
        } finally {
            toggleLoader(false);
        }
    };

    // --- MODIFIED: Manual search now populates its own slider ---
    const handleSearch = async (type, value) => {
        allSliders.forEach(stopSliderAnimation);
        hideAllDynamicSections();
        toggleLoader(true);

        // Show skeleton loader while searching
        showSkeletonLoader(manualSearchSlider, 8);
        manualSearchContainer.classList.remove('hidden');
        manualSearchContainer.scrollIntoView({ behavior: 'smooth' });

        try {
            const response = await fetch(`${API_BASE_URL}filter.php?${type}=${value}`);
            const data = await response.json();

            if (data.meals) {
                // Randomize search results to show variety
                const shuffledMeals = shuffleArray(data.meals);
                displayRecipesInSlider(shuffledMeals, manualSearchSlider);
            } else {
                manualSearchSlider.innerHTML = `<p class="error-message">No recipes found for "${value}".</p>`;
                manualSearchSlider.style.opacity = '1';
            }
        } catch (error) { 
            console.error('Error fetching search results:', error);
            manualSearchSlider.innerHTML = `<p class="error-message">Error loading recipes. Please try again.</p>`;
            manualSearchSlider.style.opacity = '1';
        }
        finally { toggleLoader(false); }
    };

    // --- MODIFIED: Random meal now uses the new featured section ---
    const handleRandomMeal = async () => {
        allSliders.forEach(stopSliderAnimation);
        hideAllDynamicSections();
        toggleLoader(true);

        try {
            const response = await fetch(`${API_BASE_URL}random.php`);
            const data = await response.json();
            if (data.meals && data.meals[0]) {
                randomMealContent.innerHTML = ''; // Clear previous
                randomMealContent.appendChild(createMealCard(data.meals[0]));
                randomMealContainer.classList.remove('hidden');
                randomMealContainer.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) { console.error('Error fetching random meal:', error); }
        finally { toggleLoader(false); }
    };

    // Pantry Search Functions
    const openPantryModal = () => {
        pantryModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        pantryIngredientInput.focus();
    };

    const closePantryModal = () => {
        pantryModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    };

    const addIngredient = () => {
        const ingredient = pantryIngredientInput.value.trim().toLowerCase();
        if (ingredient && !pantryIngredients.includes(ingredient)) {
            pantryIngredients.push(ingredient);
            renderPantryTags();
            pantryIngredientInput.value = '';
            pantryIngredientInput.focus();
        }
    };

    const removeIngredient = (ingredient) => {
        pantryIngredients = pantryIngredients.filter(item => item !== ingredient);
        renderPantryTags();
    };

    const renderPantryTags = () => {
        pantryTagsContainer.innerHTML = '';
        pantryIngredients.forEach(ingredient => {
            const tag = document.createElement('div');
            tag.className = 'ingredient-tag';
            tag.innerHTML = `<span>${ingredient}</span><button type="button">&times;</button>`;
            tag.querySelector('button').addEventListener('click', () => removeIngredient(ingredient));
            pantryTagsContainer.appendChild(tag);
        });
        searchPantryBtn.disabled = pantryIngredients.length === 0;
    };

    const searchByPantryIngredients = async () => {
        if (pantryIngredients.length === 0) return;
        closePantryModal();
        hideAllDynamicSections();
        toggleLoader(true);

        // Show skeleton loader while searching
        showSkeletonLoader(pantryResultsSlider, 8);
        pantryResultsContainer.classList.remove('hidden');
        pantryResultsContainer.scrollIntoView({ behavior: 'smooth' });

        try {
            const recipePromises = pantryIngredients.map(ing => fetch(`${API_BASE_URL}filter.php?i=${ing}`).then(res => res.json()));
            const results = await Promise.all(recipePromises);

            const mealMap = new Map();
            results.forEach(result => {
                if (result.meals) {
                    result.meals.forEach(meal => {
                        const count = (mealMap.get(meal.idMeal)?.count || 0) + 1;
                        mealMap.set(meal.idMeal, { meal, count });
                    });
                }
            });

            const sortedMeals = Array.from(mealMap.values()).sort((a, b) => b.count - a.count).map(item => item.meal);

            if (sortedMeals.length > 0) {
                // For pantry results, we keep the sorting by ingredient match count
                // but add slight randomization within same-count groups
                const groupedByCount = {};
                sortedMeals.forEach(meal => {
                    const count = mealMap.get(meal.idMeal).count;
                    if (!groupedByCount[count]) groupedByCount[count] = [];
                    groupedByCount[count].push(meal);
                });
                
                // Shuffle within each count group, then flatten
                const finalMeals = Object.keys(groupedByCount)
                    .sort((a, b) => b - a) // Sort by count descending
                    .flatMap(count => shuffleArray(groupedByCount[count]));
                
                displayRecipesInSlider(finalMeals, pantryResultsSlider);
            } else {
                pantryResultsSlider.innerHTML = '<p class="error-message">No recipes found with that combination of ingredients.</p>';
                pantryResultsSlider.style.opacity = '1';
            }
        } catch (error) { 
            console.error('Error fetching pantry recipes:', error);
            pantryResultsSlider.innerHTML = '<p class="error-message">Error loading recipes. Please try again.</p>';
            pantryResultsSlider.style.opacity = '1';
        }
        finally { toggleLoader(false); }
    };

    // --- Event Listeners & Initial Load ---
    const initializePage = async () => {
        toggleLoader(true);
        
        const sectionsToLoad = [
            { query: 'Pasta', elementId: 'pasta-slider' },
            { query: 'Seafood', elementId: 'seafood-slider' },
            { query: 'Dessert', elementId: 'dessert-slider' },
            { query: 'Chicken', elementId: 'chicken-slider' },
            { query: 'Vegetarian', elementId: 'vegetarian-slider' }
        ];

        // Show skeleton loaders for all sliders first
        sectionsToLoad.forEach(({ elementId }) => {
            const container = document.getElementById(elementId);
            if (container) showSkeletonLoader(container);
        });
        showSkeletonLoader(sliderContainer);
        
        // Load new sections
        loadSeasonalContent();
        loadTrendingContent();

        const fetchSection = async ({ query, elementId }) => {
            const container = document.getElementById(elementId);
            if (!container) return;
            try {
                const response = await fetch(`${API_BASE_URL}filter.php?c=${query}`);
                const data = await response.json();
                if (data.meals) {
                    // Randomize the order of meals to keep content fresh
                    const shuffledMeals = shuffleArray(data.meals);
                    displayInfiniteSlider(shuffledMeals, container);
                }
            } catch (error) { 
                console.error(`Error fetching ${query}:`, error);
                // Show container even if there's an error to prevent it from staying hidden
                container.classList.add('loaded');
            }
        };

        // Load all sections in parallel
        const sectionPromises = sectionsToLoad.map(fetchSection);
        
        // Load random meals for the main slider
        const randomMealsPromise = (async () => {
            try {
                const randomMealsPromises = Array.from({ length: 25 }, () => fetch(`${API_BASE_URL}random.php`).then(res => res.json()));
                const results = await Promise.all(randomMealsPromises);
                const allMeals = results.map(result => result.meals[0]).filter(Boolean);
                
                // Remove duplicates by meal ID and take first 20
                const uniqueMeals = [];
                const seenIds = new Set();
                for (const meal of allMeals) {
                    if (!seenIds.has(meal.idMeal)) {
                        seenIds.add(meal.idMeal);
                        uniqueMeals.push(meal);
                        if (uniqueMeals.length >= 20) break;
                    }
                }
                
                displayInfiniteSlider(uniqueMeals, sliderContainer);
            } catch (error) {
                console.error('Error fetching random meals:', error);
                sliderContainer.classList.add('loaded');
            }
        })();

        // Wait for all content to load
        await Promise.all([...sectionPromises, randomMealsPromise]);

        // Start animations after a delay to ensure sliders are loaded
        setTimeout(() => {
            allSliders.forEach(slider => {
                if (slider.id !== 'pantry-results-slider' && slider.id !== 'manual-search-slider') {
                    startSliderAnimation(slider);
                }
            });
        }, 600);

        toggleLoader(false);
    };

    searchTypeSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        searchValueContainer.classList.toggle('hidden', !type);
        if (type) {
            fetchAndPopulateFilterOptions(type);
        } else {
            hideAllDynamicSections();
            allSliders.forEach(slider => startSliderAnimation(slider));
        }
    });

    searchValueSelect.addEventListener('change', (e) => {
        const type = searchTypeSelect.value;
        const value = e.target.value;
        if (value) handleSearch(type, value);
    });

    allSliders.forEach(slider => {
        slider.addEventListener('mouseenter', () => stopSliderAnimation(slider));
        slider.addEventListener('mouseleave', () => startSliderAnimation(slider));
    });

    randomMealBtn.addEventListener('click', handleRandomMeal);
    pantrySearchBtn.addEventListener('click', openPantryModal);
    closePantryModalBtn.addEventListener('click', closePantryModal);
    addIngredientBtn.addEventListener('click', addIngredient);
    searchPantryBtn.addEventListener('click', searchByPantryIngredients);
    profileBtn.addEventListener('click', () => window.location.href = 'profile.html');
    pantryIngredientInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addIngredient(); }
    });

    pantryModal.addEventListener('click', (e) => { if (e.target === pantryModal) closePantryModal(); });
    recipeModal.addEventListener('click', (e) => { if (e.target === recipeModal) closeModal(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (recipeModal.classList.contains('show')) closeModal();
            if (pantryModal.classList.contains('show')) closePantryModal();
        }
    });

    initializePage();
    renderPantryTags();
});
