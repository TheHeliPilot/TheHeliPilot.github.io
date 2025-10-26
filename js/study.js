import { state } from './state.js';
import { saveFlashcards } from './cards.js';

// Study mode functions
export function startStudyMode(filters = {}) {
    state.studyCards = [...state.flashcards].filter(card => {
        if (filters.notStudied && card.difficulty !== undefined) return false;
        if (filters.hard && card.difficulty !== 'hard') return false;
        if (filters.medium && card.difficulty !== 'medium') return false;
        if (filters.easy && card.difficulty !== 'easy') return false;
        if (filters.mastered && card.difficulty !== 'mastered') return false;
        return true;
    });

    if (document.getElementById('shuffleMode').checked) {
        shuffleArray(state.studyCards);
    }

    state.currentCardIndex = 0;
    document.getElementById('cardsSection').classList.add('hidden');
    document.getElementById('studySection').classList.remove('hidden');

    updateStudyProgress();
    showCard(state.studyCards[0]);
}

export function showCard(card) {
    if (!card) return;

    document.getElementById('questionText').textContent = card.question;
    document.getElementById('answerText').textContent = card.options[card.correctIndex];

    updateDifficultyBadge(card.difficulty);
    document.querySelector('.flashcard').classList.remove('flipped');
}

export function setDifficulty(difficulty) {
    const currentCard = state.studyCards[state.currentCardIndex];
    currentCard.difficulty = difficulty;
    state.stats.cardsStudied.add(currentCard.question);

    saveFlashcards();
    updateDifficultyBadge(difficulty);
}

export function updateDifficultyBadge(difficulty) {
    const badges = ['frontDifficultyBadge', 'backDifficultyBadge'];
    badges.forEach(id => {
        const badge = document.getElementById(id);
        badge.className = 'card-difficulty-badge';
        if (difficulty) {
            badge.classList.add(`difficulty-${difficulty}`);
            badge.textContent = difficulty.toUpperCase();
        } else {
            badge.textContent = 'NOT STUDIED';
        }
    });
}

function updateStudyProgress() {
    document.getElementById('currentCard').textContent = state.currentCardIndex + 1;
    document.getElementById('totalCards').textContent = state.studyCards.length;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
