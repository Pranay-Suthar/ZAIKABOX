document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element References ---
    const preloader = document.getElementById('preloader');
    const singleRandomBtn = document.getElementById('single-random-meal');
    const mealGrid = document.querySelector('.meal-grid');
    const toastLoader = document.getElementById('toast-loader');
    const searchTypeSelect = document.getElementById('search-type');
    const searchValueContainer = document.getElementById('filter-value-container');
    const searchValueSelect = document.getElementById('search-value');
    const searchContainer = document.querySelector('.search-container');

    // --- State Management ---
    let filterOptions = { c: [], a: [], i: [] };
    let allMeals = [];
    let mealsDisplayed = 0;
    const MEALS_PER_PAGE = 12;

    // --- Preloader Logic ---
    if (preloader) {
        // Add 'loaded' class after a short delay to allow content to render
        setTimeout(() => {
            preloader.classList.add('loaded');
        }, 500); // 500ms delay
    }


    // --- Helper Functions ---
    const showLoader = () => { if (toastLoader) toastLoader.style.display = 'flex'; };
    const hideLoader = () => { if (toastLoader) toastLoader.style.display = 'none'; };
    
    const getIngredients = (meal) => {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            if (ingredient) {
                ingredients.push({ name: ingredient, amount: meal[`strMeasure${i}`] });
            } else { break; }
        }
        return ingredients;
    };
    
    // --- Shrinkable Search Bar Logic ---
    if (searchContainer) {
        searchContainer.classList.add('shrunk');
        searchContainer.addEventListener('mouseenter', () => searchContainer.classList.remove('shrunk'));
        searchContainer.addEventListener('mouseleave', () => searchContainer.classList.add('shrunk'));
    }


    // --- Core Display Functions ---
    const displayMealInModal = (meal) => {
        const ingredients = getIngredients(meal);
        const instructionSteps = meal.strInstructions
            .split(/\r?\n/)
            .filter(step => step.trim().length > 0)
            .map(step => `<li class="recipe-instruction-step">${step}</li>`)
            .join('');

        const modal = document.createElement('div');
        modal.className = 'recipe-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal-btn">&times;</button>
                <div class="recipe-primary-content">
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-image">
                    <div class="recipe-tags">
                        ${meal.strCategory ? `<span>${meal.strCategory}</span>` : ''}
                        ${meal.strArea ? `<span>${meal.strArea}</span>` : ''}
                        ${meal.strTags ? meal.strTags.split(',').map(tag => `<span>#${tag.trim()}</span>`).join('') : ''}
                    </div>
                    ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" class="recipe-video-btn">Watch Video <i class="fa-brands fa-youtube"></i></a>` : ''}
                </div>
                <div class="recipe-secondary-content">
                    <h2 class="recipe-title">${meal.strMeal}</h2>
                    <div class="recipe-section">
                        <h3 class="recipe-section-title">Ingredients</h3>
                        <ul class="recipe-ingredients-list">
                            ${ingredients.map(ing => `<li><span class="ingredient-name">${ing.name}</span><span class="ingredient-amount">${ing.amount}</span></li>`).join('')}
                        </ul>
                    </div>
                    <div class="recipe-section">
                        <h3 class="recipe-section-title">Instructions</h3>
                        <ol class="recipe-instructions">${instructionSteps}</ol>
                    </div>
                </div>
            </div>
        `;

        const closeModal = () => document.body.removeChild(modal);
        modal.querySelector('.close-modal-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.body.appendChild(modal);
    };

    async function fetchMealDetailsById(mealId) {
        showLoader();
        try {
            const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
            const data = await res.json();
            if (data.meals && data.meals[0]) {
                displayMealInModal(data.meals[0]);
            } else {
                alert('Could not fetch recipe details.');
            }
        } catch (error) {
            console.error('Error fetching meal details:', error);
            alert('An error occurred while fetching the recipe.');
        } finally {
            hideLoader();
        }
    }

    async function getSingleRandomMeal() {
        showLoader();
        try {
            const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
            const data = await res.json();
            if (data.meals && data.meals[0]) {
                displayMealInModal(data.meals[0]);
            } else {
                alert('Could not find a random recipe. Please try again!');
            }
        } catch (error) {
            console.error('Error fetching random meal:', error);
            alert('Error fetching recipe. Please check your connection.');
        } finally {
            hideLoader();
        }
    }
    
    // --- Dynamic Filter & Search Logic ---
    async function fetchAllFilterOptions() {
        try {
            const [catRes, areaRes, ingRes] = await Promise.all([
                fetch('https://www.themealdb.com/api/json/v1/1/list.php?c=list'),
                fetch('https://www.themealdb.com/api/json/v1/1/list.php?a=list'),
                fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=list')
            ]);
            const catData = await catRes.json();
            const areaData = await areaRes.json();
            const ingData = await ingRes.json();
            filterOptions.c = catData.meals.map(m => m.strCategory);
            filterOptions.a = areaData.meals.map(m => m.strArea);
            filterOptions.i = ingData.meals.map(m => m.strIngredient).slice(0, 100);
        } catch (error) {
            console.error("Failed to fetch filter options:", error);
        }
    }

    function populateValueSelect(type) {
        const options = filterOptions[type];
        if (!options || options.length === 0) {
            searchValueContainer.classList.add('hidden');
            return;
        }
        searchValueSelect.innerHTML = `<option value="">-- Select an Option --</option>`;
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            searchValueSelect.appendChild(optionElement);
        });
        searchValueContainer.classList.remove('hidden');
    }

    async function searchMealsByFilter(type, value) {
        if (!mealGrid || !type || !value) return;
        mealGrid.innerHTML = '';
        showLoader();
        
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?${type}=${encodeURIComponent(value)}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.meals && data.meals.length) {
                allMeals = data.meals;
                mealsDisplayed = 0;
                loadMoreMeals();
            } else {
                mealGrid.innerHTML = `<div class="error-message">No recipes found for "${value}".</div>`;
            }
        } catch (error) {
            console.error('Error searching meals:', error);
            mealGrid.innerHTML = '<div class="error-message">Error fetching recipes.</div>';
        } finally {
            hideLoader();
        }
    }

    function loadMoreMeals() {
        const existingBtn = document.getElementById('load-more-btn');
        if (existingBtn) existingBtn.parentElement.removeChild(existingBtn);

        const nextBatch = allMeals.slice(mealsDisplayed, mealsDisplayed + MEALS_PER_PAGE);

        nextBatch.forEach(meal => {
            const card = document.createElement('div');
            card.className = 'meal-card';
            card.addEventListener('click', () => fetchMealDetailsById(meal.idMeal));
            card.innerHTML = `
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-card-background">
                <div class="meal-card-overlay">
                    <div class="meal-card-info">
                         <h3 class="meal-card-title">${meal.strMeal}</h3>
                         <span class="meal-card-cta">View Recipe</span>
                    </div>
                </div>
            `;
            mealGrid.appendChild(card);
        });

        mealsDisplayed += nextBatch.length;

        if (mealsDisplayed < allMeals.length) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.id = 'load-more-btn';
            loadMoreBtn.textContent = 'Load More Recipes';
            loadMoreBtn.addEventListener('click', loadMoreMeals);
            mealGrid.parentElement.appendChild(loadMoreBtn);
        }
    }

    // --- Event Listeners ---
    if (singleRandomBtn) singleRandomBtn.addEventListener('click', getSingleRandomMeal);
    
    searchTypeSelect.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        allMeals = [];
        mealGrid.innerHTML = '';
        const existingBtn = document.getElementById('load-more-btn');
        if (existingBtn) existingBtn.parentElement.removeChild(existingBtn);
        
        if (selectedType) {
            populateValueSelect(selectedType);
        } else {
            searchValueContainer.classList.add('hidden');
        }
    });

    searchValueSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        const selectedType = searchTypeSelect.value;
        if (selectedValue) {
            searchMealsByFilter(selectedType, selectedValue);
        }
    });

    // --- Initial Load ---
    fetchAllFilterOptions();
});

