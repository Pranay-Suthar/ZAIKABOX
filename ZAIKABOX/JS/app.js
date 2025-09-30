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


    // --- State ---
    const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';
    let sliderIntervals = new Map();
    let pantryIngredients = [];

    // --- Core Functions ---

    const toggleLoader = (show) => {
        toastLoader.classList.toggle('show', show);
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
    
    const createMealCard = (meal) => {
        const mealCard = document.createElement('div');
        mealCard.className = 'meal-card';
        mealCard.dataset.mealId = meal.idMeal;
        mealCard.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-card-background" loading="lazy">
            <div class="meal-card-overlay">
                <div class="meal-card-info">
                    <h3 class="meal-card-title">${meal.strMeal}</h3>
                    <span class="meal-card-cta">View Recipe</span>
                </div>
            </div>
        `;
        mealCard.addEventListener('click', () => fetchAndShowRecipeDetails(meal.idMeal));
        return mealCard;
    };

    const displayRecipesInSlider = (meals, container) => {
        container.innerHTML = '';
        meals.forEach(meal => {
            container.appendChild(createMealCard(meal));
        });
    };

    const displayInfiniteSlider = (meals, container) => {
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        meals.forEach(meal => {
            fragment.appendChild(createMealCard(meal));
        });
        container.appendChild(fragment.cloneNode(true));
        container.prepend(fragment);
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
        const ingredientsHtml = ingredients.map(ing => `<li><span class="ingredient-name">${ing.name}</span><span class="ingredient-amount">${ing.amount}</span></li>`).join('');
        modalContent.innerHTML = `
            <button class="close-modal-btn" id="close-modal-btn">&times;</button>
            <div class="recipe-primary-content">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-image">
                <div class="recipe-tags">
                    ${meal.strCategory ? `<span>${meal.strCategory}</span>` : ''}
                    ${meal.strArea ? `<span>${meal.strArea}</span>` : ''}
                </div>
                ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" class="recipe-video-btn"><i class="fa fa-youtube-play"></i> Watch Video</a>` : ''}
            </div>
            <div class="recipe-secondary-content">
                <h2 class="recipe-title">${meal.strMeal}</h2>
                <h3 class="recipe-section-title">Ingredients</h3>
                <ul class="recipe-ingredients-list">${ingredientsHtml}</ul>
                <h3 class="recipe-section-title">Instructions</h3>
                <p class="recipe-instructions-text">${meal.strInstructions.replace(/\r\n/g, '\n')}</p>
            </div>`;
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
        
        try {
            const response = await fetch(`${API_BASE_URL}filter.php?${type}=${value}`);
            const data = await response.json();
            
            if (data.meals) {
                displayRecipesInSlider(data.meals, manualSearchSlider);
                manualSearchContainer.classList.remove('hidden');
                manualSearchContainer.scrollIntoView({ behavior: 'smooth' });
            } else {
                manualSearchSlider.innerHTML = `<p class="error-message">No recipes found for "${value}".</p>`;
                manualSearchContainer.classList.remove('hidden');
            }
        } catch (error) { console.error('Error fetching search results:', error); }
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
        } catch(error) { console.error('Error fetching random meal:', error); }
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
                displayRecipesInSlider(sortedMeals, pantryResultsSlider);
                pantryResultsContainer.classList.remove('hidden');
                pantryResultsContainer.scrollIntoView({ behavior: 'smooth' });
            } else {
                pantryResultsSlider.innerHTML = '<p class="error-message">No recipes found with that combination of ingredients.</p>';
                pantryResultsContainer.classList.remove('hidden');
            }
        } catch (error) { console.error('Error fetching pantry recipes:', error); }
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

        const fetchSection = async ({ query, elementId }) => {
            const container = document.getElementById(elementId);
            if (!container) return;
            try {
                const response = await fetch(`${API_BASE_URL}filter.php?c=${query}`);
                const data = await response.json();
                if (data.meals) displayInfiniteSlider(data.meals, container);
            } catch (error) { console.error(`Error fetching ${query}:`, error); }
        };

        await Promise.all(sectionsToLoad.map(fetchSection));
        
        const randomMealsPromises = Array.from({ length: 20 }, () => fetch(`${API_BASE_URL}random.php`).then(res => res.json()));
        const results = await Promise.all(randomMealsPromises);
        const meals = results.map(result => result.meals[0]).filter(Boolean);
        displayInfiniteSlider(meals, sliderContainer);
        
        allSliders.forEach(slider => {
            if(slider.id !== 'pantry-results-slider' && slider.id !== 'manual-search-slider') {
                startSliderAnimation(slider);
            }
        });
        
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
