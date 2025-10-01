// Debug helper for bookmarks
import { auth, db } from './firebase-config.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Debug function to check bookmarks in Firestore
window.debugBookmarks = async () => {
    console.log('🔍 Debug: Checking bookmarks...');
    
    if (!auth.currentUser) {
        console.log('❌ No authenticated user');
        return;
    }
    
    const userId = auth.currentUser.uid;
    console.log('👤 User ID:', userId);
    
    try {
        // Get all bookmarks for this user
        const bookmarksRef = collection(db, 'bookmarks');
        const q = query(bookmarksRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        console.log('📊 Total bookmarks found:', querySnapshot.size);
        
        querySnapshot.forEach((doc) => {
            console.log('📄 Document ID:', doc.id);
            console.log('📋 Data:', doc.data());
        });
        
        // Also check what's in the bookmark manager
        console.log('🎯 BookmarkManager userBookmarks set:', Array.from(window.bookmarkManager.userBookmarks));
        
        // Test getting bookmarks through the manager
        const managerBookmarks = await window.bookmarkManager.getUserBookmarks();
        console.log('📋 Manager getUserBookmarks result:', managerBookmarks);
        
    } catch (error) {
        console.error('❌ Error debugging bookmarks:', error);
    }
};

console.log('🛠️ Debug function loaded. Run debugBookmarks() in console to check bookmarks.');