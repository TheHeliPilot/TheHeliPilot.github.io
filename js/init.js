import { state, loadUserData, resetAppState } from './state.js';
import { setupEventListeners, updateUserInfo, updateDashboardStats } from './ui.js';
import { displayFlashcards } from './cards.js';
import { auth } from './firebase-config.js';

// Initialize app
function init() {
    // Set up auth state observer
    auth.onAuthStateChanged((user) => {
        state.currentUser = user;
        if (user) {
            // User is signed in
            document.getElementById('authContainer').style.display = 'none';
            document.querySelector('.container').style.display = 'block';

            // Update UI with user info
            updateUserInfo(user);

            // Load user's data
            if (loadUserData()) {
                displayFlashcards();
                updateDashboardStats();
            }
        } else {
            // User is signed out
            document.getElementById('authContainer').style.display = 'flex';
            document.querySelector('.container').style.display = 'none';
            resetAppState();
        }
    });

    // Initialize UI
    setupEventListeners();

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}

// Initialize the app when document is ready
document.addEventListener('DOMContentLoaded', init);
