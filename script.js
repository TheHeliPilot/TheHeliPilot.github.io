import * as AI from './js/ai.js';
import * as Cards from './js/cards.js';
import * as Study from './js/study.js';
import * as Test from './js/test.js';
import * as UI from './js/ui.js';

// State management
let flashcards = [];
let studyCards = [];
let currentUser = null;
let currentCardIndex = 0;
let currentTestIndex = 0;
let testScore = 0;
let apiKey = localStorage.getItem('claudeApiKey') || '';
let openaiKey = localStorage.getItem('openaiApiKey') || '';
let currentAIProvider = 'claude';
let editingCardIndex = null;
let stats = JSON.parse(localStorage.getItem('flashcardStats')) || {
    totalSessions: 0,
    cardsStudied: new Set()
};

// Initialize app
function init() {
    // Set up auth state observer
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            loadUserData();
        } else {
            resetAppState();
        }
    });

    // Initialize UI
    UI.setupEventListeners();
    
    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}

// Load user data
function loadUserData() {
    const savedCards = localStorage.getItem(`flashcards_${currentUser.uid}`);
    if (savedCards) {
        try {
            flashcards = JSON.parse(savedCards);
            if (flashcards.length > 0) {
                Cards.displayFlashcards(flashcards, currentUser);
            }
        } catch (e) {
            console.error('Error loading flashcards:', e);
        }
    }
}

// Reset app state
function resetAppState() {
    flashcards = [];
    Cards.displayFlashcards(flashcards, null);
}

// Initialize the app
init();

// Export state and functions for use in other modules
export {
    flashcards,
    studyCards,
    currentUser,
    currentCardIndex,
    currentTestIndex,
    testScore,
    apiKey,
    openaiKey,
    currentAIProvider,
    editingCardIndex,
    stats
};
