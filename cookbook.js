// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, onSnapshot, doc, getDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHzADEpSrzJ6yYxPpDi_nmAz3FEkf2kH8",
  authDomain: "food-recommendation-fea21.firebaseapp.com",
  projectId: "food-recommendation-fea21",
  storageBucket: "food-recommendation-fea21.firebasestorage.app",
  messagingSenderId: "525389055882",
  appId: "1:525389055882:web:db8e501a63b96ca9db6a73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const mealGrid = document.querySelector('.meal-grid');
    const toastLoader = document.getElementById('toast-loader');

    const showLoader = () => { if (toastLoader) toastLoader.style.display = 'flex'; };
    const hideLoader = () => { if (toastLoader) toastLoader.style.display = 'none'; };

    onAuthStateChanged(auth, user => {
        if (user) {
            // User is signed in, fetch their cookbook
            fetchCookbook(user.uid);
        } else {
            // User is not signed in, redirect to login
            window.location.href = 'login.html';
        }
    });

    function fetchCookbook(userId) {
        showLoader();
        const favoritesCol = collection(db, 'users', userId, 'favorites');

        onSnapshot(favoritesCol, async (snapshot) => {
            if (snapshot.empty) {
                mealGrid.innerHTML = `<p class="error-message">Your cookbook is empty. Go save some recipes!</p>`;
                hideLoader();
                return;
            }

            const mealPromises = snapshot.docs.map(doc => 
                fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${doc.id}`).then(res => res.json())
            );

            const mealResults = await Promise.all(mealPromises);
            const meals = mealResults.map(result => result.meals[0]).filter(Boolean);
            
            displayFavorites(meals);
            hideLoader();
        });
    }

    function displayFavorites(meals) {
        mealGrid.innerHTML = '';
        meals.forEach(meal => {
            const card = document.createElement('div');
            card.className = 'meal-card';
            card.addEventListener('click', () => displayMealInModal(meal, auth.currentUser.uid));
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
    }

    // --- Modal Logic (Duplicated for this page) ---
    const getIngredients = (meal) => {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) {
                ingredients.push({ name: meal[`strIngredient${i}`], amount: meal[`strMeasure${i}`] });
            } else { break; }
        }
        return ingredients;
    };

    async function displayMealInModal(meal, userId) {
        const ingredients = getIngredients(meal);
        const instructionSteps = meal.strInstructions.split(/\r?\n/).filter(step => step.trim().length > 0).map(step => `<li class="recipe-instruction-step">${step}</li>`).join('');

        const modal = document.createElement('div');
        modal.className = 'recipe-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal-btn">&times;</button>
                <button class="favorite-btn" data-meal-id="${meal.idMeal}"><i class="fa-solid fa-heart"></i></button>
                <div class="recipe-primary-content">
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-image">
                    <div class="recipe-tags">
                        ${meal.strCategory ? `<span>${meal.strCategory}</span>` : ''}
                        ${meal.strArea ? `<span>${meal.strArea}</span>` : ''}
                    </div>
                    ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" class="recipe-video-btn">Watch Video <i class="fa-brands fa-youtube"></i></a>` : ''}
                </div>
                <div class="recipe-secondary-content">
                    <h2 class="recipe-title">${meal.strMeal}</h2>
                    <div class="recipe-section">
                        <h3 class="recipe-section-title">Ingredients</h3>
                        <ul class="recipe-ingredients-list">${ingredients.map(ing => `<li><span class="ingredient-name">${ing.name}</span><span class="ingredient-amount">${ing.amount}</span></li>`).join('')}</ul>
                    </div>
                    <div class="recipe-section">
                        <h3 class="recipe-section-title">Instructions</h3>
                        <ol class="recipe-instructions">${instructionSteps}</ol>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => document.body.removeChild(modal);
        modal.querySelector('.close-modal-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Favorite button logic
        const favBtn = modal.querySelector('.favorite-btn');
        favBtn.addEventListener('click', async () => {
            const mealId = favBtn.dataset.mealId;
            const favDocRef = doc(db, 'users', userId, 'favorites', mealId);
            // In the cookbook, clicking always means "remove"
            await deleteDoc(favDocRef);
            closeModal(); // Close modal after removing
        });
    }
});
