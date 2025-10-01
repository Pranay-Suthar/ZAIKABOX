// Photos functionality for the login page
document.addEventListener('DOMContentLoaded', function() {
    const singlePhoto = document.getElementById('single-photo');
    let currentPhoto = null;
    let nextPhoto = null;
    let photoInterval = null;
    
    // Load initial photo
    loadRandomPhoto();
    
    // Start auto-changing photos every 5 seconds
    startPhotoRotation();
    
    function startPhotoRotation() {
        photoInterval = setInterval(() => {
            // If we have a buffered photo, show it immediately
            if (nextPhoto) {
                showPhoto(nextPhoto);
                // Load the next photo in the background
                loadNextPhoto();
            } else {
                // Fallback: load new photo if buffer is empty
                loadRandomPhoto();
            }
        }, 10000); // Change every 10 seconds
    }
    
    async function loadRandomPhoto() {
        try {
            // Show loading state only on first load
            if (!currentPhoto) {
                singlePhoto.innerHTML = '<div class="loading">Loading photo...</div>';
            }
            
            // Fetch one random meal
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
            const data = await response.json();
            const meal = data.meals[0];
            
            // Show the photo
            showPhoto(meal);
            
            // Start loading the next photo in the background
            loadNextPhoto();
            
        } catch (error) {
            console.error('Error loading photo:', error);
            singlePhoto.innerHTML = '<div class="error">Failed to load photo. Please refresh the page.</div>';
        }
    }
    
    async function loadNextPhoto() {
        try {
            // Fetch next random meal in the background
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
            const data = await response.json();
            const meal = data.meals[0];
            
            // Store the next photo in buffer
            nextPhoto = meal;
            
            // Preload the image
            const img = new Image();
            img.src = meal.strMealThumb;
            
        } catch (error) {
            console.error('Error loading next photo:', error);
            // Don't show error to user, just log it
        }
    }
    
    function showPhoto(meal) {
        // Clear current content
        singlePhoto.innerHTML = '';
        
        // Create and show the photo
        const photoItem = createPhotoItem(meal);
        singlePhoto.appendChild(photoItem);
        
        // Add fade-in effect
        photoItem.style.opacity = '0';
        photoItem.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            photoItem.style.transition = 'all 0.5s ease';
            photoItem.style.opacity = '1';
            photoItem.style.transform = 'scale(1)';
        }, 100);
        
        // Update current photo reference
        currentPhoto = meal;
    }
    
    function createPhotoItem(meal) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        photoItem.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
            <div class="photo-info">
                <div class="photo-title">${meal.strMeal}</div>
                <div class="photo-category">${meal.strCategory || 'Recipe'}</div>
            </div>
        `;
        
        // Add click event to show meal details
        photoItem.addEventListener('click', () => {
            showMealDetails(meal);
        });
        
        return photoItem;
    }
    
    function showMealDetails(meal) {
        // Create a simple modal to show meal details
        const modal = document.createElement('div');
        modal.className = 'meal-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <h3>${meal.strMeal}</h3>
                <p><strong>Category:</strong> ${meal.strCategory || 'N/A'}</p>
                <p><strong>Area:</strong> ${meal.strArea || 'N/A'}</p>
                <p><strong>Instructions:</strong> ${meal.strInstructions ? meal.strInstructions.substring(0, 150) + '...' : 'No instructions available'}</p>
            </div>
        `;
        
        // Add modal styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        // Add content styles
        const content = modal.querySelector('.modal-content');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 16px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            text-align: center;
        `;
        
        // Add close button styles
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        `;
        
        // Add image styles
        const img = modal.querySelector('img');
        img.style.cssText = `
            width: 100%;
            max-width: 300px;
            height: auto;
            border-radius: 8px;
            margin-bottom: 20px;
        `;
        
        // Add event listeners
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Add to page
        document.body.appendChild(modal);
    }
    
    // Clean up interval when page is unloaded
    window.addEventListener('beforeunload', () => {
        if (photoInterval) {
            clearInterval(photoInterval);
        }
    });
});

// Add some basic styles for loading and error states
const style = document.createElement('style');
style.textContent = `
    .loading, .error {
        text-align: center;
        color: white;
        font-size: 1.1rem;
        padding: 40px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        backdrop-filter: blur(10px);
    }
    
    .error {
        color: #ff6b6b;
    }
    
    .meal-modal {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .photo-item {
        transition: all 0.5s ease;
    }
`;
document.head.appendChild(style); 