// ================= Bookmarks Module =================
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

// Enable Firestore
const USE_FIRESTORE = true;

class BookmarkManager {
    constructor() {
        this.userBookmarks = new Set();
        this.bookmarksCache = null;
        this.lastCacheTime = 0;
        this.cacheExpiry = 30000; // 30 seconds
        this.authReady = false;
        
        // Wait for auth to be ready before loading bookmarks
        this.initializeAuth();
    }

    async initializeAuth() {
        // Wait for auth state to be determined
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                this.authReady = true;
                if (user) {
                    // Small delay to ensure user is fully authenticated
                    setTimeout(() => {
                        this.loadUserBookmarks();
                    }, 500);
                }
                unsubscribe();
                resolve();
            });
        });
    }

    // Load user's bookmarks from Firestore
    async loadUserBookmarks() {
        if (!auth.currentUser) return;
        
        try {
            if (USE_FIRESTORE) {
                const userId = auth.currentUser.uid;
                const bookmarksRef = collection(db, 'bookmarks');
                const q = query(bookmarksRef, where('userId', '==', userId));
                const querySnapshot = await getDocs(q);
                
                this.userBookmarks.clear();
                querySnapshot.forEach((doc) => {
                    this.userBookmarks.add(doc.data().mealId);
                });
            } else {
                // Fallback to localStorage
                const userId = auth.currentUser.uid;
                const bookmarksKey = `bookmarks_${userId}`;
                const savedBookmarks = localStorage.getItem(bookmarksKey);
                
                this.userBookmarks.clear();
                if (savedBookmarks) {
                    const bookmarkIds = JSON.parse(savedBookmarks);
                    bookmarkIds.forEach(id => this.userBookmarks.add(id));
                }
            }
            
            // Only update buttons if they exist on the page
            if (document.querySelectorAll('.bookmark-btn').length > 0) {
                this.updateBookmarkButtons();
            }
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        }
    }

    // Add a recipe to bookmarks
    async addBookmark(mealId, mealData) {
        // Check if user is authenticated
        if (!auth.currentUser) {
            this.showToast('Please log in to bookmark recipes', 'error');
            return false;
        }

        // Validate input data
        if (!mealId || !mealData) {
            this.showToast('Invalid recipe data', 'error');
            return false;
        }

        try {
            const userId = auth.currentUser.uid;
            
            if (USE_FIRESTORE) {
                // Check if already bookmarked
                if (this.userBookmarks.has(mealId)) {
                    this.showToast('Recipe already bookmarked!', 'info');
                    return true;
                }
                
                // Add to Firestore
                const bookmarkData = {
                    userId: userId,
                    mealId: String(mealId),
                    mealName: String(mealData.strMeal || 'Unknown Recipe'),
                    mealThumb: String(mealData.strMealThumb || ''),
                    mealCategory: String(mealData.strCategory || ''),
                    mealArea: String(mealData.strArea || ''),
                    bookmarkedAt: new Date()
                };
                
                await addDoc(collection(db, 'bookmarks'), bookmarkData);
            } else {
                // Fallback to localStorage
                const bookmarksKey = `bookmarks_${userId}`;
                const bookmarkDataKey = `bookmark_data_${userId}`;
                
                const existingBookmarks = JSON.parse(localStorage.getItem(bookmarksKey) || '[]');
                const existingData = JSON.parse(localStorage.getItem(bookmarkDataKey) || '{}');
                
                if (!existingBookmarks.includes(mealId)) {
                    existingBookmarks.push(mealId);
                    existingData[mealId] = {
                        mealId: String(mealId),
                        mealName: String(mealData.strMeal || 'Unknown Recipe'),
                        mealThumb: String(mealData.strMealThumb || ''),
                        mealCategory: String(mealData.strCategory || ''),
                        mealArea: String(mealData.strArea || ''),
                        bookmarkedAt: new Date().toISOString()
                    };
                    
                    localStorage.setItem(bookmarksKey, JSON.stringify(existingBookmarks));
                    localStorage.setItem(bookmarkDataKey, JSON.stringify(existingData));
                }
            }

            this.userBookmarks.add(mealId);
            this.bookmarksCache = null; // Clear cache
            this.updateBookmarkButtons();
            this.showToast('Recipe bookmarked!', 'success');
            return true;
        } catch (error) {
            console.error('Error adding bookmark:', error);
            this.showToast('Failed to bookmark recipe', 'error');
            return false;
        }
    }

    // Remove a recipe from bookmarks
    async removeBookmark(mealId) {
        if (!auth.currentUser) {
            this.showToast('Please log in to manage bookmarks', 'error');
            return;
        }

        try {
            const userId = auth.currentUser.uid;
            
            if (USE_FIRESTORE) {
                // Find and delete from Firestore
                const bookmarksRef = collection(db, 'bookmarks');
                const q = query(bookmarksRef, 
                    where('userId', '==', userId), 
                    where('mealId', '==', mealId)
                );
                const querySnapshot = await getDocs(q);
                
                querySnapshot.forEach(async (docSnapshot) => {
                    await deleteDoc(doc(db, 'bookmarks', docSnapshot.id));
                });
            } else {
                // Fallback to localStorage
                const bookmarksKey = `bookmarks_${userId}`;
                const bookmarkDataKey = `bookmark_data_${userId}`;
                
                const existingBookmarks = JSON.parse(localStorage.getItem(bookmarksKey) || '[]');
                const existingData = JSON.parse(localStorage.getItem(bookmarkDataKey) || '{}');
                
                const updatedBookmarks = existingBookmarks.filter(id => id !== mealId);
                delete existingData[mealId];
                
                localStorage.setItem(bookmarksKey, JSON.stringify(updatedBookmarks));
                localStorage.setItem(bookmarkDataKey, JSON.stringify(existingData));
            }

            this.userBookmarks.delete(mealId);
            this.bookmarksCache = null; // Clear cache
            this.updateBookmarkButtons();
            this.showToast('Bookmark removed', 'success');
        } catch (error) {
            console.error('Error removing bookmark:', error);
            this.showToast('Failed to remove bookmark', 'error');
        }
    }

    // Check if a recipe is bookmarked
    isBookmarked(mealId) {
        return this.userBookmarks.has(mealId);
    }

    // Get all user bookmarks with caching
    async getUserBookmarks() {
        if (!auth.currentUser) return [];

        // Check cache first
        const now = Date.now();
        if (this.bookmarksCache && (now - this.lastCacheTime) < this.cacheExpiry) {
            return this.bookmarksCache;
        }

        try {
            const userId = auth.currentUser.uid;
            let bookmarks = [];
            
            if (USE_FIRESTORE) {
                // Get from Firestore
                const bookmarksRef = collection(db, 'bookmarks');
                const q = query(bookmarksRef, where('userId', '==', userId));
                const querySnapshot = await getDocs(q);
                
                bookmarks = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    bookmarkedAt: doc.data().bookmarkedAt?.toDate?.() || new Date(doc.data().bookmarkedAt)
                }));
                
                // Sort manually after fetching
                bookmarks.sort((a, b) => {
                    const aTime = new Date(a.bookmarkedAt).getTime() || 0;
                    const bTime = new Date(b.bookmarkedAt).getTime() || 0;
                    return bTime - aTime;
                });
            } else {
                // Fallback to localStorage
                const bookmarkDataKey = `bookmark_data_${userId}`;
                const existingData = JSON.parse(localStorage.getItem(bookmarkDataKey) || '{}');
                
                bookmarks = Object.values(existingData).sort((a, b) => {
                    const aTime = new Date(a.bookmarkedAt).getTime() || 0;
                    const bTime = new Date(b.bookmarkedAt).getTime() || 0;
                    return bTime - aTime;
                });
            }
            
            // Update cache
            this.bookmarksCache = bookmarks;
            this.lastCacheTime = now;
            
            return bookmarks;
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
            return [];
        }
    }

    // Update all bookmark buttons on the page
    updateBookmarkButtons() {
        const bookmarkButtons = document.querySelectorAll('.bookmark-btn');
        bookmarkButtons.forEach(btn => {
            const mealId = btn.dataset.mealId;
            const isBookmarked = this.isBookmarked(mealId);
            
            btn.classList.toggle('bookmarked', isBookmarked);
            btn.innerHTML = isBookmarked ? 
                '<i class="fa fa-heart"></i>' : 
                '<i class="fa fa-heart-o"></i>';
            btn.title = isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks';
        });
    }

    // Show toast notification
    showToast(message, type = 'success') {
        // Create toast if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Create global instance
const bookmarkManager = new BookmarkManager();

// Make it globally available
window.bookmarkManager = bookmarkManager;

// Export for use in other modules
export { bookmarkManager };