# ZaikaBox — Recipe Discovery Platform

> A modern, full-stack recipe discovery web app powered by dual API integration, Firebase, and AI-assisted cooking guidance.

**Live Demo → [zaikabox-mu.vercel.app](https://zaikabox-mu.vercel.app)**  
**Built by** [Pranay Suthar](https://github.com/Pranay-Suthar) · [Aryan Thakar](https://github.com/aryan9106)

---

## What is ZaikaBox?

ZaikaBox solves a simple but frustrating problem: you open your fridge, see a handful of ingredients, and have no idea what to cook. Most recipe apps make you search by dish name — ZaikaBox lets you search by what you already have.

It pulls from two live recipe APIs (TheMealDB + Tasty API), deduplicates and cleans the data, and serves 5,000+ unique recipes with smart filtering, ingredient-based pantry search, and an AI assistant powered by Groq Cloud — all in a mobile-first, glass-morphism UI.

---

## Core Features

### Recipe Discovery
- **Pantry Search** — Enter ingredients you have; get recipes sorted by match percentage, delivered in under 200ms
- **Multi-filter Search** — Filter by category, cuisine/area, or specific ingredients
- **Random Recipe Generator** — One-click discovery for when you're feeling adventurous
- **Dual API Stream** — Aggregates and deduplicates data from TheMealDB and Tasty API in real time

### Smart Recipe Analysis
- **Cooking Time Estimation** — Analyzes ingredients and technique keywords to predict duration
- **Difficulty Assessment** — Auto-rates recipes as Beginner / Intermediate / Expert based on method complexity
- **Calorie Range Estimation** — Nutritional insight derived from ingredient types and portions
- **Cuisine Recognition** — Regional categorization with country flags

### User Experience
- **Firebase Authentication** — Google Sign-In and email/password login
- **Cloud Bookmarks** — Save and sync favorite recipes across devices via Firestore
- **User Profiles** — Editable display names, cooking history, and bookmark management
- **Groq Cloud AI Assistant** — Conversational cooking guidance with server-side safety layers

### UI / Performance
- **Glass-morphism Design** — Frosted glass aesthetics with hardware-accelerated animations
- **Mobile-First Layout** — Fully responsive from 320px to 4K; touch-friendly recipe cards and navigation
- **Skeleton Loading States** — Smooth content placeholders during API fetch
- **50% Faster Mobile Scrolling** — GPU-accelerated CSS for buttery performance on touch devices

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript (ES6+), HTML5, CSS3 (Grid + Flexbox) |
| Auth & Database | Firebase Authentication, Cloud Firestore |
| Recipe APIs | TheMealDB API, Tasty API |
| AI Assistant | Groq Cloud API |
| Hosting | Vercel |
| Fonts & Icons | Google Fonts (Gabarito, Titillium Web), Font Awesome |

---

## Getting Started

### Prerequisites
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Firebase account
- Groq Cloud API key

### Setup

```bash
# Clone the repository
git clone https://github.com/Pranay-Suthar/ZAIKABOX.git
cd ZAIKABOX

# Update Firebase config
# Edit ZAIKABOX/HTML/JS/firebase-config.js with your credentials
```

### Firebase Configuration

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** — Email/Password + Google Sign-In
3. Create a **Firestore** database
4. Apply security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Copy your Firebase config object into `firebase-config.js`
6. Deploy to Vercel, Netlify, or Firebase Hosting

---

## Responsive Breakpoints

| Device | Screen Size | Layout |
|---|---|---|
| Mobile | 320px – 767px | Stacked cards, touch-friendly nav, 2-column bookmarks |
| Tablet | 768px – 1199px | Balanced grid, medium touch targets |
| Desktop | 1200px – 1920px | Full multi-column layout, hover effects |
| Large Screen | 1920px+ | Centered content with max-width constraints |

---

## Project Structure

```
ZAIKABOX/
├── HTML/
│   ├── JS/
│   │   ├── firebase-config.js     # Firebase credentials
│   │   ├── auth.js                # Authentication logic
│   │   ├── recipes.js             # API integration & search
│   │   ├── pantry.js              # Pantry search algorithm
│   │   └── ai-assistant.js        # Groq Cloud integration
│   ├── CSS/
│   │   └── styles.css             # Global styles + themes
│   └── pages/                     # Individual HTML pages
├── ZAIKABOX/images/               # Project screenshots
└── README.md
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*ZaikaBox — Discover · Cook · Share · Enjoy*
