import { state } from './state.js';

// Test mode functions
export function startTestMode(filters = {}) {
    state.studyCards = [...state.flashcards].filter(card => {
        if (filters.notStudied && card.difficulty !== undefined) return false;
        if (filters.hard && card.difficulty !== 'hard') return false;
        if (filters.medium && card.difficulty !== 'medium') return false;
        if (filters.easy && card.difficulty !== 'easy') return false;
        if (filters.mastered && card.difficulty !== 'mastered') return false;
        return true;
    });

    shuffleArray(state.studyCards);
    state.currentTestIndex = 0;
    state.testScore = 0;

    document.getElementById('cardsSection').classList.add('hidden');
    document.getElementById('testSection').classList.remove('hidden');

    updateTestProgress();
    showTestQuestion(state.studyCards[0]);
}

export function showTestQuestion(card) {
    if (!card) return;

    document.getElementById('testQuestion').textContent = card.question;

    // Shuffle options for test
    const shuffledOptions = [...card.options];
    shuffleArray(shuffledOptions);

    // Map original indices to shuffled indices
    const indexMap = shuffledOptions.map(opt => card.options.indexOf(opt));
    card.shuffledCorrectIndex = indexMap.indexOf(card.correctIndex);

    shuffledOptions.forEach((option, i) => {
        document.getElementById(`mcOption${i}`).textContent = option;
    });

    document.getElementById('mcAnswerSection').classList.remove('hidden');
    document.getElementById('answerFeedback').classList.add('hidden');
}

export function handleMultipleChoiceAnswer(selectedIndex, card) {
    const isCorrect = selectedIndex === card.shuffledCorrectIndex;
    state.testScore += isCorrect ? 1 : 0;

    showFeedback(isCorrect, card.explanation);
    updateTestProgress();
}

export function showFeedback(isCorrect, message) {
    const feedback = document.getElementById('answerFeedback');
    const content = document.querySelector('.feedback-content');

    content.className = `feedback-content ${isCorrect ? 'correct' : 'incorrect'}`;
    content.innerHTML = `
        <h4>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</h4>
        <p>${message}</p>
    `;

    feedback.classList.remove('hidden');
}

function updateTestProgress() {
    document.getElementById('currentQuestion').textContent = state.currentTestIndex + 1;
    document.getElementById('totalQuestions').textContent = state.studyCards.length;
    document.getElementById('testScore').textContent = state.testScore;
    document.getElementById('testTotal').textContent = state.currentTestIndex + 1;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
