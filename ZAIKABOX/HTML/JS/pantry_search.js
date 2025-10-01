document.addEventListener('DOMContentLoaded', () => {

    // --- Get all necessary elements from the DOM ---
    const pantrySearchBtn = document.getElementById('pantry-search-btn');
    const pantryModal = document.getElementById('pantry-modal');
    const closeModalBtn = document.getElementById('close-pantry-modal-btn');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const ingredientInput = document.getElementById('ingredient-input');
    const ingredientListContainer = document.getElementById('ingredient-list-container');
    const findRecipesBtn = document.getElementById('find-recipes-btn');

    // These elements are likely in your main script, but we need to access them here
    const mealGrid = document.querySelector('.meal-grid'); 
    const toastLoader = document.getElementById('toast-loader');

    // --- Event Listeners ---
    pantrySearchBtn.addEventListener('click', openPantryModal);
    closeModalBtn.addEventListener('click', closePantryModal);
    addIngredientBtn.addEventListener('click', addIngredient);
    
    ingredientInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            addIngredient();
        }
    });

    findRecipesBtn.addEventListener('click', findRecipesByIngredients);
    
    // --- UI Functions ---
    
    function openPantryModal() {
        pantryModal.classList.add('show');
    }

    function closePantryModal() {
        pantryModal.classList.remove('show');
    }

    function showLoader(message = "Finding recipes...") {
        toastLoader.querySelector('span').textContent = message;
        toastLoader.classList.add('show');
    }

    function hideLoader() {
        toastLoader.classList.remove('show');
    }

    function addIngredient() {
        const ingredientText = ingredientInput.value.trim().toLowerCase();
        if (ingredientText === '') return;

        const tag = document.createElement('div');
        tag.classList.add('ingredient-tag');
        tag.textContent = ingredientText;

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-ingredient-btn');
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => tag.remove();

        tag.appendChild(removeBtn);
        ingredientListContainer.appendChild(tag);

        ingredientInput.value = '';
        ingredientInput.focus();
    }

    // --- API and Logic ---

    async function findRecipesByIngredients() {
        const ingredients = Array.from(ingredientListContainer.querySelectorAll('.ingredient-tag'))
                                 .map(tag => tag.firstChild.textContent.trim());

        if (ingredients.length === 0) {
            alert('Please add at least one ingredient.');
            return;
        }

        closePantryModal();
        showLoader("Checking your ingredients...");

        const primaryIngredient = ingredients[0];
        const secondaryIngredients = ingredients.slice(1);

        try {
            // 1. Primary Search: Get all meals for the first ingredient
            const initialResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${primaryIngredient}`);
            const initialData = await initialResponse.json();

            if (!initialData.meals) {
                mealGrid.innerHTML = `<p class="error-message">Sorry, we couldn't find any recipes with '${primaryIngredient}'. Try another ingredient!</p>`;
                hideLoader();
                return;
            }

            showLoader(`Found ${initialData.meals.length} recipes... now filtering.`);

            // 2. Filter & Match: Check each meal for the other ingredients
            const matchingRecipes = [];
            for (const partialMeal of initialData.meals) {
                const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${partialMeal.idMeal}`);
                const detailData = await detailResponse.json();
                const fullMeal = detailData.meals[0];

                // Create a single string of all ingredients for easy searching
                let allMealIngredients = '';
                for (let i = 1; i <= 20; i++) {
                    const ingredient = fullMeal[`strIngredient${i}`];
                    if (ingredient) {
                        allMealIngredients += ingredient.toLowerCase() + ' ';
                    }
                }
                
                // Check if ALL secondary ingredients are in the meal's ingredient list
                const hasAllIngredients = secondaryIngredients.every(ing => allMealIngredients.includes(ing));

                if (hasAllIngredients) {
                    matchingRecipes.push(fullMeal);
                }
            }

            // 3. Display Results
            // Note: This relies on a 'displayMeals' function from your main script.
            if (matchingRecipes.length > 0) {
                // Assuming 'displayMeals' is a function in your global scope or another script
                window.displayMeals(matchingRecipes, `Meals you can make with ${ingredients.join(', ')}`);
            } else {
                mealGrid.innerHTML = `<p class="error-message">We found recipes with '${primaryIngredient}', but none of them also had '${secondaryIngredients.join(', ')}'. Try a different combination!</p>`;
            }

        } catch (error) {
            console.error('Failed to fetch recipes:', error);
            mealGrid.innerHTML = `<p class="error-message">Oops! Something went wrong. Please try again later.</p>`;
        } finally {
            hideLoader();
        }
    }
});
