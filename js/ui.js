import { state } from './state.js';
import * as Cards from './cards.js';
import * as Study from './study.js';
import * as Test from './test.js';
import * as AI from './ai.js';

// Page navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    // Show selected page
    document.getElementById(pageId).classList.remove('hidden');

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
}

export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

export function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

export function showStatistics() {
    const totalCards = state.flashcards.length;
    const studiedCards = state.stats.cardsStudied.size;
    const masteredCards = state.flashcards.filter(c => c.difficulty === 'mastered').length;

    document.getElementById('totalCardsCount').textContent = totalCards;
    document.getElementById('studiedCount').textContent = studiedCards;
    document.getElementById('masteredCount').textContent = masteredCards;
    document.getElementById('studySessionsCount').textContent = state.stats.totalSessions;

    updateProgressBar();
    document.getElementById('statsModal').classList.remove('hidden');
}

export function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(e.target.dataset.page);
        });
    });

    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

    // Stats button
    document.getElementById('statsBtn').addEventListener('click', showStatistics);

    // Help modal
    document.getElementById('helpBtn').addEventListener('click', () => {
        document.getElementById('helpModal').classList.remove('hidden');
    });

    // Study mode controls
    document.getElementById('studyBtn').addEventListener('click', () => {
        const filters = getActiveFilters();
        Study.startStudyMode(filters);
    });

    // Test mode controls
    document.getElementById('testBtn').addEventListener('click', () => {
        const filters = getActiveFilters();
        Test.startTestMode(filters);
    });

    // Card management
    document.getElementById('addCardBtn').addEventListener('click', () => {
        state.editingCardIndex = null;
        document.getElementById('cardModal').classList.remove('hidden');
    });

    document.getElementById('saveCard').addEventListener('click', saveCardFromModal);

    // AI generation
    document.getElementById('generateBtn').addEventListener('click', async () => {
        const text = document.getElementById('inputText').value;
        const apiKey = state.currentAIProvider === 'claude' ? state.apiKey : state.openaiKey;

        try {
            const questions = await (state.currentAIProvider === 'claude'
                ? AI.generateWithClaude(text, apiKey)
                : AI.generateWithOpenAI(text, apiKey));

            state.flashcards = [...state.flashcards, ...questions];
            Cards.saveFlashcards();
            Cards.displayFlashcards();
            showNotification('Questions generated successfully');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Study mode navigation
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (state.currentCardIndex > 0) {
            state.currentCardIndex--;
            Study.showCard(state.studyCards[state.currentCardIndex]);
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (state.currentCardIndex < state.studyCards.length - 1) {
            state.currentCardIndex++;
            Study.showCard(state.studyCards[state.currentCardIndex]);
        }
    });

    // Flashcard flipping
    document.getElementById('flipBtn').addEventListener('click', () => {
        document.querySelector('.flashcard').classList.add('flipped');
    });

    document.getElementById('flipBackBtn').addEventListener('click', () => {
        document.querySelector('.flashcard').classList.remove('flipped');
    });

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.target.dataset.difficulty;
            Study.setDifficulty(difficulty);
        });
    });

    // Multiple choice answers in test mode
    document.querySelectorAll('.mc-answer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedIndex = parseInt(e.target.dataset.index);
            Test.handleMultipleChoiceAnswer(selectedIndex, state.studyCards[state.currentTestIndex]);
        });
    });

    // Search and filters
    document.getElementById('searchInput').addEventListener('input', (e) => {
        Cards.displayFlashcards(e.target.value, getActiveFilters());
    });

    document.querySelectorAll('.filter-options input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            Cards.displayFlashcards(document.getElementById('searchInput').value, getActiveFilters());
        });
    });

    // Modal controls
    document.querySelectorAll('.close-btn, #cancelModal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
        });
    });

    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', Cards.exportCards);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', Cards.importCards);

    // Reset stats
    document.getElementById('resetStats').addEventListener('click', () => {
        window.showConfirm(
            'Are you sure you want to reset all statistics?',
            () => {
                state.stats = {
                    totalSessions: 0,
                    cardsStudied: new Set()
                };
                saveState();
                showStatistics();
                showNotification('Statistics reset successfully');
            },
            {
                title: 'Reset Statistics',
                confirmText: 'Reset All',
                confirmIcon: 'fa-redo',
                confirmClass: 'btn-danger'
            }
        );
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (document.querySelector('.modal:not(.hidden)')) return;

        switch (e.key) {
            case ' ':
            case 'Enter':
                document.querySelector('.flashcard').classList.toggle('flipped');
                break;
            case 'ArrowLeft':
                document.getElementById('prevBtn').click();
                break;
            case 'ArrowRight':
                document.getElementById('nextBtn').click();
                break;
            case '1':
                document.querySelector('.diff-btn[data-difficulty="hard"]')?.click();
                break;
            case '2':
                document.querySelector('.diff-btn[data-difficulty="medium"]')?.click();
                break;
            case '3':
                document.querySelector('.diff-btn[data-difficulty="easy"]')?.click();
                break;
            case '4':
                document.querySelector('.diff-btn[data-difficulty="mastered"]')?.click();
                break;
            case 'Escape':
                document.getElementById('exitStudyBtn')?.click();
                document.getElementById('exitTestBtn')?.click();
                break;
        }
    });

    // Update user info when logged in
    if (state.currentUser) {
        updateUserInfo(state.currentUser);
    }
}

export function updateUserInfo(user) {
    if (user) {
        document.getElementById('userDisplayName').textContent =
            `Welcome back, ${user.email.split('@')[0]}`;
        document.getElementById('userEmail').textContent = user.email;
    }
}

function getActiveFilters() {
    return {
        notStudied: document.getElementById('filterNotStudied').checked,
        hard: document.getElementById('filterHard').checked,
        medium: document.getElementById('filterMedium').checked,
        easy: document.getElementById('filterEasy').checked,
        mastered: document.getElementById('filterMastered').checked
    };
}

function updateProgressBar() {
    const total = state.flashcards.length;
    if (total === 0) return;

    const counts = {
        mastered: state.flashcards.filter(c => c.difficulty === 'mastered').length,
        easy: state.flashcards.filter(c => c.difficulty === 'easy').length,
        medium: state.flashcards.filter(c => c.difficulty === 'medium').length,
        hard: state.flashcards.filter(c => c.difficulty === 'hard').length,
        unstudied: state.flashcards.filter(c => !c.difficulty).length
    };

    Object.entries(counts).forEach(([key, value]) => {
        const percentage = (value / total) * 100;
        document.getElementById(`progress${key.charAt(0).toUpperCase() + key.slice(1)}`).style.width = `${percentage}%`;
        document.getElementById(`legend${key.charAt(0).toUpperCase() + key.slice(1)}`).textContent = value;
    });
}

function saveCardFromModal() {
    const question = document.getElementById('modalQuestion').value;
    const options = Array.from({length: 4}, (_, i) => document.getElementById(`option${i}`).value);
    const correctIndex = parseInt(document.querySelector('input[name="correctAnswer"]:checked').value);
    const explanation = document.getElementById('modalExplanation').value;

    const card = { question, options, correctIndex, explanation };

    if (state.editingCardIndex !== null) {
        state.flashcards[state.editingCardIndex] = card;
    } else {
        state.flashcards.push(card);
    }

    Cards.saveFlashcards();
    Cards.displayFlashcards();
    document.getElementById('cardModal').classList.add('hidden');
    showNotification(state.editingCardIndex !== null ? 'Card updated' : 'Card added');
}

export function updateDashboardStats() {
    if (!state.flashcards) return;

    document.getElementById('dashboardTotalCards').textContent = state.flashcards.length;
    document.getElementById('dashboardMastered').textContent =
        state.flashcards.filter(card => card.difficulty === 'mastered').length;

    // Calculate streak
    const streak = localStorage.getItem('studyStreak') || 0;
    document.getElementById('dashboardStreak').textContent = `${streak} days`;
}
