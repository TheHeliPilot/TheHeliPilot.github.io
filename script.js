// State management
let flashcards = [];
let studyCards = []; // Cards currently in study mode (may be shuffled)
let testCards = []; // Cards in test mode
let currentCardIndex = 0;
let currentTestIndex = 0;
let testScore = 0;
let apiKey = localStorage.getItem('claudeApiKey') || '';
let openaiKey = localStorage.getItem('openaiApiKey') || '';
let currentAIProvider = 'claude'; // 'claude' or 'openai'
let editingCardIndex = null;
let stats = JSON.parse(localStorage.getItem('flashcardStats')) || {
    totalSessions: 0,
    cardsStudied: new Set()
};

// Load saved flashcards
const savedCards = localStorage.getItem('flashcards');
if (savedCards) {
    try {
        flashcards = JSON.parse(savedCards);
        if (flashcards.length > 0) {
            displayFlashcards();
        }
    } catch (e) {
        console.error('Error loading saved flashcards:', e);
    }
}

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');
const inputText = document.getElementById('inputText');
const generateBtn = document.getElementById('generateBtn');
const manualAddBtn = document.getElementById('manualAddBtn');
const importBtn = document.getElementById('importBtn');
const loading = document.getElementById('loading');
const inputSection = document.getElementById('inputSection');
const cardsSection = document.getElementById('cardsSection');
const studySection = document.getElementById('studySection');
const cardsList = document.getElementById('cardsList');
const cardCount = document.getElementById('cardCount');
const searchInput = document.getElementById('searchInput');
const addCardBtn = document.getElementById('addCardBtn');
const exportBtn = document.getElementById('exportBtn');
const studyBtn = document.getElementById('studyBtn');
const newCardsBtn = document.getElementById('newCardsBtn');
const flashcard = document.getElementById('flashcard');
const questionText = document.getElementById('questionText');
const answerText = document.getElementById('answerText');
const flipBtn = document.getElementById('flipBtn');
const flipBackBtn = document.getElementById('flipBackBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const exitStudyBtn = document.getElementById('exitStudyBtn');
const currentCardEl = document.getElementById('currentCard');
const totalCardsEl = document.getElementById('totalCards');
const shuffleMode = document.getElementById('shuffleMode');
const darkModeToggle = document.getElementById('darkModeToggle');
const helpBtn = document.getElementById('helpBtn');
const statsBtn = document.getElementById('statsBtn');
const toggleAI = document.getElementById('toggleAI');
const aiOptions = document.getElementById('aiOptions');
const claudeProBtn = document.getElementById('claudeProBtn');
const claudeProHelper = document.getElementById('claudeProHelper');
const claudeProText = document.getElementById('claudeProText');
const copyPromptBtn = document.getElementById('copyPromptBtn');
const claudeProJSON = document.getElementById('claudeProJSON');
const importJSONBtn = document.getElementById('importJSONBtn');
const cardModal = document.getElementById('cardModal');
const modalTitle = document.getElementById('modalTitle');
const modalQuestion = document.getElementById('modalQuestion');
const modalAnswer = document.getElementById('modalAnswer');
const closeModal = document.getElementById('closeModal');
const cancelModal = document.getElementById('cancelModal');
const saveCard = document.getElementById('saveCard');
const helpModal = document.getElementById('helpModal');
const statsModal = document.getElementById('statsModal');
const fileInput = document.getElementById('fileInput');
const frontDifficultyBadge = document.getElementById('frontDifficultyBadge');
const backDifficultyBadge = document.getElementById('backDifficultyBadge');

// Filter checkboxes
const filterAll = document.getElementById('filterAll');
const filterNotStudied = document.getElementById('filterNotStudied');
const filterHard = document.getElementById('filterHard');
const filterMedium = document.getElementById('filterMedium');
const filterEasy = document.getElementById('filterEasy');
const filterMastered = document.getElementById('filterMastered');

// New DOM elements for enhanced features
const openaiKeyInput = document.getElementById('openaiKey');
const saveOpenAIKeyBtn = document.getElementById('saveOpenAIKey');
const testBtn = document.getElementById('testBtn');
const testSection = document.getElementById('testSection');
const modalExplanation = document.getElementById('modalExplanation');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const importFileBtn = document.getElementById('importFileBtn');
const studyFileInput = document.getElementById('studyFileInput');

// Test mode elements
const currentQuestion = document.getElementById('currentQuestion');
const totalQuestions = document.getElementById('totalQuestions');
const testScoreEl = document.getElementById('testScore');
const testTotalEl = document.getElementById('testTotal');
const testQuestion = document.getElementById('testQuestion');
const questionTypeBadge = document.getElementById('questionTypeBadge');
const mcAnswerSection = document.getElementById('mcAnswerSection');
const writtenAnswerSection = document.getElementById('writtenAnswerSection');
const flashcardTestSection = document.getElementById('flashcardTestSection');
const writtenAnswerInput = document.getElementById('writtenAnswerInput');
const submitWrittenBtn = document.getElementById('submitWrittenBtn');
const revealAnswerBtn = document.getElementById('revealAnswerBtn');
const flashcardTestAnswer = document.getElementById('flashcardTestAnswer');
const selfGradeSection = document.getElementById('selfGradeSection');
const answerFeedback = document.getElementById('answerFeedback');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const exitTestBtn = document.getElementById('exitTestBtn');

// Initialize
if (apiKey) {
    apiKeyInput.value = apiKey;
}
if (openaiKey) {
    openaiKeyInput.value = openaiKey;
}

// Event listeners
saveKeyBtn.addEventListener('click', saveApiKey);
generateBtn.addEventListener('click', generateFlashcards);
manualAddBtn.addEventListener('click', () => openCardModal());
importBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', importCards);
deleteAllBtn.addEventListener('click', deleteAllCards);
importFileBtn.addEventListener('click', () => studyFileInput.click());
studyFileInput.addEventListener('change', importStudyFile);
addCardBtn.addEventListener('click', () => openCardModal());
exportBtn.addEventListener('click', exportCards);
studyBtn.addEventListener('click', startStudyMode);
newCardsBtn.addEventListener('click', createNewCards);
flipBtn.addEventListener('click', () => flashcard.classList.add('flipped'));
flipBackBtn.addEventListener('click', () => flashcard.classList.remove('flipped'));
prevBtn.addEventListener('click', previousCard);
nextBtn.addEventListener('click', nextCard);
exitStudyBtn.addEventListener('click', exitStudyMode);
darkModeToggle.addEventListener('click', toggleDarkMode);
helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
statsBtn.addEventListener('click', showStatistics);
claudeProBtn.addEventListener('click', () => {
    claudeProHelper.classList.toggle('hidden');
    aiOptions.classList.add('hidden');
    claudeProBtn.textContent = claudeProHelper.classList.contains('hidden') ? 'Use Claude Pro (Free!)' : 'Hide Claude Pro Helper';
});
toggleAI.addEventListener('click', () => {
    aiOptions.classList.toggle('hidden');
    claudeProHelper.classList.add('hidden');
    toggleAI.textContent = aiOptions.classList.contains('hidden') ? 'Use API Instead' : 'Hide API Options';
});
copyPromptBtn.addEventListener('click', copyClaudeProPrompt);
importJSONBtn.addEventListener('click', importClaudeProJSON);
saveOpenAIKeyBtn.addEventListener('click', saveOpenAIKey);
testBtn.addEventListener('click', startTestMode);
exitTestBtn.addEventListener('click', exitTestMode);
submitWrittenBtn.addEventListener('click', submitWrittenAnswer);
revealAnswerBtn.addEventListener('click', revealFlashcardAnswer);
nextQuestionBtn.addEventListener('click', nextTestQuestion);
closeModal.addEventListener('click', () => cardModal.classList.add('hidden'));
cancelModal.addEventListener('click', () => cardModal.classList.add('hidden'));
saveCard.addEventListener('click', saveCardFromModal);
searchInput.addEventListener('input', filterCards);

// API provider tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentAIProvider = e.target.dataset.provider;

        document.getElementById('claudeAPISection').classList.toggle('hidden', currentAIProvider !== 'claude');
        document.getElementById('openaiAPISection').classList.toggle('hidden', currentAIProvider !== 'openai');
    });
});

// Multiple choice answer buttons
document.querySelectorAll('.mc-answer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        handleMultipleChoiceAnswer(parseInt(e.currentTarget.dataset.index));
    });
});

// Self-grading buttons
document.querySelectorAll('.self-grade-buttons button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        handleSelfGrade(e.target.dataset.correct === 'true');
    });
});

// Filter listeners
filterAll.addEventListener('change', handleFilterAll);
[filterNotStudied, filterHard, filterMedium, filterEasy, filterMastered].forEach(filter => {
    filter.addEventListener('change', filterCards);
});

// Difficulty button listeners
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        setDifficulty(e.target.dataset.difficulty);
    });
});

// Functions
function saveApiKey() {
    // Clean the API key - remove any non-ASCII characters
    const rawKey = apiKeyInput.value.trim();
    apiKey = rawKey.replace(/[^\x00-\xFF]/g, '');

    if (apiKey && apiKey === rawKey) {
        localStorage.setItem('claudeApiKey', apiKey);
        showNotification('Claude API key saved successfully!');
    } else if (apiKey !== rawKey) {
        showNotification('API key contained invalid characters. Please copy it again carefully.', 'error');
    } else {
        showNotification('Please enter a valid API key', 'error');
    }
}

function saveOpenAIKey() {
    // Clean the API key - remove any non-ASCII characters
    const rawKey = openaiKeyInput.value.trim();
    openaiKey = rawKey.replace(/[^\x00-\xFF]/g, '');

    if (openaiKey && openaiKey === rawKey) {
        localStorage.setItem('openaiApiKey', openaiKey);
        showNotification('OpenAI API key saved successfully!');
    } else if (openaiKey !== rawKey) {
        showNotification('API key contained invalid characters. Please copy it again carefully.', 'error');
    } else {
        showNotification('Please enter a valid API key', 'error');
    }
}

function showNotification(message, type = 'success') {
    alert(message); // Simple for now, could be enhanced with custom toast notifications
}

function copyClaudeProPrompt() {
    const text = claudeProText.value.trim();

    if (!text) {
        showNotification('Please paste your study material first!', 'error');
        return;
    }

    const prompt = `You are a multiple choice quiz generator. Analyze the following text and create challenging multiple choice questions to test knowledge.

Create between 5-10 questions depending on the content length and complexity. Each question should:
- Be challenging and test deep understanding
- Have 4 answer options (A, B, C, D)
- Include an explanation for why the correct answer is right

Return ONLY a JSON array in this exact format (no markdown code blocks, no explanation, just the raw JSON):
[
  {
    "question": "Question text here?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 0,
    "explanation": "Explanation of why this is correct"
  }
]

The correctAnswer field should be 0 for A, 1 for B, 2 for C, or 3 for D.

Text to analyze:
${text}`;

    // Copy to clipboard
    navigator.clipboard.writeText(prompt).then(() => {
        showNotification('Prompt copied! Now paste it into Claude.ai and copy the JSON response back here.');
    }).catch(err => {
        showNotification('Failed to copy. Please select and copy manually.', 'error');
        console.error('Copy failed:', err);
    });
}

function importClaudeProJSON() {
    const jsonText = claudeProJSON.value.trim();

    if (!jsonText) {
        showNotification('Please paste the JSON from Claude first!', 'error');
        return;
    }

    try {
        // Remove markdown code blocks if present
        let cleanJSON = jsonText;
        if (cleanJSON.includes('```json')) {
            cleanJSON = cleanJSON.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanJSON.includes('```')) {
            cleanJSON = cleanJSON.replace(/```\n?/g, '');
        }

        const newCards = JSON.parse(cleanJSON);

        if (!Array.isArray(newCards) || newCards.length === 0) {
            throw new Error('Invalid JSON format. Make sure it\'s an array of cards.');
        }

        // Add to flashcards - all multiple choice and hard
        const cardsWithMeta = newCards.map(card => ({
            ...card,
            type: 'multiple',
            difficulty: 'hard',
            id: Date.now() + Math.random()
        }));

        flashcards = [...flashcards, ...cardsWithMeta];
        saveFlashcards();
        displayFlashcards();

        // Clear the form
        claudeProText.value = '';
        claudeProJSON.value = '';
        claudeProHelper.classList.add('hidden');

        showNotification(`Successfully imported ${newCards.length} flashcards!`);
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Error parsing JSON: ' + error.message + '. Make sure you copied the complete JSON from Claude.', 'error');
    }
}

async function generateFlashcards() {
    const text = inputText.value.trim();

    if (!text) {
        showNotification('Please enter some text to generate flashcards', 'error');
        return;
    }

    if (currentAIProvider === 'claude' && !apiKey) {
        showNotification('Please enter and save your Claude API key first', 'error');
        return;
    }

    if (currentAIProvider === 'openai' && !openaiKey) {
        showNotification('Please enter and save your OpenAI API key first', 'error');
        return;
    }

    generateBtn.disabled = true;
    loading.classList.remove('hidden');

    try {
        let newCards;

        if (currentAIProvider === 'claude') {
            newCards = await generateWithClaude(text);
        } else {
            newCards = await generateWithOpenAI(text);
        }

        // Add card type and metadata - all cards are multiple choice and hard difficulty
        flashcards = newCards.map(card => ({
            ...card,
            type: 'multiple',
            difficulty: 'hard',
            id: Date.now() + Math.random()
        }));

        saveFlashcards();
        displayFlashcards();
        showNotification(`Generated ${flashcards.length} flashcards!`);

    } catch (error) {
        console.error('Error:', error);
        showNotification('Error generating flashcards: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
        loading.classList.add('hidden');
    }
}

async function generateWithClaude(text) {
    // Clean and validate API key
    const cleanKey = apiKey.trim().replace(/[^\x00-\xFF]/g, '');

    if (!cleanKey) {
        throw new Error('Invalid API key format');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [{
                role: 'user',
                content: `You are a multiple choice quiz generator. Analyze the following text and create challenging multiple choice questions to test knowledge.

Create between 5-10 questions depending on the content length and complexity. Each question should:
- Be challenging and test deep understanding
- Have 4 answer options (A, B, C, D)
- Include an explanation for why the correct answer is right

Return ONLY a JSON array in this exact format (no markdown, no explanation, just the JSON):
[
  {
    "question": "Question text here?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 0,
    "explanation": "Explanation of why this is correct"
  }
]

The correctAnswer field should be 0 for A, 1 for B, 2 for C, or 3 for D.

Text to analyze:
${text}`
            }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate flashcards');
    }

    const data = await response.json();
    let content = data.content[0].text;

    // Extract JSON from response
    if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.startsWith('```')) {
        content = content.replace(/```\n?/g, '');
    }

    const cards = JSON.parse(content.trim());
    if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error('Invalid flashcards format received');
    }

    return cards;
}

async function generateWithOpenAI(text) {
    // Clean and validate API key
    const cleanKey = openaiKey.trim().replace(/[^\x00-\xFF]/g, '');

    if (!cleanKey) {
        throw new Error('Invalid API key format');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',  // Changed to gpt-3.5-turbo which is available to all accounts
            messages: [{
                role: 'system',
                content: 'You are a multiple choice quiz generator. Create challenging multiple choice questions. Return only valid JSON, no markdown formatting.'
            }, {
                role: 'user',
                content: `Analyze this text and create 5-10 challenging multiple choice questions. Return ONLY a JSON array:
[{
  "question": "question text?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "why this is correct"
}]

correctAnswer is 0 for A, 1 for B, 2 for C, 3 for D.

Text: ${text}`
            }],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate flashcards');
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // Extract JSON
    if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.startsWith('```')) {
        content = content.replace(/```\n?/g, '');
    }

    const cards = JSON.parse(content);
    if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error('Invalid flashcards format received');
    }

    return cards;
}

function saveFlashcards() {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
}

function displayFlashcards() {
    const searchTerm = searchInput.value.toLowerCase();
    const filters = getActiveFilters();

    cardsList.innerHTML = '';

    let visibleCards = flashcards.filter(card => {
        // Search filter
        const matchesSearch = !searchTerm ||
            card.question.toLowerCase().includes(searchTerm) ||
            card.answer.toLowerCase().includes(searchTerm);

        // Difficulty filter
        const matchesDifficulty = filters.includes(card.difficulty || 'unstudied');

        return matchesSearch && matchesDifficulty;
    });

    cardCount.textContent = visibleCards.length;

    visibleCards.forEach((card, index) => {
        const actualIndex = flashcards.indexOf(card);
        const cardEl = document.createElement('div');
        cardEl.className = 'card-item';

        const difficultyBadge = `<span class="difficulty-badge difficulty-hard">HARD</span>`;

        // Build options HTML
        let optionsHTML = '';
        if (card.options && card.options.length > 0) {
            optionsHTML = '<div style="margin: 10px 0;">';
            card.options.forEach((opt, i) => {
                const isCorrect = i === card.correctAnswer;
                const letter = String.fromCharCode(65 + i);
                const style = isCorrect ? 'color: #1dd1a1; font-weight: bold;' : '';
                optionsHTML += `<p style="${style}">${letter}. ${escapeHtml(opt)} ${isCorrect ? '✓' : ''}</p>`;
            });
            optionsHTML += '</div>';
        }

        // Add explanation if exists
        const explanationHTML = card.explanation
            ? `<p style="margin-top: 10px;"><strong>Explanation:</strong> ${escapeHtml(card.explanation)}</p>`
            : '';

        cardEl.innerHTML = `
            <h4>
                Card ${actualIndex + 1}
                ${difficultyBadge}
            </h4>
            <p><strong>Question:</strong> ${escapeHtml(card.question)}</p>
            ${optionsHTML}
            ${explanationHTML}
            <div class="card-actions">
                <button class="btn-secondary" onclick="editCard(${actualIndex})">Edit</button>
                <button class="btn-secondary" onclick="deleteCard(${actualIndex})">Delete</button>
            </div>
        `;
        cardsList.appendChild(cardEl);
    });

    if (visibleCards.length === 0) {
        cardsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No cards match your filters</p>';
    }

    inputSection.classList.add('hidden');
    cardsSection.classList.remove('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getActiveFilters() {
    const filters = [];
    if (filterNotStudied.checked) filters.push('unstudied', null);
    if (filterHard.checked) filters.push('hard');
    if (filterMedium.checked) filters.push('medium');
    if (filterEasy.checked) filters.push('easy');
    if (filterMastered.checked) filters.push('mastered');
    return filters;
}

function handleFilterAll() {
    const isChecked = filterAll.checked;
    filterNotStudied.checked = isChecked;
    filterHard.checked = isChecked;
    filterMedium.checked = isChecked;
    filterEasy.checked = isChecked;
    filterMastered.checked = isChecked;
    filterCards();
}

function filterCards() {
    if (flashcards.length > 0) {
        displayFlashcards();
    }
}

function openCardModal(index = null) {
    editingCardIndex = index;

    if (index !== null) {
        const card = flashcards[index];
        modalTitle.textContent = 'Edit Card';
        modalQuestion.value = card.question;
        modalExplanation.value = card.explanation || '';

        // Load multiple choice data
        card.options.forEach((opt, i) => {
            document.getElementById(`option${i}`).value = opt;
        });
        document.querySelector(`input[name="correctAnswer"][value="${card.correctAnswer}"]`).checked = true;
    } else {
        modalTitle.textContent = 'Add New Card';
        modalQuestion.value = '';
        modalExplanation.value = '';
        document.querySelectorAll('.mc-input').forEach(input => input.value = '');
        document.querySelector('input[name="correctAnswer"]').checked = true;
    }

    cardModal.classList.remove('hidden');
    modalQuestion.focus();
}

function saveCardFromModal() {
    const question = modalQuestion.value.trim();
    const explanation = modalExplanation.value.trim();

    if (!question) {
        showNotification('Please enter a question', 'error');
        return;
    }

    // Get multiple choice options
    const options = [];
    for (let i = 0; i < 4; i++) {
        const opt = document.getElementById(`option${i}`).value.trim();
        if (!opt) {
            showNotification(`Please fill in option ${String.fromCharCode(65 + i)}`, 'error');
            return;
        }
        options.push(opt);
    }
    const correctAnswer = parseInt(document.querySelector('input[name="correctAnswer"]:checked').value);

    let cardData = {
        question,
        type: 'multiple',
        options,
        correctAnswer,
        explanation: explanation || '',
        difficulty: 'hard', // Always set to hard
        id: Date.now() + Math.random()
    };

    if (editingCardIndex !== null) {
        // Preserve existing id when editing
        cardData.id = flashcards[editingCardIndex].id;
        flashcards[editingCardIndex] = cardData;
    } else {
        flashcards.push(cardData);
    }

    saveFlashcards();
    displayFlashcards();
    cardModal.classList.add('hidden');
    showNotification(editingCardIndex !== null ? 'Card updated!' : 'Card added!');
}

function editCard(index) {
    openCardModal(index);
}

function deleteCard(index) {
    if (confirm('Are you sure you want to delete this card?')) {
        flashcards.splice(index, 1);
        saveFlashcards();
        displayFlashcards();
        showNotification('Card deleted');
    }
}

function deleteAllCards() {
    if (flashcards.length === 0) {
        showNotification('No cards to delete', 'error');
        return;
    }

    if (confirm(`Are you sure you want to delete ALL ${flashcards.length} cards? This cannot be undone!`)) {
        flashcards = [];
        stats = { totalSessions: 0, cardsStudied: new Set() };
        saveFlashcards();
        saveStats();
        cardsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No cards yet. Create some to get started!</p>';
        cardCount.textContent = '0';
        showNotification('All cards deleted');
    }
}

async function importStudyFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.txt', '.md', '.doc', '.docx'];
    const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidFile) {
        showNotification('Please upload a .txt, .md, or .doc file', 'error');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;

            if (!text || text.trim().length === 0) {
                showNotification('File is empty', 'error');
                return;
            }

            // Put the text into the input field
            inputText.value = text;

            // Show the input section
            cardsSection.classList.add('hidden');
            inputSection.classList.remove('hidden');

            showNotification('Study material loaded! Now use an AI provider to generate questions or use Claude Pro workflow.');

        } catch (error) {
            showNotification('Error reading file: ' + error.message, 'error');
        }
    };

    reader.onerror = () => {
        showNotification('Error reading file', 'error');
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

function exportCards() {
    if (flashcards.length === 0) {
        showNotification('No cards to export', 'error');
        return;
    }

    const dataStr = JSON.stringify(flashcards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flashcards-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Cards exported successfully!');
}

function importCards(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                throw new Error('Invalid file format');
            }

            // Merge or replace
            if (flashcards.length > 0) {
                if (confirm('Do you want to add these cards to your existing set? (Cancel to replace)')) {
                    flashcards = [...flashcards, ...imported];
                } else {
                    flashcards = imported;
                }
            } else {
                flashcards = imported;
            }

            // Ensure all cards have proper format
            flashcards = flashcards.map(card => ({
                ...card,
                type: 'multiple',
                difficulty: 'hard',
                id: card.id || Date.now() + Math.random()
            }));

            saveFlashcards();
            displayFlashcards();
            showNotification(`Imported ${imported.length} cards!`);
        } catch (error) {
            showNotification('Error importing cards: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

function startStudyMode() {
    if (flashcards.length === 0) {
        showNotification('No cards to study', 'error');
        return;
    }

    currentCardIndex = 0;

    // Get filtered cards for study
    const filters = getActiveFilters();
    studyCards = flashcards.filter(card => filters.includes(card.difficulty || 'unstudied'));

    if (studyCards.length === 0) {
        showNotification('No cards match your filters for studying', 'error');
        return;
    }

    // Shuffle if enabled
    if (shuffleMode.checked) {
        studyCards = [...studyCards].sort(() => Math.random() - 0.5);
    }

    totalCardsEl.textContent = studyCards.length;

    // Increment study sessions
    stats.totalSessions++;
    saveStats();

    showCard();
    cardsSection.classList.add('hidden');
    studySection.classList.remove('hidden');
}

function showCard() {
    if (studyCards.length === 0) return;

    const card = studyCards[currentCardIndex];
    questionText.textContent = card.question;
    answerText.textContent = card.answer;
    currentCardEl.textContent = currentCardIndex + 1;
    flashcard.classList.remove('flipped');

    // Update difficulty badges
    updateDifficultyBadge(card.difficulty);

    prevBtn.disabled = currentCardIndex === 0;
    nextBtn.disabled = currentCardIndex === studyCards.length - 1;
}

function updateDifficultyBadge(difficulty) {
    const badgeText = difficulty ? difficulty.toUpperCase() : 'NOT STUDIED';
    const badgeClass = difficulty ? `difficulty-badge difficulty-${difficulty}` : 'difficulty-badge difficulty-unstudied';

    frontDifficultyBadge.textContent = badgeText;
    frontDifficultyBadge.className = badgeClass;
    backDifficultyBadge.textContent = badgeText;
    backDifficultyBadge.className = badgeClass;
}

function setDifficulty(difficulty) {
    const card = studyCards[currentCardIndex];

    // Find the card in the main flashcards array and update it
    const mainCardIndex = flashcards.findIndex(c => c.id === card.id);
    if (mainCardIndex !== -1) {
        flashcards[mainCardIndex].difficulty = difficulty;
        card.difficulty = difficulty;
        stats.cardsStudied.add(card.id);
        saveFlashcards();
        saveStats();
        updateDifficultyBadge(difficulty);
        showNotification(`Marked as ${difficulty}`);

        // Auto-advance to next card
        setTimeout(() => {
            if (currentCardIndex < studyCards.length - 1) {
                nextCard();
            }
        }, 500);
    }
}

function previousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCard();
    }
}

function nextCard() {
    if (currentCardIndex < studyCards.length - 1) {
        currentCardIndex++;
        showCard();
    }
}

function exitStudyMode() {
    studySection.classList.add('hidden');
    displayFlashcards(); // Refresh to show updated difficulties
}

// Test Mode Functions
function startTestMode() {
    if (flashcards.length === 0) {
        showNotification('No cards to test', 'error');
        return;
    }

    currentTestIndex = 0;
    testScore = 0;

    // Get filtered cards
    const filters = getActiveFilters();
    testCards = flashcards.filter(card => filters.includes(card.difficulty || 'unstudied'));

    if (testCards.length === 0) {
        showNotification('No cards match your filters for testing', 'error');
        return;
    }

    // Shuffle
    testCards = [...testCards].sort(() => Math.random() - 0.5);

    totalQuestions.textContent = testCards.length;
    testTotalEl.textContent = testCards.length;
    testScoreEl.textContent = '0';

    showTestQuestion();
    cardsSection.classList.add('hidden');
    testSection.classList.remove('hidden');
}

function showTestQuestion() {
    if (currentTestIndex >= testCards.length) {
        showTestComplete();
        return;
    }

    const card = testCards[currentTestIndex];

    currentQuestion.textContent = currentTestIndex + 1;
    testQuestion.textContent = card.question;

    // Set badge to show hard difficulty
    questionTypeBadge.textContent = 'HARD';
    questionTypeBadge.style.background = '#ff6b6b';
    questionTypeBadge.style.color = 'white';

    // Hide all answer sections
    mcAnswerSection.classList.add('hidden');
    writtenAnswerSection.classList.add('hidden');
    flashcardTestSection.classList.add('hidden');
    answerFeedback.classList.add('hidden');

    // Show multiple choice section
    setupMultipleChoice(card);
}

function setupMultipleChoice(card) {
    mcAnswerSection.classList.remove('hidden');

    card.options.forEach((option, index) => {
        const btn = document.querySelector(`.mc-answer-btn[data-index="${index}"]`);
        btn.querySelector('.mc-text').textContent = option;
        btn.classList.remove('correct', 'incorrect', 'selected');
        btn.disabled = false;
    });
}

function setupWrittenAnswer() {
    writtenAnswerSection.classList.remove('hidden');
    writtenAnswerInput.value = '';
    writtenAnswerInput.disabled = false;
    submitWrittenBtn.disabled = false;
}

function setupFlashcardTest(card) {
    flashcardTestSection.classList.remove('hidden');
    flashcardTestAnswer.textContent = card.answer;
    flashcardTestAnswer.classList.add('hidden');
    revealAnswerBtn.classList.remove('hidden');
    selfGradeSection.classList.add('hidden');
}

function handleMultipleChoiceAnswer(selectedIndex) {
    const card = testCards[currentTestIndex];
    const buttons = document.querySelectorAll('.mc-answer-btn');

    // Disable all buttons
    buttons.forEach(btn => btn.disabled = true);

    // Mark correct and incorrect
    buttons[card.correctAnswer].classList.add('correct');
    if (selectedIndex !== card.correctAnswer) {
        buttons[selectedIndex].classList.add('incorrect');
    }

    // Show feedback with explanation
    const isCorrect = selectedIndex === card.correctAnswer;
    if (isCorrect) testScore++;

    let feedbackMessage = isCorrect
        ? 'Correct!'
        : `Incorrect. The correct answer was ${String.fromCharCode(65 + card.correctAnswer)}: ${card.options[card.correctAnswer]}`;

    if (card.explanation) {
        feedbackMessage += `\n\nExplanation: ${card.explanation}`;
    }

    showFeedback(isCorrect, feedbackMessage);
}

async function submitWrittenAnswer() {
    const userAnswer = writtenAnswerInput.value.trim();
    const card = testCards[currentTestIndex];

    if (!userAnswer) {
        showNotification('Please enter an answer', 'error');
        return;
    }

    submitWrittenBtn.disabled = true;
    writtenAnswerInput.disabled = true;
    submitWrittenBtn.textContent = 'Evaluating...';

    try {
        const result = await evaluateWrittenAnswer(card.question, userAnswer, card.expectedAnswer);

        if (result.correct) testScore++;

        showFeedback(result.correct, result.feedback);
    } catch (error) {
        showNotification('Error evaluating answer: ' + error.message, 'error');
        submitWrittenBtn.disabled = false;
        writtenAnswerInput.disabled = false;
    } finally {
        submitWrittenBtn.textContent = 'Submit Answer';
    }
}

async function evaluateWrittenAnswer(question, userAnswer, expectedAnswer) {
    // Use whichever API is available
    const useOpenAI = openaiKey && (!apiKey || currentAIProvider === 'openai');

    if (!openaiKey && !apiKey) {
        // Simple text comparison fallback
        const similarity = userAnswer.toLowerCase().includes(expectedAnswer.toLowerCase()) ||
                          expectedAnswer.toLowerCase().includes(userAnswer.toLowerCase());

        return {
            correct: similarity,
            feedback: similarity
                ? 'Correct! Your answer matches the expected response.'
                : `Incorrect. Expected answer: ${expectedAnswer}`
        };
    }

    try {
        if (useOpenAI) {
            return await evaluateWithOpenAI(question, userAnswer, expectedAnswer);
        } else {
            return await evaluateWithClaude(question, userAnswer, expectedAnswer);
        }
    } catch (error) {
        console.error('AI evaluation failed, using fallback:', error);
        // Fallback to simple comparison
        const similarity = userAnswer.toLowerCase().includes(expectedAnswer.toLowerCase()) ||
                          expectedAnswer.toLowerCase().includes(userAnswer.toLowerCase());
        return {
            correct: similarity,
            feedback: similarity
                ? 'Correct! Your answer matches the expected response.'
                : `Incorrect. Expected answer: ${expectedAnswer}`
        };
    }
}

async function evaluateWithClaude(question, userAnswer, expectedAnswer) {
    // Clean and validate API key
    const cleanKey = apiKey.trim().replace(/[^\x00-\xFF]/g, '');

    if (!cleanKey) {
        throw new Error('Invalid API key format');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            messages: [{
                role: 'user',
                content: `Evaluate if this answer is correct.

Question: ${question}
Expected Answer: ${expectedAnswer}
Student's Answer: ${userAnswer}

Return JSON in this format: {"correct": true/false, "feedback": "explanation"}
Consider the answer correct if it conveys the same meaning, even if worded differently.`
            }]
        })
    });

    const data = await response.json();
    let content = data.content[0].text.trim();

    if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    return JSON.parse(content);
}

async function evaluateWithOpenAI(question, userAnswer, expectedAnswer) {
    // Clean and validate API key
    const cleanKey = openaiKey.trim().replace(/[^\x00-\xFF]/g, '');

    if (!cleanKey) {
        throw new Error('Invalid API key format');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',  // Changed to gpt-3.5-turbo which is available to all accounts
            messages: [{
                role: 'system',
                content: 'You are evaluating student answers. Return only JSON.'
            }, {
                role: 'user',
                content: `Evaluate: Question: ${question}\nExpected: ${expectedAnswer}\nStudent: ${userAnswer}\n\nReturn: {"correct": boolean, "feedback": "explanation"}`
            }],
            temperature: 0.3
        })
    });

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    return JSON.parse(content);
}

function revealFlashcardAnswer() {
    flashcardTestAnswer.classList.remove('hidden');
    revealAnswerBtn.classList.add('hidden');
    selfGradeSection.classList.remove('hidden');
}

function handleSelfGrade(isCorrect) {
    if (isCorrect) testScore++;

    showFeedback(isCorrect, isCorrect ? 'Great job!' : 'Keep practicing!');
}

function showFeedback(isCorrect, message) {
    testScoreEl.textContent = testScore;

    const feedbackContent = answerFeedback.querySelector('.feedback-content');
    feedbackContent.className = 'feedback-content ' + (isCorrect ? 'correct' : 'incorrect');

    // Convert newlines to <br> tags for proper display
    const formattedMessage = message.replace(/\n/g, '<br>');

    feedbackContent.innerHTML = `
        <h4>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</h4>
        <p>${formattedMessage}</p>
    `;

    answerFeedback.classList.remove('hidden');
}

function nextTestQuestion() {
    currentTestIndex++;
    showTestQuestion();
}

function showTestComplete() {
    const percentage = Math.round((testScore / testCards.length) * 100);

    testQuestion.textContent = 'Test Complete!';
    questionTypeBadge.style.display = 'none';

    mcAnswerSection.classList.add('hidden');
    writtenAnswerSection.classList.add('hidden');
    flashcardTestSection.classList.add('hidden');

    const feedbackContent = answerFeedback.querySelector('.feedback-content');
    feedbackContent.className = 'feedback-content';
    feedbackContent.innerHTML = `
        <h4>Final Score: ${testScore}/${testCards.length} (${percentage}%)</h4>
        <p>${percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good effort!' : 'Keep studying!'}</p>
    `;
    answerFeedback.classList.remove('hidden');
    nextQuestionBtn.textContent = 'Finish';
    nextQuestionBtn.onclick = exitTestMode;
}

function exitTestMode() {
    testSection.classList.add('hidden');
    displayFlashcards();
}

function createNewCards() {
    if (flashcards.length > 0) {
        if (!confirm('This will clear your current cards. Are you sure?')) {
            return;
        }
    }
    flashcards = [];
    saveFlashcards();
    inputText.value = '';
    cardsSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkModeToggle.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
}

function saveStats() {
    // Convert Set to Array for storage
    const statsToSave = {
        totalSessions: stats.totalSessions,
        cardsStudied: Array.from(stats.cardsStudied)
    };
    localStorage.setItem('flashcardStats', JSON.stringify(statsToSave));
}

function showStatistics() {
    // Load stats
    const savedStats = localStorage.getItem('flashcardStats');
    if (savedStats) {
        const parsed = JSON.parse(savedStats);
        stats = {
            totalSessions: parsed.totalSessions,
            cardsStudied: new Set(parsed.cardsStudied)
        };
    }

    // Calculate stats
    const total = flashcards.length;
    const studied = flashcards.filter(c => c.difficulty).length;
    const mastered = flashcards.filter(c => c.difficulty === 'mastered').length;
    const easy = flashcards.filter(c => c.difficulty === 'easy').length;
    const medium = flashcards.filter(c => c.difficulty === 'medium').length;
    const hard = flashcards.filter(c => c.difficulty === 'hard').length;
    const unstudied = total - studied;

    // Update stat cards
    document.getElementById('totalCardsCount').textContent = total;
    document.getElementById('studiedCount').textContent = studied;
    document.getElementById('masteredCount').textContent = mastered;
    document.getElementById('studySessionsCount').textContent = stats.totalSessions;

    // Update progress bar
    if (total > 0) {
        document.getElementById('progressMastered').style.width = `${(mastered / total) * 100}%`;
        document.getElementById('progressEasy').style.width = `${(easy / total) * 100}%`;
        document.getElementById('progressMedium').style.width = `${(medium / total) * 100}%`;
        document.getElementById('progressHard').style.width = `${(hard / total) * 100}%`;
        document.getElementById('progressUnstudied').style.width = `${(unstudied / total) * 100}%`;
    }

    // Update legend
    document.getElementById('legendMastered').textContent = mastered;
    document.getElementById('legendEasy').textContent = easy;
    document.getElementById('legendMedium').textContent = medium;
    document.getElementById('legendHard').textContent = hard;
    document.getElementById('legendUnstudied').textContent = unstudied;

    statsModal.classList.remove('hidden');
}

document.getElementById('resetStats').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all statistics? This will clear difficulty ratings.')) {
        flashcards.forEach(card => card.difficulty = null);
        stats = { totalSessions: 0, cardsStudied: new Set() };
        saveFlashcards();
        saveStats();
        showStatistics();
        showNotification('Statistics reset');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Close modals with Escape
    if (e.key === 'Escape') {
        cardModal.classList.add('hidden');
        helpModal.classList.add('hidden');
        statsModal.classList.add('hidden');
        if (!studySection.classList.contains('hidden')) {
            exitStudyMode();
        }
        return;
    }

    // Study mode shortcuts
    if (!studySection.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            previousCard();
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextCard();
        }
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            flashcard.classList.toggle('flipped');
        }
        if (e.key === '1') {
            e.preventDefault();
            setDifficulty('hard');
        }
        if (e.key === '2') {
            e.preventDefault();
            setDifficulty('medium');
        }
        if (e.key === '3') {
            e.preventDefault();
            setDifficulty('easy');
        }
        if (e.key === '4') {
            e.preventDefault();
            setDifficulty('mastered');
        }
    }
});

// Click outside modal to close
[cardModal, helpModal, statsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});
