// Quill editor instance
let quillEditor = null;
let currentProject = null;

// Initialize the project detail page
export function initProjectDetailPage() {
    // Initialize Quill editor when DOM is ready
    if (typeof Quill !== 'undefined' && !quillEditor) {
        const editorElement = document.getElementById('notesEditor');
        if (editorElement) {
            quillEditor = new Quill('#notesEditor', {
                theme: 'snow',
                placeholder: 'Write your notes here...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        ['link', 'image', 'code-block'],
                        ['clean']
                    ]
                }
            });
        }
    }

    setupProjectDetailEventListeners();
}

// Expose to window for onclick handlers
window.openProjectDetail = openProject;

// Setup event listeners for project detail page
function setupProjectDetailEventListeners() {
    // Back to projects button
    const backBtn = document.getElementById('backToProjectsBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showPage('projectsPage');
        });
    }

    // Project tabs
    document.querySelectorAll('.project-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            switchProjectTab(tabName);
        });
    });

    // Save notes button
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', saveNotes);
    }

    // Regenerate project button
    const regenerateBtn = document.getElementById('regenerateProjectBtn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', regenerateProject);
    }

    // Add test card button
    const addTestCardBtn = document.getElementById('addTestCardBtn');
    if (addTestCardBtn) {
        addTestCardBtn.addEventListener('click', openAddTestCardModal);
    }

    // Add study card button
    const addStudyCardBtn = document.getElementById('addStudyCardBtn');
    if (addStudyCardBtn) {
        addStudyCardBtn.addEventListener('click', openAddStudyCardModal);
    }

    // Save test card button
    const saveTestCardBtn = document.getElementById('saveTestCardBtn');
    if (saveTestCardBtn) {
        saveTestCardBtn.addEventListener('click', saveNewTestCard);
    }

    // Save study card button
    const saveStudyCardBtn = document.getElementById('saveStudyCardBtn');
    if (saveStudyCardBtn) {
        saveStudyCardBtn.addEventListener('click', saveNewStudyCard);
    }

    // Color picker in add study card modal
    document.querySelectorAll('#addStudyCardModal .color-picker-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('#addStudyCardModal .color-picker-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            document.getElementById('studyCardColor').value = this.dataset.color;
        });
    });

    // Start test from project
    const startTestBtn = document.getElementById('startProjectTestBtn');
    if (startTestBtn) {
        startTestBtn.addEventListener('click', startProjectTest);
    }
}

// Open a project in detail view
async function openProject(projectId) {
    try {
        console.log('Opening project:', projectId);
        console.log('Available projects:', window.projects);

        // Get project data from window.projects (already loaded)
        const project = window.projects ? window.projects.find(p => p.id === projectId) : null;

        console.log('Found project:', project);

        if (!project) {
            showNotification('Project not found: ' + projectId, 'error');
            console.error('Project not found in window.projects');
            return;
        }

        currentProject = project;

        // Update UI
        const titleElement = document.getElementById('projectDetailTitle');
        if (titleElement) {
            titleElement.textContent = currentProject.name;
        }

        // Load notes into editor
        if (quillEditor) {
            if (currentProject.notes) {
                quillEditor.root.innerHTML = currentProject.notes;
            } else {
                quillEditor.setText('');
            }
        }

        // Load saved language preference
        const languageSelect = document.getElementById('generationLanguage');
        if (languageSelect && currentProject.language) {
            languageSelect.value = currentProject.language;
        }

        // Load test cards (from existing cards data)
        loadTestCards(projectId);

        // Load study cards
        loadStudyCards(projectId);

        // Show project detail page
        showPage('projectDetailPage');

        // Switch to notes tab by default
        switchProjectTab('notes');

    } catch (error) {
        console.error('Error opening project:', error);
        showNotification('Failed to load project', 'error');
    }
}

// Switch between project tabs
function switchProjectTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.project-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`.project-tab[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Update tab content
    document.querySelectorAll('.project-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeContent = document.getElementById(`${tabName}Tab`);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    // Refresh mind map whenever switching to it
    if (tabName === 'mindMap') {
        // Use setTimeout to ensure the tab is visible before rendering
        setTimeout(() => {
            renderMindMap();
        }, 100);
    }
}

// Open add test card modal
function openAddTestCardModal() {
    // Clear form
    document.getElementById('testCardQuestion').value = '';
    document.getElementById('testCardOption0').value = '';
    document.getElementById('testCardOption1').value = '';
    document.getElementById('testCardOption2').value = '';
    document.getElementById('testCardOption3').value = '';
    document.getElementById('testCardExplanation').value = '';
    document.getElementById('testCardDifficulty').value = 'medium';
    document.querySelector('input[name="testCardCorrect"][value="0"]').checked = true;

    // Show modal
    document.getElementById('addTestCardModal').classList.remove('hidden');
}

// Open add study card modal
function openAddStudyCardModal() {
    if (!currentProject || !currentProject.studyCards) return;

    // Clear form
    document.getElementById('studyCardTitle').value = '';
    document.getElementById('studyCardContent').value = '';
    document.getElementById('studyCardCategory').value = 'primary';
    document.getElementById('studyCardColor').value = '#667eea';

    // Reset color selection
    document.querySelectorAll('#addStudyCardModal .color-picker-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector('#addStudyCardModal .color-picker-option[data-color="#667eea"]').classList.add('selected');

    // Populate parent dropdown
    const parentSelect = document.getElementById('studyCardParent');
    parentSelect.innerHTML = '<option value="">No Parent (Root Level)</option>';

    currentProject.studyCards.forEach((card, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = card.topic || card.term || `Card ${index + 1}`;
        parentSelect.appendChild(option);
    });

    // Show modal
    document.getElementById('addStudyCardModal').classList.remove('hidden');
}

// Save new test card
async function saveNewTestCard() {
    try {
        const question = document.getElementById('testCardQuestion').value.trim();
        const options = [
            document.getElementById('testCardOption0').value.trim(),
            document.getElementById('testCardOption1').value.trim(),
            document.getElementById('testCardOption2').value.trim(),
            document.getElementById('testCardOption3').value.trim()
        ];
        const correctAnswer = parseInt(document.querySelector('input[name="testCardCorrect"]:checked').value);
        const explanation = document.getElementById('testCardExplanation').value.trim();
        const difficulty = document.getElementById('testCardDifficulty').value;

        // Validation
        if (!question) {
            showNotification('Please enter a question', 'error');
            return;
        }
        if (options.some(opt => !opt)) {
            showNotification('Please fill in all answer options', 'error');
            return;
        }

        const user = window.auth.currentUser;
        const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

        const cardData = {
            projectId: currentProject.id,
            question: question,
            options: options,
            correctAnswer: correctAnswer,
            explanation: explanation,
            difficulty: difficulty,
            mastered: false,
            locked: false,
            createdAt: Date.now()
        };

        const cardsRef = ref(window.db, `users/${user.uid}/cards`);
        await push(cardsRef, cardData);

        // Reload cards
        if (window.loadCards) {
            await window.loadCards();
        }
        loadTestCards(currentProject.id);

        // Close modal
        document.getElementById('addTestCardModal').classList.add('hidden');
        showNotification('Test card added successfully', 'success');
    } catch (error) {
        console.error('Error saving test card:', error);
        showNotification('Failed to save test card', 'error');
    }
}

// Save new study card
async function saveNewStudyCard() {
    try {
        const title = document.getElementById('studyCardTitle').value.trim();
        const content = document.getElementById('studyCardContent').value.trim();
        const parentValue = document.getElementById('studyCardParent').value;
        const category = document.getElementById('studyCardCategory').value;
        const color = document.getElementById('studyCardColor').value;

        // Validation
        if (!title) {
            showNotification('Please enter a title', 'error');
            return;
        }
        if (!content) {
            showNotification('Please enter content', 'error');
            return;
        }

        const user = window.auth.currentUser;
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

        // Create new study card
        const newCard = {
            topic: title,
            content: content,
            category: category,
            color: color,
            parentIndex: parentValue === '' ? null : parseInt(parentValue),
            level: parentValue === '' ? 0 : (currentProject.studyCards[parseInt(parentValue)].level + 1)
        };

        // Add to existing study cards
        if (!currentProject.studyCards) {
            currentProject.studyCards = [];
        }
        currentProject.studyCards.push(newCard);

        // Save to Firebase
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            studyCards: currentProject.studyCards,
            studyCardsCount: currentProject.studyCards.length,
            updatedAt: new Date().toISOString()
        });

        // Update window.projects
        if (window.projects) {
            const projectIndex = window.projects.findIndex(p => p.id === currentProject.id);
            if (projectIndex !== -1) {
                window.projects[projectIndex].studyCards = currentProject.studyCards;
                window.projects[projectIndex].studyCardsCount = currentProject.studyCards.length;
            }
        }

        // Reload display
        loadStudyCards(currentProject.id);

        // Refresh mind map if visible
        if (document.getElementById('mindMapTab').classList.contains('active')) {
            renderMindMap();
        }

        // Close modal
        document.getElementById('addStudyCardModal').classList.add('hidden');
        showNotification('Study card added successfully', 'success');
    } catch (error) {
        console.error('Error saving study card:', error);
        showNotification('Failed to save study card', 'error');
    }
}

// Save notes
async function saveNotes() {
    try {
        if (!window.auth || !window.auth.currentUser || !currentProject) {
            showNotification('Please log in to save notes', 'error');
            return;
        }

        if (!quillEditor) {
            showNotification('Editor not initialized', 'error');
            return;
        }

        const notes = quillEditor.root.innerHTML;
        const user = window.auth.currentUser;

        // Get selected language
        const languageSelect = document.getElementById('generationLanguage');
        const language = languageSelect ? languageSelect.value : 'en';

        // Import Firebase functions dynamically
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            notes: notes,
            language: language,
            updatedAt: new Date().toISOString()
        });

        // Update local project data
        currentProject.notes = notes;
        currentProject.language = language;
        if (window.projects) {
            const projectIndex = window.projects.findIndex(p => p.id === currentProject.id);
            if (projectIndex !== -1) {
                window.projects[projectIndex].notes = notes;
                window.projects[projectIndex].language = language;
            }
        }

        showNotification('Notes saved successfully', 'success');
    } catch (error) {
        console.error('Error saving notes:', error);
        showNotification('Failed to save notes: ' + error.message, 'error');
    }
}

// Helper function to retry API calls
async function retryAPICall(apiCall, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await apiCall();
            return result;
        } catch (error) {
            console.error(`API call attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            // Wait 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`Retrying... (attempt ${attempt + 1}/${maxRetries})`);
        }
    }
}

// Regenerate project (test cards and study cards)
async function regenerateProject() {
    try {
        if (!window.auth || !window.auth.currentUser || !currentProject) {
            showNotification('Please log in to regenerate project', 'error');
            return;
        }

        if (!quillEditor) {
            showNotification('Editor not initialized', 'error');
            return;
        }

        // Confirm action
        if (!confirm('This will regenerate all test cards and study cards from your notes. Continue?')) {
            return;
        }

        const notesText = quillEditor.getText().trim();

        if (!notesText || notesText.length < 50) {
            showNotification('Please add more content to your notes (at least 50 characters)', 'error');
            return;
        }

        // Warn if text is very long
        if (notesText.length > 15000) {
            if (!confirm('Your notes are quite long (' + Math.round(notesText.length / 1000) + 'k characters). This may take longer to process. Continue?')) {
                return;
            }
        }

        // Check if user is Pro or Dev
        const isPro = window.isProUser || false;
        const isDev = window.isDevUser || false;
        const isAdmin = window.isAdminUser || false;

        if (!isPro && !isDev && !isAdmin) {
            showNotification('Regenerate Project is a Pro/Dev feature. Contact support to upgrade.', 'error');
            return;
        }

        // Show loading
        const regenerateBtn = document.getElementById('regenerateProjectBtn');
        const originalText = regenerateBtn.innerHTML;
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating study cards...';

        const user = window.auth.currentUser;
        // Try gpt-4o-mini first as it's more stable, fallback to gpt-5-nano
        const model = 'gpt-4o-mini';
        const quizCount = 20; // Reduced from 30 to avoid JSON parsing errors

        // Get selected language
        const languageSelect = document.getElementById('generationLanguage');
        const language = languageSelect ? languageSelect.value : 'en';
        const languageNames = {
            'en': 'English',
            'sk': 'Slovak',
            'cs': 'Czech',
            'de': 'German',
            'fr': 'French',
            'es': 'Spanish',
            'it': 'Italian',
            'pl': 'Polish',
            'ru': 'Russian'
        };
        const languageName = languageNames[language] || 'English';

        // Import Firebase functions
        const { ref, push, update, remove } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

        // Step 1: Generate study cards (with retry)
        const studyCardsPayload = {
            userId: user.uid,
            isPro: isPro || isDev || isAdmin,
            text: notesText,
            model: model,
            language: language,
            languageInstruction: `Generate all content in ${languageName}. Questions, answers, explanations, and all text should be in ${languageName}.`
        };
        console.log('Sending study cards request:', studyCardsPayload);

        const studyCardsData = await retryAPICall(async () => {
            const studyCardsResponse = await fetch('https://quizapp2-eight.vercel.app/api/generate-study-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studyCardsPayload)
            });

            if (!studyCardsResponse.ok) {
                let errorMessage = 'Failed to generate study cards';
                try {
                    const error = await studyCardsResponse.json();
                    console.error('Study cards API error:', error);
                    errorMessage = error.error || error.message || `Server error (${studyCardsResponse.status})`;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                    errorMessage = `Server error (${studyCardsResponse.status})`;
                }
                throw new Error(errorMessage);
            }

            const data = await studyCardsResponse.json();
            console.log('Study cards generated:', data);
            return data;
        });


        // Step 2: Generate quiz cards (with retry)
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating test cards...';

        const quizCardsData = await retryAPICall(async () => {
            const quizCardsResponse = await fetch('https://quizapp2-eight.vercel.app/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    isPro: isPro || isDev || isAdmin,
                    text: notesText,
                    count: quizCount,
                    model: model,
                    difficulty: 'mixed',
                    language: language,
                    languageInstruction: `Generate all content in ${languageName}. Questions, answers, explanations, and all text should be in ${languageName}.`
                })
            });

            if (!quizCardsResponse.ok) {
                let errorMessage = 'Failed to generate test cards';
                try {
                    const error = await quizCardsResponse.json();
                    console.error('Quiz cards API error:', error);
                    errorMessage = error.error || error.message || `Server error (${quizCardsResponse.status})`;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                    errorMessage = `Server error (${quizCardsResponse.status})`;
                }
                throw new Error(errorMessage);
            }

            const data = await quizCardsResponse.json();
            console.log('Quiz cards generated:', data);
            return data;
        });

        // Step 3: Delete old cards before saving new ones
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting old cards...';

        // Delete all unlocked test cards for this project
        if (window.cards) {
            const projectCards = window.cards.filter(c => c.projectId === currentProject.id);
            console.log('Found project cards:', projectCards);

            for (const card of projectCards) {
                // Only delete if not locked
                if (!card.locked) {
                    const cardRef = ref(window.db, `users/${user.uid}/cards/${card.id}`);
                    await remove(cardRef);
                    console.log('Deleted unlocked card:', card.id);
                }
            }
        }

        // Step 4: Save new quiz cards
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving new test cards...';

        const cardsRef = ref(window.db, `users/${user.uid}/cards`);
        for (const card of quizCardsData.cards) {
            const cardData = {
                projectId: currentProject.id,
                question: card.question,
                options: card.options,
                correctAnswer: card.correctAnswer,
                explanation: card.explanation || '',
                difficulty: card.difficulty || 'medium',
                mastered: false,
                locked: false,
                createdAt: Date.now()
            };
            await push(cardsRef, cardData);
        }

        // Save study cards to project
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            studyCards: studyCardsData.cards,
            studyCardsCount: studyCardsData.count,
            language: language,
            updatedAt: new Date().toISOString()
        });

        // Update local project data
        currentProject.studyCards = studyCardsData.cards;
        currentProject.studyCardsCount = studyCardsData.count;
        currentProject.language = language;

        if (window.projects) {
            const projectIndex = window.projects.findIndex(p => p.id === currentProject.id);
            if (projectIndex !== -1) {
                window.projects[projectIndex].studyCards = studyCardsData.cards;
                window.projects[projectIndex].studyCardsCount = studyCardsData.count;
                window.projects[projectIndex].language = language;
            }
        }

        // Reload cards from database
        if (window.loadCards) {
            await window.loadCards();
        }

        // Success!
        showNotification(`Generated ${studyCardsData.count} study cards and ${quizCardsData.cards.length} test cards!`, 'success');

        // Reload the cards display
        loadTestCards(currentProject.id);
        loadStudyCards(currentProject.id);

        regenerateBtn.disabled = false;
        regenerateBtn.innerHTML = originalText;

    } catch (error) {
        console.error('Error regenerating project:', error);
        showNotification('Failed to regenerate project: ' + error.message, 'error');

        const regenerateBtn = document.getElementById('regenerateProjectBtn');
        if (regenerateBtn) {
            regenerateBtn.disabled = false;
            regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate Project';
        }
    }
}

// Load test cards
function loadTestCards(projectId) {
    try {
        const testCardsList = document.getElementById('testCardsList');
        if (!testCardsList) return;

        // Get cards from window.cards that belong to this project
        const projectCards = window.cards ? window.cards.filter(c => c.projectId === projectId) : [];

        if (projectCards.length === 0) {
            testCardsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-layer-group"></i>
                    <p>No test cards yet. Add cards or regenerate the project!</p>
                </div>
            `;
            return;
        }

        testCardsList.innerHTML = projectCards.map(card => `
            <div class="card-item test-card-item">
                <div class="card-question">${escapeHtml(card.question)}</div>
                <div class="card-options">
                    ${card.options.map((opt, idx) => `
                        <div class="card-option ${idx === card.correctAnswer ? 'correct' : ''}">
                            ${String.fromCharCode(65 + idx)}. ${escapeHtml(opt)}
                        </div>
                    `).join('')}
                </div>
                ${card.explanation ? `
                    <div style="margin-top: var(--spacing-md); padding: var(--spacing-md); background: var(--surface-light); border-radius: var(--radius-sm); font-size: 0.875rem; color: var(--text-secondary);">
                        <strong>Explanation:</strong> ${escapeHtml(card.explanation)}
                    </div>
                ` : ''}
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading test cards:', error);
    }
}

// Load study cards
function loadStudyCards(projectId) {
    try {
        const studyCardsList = document.getElementById('studyCardsList');
        if (!studyCardsList) return;

        // Check if project has study cards data
        const project = window.projects ? window.projects.find(p => p.id === projectId) : null;
        const hasStudyCards = project && project.studyCards;

        console.log('Loading study cards for project:', project);
        console.log('Study cards data:', project?.studyCards);

        // Log first card structure to debug
        if (project?.studyCards && project.studyCards.length > 0) {
            console.log('First study card structure:', project.studyCards[0]);
            console.log('Available fields:', Object.keys(project.studyCards[0]));
        }

        if (!hasStudyCards) {
            studyCardsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-brain"></i>
                    <p>No study cards yet. Regenerate the project to create study cards!</p>
                </div>
            `;
            return;
        }

        // Display study cards from project data
        const studyCards = Array.isArray(project.studyCards) ? project.studyCards : [];

        if (studyCards.length === 0) {
            studyCardsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-brain"></i>
                    <p>No study cards yet. Regenerate the project to create study cards!</p>
                </div>
            `;
            return;
        }

        studyCardsList.innerHTML = studyCards.map((card, index) => {
            const cardColor = card.color || '#667eea';
            return `
            <div class="card-item study-card" data-card-index="${index}" style="border-left-color: ${cardColor};">
                <div class="study-card-color-indicator" style="background: ${cardColor};" data-card-index="${index}"></div>

                <!-- Display Mode -->
                <div class="study-card-display">
                    <div class="card-question">${escapeHtml(card.topic || card.term || card.name || card.title || 'Untitled')}</div>
                    <div style="color: var(--text-secondary); font-size: 0.938rem; line-height: 1.5;">
                        ${escapeHtml(card.content || card.definition || card.description || '')}
                    </div>
                    ${card.level !== undefined ? `
                        <div style="font-size: 0.875rem; color: var(--text-muted);">
                            <i class="fas fa-layer-group"></i> Level ${card.level}
                            ${card.category ? ` • <i class="fas fa-tag"></i> ${card.category}` : ''}
                        </div>
                    ` : ''}
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; opacity: 0.7;">
                        Click to edit
                    </div>
                </div>

                <!-- Edit Mode -->
                <div class="study-card-edit-form">
                    <div class="form-group" style="margin-bottom: var(--spacing-md);">
                        <label>Title</label>
                        <input type="text" class="text-input study-card-title" value="${escapeHtml(card.topic || card.term || card.name || card.title || '')}" />
                    </div>
                    <div class="form-group" style="margin-bottom: var(--spacing-md);">
                        <label>Description</label>
                        <textarea class="text-input study-card-description" rows="3">${escapeHtml(card.content || card.definition || card.description || '')}</textarea>
                    </div>
                    <div style="display: flex; gap: var(--spacing-sm);">
                        <button class="btn btn-primary btn-sm save-study-card" data-card-index="${index}">
                            <i class="fas fa-save"></i> Save
                        </button>
                        <button class="btn btn-secondary btn-sm cancel-study-card-edit">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Add click handlers for study cards
        document.querySelectorAll('.study-card').forEach(cardEl => {
            cardEl.addEventListener('click', (e) => {
                // Don't trigger edit mode if clicking color indicator or already editing
                if (e.target.classList.contains('study-card-color-indicator') ||
                    cardEl.classList.contains('editing') ||
                    e.target.closest('.study-card-edit-form')) {
                    return;
                }
                cardEl.classList.add('editing');
            });
        });

        // Add click handlers for color indicators
        document.querySelectorAll('.study-card-color-indicator').forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                e.stopPropagation();
                showColorPicker(e.target, parseInt(indicator.dataset.cardIndex));
            });
        });

        // Add save handlers
        document.querySelectorAll('.save-study-card').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.cardIndex);
                await saveStudyCardEdit(index);
            });
        });

        // Add cancel handlers
        document.querySelectorAll('.cancel-study-card-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardEl = btn.closest('.study-card');
                cardEl.classList.remove('editing');
            });
        });

    } catch (error) {
        console.error('Error loading study cards:', error);
    }
}

// Save study card edit
async function saveStudyCardEdit(cardIndex) {
    try {
        const cardEl = document.querySelector(`.study-card[data-card-index="${cardIndex}"]`);
        const titleInput = cardEl.querySelector('.study-card-title');
        const descInput = cardEl.querySelector('.study-card-description');

        const newTitle = titleInput.value.trim();
        const newDescription = descInput.value.trim();

        if (!newTitle) {
            showNotification('Title cannot be empty', 'error');
            return;
        }

        // Update the study card in the project
        if (currentProject.studyCards && currentProject.studyCards[cardIndex]) {
            currentProject.studyCards[cardIndex].topic = newTitle;
            currentProject.studyCards[cardIndex].content = newDescription;

            // Save to Firebase
            const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
            const user = window.auth.currentUser;
            const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
            await update(projectRef, {
                studyCards: currentProject.studyCards,
                updatedAt: new Date().toISOString()
            });

            // Update display and exit edit mode
            cardEl.classList.remove('editing');
            loadStudyCards(currentProject.id);
            showNotification('Study card updated', 'success');

            // Refresh mind map if it's visible
            if (document.getElementById('mindMapTab').classList.contains('active')) {
                renderMindMap();
            }
        }
    } catch (error) {
        console.error('Error saving study card:', error);
        showNotification('Failed to save study card', 'error');
    }
}

// Show color picker for study card
function showColorPicker(targetElement, cardIndex) {
    // Remove any existing color picker
    const existing = document.querySelector('.color-picker-modal');
    if (existing) existing.remove();

    // Create color picker
    const colorPicker = document.createElement('div');
    colorPicker.className = 'color-picker-modal active';

    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#30cfd0', '#330867',
        '#ff6b6b', '#ee5a6f', '#ffd93d', '#6bcf7f',
        '#4a90e2', '#9013fe', '#50c878', '#ff6347'
    ];

    colorPicker.innerHTML = `
        <div style="margin-bottom: var(--spacing-sm); font-weight: 600; color: var(--text-primary);">
            Choose Color
        </div>
        <div class="color-picker-grid">
            ${colors.map(color => `
                <div class="color-picker-option" style="background: ${color};" data-color="${color}"></div>
            `).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="this.closest('.color-picker-modal').remove()">
            Cancel
        </button>
    `;

    // Position the picker
    const rect = targetElement.getBoundingClientRect();
    colorPicker.style.position = 'fixed';
    colorPicker.style.left = `${rect.left}px`;
    colorPicker.style.top = `${rect.bottom + 8}px`;

    document.body.appendChild(colorPicker);

    // Add click handlers for color options
    colorPicker.querySelectorAll('.color-picker-option').forEach(option => {
        option.addEventListener('click', async () => {
            const color = option.dataset.color;
            await updateStudyCardColor(cardIndex, color);
            colorPicker.remove();
        });
    });

    // Close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeColorPicker(e) {
            if (!colorPicker.contains(e.target) && e.target !== targetElement) {
                colorPicker.remove();
                document.removeEventListener('click', closeColorPicker);
            }
        });
    }, 100);
}

// Update study card color
async function updateStudyCardColor(cardIndex, color) {
    try {
        if (!currentProject.studyCards || !currentProject.studyCards[cardIndex]) return;

        // Update color in study card
        currentProject.studyCards[cardIndex].color = color;

        // Save to Firebase
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const user = window.auth.currentUser;
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            studyCards: currentProject.studyCards,
            updatedAt: new Date().toISOString()
        });

        // Reload study cards display
        loadStudyCards(currentProject.id);

        // Refresh mind map if it's visible
        if (document.getElementById('mindMapTab').classList.contains('active')) {
            renderMindMap();
        }

        showNotification('Color updated', 'success');
    } catch (error) {
        console.error('Error updating color:', error);
        showNotification('Failed to update color', 'error');
    }
}

// Show color picker for mind map node
function showMindMapColorPicker(event, nodeId) {
    // Remove any existing color picker
    const existing = document.querySelector('.color-picker-modal');
    if (existing) existing.remove();

    // Create color picker
    const colorPicker = document.createElement('div');
    colorPicker.className = 'color-picker-modal active';

    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#30cfd0', '#330867',
        '#ff6b6b', '#ee5a6f', '#ffd93d', '#6bcf7f',
        '#4a90e2', '#9013fe', '#50c878', '#ff6347'
    ];

    colorPicker.innerHTML = `
        <div style="margin-bottom: var(--spacing-sm); font-weight: 600; color: var(--text-primary);">
            Choose Node Color
        </div>
        <div class="color-picker-grid">
            ${colors.map(color => `
                <div class="color-picker-option" style="background: ${color};" data-color="${color}"></div>
            `).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="this.closest('.color-picker-modal').remove()">
            Cancel
        </button>
    `;

    // Position the picker near the click
    colorPicker.style.position = 'fixed';
    colorPicker.style.left = `${event.clientX + 10}px`;
    colorPicker.style.top = `${event.clientY + 10}px`;

    document.body.appendChild(colorPicker);

    // Add click handlers for color options
    colorPicker.querySelectorAll('.color-picker-option').forEach(option => {
        option.addEventListener('click', async () => {
            const color = option.dataset.color;
            await updateStudyCardColor(nodeId, color);
            colorPicker.remove();
        });
    });

    // Close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeColorPicker(e) {
            if (!colorPicker.contains(e.target)) {
                colorPicker.remove();
                document.removeEventListener('click', closeColorPicker);
            }
        });
    }, 100);
}

// Render mind map
function renderMindMap() {
    const mindMapContainer = document.getElementById('projectMindMapContainer');
    const svgElement = document.getElementById('projectMindMapSvg');
    const tooltip = document.getElementById('projectMindMapTooltip');

    if (!mindMapContainer || !svgElement) return;

    const project = currentProject;
    const hasStudyCards = project && project.studyCards && project.studyCards.length > 0;

    if (!hasStudyCards) {
        mindMapContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-project-diagram"></i>
                <p>No study cards to visualize. Regenerate the project to create a mind map!</p>
            </div>
        `;
        return;
    }

    // Clear previous visualization
    svgElement.innerHTML = '';

    const studyCards = project.studyCards;
    const width = mindMapContainer.clientWidth;
    const height = mindMapContainer.clientHeight;

    console.log('Rendering tree mind map with cards:', studyCards);

    // Build hierarchical tree structure from study cards
    function buildTreeStructure(cards) {
        // Create a map of all nodes
        const nodesMap = new Map();
        cards.forEach((card, index) => {
            nodesMap.set(index, {
                id: index,
                name: card.topic || card.term || card.name || card.title || `Card ${index + 1}`,
                definition: card.content || card.definition || card.description || '',
                level: card.level || 0,
                color: card.color || '#667eea',
                children: []
            });
        });

        // Link children to parents using parentIndex
        cards.forEach((card, index) => {
            if (card.parentIndex !== null && card.parentIndex !== undefined) {
                const parent = nodesMap.get(card.parentIndex);
                const child = nodesMap.get(index);
                if (parent && child) {
                    parent.children.push(child);
                }
            }
        });

        // Find root nodes (nodes with parentIndex === null or level 0)
        const roots = [];
        cards.forEach((card, index) => {
            if (card.parentIndex === null || card.parentIndex === undefined) {
                roots.push(nodesMap.get(index));
            }
        });

        // If no roots found, use first card
        if (roots.length === 0 && cards.length > 0) {
            roots.push(nodesMap.get(0));
        }

        // If multiple roots, create a virtual root
        if (roots.length > 1) {
            return {
                name: project.name,
                definition: 'Project Root',
                level: -1,
                children: roots
            };
        }

        return roots[0] || { name: 'Empty', children: [] };
    }

    const treeData = buildTreeStructure(studyCards);
    console.log('Tree structure:', treeData);

    // Setup SVG
    const svg = d3.select(svgElement);
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Create container for zoom/pan
    const container = svg.append('g');

    // Add zoom
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            container.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Double-click to reset
    svg.on('dblclick.zoom', null);
    svg.on('dblclick', () => {
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(100, height / 2).scale(1)
        );
    });

    // Create defs for potential filters/patterns (keeping for future use)
    const defs = svg.append('defs');

    // Create tree layout
    const treeLayout = d3.tree()
        .size([height - 100, width - 300])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

    // Create hierarchy
    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // Draw links (tree branches)
    const links = container.selectAll('.mind-map-link')
        .data(root.links())
        .enter().append('path')
        .attr('class', 'mind-map-link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y + 100)
            .y(d => d.x + 50))
        .attr('fill', 'none')
        .attr('stroke', '#3c4652')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5);

    // Draw nodes
    const nodes = container.selectAll('.mind-map-node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', 'mind-map-node')
        .attr('transform', d => `translate(${d.y + 100},${d.x + 50})`)
        .attr('data-node-id', d => d.data.id);

    // Calculate rectangle dimensions based on text length
    const getRectWidth = (d) => {
        const textLength = d.data.name.length;
        // Dynamic width: 8px per character + padding, no maximum limit
        return Math.max(140, textLength * 8.5 + 50);
    };
    const rectHeight = 56;
    const accentWidth = 6;

    // Main dark rectangle background
    nodes.append('rect')
        .attr('x', d => -getRectWidth(d) / 2)
        .attr('y', -rectHeight / 2)
        .attr('width', d => getRectWidth(d))
        .attr('height', rectHeight)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', '#222831')
        .attr('stroke', '#3c4652')
        .attr('stroke-width', 1)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))')
        .style('cursor', 'pointer');

    // Colored accent bar on the left
    nodes.append('rect')
        .attr('x', d => -getRectWidth(d) / 2)
        .attr('y', -rectHeight / 2)
        .attr('width', accentWidth)
        .attr('height', rectHeight)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', d => d.data.color || '#667eea')
        .style('cursor', 'pointer')
        .attr('pointer-events', 'none');

    // Small color dot indicator in top right (for visual balance)
    nodes.append('circle')
        .attr('cx', d => getRectWidth(d) / 2 - 12)
        .attr('cy', -rectHeight / 2 + 12)
        .attr('r', 4)
        .attr('fill', d => d.data.color || '#667eea')
        .attr('pointer-events', 'none');

    // Name label inside rectangle (left-aligned, after the accent bar)
    nodes.append('text')
        .text(d => d.data.name)
        .attr('x', d => -getRectWidth(d) / 2 + accentWidth + 12)
        .attr('text-anchor', 'start')
        .attr('dy', -5)
        .attr('fill', '#d2dae3')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('pointer-events', 'none');

    // Level label inside rectangle (below title, left-aligned)
    nodes.append('text')
        .text(d => d.data.level >= 0 ? `Level ${d.data.level}` : '')
        .attr('x', d => -getRectWidth(d) / 2 + accentWidth + 12)
        .attr('text-anchor', 'start')
        .attr('dy', 12)
        .attr('fill', '#9da7b3')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('pointer-events', 'none');

    // Hover and click effects
    nodes.on('mouseenter', function(event, d) {
        // Highlight the main background rect (first rect)
        d3.select(this).selectAll('rect').filter((d, i) => i === 0)
            .transition().duration(200)
            .attr('stroke', '#1db954')
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))');

        // Brighten the accent bar
        d3.select(this).selectAll('rect').filter((d, i) => i === 1)
            .transition().duration(200)
            .attr('width', accentWidth + 2);

        if (tooltip) {
            tooltip.querySelector('h4').textContent = d.data.name;
            tooltip.querySelector('p').textContent = d.data.definition || 'No description';
            tooltip.style.opacity = '1';
        }
    })
    .on('mousemove', function(event) {
        if (tooltip) {
            const rect = mindMapContainer.getBoundingClientRect();
            tooltip.style.left = (event.clientX - rect.left + 15) + 'px';
            tooltip.style.top = (event.clientY - rect.top + 15) + 'px';
        }
    })
    .on('mouseleave', function(event, d) {
        // Reset the main background rect
        d3.select(this).selectAll('rect').filter((d, i) => i === 0)
            .transition().duration(200)
            .attr('stroke', '#3c4652')
            .attr('stroke-width', 1)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))');

        // Reset the accent bar
        d3.select(this).selectAll('rect').filter((d, i) => i === 1)
            .transition().duration(200)
            .attr('width', accentWidth);

        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    })
    .on('click', function(event, d) {
        event.stopPropagation();
        if (d.data.id !== undefined) {
            showMindMapColorPicker(event, d.data.id);
        }
    });

    // Center the view initially
    svg.call(zoom.transform, d3.zoomIdentity.translate(100, height / 2).scale(1));
}

// Helper functions
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.classList.remove('hidden');
    }
}

function showNotification(message, type = 'success') {
    // Use existing notification system
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function startProjectTest() {
    showNotification('Start project test feature coming soon!', 'info');
}

export { quillEditor, currentProject };

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectDetailPage);
} else {
    // DOM already loaded
    setTimeout(initProjectDetailPage, 100);
}
