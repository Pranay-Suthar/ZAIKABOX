🍳 Zaikabox - Your Personal Recipe Discovery App
Zaikabox is a sleek, modern web application designed to help you discover thousands of new and exciting meal recipes from around the world. With a clean, interactive user interface and powerful search capabilities, finding your next favorite meal has never been easier. The app is built with vanilla JavaScript and leverages Firebase for user authentication and data storage, allowing you to save your favorite recipes to a personal cookbook.

✨ Key Features
The website is packed with features designed for a seamless and engaging user experience:

1. User Authentication & Personalization
Secure Sign-Up & Login: Full user authentication system powered by Firebase Authentication.

Personal Cookbook: Logged-in users can save their favorite recipes to a personal collection.

Real-time Syncing: Saved recipes are stored in Firestore and synced in real-time across the app.

2. Advanced Recipe Discovery
Generate Random Recipe: Instantly get a detailed recipe suggestion with a single click.

Dynamic Filtering: An intelligent, two-step search system allows you to filter recipes by:

Category (e.g., Seafood, Breakfast, Dessert)

Country/Area (e.g., Italian, Mexican, Indian)

Main Ingredient (e.g., Chicken, Salmon, Rice)

Live Search Options: Filter options are fetched directly from TheMealDB API, ensuring they are always up-to-date.

3. Interactive & Modern User Interface
Floating, Expandable Search Bar: A sleek, space-saving search interface that starts as a compact icon and smoothly expands on click.

Detailed Recipe Modal: View complete recipe details—including ingredients, step-by-step instructions, and a link to a YouTube video—in a pop-up modal without ever leaving the page.

Interactive Recipe Cards: Beautifully designed cards with a "hover-reveal" effect and an integrated "like" button to save recipes.

"Load More" Pagination: Search results are displayed in batches of 12, with a "Load More" button for a clean and performant browsing experience.

Fully Responsive Design: The interface is optimized for a seamless experience on desktops, tablets, and mobile devices.

4. (In Progress) Dedicated Cookbook Page
A separate, dedicated page (cookbook.html) where users can view and manage their collection of saved recipes.

🛠️ Technologies Used
Frontend: HTML5, CSS3 (Flexbox, Grid), Vanilla JavaScript (ES6+)

Backend & Database: Google Firebase (Authentication, Firestore)

API: TheMealDB API for recipe data.

Icons: Font Awesome for UI icons.

🚀 How to Use
Explore: Open the website and immediately start discovering recipes.

Search: Click the floating search icon on the right to expand the search bar.

Filter: Select a filter type (Category, Country, or Ingredient) and then choose from the dynamically populated list of options.

Save: Sign up or log in to your account to save your favorite recipes by clicking the heart icon on