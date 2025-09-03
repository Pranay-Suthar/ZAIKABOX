// Wrap all your code in a DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {

    const randomMealBtn = document.querySelector('#random-meal');
    const searchBtn = document.querySelector('#search-btn');
    const mealContainer = document.querySelector('.meal-container');
    const areaSelect = document.querySelector('#area-select');
    const categorySelect = document.querySelector('#category-select');
    const vegNonvegSelect = document.querySelector('#veg-nonveg-select');
    let lastSearchQuery = ''; // Store the last search query
    let currentSearchResults = []; // Store current search results for back navigation

    // --- Veg/Non-veg Category Mapping ---
    const vegetarianCategories = [
        'Vegetarian', 'Vegan', 'Side', 'Dessert', 'Breakfast'
    ];
    
    const nonVegetarianCategories = [
        'Beef', 'Chicken', 'Pork', 'Seafood', 'Goat', 'Lamb'
    ];

    // --- Initial Fetch Functions to Populate Filters ---
    async function fetchAreas() {
        try {
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?a=list');
            const data = await response.json();
            populateDropdown(areaSelect, data.meals, 'strArea', 'Country');
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
    }

    async function fetchCategories() {
        try {
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?c=list');
            const data = await response.json();
            populateDropdown(categorySelect, data.meals, 'strCategory', 'Category');
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }
    
    function populateDropdown(selectElement, items, key, defaultLabel) {
        selectElement.innerHTML = `<option value="">-- Select ${defaultLabel} --</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[key];
            option.textContent = item[key];
            selectElement.appendChild(option);
        });
    }

    // --- Helper function to check if a meal is vegetarian ---
    function isVegetarian(meal) {
        const nonVegKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'prawns', 'bacon', 'ham', 'turkey', 'duck', 'meat'];
        const mealName = meal.strMeal.toLowerCase();
        const category = meal.strCategory ? meal.strCategory.toLowerCase() : '';
        
        return !nonVegKeywords.some(keyword => 
            mealName.includes(keyword) || category.includes(keyword)
        );
    }

    // --- Search & Display Logic ---
    async function searchMeals(query) {
        // Show loading state
        mealContainer.innerHTML = '<div class="loading"></div>';
        
        try {
            const response = await fetch(query);
            const data = await response.json();
            
            if (data.meals) {
                lastSearchQuery = query;
                let meals = data.meals;
                
                // Apply vegetarian/non-vegetarian filter if needed
                const vegNonveg = vegNonvegSelect.value;
                if (vegNonveg === 'veg') {
                    meals = meals.filter(meal => isVegetarian(meal));
                } else if (vegNonveg === 'non-veg') {
                    meals = meals.filter(meal => !isVegetarian(meal));
                }
                
                // Limit to 16 meals for 4x4 grid
                meals = meals.slice(0, 16);
                currentSearchResults = meals;
                
                displaySearchResults(meals);
            } else {
                mealContainer.innerHTML = `
                    <div class="no-results">
                        <h2>No recipes found</h2>
                        <p>Try adjusting your search filters</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error searching meals:', error);
            mealContainer.innerHTML = `
                <div class="error-message">
                    <h2>Oops! Something went wrong</h2>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }

    // --- Function to display search results in 4x4 grid ---
    function displaySearchResults(meals) {
        if (!meals || meals.length === 0) {
            mealContainer.innerHTML = `
                <div class="no-results">
                    <h2>No recipes found</h2>
                    <p>Try adjusting your search filters</p>
                </div>
            `;
            return;
        }

        // Create grid container with search results
        mealContainer.innerHTML = `
            <div class="search-results">
                ${meals.map(meal => createMealCard(meal)).join('')}
            </div>
            <div class="btn-container" style="margin-top: 30px;">
                <button id="suggest-more-btn" class="suggest-more-btn">Suggest More</button>
            </div>
        `;

        // Add click event listeners to meal cards
        const mealCards = mealContainer.querySelectorAll('.meal-card');
        mealCards.forEach((card, index) => {
            card.addEventListener('click', () => fetchMealDetails(meals[index].idMeal));
        });

        // Add event listener to suggest more button
        const suggestMoreBtn = document.getElementById('suggest-more-btn');
        if (suggestMoreBtn) {
            suggestMoreBtn.addEventListener('click', () => {
                if (lastSearchQuery) {
                    searchMeals(lastSearchQuery);
                }
            });
        }
    }

    // --- Function to create individual meal card ---
    function createMealCard(meal) {
        return `
            <div class="meal-card">
                <div class="meal-card-image">
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
                    ${meal.strCategory ? `<div class="meal-card-category">${meal.strCategory}</div>` : ''}
                </div>
                <div class="meal-card-content">
                    <h3>${meal.strMeal}</h3>
                </div>
            </div>
        `;
    }

    // --- Function to handle multiple random meals for better grid display ---
    async function getMultipleRandomMeals(count = 16) {
        const promises = [];
        for (let i = 0; i < count; i++) {
            promises.push(fetch('https://www.themealdb.com/api/json/v1/1/random.php'));
        }
        
        try {
            const responses = await Promise.all(promises);
            const dataPromises = responses.map(res => res.json());
            const results = await Promise.all(dataPromises);
            const meals = results.map(result => result.meals[0]).filter(meal => meal);
            
            currentSearchResults = meals;
            displaySearchResults(meals);
        } catch (error) {
            console.error('Error fetching random meals:', error);
            // Fallback to single random meal
            searchMeals('https://www.themealdb.com/api/json/v1/1/random.php');
        }
    }

    async function fetchMealDetails(id) {
        mealContainer.innerHTML = '<div class="loading"></div>';
        
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
            const data = await response.json();
            if (data.meals) {
                createMeal(data.meals[0]);
            }
        } catch (error) {
            console.error('Error fetching meal details:', error);
            mealContainer.innerHTML = `
                <div class="error-message">
                    <h2>Error loading recipe</h2>
                    <p>Please try again</p>
                </div>
            `;
        }
    }

    // --- Function to show search results (back navigation) ---
    function showSearchResults() {
        if (currentSearchResults.length > 0) {
            displaySearchResults(currentSearchResults);
        } else {
            getMultipleRandomMeals();
        }
    }

    const getIngredients = (meal, num = 1) => {
        return meal[`strIngredient${num}`]
            ? [{
                'name': meal[`strIngredient${num}`],
                'amount': meal[`strMeasure${num}`]
            }].concat(getIngredients(meal, num + 1)) : '';
    };

    const createMeal = (meal) => {
        const ingredients = getIngredients(meal).slice(0, -1);

        // Split instructions into steps for better formatting
        const instructionSteps = meal.strInstructions
            .split(/\d+\.|\n/)
            .filter(step => step.trim())
            .map(step => step.trim());

        mealContainer.innerHTML = `
            <h2 id="meal-title">${meal.strMeal}</h2>
            <div class="meal-content">
                <div class="primary">
                    <div class="thumbnail-container">
                        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                    </div>
                    
                    <div class="ingredients">
                        <h3 id="ingredient-title">Ingredients</h3>
                        <ol>
                            ${ingredients.map(ingredient => `
                                <li>
                                    <p>
                                        <span>${ingredient.name}</span>
                                        <span class="amount">${ingredient.amount}</span>
                                    </p>
                                </li>
                            `).join('')}
                        </ol>
                    </div>

                    <div class="tags">
                        ${meal.strCategory ? `<div>${meal.strCategory}</div>` : ''}
                        ${meal.strArea ? `<div>${meal.strArea}</div>` : ''}
                        ${meal.strTags ? meal.strTags.split(',').map(tag => `<div>${tag.trim()}</div>`).join('') : ''}
                    </div>

                    ${meal.strYoutube ? `<button id="watch-video" onclick="displayVideo('${meal.strYoutube.split('v=')[1]}')">Watch Video 📺</button>` : ''}
                    
                    <button onclick="showSearchResults()" class="back-btn">← Back to Search Results</button>
                </div>
                
                <div class="secondary">
                    <h3 id="instruction-title">Instructions</h3>
                    <div class="instructions">
                        <ul>
                            ${instructionSteps.map(step => `<li class="steps">${step}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        document.body.classList.remove('flex-column');
    };

    window.displayVideo = (videoId) => {
        const [videoContainer, iframe, btn] = ['section', 'iframe', 'button'].map(elem => document.createElement(elem));

        videoContainer.classList.add('video-container', 'flex-row');
        videoContainer.addEventListener('click', () => videoContainer.remove());

        iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}`);
        iframe.setAttribute('allowfullscreen', '');

        btn.setAttribute('id', 'remove-video');
        btn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        btn.addEventListener('click', () => videoContainer.remove());

        [iframe, btn].forEach(elem => videoContainer.appendChild(elem));

        document.body.appendChild(videoContainer);
    };

    // --- Function to show welcome message ---
    function showWelcomeMessage() {
        mealContainer.innerHTML = `
            <div class="welcome-message">
                <h2>Welcome to Recipe Finder!</h2>
                <p>Use the "Get Random Recipe ✨" button to discover a delicious recipe, or use the search filters to find specific cuisines and categories.</p>
                <div class="welcome-actions">
                    <button onclick="document.getElementById('random-meal').click()" class="welcome-btn">🎲 Get Random Recipe</button>
                    <button onclick="getMultipleRandomMeals()" class="welcome-btn">🔍 Browse Recipes</button>
                </div>
            </div>
        `;
    }

    // Make functions globally available
    window.showSearchResults = showSearchResults;
    window.showWelcomeMessage = showWelcomeMessage;

    // --- Event Listeners ---
    if (randomMealBtn) {
        randomMealBtn.addEventListener('click', () => {
            getMultipleRandomMeals();
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const area = areaSelect.value;
            const category = categorySelect.value;
            const vegNonveg = vegNonvegSelect.value;
            let query = '';

            if (area) {
                query = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`;
            } else if (category) {
                query = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`;
            } else if (vegNonveg === 'veg') {
                // Fetch from multiple vegetarian categories and combine
                const vegCategory = vegetarianCategories[Math.floor(Math.random() * vegetarianCategories.length)];
                query = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${vegCategory}`;
            } else if (vegNonveg === 'non-veg') {
                // Fetch from multiple non-vegetarian categories and combine
                const nonVegCategory = nonVegetarianCategories[Math.floor(Math.random() * nonVegetarianCategories.length)];
                query = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${nonVegCategory}`;
            } else {
                // Default to multiple random meals for better grid display
                getMultipleRandomMeals();
                return;
            }

            searchMeals(query);
        });
    }

    // --- Toast Notification System ---
    function showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container') || createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    // --- Navbar Functionality ---
    function initializeNavbar() {
        const logoutBtn = document.getElementById('logout-btn');
        const socialLinks = document.querySelectorAll('.social-links a');
        
        // Show logout button (you can conditionally show this based on user authentication)
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Add click tracking for social links (optional)
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const platform = e.target.closest('a').title;
                console.log(`Navigating to ${platform}`);
                // You can add analytics tracking here if needed
            });
        });
        
        // Add tooltip effects for social links
        socialLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const title = link.getAttribute('title');
                if (title) {
                    showTooltip(link, title);
                }
            });
            
            link.addEventListener('mouseleave', () => {
                hideTooltip();
            });
        });
    }
    
    function handleLogout() {
        // Show confirmation dialog
        if (confirm('Are you sure you want to logout?')) {
            showToast('Logging out...', 'info');
            
            // Simulate logout process
            setTimeout(() => {
                // Clear any stored user data
                localStorage.removeItem('user');
                sessionStorage.clear();
                
                // Reset the application state
                resetApplicationState();
                
                // Show success message
                showToast('Successfully logged out!', 'success');
                
                // Optional: Redirect to login page or refresh
                // window.location.href = 'login.html';
                // window.location.reload();
            }, 1000);
        }
    }
    
    function resetApplicationState() {
        // Clear search results
        currentSearchResults = [];
        lastSearchQuery = '';
        
        // Reset dropdown selections
        if (areaSelect) areaSelect.value = '';
        if (categorySelect) categorySelect.value = '';
        if (vegNonvegSelect) vegNonvegSelect.value = 'all';
        
        // Clear meal container
        mealContainer.innerHTML = `
            <div class="welcome-message">
                <h2>Welcome to Recipe Finder!</h2>
                <p>Use the "Get Random Recipe" button or search filters to discover delicious recipes.</p>
            </div>
        `;
        
        // Update user greeting
        const userInfo = document.querySelector('.user-info h1');
        if (userInfo) {
            userInfo.textContent = 'Hello, Guest!';
        }
    }
    
    // Simple tooltip system for social links
    function showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.8rem;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = (rect.left + rect.width/2 - tooltip.offsetWidth/2) + 'px';
        tooltip.style.top = (rect.bottom + 5) + 'px';
    }
    
    function hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    // --- Initialize navbar when DOM loads ---
    initializeNavbar();

    // Run initial data fetching
    fetchAreas();
    fetchCategories();
});