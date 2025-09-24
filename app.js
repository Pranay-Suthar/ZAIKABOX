        document.addEventListener('DOMContentLoaded', () => {
            // --- DOM Elements ---
            const sliderContainer = document.querySelector('.meal-slider-container');
            const mealGrid = document.querySelector('.meal-grid');
            const randomMealContainer = document.querySelector('.random-meal-container');
            const toastLoader = document.getElementById('toast-loader');
            const recipeModal = document.getElementById('recipe-modal');
            const modalContent = document.getElementById('modal-content');
            const searchTypeSelect = document.getElementById('search-type');
            const searchValueSelect = document.getElementById('search-value');
            const searchValueContainer = document.getElementById('filter-value-container');
            const randomMealBtn = document.getElementById('single-random-meal');

            // --- State ---
            const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';
            let slideInterval = null;

            // --- Functions ---

            /**
             * Shows or hides the loading indicator.
             * @param {boolean} show - True to show, false to hide.
             */
            const toggleLoader = (show) => {
                toastLoader.classList.toggle('show', show);
            };

            /**
             * Starts the automatic circular scrolling for the slider.
             */
            const startSliderAnimation = () => {
                stopSliderAnimation(); // Ensure no multiple intervals are running
                slideInterval = setInterval(() => {
                    // Check if we've scrolled past the first set of items
                    if (sliderContainer.scrollLeft >= sliderContainer.scrollWidth / 2) {
                        sliderContainer.scrollLeft = 0; // Silently jump to the beginning
                    } else {
                        sliderContainer.scrollLeft += 1; // Scroll smoothly
                    }
                }, 30); // Adjust for scroll speed
            };

            /**
             * Stops the automatic slider scrolling.
             */
            const stopSliderAnimation = () => {
                clearInterval(slideInterval);
            };
            
            /**
             * Creates a meal card element.
             * @param {object} meal - The meal object from the API.
             * @returns {HTMLElement} The created meal card element.
             */
            const createMealCard = (meal) => {
                const mealCard = document.createElement('div');
                mealCard.className = 'meal-card';
                mealCard.dataset.mealId = meal.idMeal;
                mealCard.innerHTML = `
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-card-background">
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

            /**
             * Displays recipes in the slider container, duplicating for infinite scroll.
             * @param {Array} meals - An array of meal objects.
             */
            const displayRecipesInSlider = (meals) => {
                sliderContainer.innerHTML = '';
                const fragment = document.createDocumentFragment();
                meals.forEach(meal => {
                    fragment.appendChild(createMealCard(meal));
                });
                // Append original and cloned set for seamless loop
                sliderContainer.appendChild(fragment);
                sliderContainer.appendChild(fragment.cloneNode(true));
            };
            
            /**
             * Displays recipes in the grid container for search results.
             * @param {Array} meals - An array of meal objects.
             */
            const displayRecipesInGrid = (meals) => {
                mealGrid.innerHTML = '';
                 if (!meals) {
                    mealGrid.innerHTML = '<p class="error-message">No recipes found for your selection.</p>';
                    return;
                }
                meals.forEach(meal => {
                    mealGrid.appendChild(createMealCard(meal));
                });
            };

            /**
             * Fetches an initial list of recipes to populate the slider.
             */
            const fetchInitialRecipes = async () => {
                toggleLoader(true);
                try {
                    const response = await fetch(`${API_BASE_URL}search.php?f=a`);
                    const data = await response.json();
                    if (data.meals) {
                        displayRecipesInSlider(data.meals);
                        startSliderAnimation();
                    } else {
                        sliderContainer.innerHTML = '<p class="error-message">Could not find any recipes.</p>';
                    }
                } catch (error) {
                    console.error('Error fetching initial recipes:', error);
                    sliderContainer.innerHTML = '<p class="error-message">Failed to load recipes.</p>';
                } finally {
                    toggleLoader(false);
                }
            };
            
            /**
             * Fetches detailed information for a specific meal and displays the modal.
             * @param {string} mealId - The ID of the meal to look up.
             */
            const fetchAndShowRecipeDetails = async (mealId) => {
                toggleLoader(true);
                try {
                    const response = await fetch(`${API_BASE_URL}lookup.php?i=${mealId}`);
                    const data = await response.json();
                    if (data.meals && data.meals[0]) {
                        displayRecipeModal(data.meals[0]);
                    } else {
                        alert('Could not retrieve recipe details.');
                    }
                } catch (error) {
                    console.error('Error fetching recipe details:', error);
                    alert('Failed to load recipe details.');
                } finally {
                    toggleLoader(false);
                }
            };

            /**
             * Populates and shows the recipe detail modal.
             * @param {object} meal - The detailed meal object from the API.
             */
            const displayRecipeModal = (meal) => {
                const ingredients = [];
                for (let i = 1; i <= 20; i++) {
                    const ingredient = meal[`strIngredient${i}`];
                    const measure = meal[`strMeasure${i}`];
                    if (ingredient && ingredient.trim() !== '') {
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
                        ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" class="recipe-video-btn"><i class="fab fa-youtube"></i> Watch Video</a>` : ''}
                    </div>
                    <div class="recipe-secondary-content">
                        <h2 class="recipe-title">${meal.strMeal}</h2>
                        <h3 class="recipe-section-title">Ingredients</h3>
                        <ul class="recipe-ingredients-list">${ingredientsHtml}</ul>
                        <h3 class="recipe-section-title">Instructions</h3>
                        <p class="recipe-instructions-text">${meal.strInstructions}</p>
                    </div>`;
                recipeModal.classList.add('show');
                document.body.style.overflow = 'hidden';
                document.getElementById('close-modal-btn').addEventListener('click', closeModal);
            };
            
            const closeModal = () => {
                recipeModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            };

            const fetchAndPopulateFilterOptions = async (type) => {
                toggleLoader(true);
                try {
                    const response = await fetch(`${API_BASE_URL}list.php?${type}=list`);
                    const data = await response.json();
                    searchValueSelect.innerHTML = `<option value="">Select a value...</option>`; // Reset
                    
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
            
            const handleSearch = async (type, value) => {
                stopSliderAnimation();
                sliderContainer.classList.add('hidden');
                randomMealContainer.classList.add('hidden');
                mealGrid.classList.remove('hidden');
                toggleLoader(true);
                try {
                    const response = await fetch(`${API_BASE_URL}filter.php?${type}=${value}`);
                    const data = await response.json();
                    displayRecipesInGrid(data.meals);
                } catch (error) {
                    console.error('Error fetching search results:', error);
                    mealGrid.innerHTML = '<p class="error-message">Failed to load search results.</p>';
                } finally {
                    toggleLoader(false);
                }
            };

            const handleRandomMeal = async () => {
                stopSliderAnimation();
                sliderContainer.classList.add('hidden');
                mealGrid.classList.add('hidden');
                randomMealContainer.classList.remove('hidden');
                randomMealContainer.innerHTML = ''; // Clear previous
                toggleLoader(true);
                try {
                    const response = await fetch(`${API_BASE_URL}random.php`);
                    const data = await response.json();
                    if (data.meals && data.meals[0]) {
                        randomMealContainer.appendChild(createMealCard(data.meals[0]));
                    }
                } catch(error) {
                    console.error('Error fetching random meal:', error);
                    randomMealContainer.innerHTML = '<p class="error-message">Failed to load a random meal.</p>';
                } finally {
                    toggleLoader(false);
                }
            };
            
            // --- Event Listeners ---
            searchTypeSelect.addEventListener('change', (e) => {
                const type = e.target.value;
                if (type) {
                    fetchAndPopulateFilterOptions(type);
                } else {
                    // Reset to slider view
                    mealGrid.classList.add('hidden');
                    randomMealContainer.classList.add('hidden');
                    sliderContainer.classList.remove('hidden');
                    startSliderAnimation();
                    searchValueContainer.classList.add('hidden');
                }
            });

            searchValueSelect.addEventListener('change', (e) => {
                const type = searchTypeSelect.value;
                const value = e.target.value;
                if (value) {
                    handleSearch(type, value);
                }
            });

            sliderContainer.addEventListener('mouseenter', stopSliderAnimation);
            sliderContainer.addEventListener('mouseleave', startSliderAnimation);

            randomMealBtn.addEventListener('click', handleRandomMeal);
            recipeModal.addEventListener('click', (e) => e.target === recipeModal && closeModal());
            document.addEventListener('keydown', (e) => e.key === 'Escape' && recipeModal.classList.contains('show') && closeModal());

            // --- Initial Load ---
            fetchInitialRecipes();
        });

        