// Global state management
export const state = {
    flashcards: [],
    studyCards: [],
    currentUser: null,
    currentCardIndex: 0,
    currentTestIndex: 0,
    testScore: 0,
    apiKey: localStorage.getItem('claudeApiKey') || '',
    openaiKey: localStorage.getItem('openaiApiKey') || '',
    currentAIProvider: 'claude',
    editingCardIndex: null,
    stats: JSON.parse(localStorage.getItem('flashcardStats')) || {
        totalSessions: 0,
        cardsStudied: new Set()
    }
};

export function resetAppState() {
    state.flashcards = [];
    state.studyCards = [];
    state.currentCardIndex = 0;
    state.currentTestIndex = 0;
    state.testScore = 0;
}

export function saveState() {
    if (state.currentUser) {
        localStorage.setItem(`flashcards_${state.currentUser.uid}`, JSON.stringify(state.flashcards));
        localStorage.setItem('flashcardStats', JSON.stringify({
            ...state.stats,
            cardsStudied: Array.from(state.stats.cardsStudied)
        }));
    }
}

export function loadUserData() {
    if (!state.currentUser) return false;

    const savedCards = localStorage.getItem(`flashcards_${state.currentUser.uid}`);
    const savedStats = localStorage.getItem('flashcardStats');

    if (savedCards) {
        try {
            state.flashcards = JSON.parse(savedCards);
            if (savedStats) {
                const stats = JSON.parse(savedStats);
                state.stats = {
                    ...stats,
                    cardsStudied: new Set(stats.cardsStudied)
                };
            }
            return true;
        } catch (e) {
            console.error('Error loading user data:', e);
            return false;
        }
    }
    return false;
}
