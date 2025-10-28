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

    // Import notes button
    const importNotesBtn = document.getElementById('importNotesBtn');
    const importNotesFile = document.getElementById('importNotesFile');
    if (importNotesBtn && importNotesFile) {
        importNotesBtn.addEventListener('click', () => importNotesFile.click());
        importNotesFile.addEventListener('change', handleFileImport);
    }

    // Clean notes button
    const cleanNotesBtn = document.getElementById('cleanNotesBtn');
    if (cleanNotesBtn) {
        cleanNotesBtn.addEventListener('click', cleanNotesWithAI);
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

    // Initialize study mode
    initStudyMode();
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

        const generatedData = await retryAPICall(async () => {
            const response = await fetch('https://quizapp2-eight.vercel.app/api/generate-study-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studyCardsPayload)
            });

            if (!response.ok) {
                let errorMessage = 'Failed to generate cards';
                try {
                    const error = await response.json();
                    console.error('Generation API error:', error);
                    errorMessage = error.error || error.message || `Server error (${response.status})`;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                    errorMessage = `Server error (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Cards generated:', data);
            return data;
        });

        // Step 2: Delete old cards before saving new ones
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

        // Step 3: Save new test cards (linked to study cards)
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving new test cards...';

        const cardsRef = ref(window.db, `users/${user.uid}/cards`);
        for (const card of generatedData.testCards) {
            const cardData = {
                projectId: currentProject.id,
                question: card.question,
                options: card.options,
                correctAnswer: card.correctAnswer,
                explanation: card.explanation || '',
                difficulty: card.difficulty || 'medium',
                relatedStudyCard: card.relatedStudyCard,
                mastered: false,
                locked: false,
                createdAt: Date.now()
            };
            await push(cardsRef, cardData);
        }

        // Save study cards to project
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            studyCards: generatedData.studyCards,
            studyCardsCount: generatedData.studyCardCount,
            language: language,
            updatedAt: new Date().toISOString()
        });

        // Update local project data
        currentProject.studyCards = generatedData.studyCards;
        currentProject.studyCardsCount = generatedData.studyCardCount;
        currentProject.language = language;

        if (window.projects) {
            const projectIndex = window.projects.findIndex(p => p.id === currentProject.id);
            if (projectIndex !== -1) {
                window.projects[projectIndex].studyCards = generatedData.studyCards;
                window.projects[projectIndex].studyCardsCount = generatedData.studyCardCount;
                window.projects[projectIndex].language = language;
            }
        }

        // Reload cards from database
        if (window.loadCards) {
            await window.loadCards();
        }

        // Success!
        showNotification(`Generated ${generatedData.studyCardCount} study cards and ${generatedData.testCardCount} test cards!`, 'success');

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
                        <label>Content</label>
                        <textarea class="text-input study-card-content" rows="3">${escapeHtml(card.content || card.definition || card.description || '')}</textarea>
                    </div>
                    <div class="form-group" style="margin-bottom: var(--spacing-md);">
                        <label>Parent Card</label>
                        <select class="text-input study-card-parent">
                            <option value="">No Parent (Root Level)</option>
                            ${studyCards.map((c, i) => i !== index ? `<option value="${i}" ${card.parentIndex === i ? 'selected' : ''}>${escapeHtml(c.topic || c.term || `Card ${i + 1}`)}</option>` : '').join('')}
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: var(--spacing-md);">
                        <label>Category</label>
                        <select class="text-input study-card-category">
                            <option value="primary" ${(card.category || 'primary') === 'primary' ? 'selected' : ''}>Primary</option>
                            <option value="secondary" ${card.category === 'secondary' ? 'selected' : ''}>Secondary</option>
                            <option value="tertiary" ${card.category === 'tertiary' ? 'selected' : ''}>Tertiary</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: var(--spacing-md);">
                        <label>Color</label>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#feca57', '#ff6b6b', '#48dbfb'].map(color => `
                                <div class="color-picker-option ${(card.color || '#667eea') === color ? 'selected' : ''}" data-color="${color}" style="width: 30px; height: 30px; background: ${color}; border-radius: 50%; cursor: pointer; border: 2px solid ${(card.color || '#667eea') === color ? 'var(--text)' : 'transparent'};"></div>
                            `).join('')}
                        </div>
                        <input type="hidden" class="study-card-color" value="${card.color || '#667eea'}" />
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

        // Add color picker handlers for edit forms
        document.querySelectorAll('.study-card-edit-form .color-picker-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = option.dataset.color;
                const editForm = option.closest('.study-card-edit-form');

                // Update visual selection
                editForm.querySelectorAll('.color-picker-option').forEach(opt => {
                    opt.classList.remove('selected');
                    opt.style.border = '2px solid transparent';
                });
                option.classList.add('selected');
                option.style.border = '2px solid var(--text)';

                // Update hidden input
                editForm.querySelector('.study-card-color').value = color;
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
        const contentInput = cardEl.querySelector('.study-card-content');
        const parentSelect = cardEl.querySelector('.study-card-parent');
        const categorySelect = cardEl.querySelector('.study-card-category');
        const colorInput = cardEl.querySelector('.study-card-color');

        const newTitle = titleInput.value.trim();
        const newContent = contentInput.value.trim();
        const parentValue = parentSelect.value;
        const category = categorySelect.value;
        const color = colorInput.value;

        if (!newTitle) {
            showNotification('Title cannot be empty', 'error');
            return;
        }

        if (!newContent) {
            showNotification('Content cannot be empty', 'error');
            return;
        }

        // Update the study card in the project
        if (currentProject.studyCards && currentProject.studyCards[cardIndex]) {
            const parentIndex = parentValue === '' ? null : parseInt(parentValue);
            const level = parentValue === '' ? 0 : (currentProject.studyCards[parseInt(parentValue)].level + 1);

            currentProject.studyCards[cardIndex].topic = newTitle;
            currentProject.studyCards[cardIndex].content = newContent;
            currentProject.studyCards[cardIndex].parentIndex = parentIndex;
            currentProject.studyCards[cardIndex].level = level;
            currentProject.studyCards[cardIndex].category = category;
            currentProject.studyCards[cardIndex].color = color;

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

    // Update analytics stats
    updateMindmapAnalytics(project.studyCards);

    // Clear previous visualization
    svgElement.innerHTML = '';

    const studyCards = project.studyCards;
    const width = mindMapContainer.clientWidth;
    const height = mindMapContainer.clientHeight;

    console.log('Rendering physics-based mind map with cards:', studyCards);

    // Track mouse position for attraction force
    let mouseX = width / 2;
    let mouseY = height / 2;

    // Helper to calculate node width
    const calculateNodeWidth = (name) => {
        const textLength = name.length;
        return Math.max(140, textLength * 8.5 + 50);
    };

    // Get test cards for this project
    const testCards = window.cards ? window.cards.filter(c => c.projectId === project.id) : [];
    console.log('Test cards:', testCards);

    // Build nodes and links for force simulation
    function buildForceData(studyCards, testCards) {
        // Study cards positioning
        const levelGroups = {};
        studyCards.forEach((card, index) => {
            const level = card.level || 0;
            if (!levelGroups[level]) levelGroups[level] = [];
            levelGroups[level].push(index);
        });

        // Create nodes for study cards
        const nodes = studyCards.map((card, index) => {
            const name = card.topic || card.term || card.name || card.title || `Card ${index + 1}`;
            const nodeWidth = calculateNodeWidth(name);
            const level = card.level || 0;

            // Position nodes in a radial layout by level
            const levelNodes = levelGroups[level];
            const nodeIndexInLevel = levelNodes.indexOf(index);
            const angleStep = (2 * Math.PI) / levelNodes.length;
            const angle = nodeIndexInLevel * angleStep - Math.PI / 2; // Start from top
            const radius = 100 + level * 150; // Distance from center increases with level

            // Get mastery-based border color
            const masteryColors = {
                'mastered': '#43e97b',  // Green
                'good': '#48dbfb',      // Cyan
                'learning': '#feca57', // Yellow
                'weak': '#ff6b6b'      // Red
            };
            const masteryColor = card.mastery ? masteryColors[card.mastery] : null;

            return {
                id: `study-${index}`,
                originalIndex: index,
                type: 'study',
                name: name,
                definition: card.content || card.definition || card.description || '',
                level: level,
                color: card.color || '#667eea',
                mastery: card.mastery,
                masteryColor: masteryColor,
                lastStudied: card.lastStudied,
                parentIndex: card.parentIndex,
                width: nodeWidth,
                radius: nodeWidth / 2 + 20, // Half width + padding
                x: width / 2 + Math.cos(angle) * radius,
                y: height / 2 + Math.sin(angle) * radius
            };
        });

        // Add test card nodes (positioned around their related study cards)
        testCards.forEach((testCard, testIndex) => {
            const relatedStudyIndex = testCard.relatedStudyCard;
            if (relatedStudyIndex !== undefined && relatedStudyIndex >= 0 && relatedStudyIndex < studyCards.length) {
                const relatedNode = nodes[relatedStudyIndex];

                // Position test node near its study card (offset by angle)
                const offsetAngle = (testIndex * Math.PI / 6); // Distribute around study node
                const offsetDistance = 120;

                const nodeWidth = calculateNodeWidth(`Test ${testIndex + 1}`);

                nodes.push({
                    id: `test-${testIndex}`,
                    originalIndex: testIndex,
                    type: 'test',
                    name: `Test: ${testCard.question.substring(0, 40)}...`,
                    definition: testCard.question,
                    level: relatedNode.level,
                    color: '#9333ea', // Purple for test cards
                    mastery: testCard.mastered ? 'mastered' : null,
                    masteryColor: testCard.mastered ? '#43e97b' : null,
                    relatedStudyCard: relatedStudyIndex,
                    difficulty: testCard.difficulty,
                    width: nodeWidth,
                    radius: nodeWidth / 2 + 15,
                    x: relatedNode.x + Math.cos(offsetAngle) * offsetDistance,
                    y: relatedNode.y + Math.sin(offsetAngle) * offsetDistance
                });
            }
        });

        // Build links
        const links = [];

        // Links between study cards (hierarchy)
        studyCards.forEach((card, index) => {
            if (card.parentIndex !== null && card.parentIndex !== undefined && card.parentIndex >= 0) {
                links.push({
                    source: `study-${card.parentIndex}`,
                    target: `study-${index}`,
                    type: 'hierarchy'
                });
            }
        });

        // Links from test cards to their related study cards
        testCards.forEach((testCard, testIndex) => {
            if (testCard.relatedStudyCard !== undefined && testCard.relatedStudyCard >= 0) {
                links.push({
                    source: `study-${testCard.relatedStudyCard}`,
                    target: `test-${testIndex}`,
                    type: 'test-link'
                });
            }
        });

        return { nodes, links };
    }

    const { nodes, links } = buildForceData(studyCards, testCards);
    console.log('Force simulation data:', { nodes, links });

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

    // Mouse tracking for attraction force
    svg.on('mousemove', (event) => {
        const [x, y] = d3.pointer(event);
        mouseX = x;
        mouseY = y;
    });

    // Double-click to reset
    svg.on('dblclick.zoom', null);
    svg.on('dblclick', () => {
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
        );
    });

    // Custom force to attract nodes towards mouse
    function mouseForce(alpha) {
        const strength = 0.15 * alpha;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0 && distance < 400) {
                const force = strength / distance;
                node.vx += dx * force;
                node.vy += dy * force;
            }
        }
    }

    // Create force simulation with springy physics
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(d => {
                // Dynamic distance based on source and target node widths
                const sourceRadius = d.source.radius || 80;
                const targetRadius = d.target.radius || 80;
                return sourceRadius + targetRadius + 80; // Sum of radii + extra spacing
            })
            .strength(0.3))
        .force('charge', d3.forceManyBody()
            .strength(-1200)
            .distanceMax(500))
        .force('collision', d3.forceCollide()
            .radius(d => d.radius || 80)
            .strength(0.9)
            .iterations(3))
        .force('center', d3.forceCenter(width / 2, height / 2)
            .strength(0.05))
        .force('mouse', mouseForce)
        .alphaDecay(0.02)
        .velocityDecay(0.3);

    // Draw links (springy connections with different styles)
    const linkElements = container.selectAll('.mind-map-link')
        .data(links)
        .enter().append('line')
        .attr('class', 'mind-map-link')
        .attr('stroke', d => {
            if (d.type === 'test-link') {
                return '#9333ea'; // Purple for test links
            }
            // Use target node's color for hierarchy links
            return d.target.color || '#667eea';
        })
        .attr('stroke-width', d => d.type === 'test-link' ? 2 : 2.5)
        .attr('stroke-opacity', d => d.type === 'test-link' ? 0.3 : 0.4)
        .attr('stroke-dasharray', d => d.type === 'test-link' ? '5,5' : 'none')
        .style('stroke-linecap', 'round')
        .style('transition', 'all 0.3s ease');

    // Draw nodes
    const nodeGroups = container.selectAll('.mind-map-node')
        .data(nodes)
        .enter().append('g')
        .attr('class', 'mind-map-node')
        .attr('data-node-id', d => d.id)
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    // Rectangle dimensions
    const getRectWidth = (d) => d.width; // Use pre-calculated width
    const rectHeight = 56;
    const accentWidth = 6;

    // Main dark rectangle background
    nodeGroups.append('rect')
        .attr('x', d => -getRectWidth(d) / 2)
        .attr('y', -rectHeight / 2)
        .attr('width', d => getRectWidth(d))
        .attr('height', rectHeight)
        .attr('rx', 12)
        .attr('ry', 12)
        .attr('fill', '#1e2329')
        .attr('stroke', d => d.masteryColor || d.color || '#667eea')
        .attr('stroke-width', d => d.masteryColor ? 3 : 1.5)
        .attr('stroke-opacity', d => d.masteryColor ? 0.9 : 0.3)
        .style('filter', d => d.masteryColor ?
            `drop-shadow(0 0 8px ${d.masteryColor}) drop-shadow(0 6px 16px rgba(0,0,0,0.5))` :
            'drop-shadow(0 6px 16px rgba(0,0,0,0.5))')
        .style('cursor', 'grab')
        .style('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');

    // Colored accent bar on the left (gradient effect)
    nodeGroups.append('rect')
        .attr('x', d => -getRectWidth(d) / 2)
        .attr('y', -rectHeight / 2)
        .attr('width', accentWidth)
        .attr('height', rectHeight)
        .attr('rx', 12)
        .attr('ry', 12)
        .attr('fill', d => d.color || '#667eea')
        .attr('opacity', 0.9)
        .style('cursor', 'grab')
        .style('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)')
        .attr('pointer-events', 'none');

    // Small color dot indicator in top right with glow
    nodeGroups.append('circle')
        .attr('cx', d => getRectWidth(d) / 2 - 14)
        .attr('cy', -rectHeight / 2 + 14)
        .attr('r', 5)
        .attr('fill', d => d.color || '#667eea')
        .style('filter', 'drop-shadow(0 0 6px ' + ((d) => d.color || '#667eea') + ')')
        .attr('opacity', 0.8)
        .attr('pointer-events', 'none');

    // Name label inside rectangle
    nodeGroups.append('text')
        .text(d => d.name)
        .attr('x', d => -getRectWidth(d) / 2 + accentWidth + 12)
        .attr('text-anchor', 'start')
        .attr('dy', -5)
        .attr('fill', '#d2dae3')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('pointer-events', 'none');

    // Level label inside rectangle
    nodeGroups.append('text')
        .text(d => {
            if (d.type === 'test') {
                return `Test (${d.difficulty || 'medium'})`;
            }
            return d.level >= 0 ? `Level ${d.level}` : '';
        })
        .attr('x', d => -getRectWidth(d) / 2 + accentWidth + 12)
        .attr('text-anchor', 'start')
        .attr('dy', 12)
        .attr('fill', '#9da7b3')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('pointer-events', 'none');

    // Add progress glow background for nodes with mastery
    nodeGroups.insert('rect', 'rect')
        .attr('class', 'progress-glow')
        .attr('x', d => -getRectWidth(d) / 2 - 8)
        .attr('y', -rectHeight / 2 - 8)
        .attr('width', d => getRectWidth(d) + 16)
        .attr('height', rectHeight + 16)
        .attr('rx', 16)
        .attr('ry', 16)
        .attr('fill', d => d.masteryColor || 'none')
        .attr('opacity', d => d.masteryColor ? 0.15 : 0)
        .style('filter', d => d.masteryColor ? `blur(10px)` : 'none')
        .attr('pointer-events', 'none');

    // Hover and click effects with smooth animations
    nodeGroups.on('mouseenter', function(event, d) {
        const nodeColor = d.color || '#667eea';

        d3.select(this).selectAll('rect').filter((d, i) => i === 0)
            .transition()
            .duration(300)
            .ease(d3.easeCubicOut)
            .attr('stroke', nodeColor)
            .attr('stroke-width', 2.5)
            .attr('stroke-opacity', 0.8)
            .style('filter', 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))');

        d3.select(this).selectAll('rect').filter((d, i) => i === 1)
            .transition()
            .duration(300)
            .ease(d3.easeCubicOut)
            .attr('width', accentWidth + 3)
            .attr('opacity', 1);

        if (tooltip) {
            tooltip.querySelector('h4').textContent = d.name;
            tooltip.querySelector('p').textContent = d.definition || 'No description';
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
        const nodeColor = d.color || '#667eea';

        d3.select(this).selectAll('rect').filter((d, i) => i === 0)
            .transition()
            .duration(300)
            .ease(d3.easeCubicOut)
            .attr('stroke', nodeColor)
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.3)
            .style('filter', 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))');

        d3.select(this).selectAll('rect').filter((d, i) => i === 1)
            .transition()
            .duration(300)
            .ease(d3.easeCubicOut)
            .attr('width', accentWidth)
            .attr('opacity', 0.9);

        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    })
    .on('click', function(event, d) {
        event.stopPropagation();
        if (d.id !== undefined) {
            showMindMapColorPicker(event, d.id);
        }
    });

    // Update positions on each simulation tick
    simulation.on('tick', () => {
        linkElements
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodeGroups
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Auto-fit view after simulation settles
    simulation.on('end', () => {
        autoFitView();
    });

    // Auto-fit function
    function autoFitView() {
        if (nodes.length === 0) return;

        // Calculate bounding box of all nodes
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            const nodeWidth = node.width || 140;
            minX = Math.min(minX, node.x - nodeWidth / 2);
            maxX = Math.max(maxX, node.x + nodeWidth / 2);
            minY = Math.min(minY, node.y - rectHeight / 2);
            maxY = Math.max(maxY, node.y + rectHeight / 2);
        });

        // Add padding
        const padding = 100;
        minX -= padding;
        maxX += padding;
        minY -= padding;
        maxY += padding;

        // Calculate scale and translate
        const boundingWidth = maxX - minX;
        const boundingHeight = maxY - minY;
        const scale = Math.min(width / boundingWidth, height / boundingHeight, 1);
        const translateX = (width - boundingWidth * scale) / 2 - minX * scale;
        const translateY = (height - boundingHeight * scale) / 2 - minY * scale;

        // Smoothly transition to fit view
        svg.transition()
            .duration(1000)
            .call(
                zoom.transform,
                d3.zoomIdentity.translate(translateX, translateY).scale(scale)
            );
    }

    // Trigger auto-fit after 3 seconds (when simulation settles)
    setTimeout(autoFitView, 3000);

    // Drag functions
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select(this).style('cursor', 'grabbing');
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        d3.select(this).style('cursor', 'grab');
    }
}

// Study Mode State
let studyModeState = {
    cards: [],
    currentIndex: 0
};

// Initialize Study Mode
function initStudyMode() {
    const startBtn = document.getElementById('startStudyModeBtn');
    const prevBtn = document.getElementById('studyModePrev');
    const nextBtn = document.getElementById('studyModeNext');
    const restartBtn = document.getElementById('restartStudyModeBtn');

    startBtn?.addEventListener('click', startStudyMode);
    prevBtn?.addEventListener('click', () => navigateStudyMode(-1));
    nextBtn?.addEventListener('click', () => navigateStudyMode(1));
    restartBtn?.addEventListener('click', startStudyMode);

    // Mastery buttons
    document.addEventListener('click', (e) => {
        const masteryBtn = e.target.closest('.mastery-btn');
        if (masteryBtn) {
            const mastery = masteryBtn.dataset.mastery;
            setCardMastery(mastery);
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const studyModeActive = document.getElementById('studyModeCard')?.classList.contains('hidden') === false;
        if (!studyModeActive) return;

        if (e.key === 'ArrowLeft') navigateStudyMode(-1);
        else if (e.key === 'ArrowRight') navigateStudyMode(1);
        // Number keys for mastery
        else if (e.key === '1') setCardMastery('weak');
        else if (e.key === '2') setCardMastery('learning');
        else if (e.key === '3') setCardMastery('good');
        else if (e.key === '4') setCardMastery('mastered');
    });
}

// Start Study Mode
function startStudyMode() {
    if (!currentProject || !currentProject.studyCards || currentProject.studyCards.length === 0) {
        showNotification('No study cards available', 'error');
        return;
    }

    // Sort cards in hierarchical order (breadth-first traversal)
    studyModeState.cards = sortCardsHierarchically(currentProject.studyCards);
    studyModeState.currentIndex = 0;

    // Show study mode UI
    document.getElementById('startStudyModeBtn').style.display = 'none';
    document.getElementById('studyModeCard').classList.remove('hidden');
    document.getElementById('studyModeComplete').classList.add('hidden');

    // Display first card
    displayStudyCard();
}

// Sort cards in hierarchical order (depth-first - branch by branch)
function sortCardsHierarchically(cards) {
    const sorted = [];

    // Build parent-child relationships
    const cardsWithIndex = cards.map((card, index) => ({ ...card, originalIndex: index }));

    // Find root nodes (level 0 or no parent)
    const roots = cardsWithIndex.filter(card => (card.level === 0 || card.parentIndex === null || card.parentIndex === undefined));

    // Depth-first traversal
    function traverseDFS(parentIndex, currentLevel) {
        // Get children of this parent at the next level
        const children = cardsWithIndex.filter(card =>
            card.parentIndex === parentIndex && !sorted.includes(card)
        );

        // If no children, try to find by level proximity
        if (children.length === 0 && currentLevel !== undefined) {
            const levelChildren = cardsWithIndex.filter(card =>
                card.level === currentLevel + 1 && !sorted.includes(card)
            );
            children.push(...levelChildren);
        }

        // Process each child and their descendants
        children.forEach(child => {
            sorted.push(child);
            traverseDFS(child.originalIndex, child.level);
        });
    }

    // Start with root nodes
    roots.forEach(root => {
        sorted.push(root);
        traverseDFS(root.originalIndex, root.level);
    });

    // Add any remaining cards that weren't connected
    cardsWithIndex.forEach(card => {
        if (!sorted.includes(card)) {
            sorted.push(card);
        }
    });

    return sorted;
}

// Display current study card
function displayStudyCard() {
    if (studyModeState.currentIndex >= studyModeState.cards.length) {
        showStudyComplete();
        return;
    }

    const card = studyModeState.cards[studyModeState.currentIndex];
    const totalCards = studyModeState.cards.length;
    const currentNum = studyModeState.currentIndex + 1;

    // Update progress
    document.getElementById('studyModeProgress').textContent = `${currentNum} / ${totalCards}`;
    document.getElementById('studyModeProgressBar').style.width = `${(currentNum / totalCards) * 100}%`;

    // Update card content
    const levelLabels = {
        0: 'Overview',
        1: 'Main Topic',
        2: 'Subtopic',
        3: 'Detailed Concept',
        4: 'Specific Detail'
    };
    document.getElementById('studyCardLevel').textContent = levelLabels[card.level] || `Level ${card.level}`;
    document.getElementById('studyCardLevel').style.background = card.color || '#667eea';
    document.getElementById('studyCardTopic').textContent = card.topic || card.term || 'Untitled';
    document.getElementById('studyCardContent').textContent = card.content || card.definition || '';

    // Update navigation buttons
    document.getElementById('studyModePrev').disabled = studyModeState.currentIndex === 0;
    document.getElementById('studyModeNext').disabled = studyModeState.currentIndex === totalCards - 1;

    // Highlight current mastery level
    const currentMastery = card.mastery || 'none';
    document.querySelectorAll('.mastery-btn').forEach(btn => {
        if (btn.dataset.mastery === currentMastery) {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.3)';
        } else {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'none';
        }
    });
}

// Navigate study mode
function navigateStudyMode(direction) {
    const newIndex = studyModeState.currentIndex + direction;
    if (newIndex < 0 || newIndex >= studyModeState.cards.length) return;

    studyModeState.currentIndex = newIndex;
    displayStudyCard();
}

// Show study complete
function showStudyComplete() {
    document.getElementById('studyModeCard').classList.add('hidden');
    document.getElementById('studyModeComplete').classList.remove('hidden');
}

// Set card mastery level
async function setCardMastery(mastery) {
    if (!currentProject || !studyModeState.cards[studyModeState.currentIndex]) {
        return;
    }

    const card = studyModeState.cards[studyModeState.currentIndex];
    const originalIndex = card.originalIndex;

    // Update in current project
    if (currentProject.studyCards && currentProject.studyCards[originalIndex]) {
        currentProject.studyCards[originalIndex].mastery = mastery;
        currentProject.studyCards[originalIndex].lastStudied = new Date().toISOString();
    }

    // Save to Firebase
    try {
        const user = auth.currentUser;
        if (user && currentProject.id) {
            const cardRef = ref(database, `users/${user.uid}/projects/${currentProject.id}/studyCards/${originalIndex}`);
            await update(cardRef, {
                mastery: mastery,
                lastStudied: new Date().toISOString()
            });

            showNotification(`Marked as ${mastery}`, 'success');

            // Update all mastery buttons to show current selection
            document.querySelectorAll('.mastery-btn').forEach(btn => {
                if (btn.dataset.mastery === mastery) {
                    btn.style.transform = 'scale(1.05)';
                    btn.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.3)';
                } else {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = 'none';
                }
            });

            // Update mindmap analytics if on mindmap tab
            updateMindmapAnalytics(currentProject.studyCards);

            // Auto-advance to next card after short delay
            setTimeout(() => {
                navigateStudyMode(1);
            }, 500);
        }
    } catch (error) {
        console.error('Failed to save mastery:', error);
        showNotification('Failed to save progress', 'error');
    }
}

// Update mindmap analytics stats
function updateMindmapAnalytics(studyCards) {
    if (!studyCards) return;

    const mastered = studyCards.filter(c => c.mastery === 'mastered').length;
    const good = studyCards.filter(c => c.mastery === 'good').length;
    const learning = studyCards.filter(c => c.mastery === 'learning').length;
    const weak = studyCards.filter(c => c.mastery === 'weak').length;

    document.getElementById('masteredCount').textContent = mastered;
    document.getElementById('goodCount').textContent = good;
    document.getElementById('learningCount').textContent = learning;
    document.getElementById('weakCount').textContent = weak;
}

// Handle file import (no auto-clean)
async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['.pdf', '.docx', '.txt', '.md'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(fileExt)) {
        showNotification('Invalid file type. Please upload PDF, DOCX, TXT, or MD files.', 'error');
        return;
    }

    // Check file size (warn for large PDFs)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 50) {
        showNotification('Warning: Large file may take a while to process...', 'info');
    }

    try {
        showNotification('Importing file...', 'info');

        const formData = new FormData();
        formData.append('file', file);

        // Parse the file
        const parseResponse = await fetch('https://quizapp2-eight.vercel.app/api/parse-file', {
            method: 'POST',
            body: formData
        });

        if (!parseResponse.ok) {
            const errorData = await parseResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to parse file');
        }

        const parseData = await parseResponse.json();

        if (!parseData.text) {
            throw new Error('No text extracted from file');
        }

        // Insert raw text into editor
        if (quillEditor) {
            quillEditor.setText(parseData.text);

            const wordCount = parseData.text.split(/\s+/).length;
            showNotification(`File imported! ${wordCount} words extracted. Use "AI Clean" to format.`, 'success');
        }
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Failed to import file: ' + error.message, 'error');
    }

    // Reset file input
    event.target.value = '';
}

// Clean notes with AI (manual action)
async function cleanNotesWithAI() {
    if (!quillEditor) {
        showNotification('Editor not available', 'error');
        return;
    }

    const rawText = quillEditor.getText();
    if (!rawText || rawText.trim().length === 0) {
        showNotification('No notes to clean', 'error');
        return;
    }

    // Check text length
    const wordCount = rawText.split(/\s+/).length;
    if (wordCount > 10000) {
        const confirmed = confirm(`Your notes are very long (${wordCount} words). AI cleaning may take a while and could be expensive. Continue?`);
        if (!confirmed) return;
    }

    try {
        showNotification('Cleaning notes with AI...', 'info');

        const response = await fetch('https://quizapp2-eight.vercel.app/api/clean-notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: rawText,
                userId: auth.currentUser?.uid
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to clean notes');
        }

        const data = await response.json();

        if (data.cleanedText) {
            // Replace editor content with cleaned text
            quillEditor.setText(data.cleanedText);
            showNotification('Notes cleaned successfully!', 'success');
        }
    } catch (error) {
        console.error('Clean notes error:', error);
        showNotification('Failed to clean notes: ' + error.message, 'error');
    }
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
