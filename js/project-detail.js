// Quill editor instances
let quillEditor = null;  // Main editor (deprecated, keeping for compatibility)
let fullscreenQuillEditor = null;  // Fullscreen editor
let currentProject = null;
let currentNoteFile = null;  // Currently open note file
let autoSaveTimeout = null;
let sidebarCollapsed = false;
let noteSortOrder = 'date';  // Default sort: by date (newest first)

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

    // Initialize fullscreen Quill editor
    if (typeof Quill !== 'undefined' && !fullscreenQuillEditor) {
        const fullscreenEditorElement = document.getElementById('fullscreenNotesEditor');
        if (fullscreenEditorElement) {
            fullscreenQuillEditor = new Quill('#fullscreenNotesEditor', {
                theme: 'snow',
                placeholder: 'Start writing your notes...',
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

            // Auto-save on fullscreen editor change
            fullscreenQuillEditor.on('text-change', () => {
                if (currentNoteFile) {
                    markNoteAsUnsavedFullscreen();
                    scheduleAutoSave();
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

    // Add note file button
    const addNoteFileBtn = document.getElementById('addNoteFileBtn');
    if (addNoteFileBtn) {
        addNoteFileBtn.addEventListener('click', createNewNoteFile);
    }

    // Select all notes button
    const selectAllNotesBtn = document.getElementById('selectAllNotesBtn');
    if (selectAllNotesBtn) {
        selectAllNotesBtn.addEventListener('click', toggleSelectAllNotes);
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

    // Auto-save on editor change
    if (quillEditor) {
        quillEditor.on('text-change', () => {
            if (currentNoteFile) {
                markNoteAsUnsaved();
                scheduleAutoSave();
            }
        });
    }

    // Title change auto-save
    const currentNoteTitle = document.getElementById('currentNoteTitle');
    if (currentNoteTitle) {
        currentNoteTitle.addEventListener('input', () => {
            if (currentNoteFile) {
                markNoteAsUnsaved();
                scheduleAutoSave();
            }
        });
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

    // Fullscreen editor controls
    const closeEditorBtn = document.getElementById('closeEditorBtn');
    if (closeEditorBtn) {
        closeEditorBtn.addEventListener('click', closeFullscreenEditor);
    }

    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }

    const showSidebarBtn = document.getElementById('showSidebarBtn');
    if (showSidebarBtn) {
        showSidebarBtn.addEventListener('click', toggleSidebar);
    }

    const selectAllNotesSidebarBtn = document.getElementById('selectAllNotesSidebarBtn');
    if (selectAllNotesSidebarBtn) {
        selectAllNotesSidebarBtn.addEventListener('click', toggleSelectAllNotes);
    }

    // Note sort select
    const noteSortSelect = document.getElementById('noteSortSelect');
    if (noteSortSelect) {
        noteSortSelect.addEventListener('change', (e) => {
            noteSortOrder = e.target.value;
            renderNoteFilesList();
        });
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

        // Migrate old notes to noteFiles if needed
        if (currentProject.notes && (!currentProject.noteFiles || currentProject.noteFiles.length === 0)) {
            currentProject.noteFiles = [{
                id: Date.now().toString(),
                title: 'Main Notes',
                content: currentProject.notes,
                selected: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }];

            // Save migration
            try {
                const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
                const user = window.auth.currentUser;
                const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
                await update(projectRef, {
                    noteFiles: currentProject.noteFiles
                });
            } catch (error) {
                console.error('Error migrating notes:', error);
            }
        }

        // Initialize noteFiles if empty
        if (!currentProject.noteFiles) {
            currentProject.noteFiles = [];
        }

        // Render note files list
        renderNoteFilesList();

        // Reset current note file
        currentNoteFile = null;

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
    document.getElementById('newStudyCardContent').value = '';
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

// Save edited test card
async function saveTestCardEdit(cardId) {
    try {
        const cardEl = document.querySelector(`.test-card[data-card-id="${cardId}"]`);
        const questionInput = cardEl.querySelector('.test-card-question');
        const optionInputs = cardEl.querySelectorAll('.test-card-option');
        const correctAnswerRadio = cardEl.querySelector(`input[name="testCardCorrect_${cardId}"]:checked`);
        const explanationInput = cardEl.querySelector('.test-card-explanation');
        const difficultySelect = cardEl.querySelector('.test-card-difficulty');

        const question = questionInput.value.trim();
        const options = Array.from(optionInputs).map(input => input.value.trim());
        const correctAnswer = correctAnswerRadio ? parseInt(correctAnswerRadio.value) : 0;
        const explanation = explanationInput.value.trim();
        const difficulty = difficultySelect.value;

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
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

        const cardData = {
            question: question,
            options: options,
            correctAnswer: correctAnswer,
            explanation: explanation,
            difficulty: difficulty
        };

        const cardRef = ref(window.db, `users/${user.uid}/cards/${cardId}`);
        await update(cardRef, cardData);

        // Update local cards array
        if (window.cards) {
            const cardIndex = window.cards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                window.cards[cardIndex] = { ...window.cards[cardIndex], ...cardData };
            }
        }

        // Reload cards
        if (window.loadCards) {
            await window.loadCards();
        }
        loadTestCards(currentProject.id);

        showNotification('Test card updated successfully', 'success');
    } catch (error) {
        console.error('Error updating test card:', error);
        showNotification('Failed to update test card', 'error');
    }
}

// Save new study card
async function saveNewStudyCard() {
    try {
        const title = document.getElementById('studyCardTitle').value.trim();
        const content = document.getElementById('newStudyCardContent').value.trim();
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

// ============================================
// NOTE FILES MANAGEMENT
// ============================================

// Open note file title modal
function openNoteFileTitleModal() {
    const modal = document.getElementById('noteFileTitleModal');
    const input = document.getElementById('noteFileTitle');
    input.value = '';
    modal.classList.remove('hidden');

    // Focus input after a short delay to ensure modal is visible
    setTimeout(() => input.focus(), 100);

    // Allow Enter key to submit
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmNoteFileTitle();
        }
    };
}

// Close note file title modal
window.closeNoteFileTitleModal = function() {
    const modal = document.getElementById('noteFileTitleModal');
    modal.classList.add('hidden');
};

// Confirm and create note file
window.confirmNoteFileTitle = async function() {
    const input = document.getElementById('noteFileTitle');
    const title = input.value.trim() || 'Untitled Note';

    // Close modal
    closeNoteFileTitleModal();

    // Create note file
    if (!currentProject) {
        showNotification('No project selected', 'error');
        return;
    }

    const noteFile = {
        id: Date.now().toString(),
        title: title,
        content: '',
        selected: true,  // Include in generation by default
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    // Initialize noteFiles array if it doesn't exist
    if (!currentProject.noteFiles) {
        currentProject.noteFiles = [];
    }

    currentProject.noteFiles.push(noteFile);

    // Save to Firebase
    try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const user = window.auth.currentUser;
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            noteFiles: currentProject.noteFiles
        });

        renderNoteFilesList();
        openNoteFileFullscreen(noteFile.id);
        showNotification('Note file created', 'success');
    } catch (error) {
        console.error('Error creating note file:', error);
        showNotification('Failed to create note file', 'error');
    }
};

// Create new note file (opens modal)
async function createNewNoteFile() {
    if (!currentProject) {
        showNotification('No project selected', 'error');
        return;
    }

    openNoteFileTitleModal();
}

// Sort note files based on current sort order
function sortNoteFiles(files) {
    const sorted = [...files]; // Create a copy to avoid mutating original

    switch (noteSortOrder) {
        case 'date': // Newest first (default)
            return sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        case 'date-asc': // Oldest first
            return sorted.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));

        case 'alpha': // A → Z
            return sorted.sort((a, b) => a.title.localeCompare(b.title));

        case 'alpha-desc': // Z → A
            return sorted.sort((a, b) => b.title.localeCompare(a.title));

        case 'size': // Largest first
            return sorted.sort((a, b) => (b.content || '').length - (a.content || '').length);

        case 'size-asc': // Smallest first
            return sorted.sort((a, b) => (a.content || '').length - (b.content || '').length);

        default:
            return sorted;
    }
}

// Render note files list (as file browser cards)
function renderNoteFilesList() {
    const container = document.getElementById('noteFilesList');
    const noteCountDisplay = document.getElementById('noteCountDisplay');

    if (!currentProject || !currentProject.noteFiles || currentProject.noteFiles.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center;">
                <i class="fas fa-file-alt" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">No note files yet.<br>Click "New Note File" to create one.</p>
            </div>
        `;
        if (noteCountDisplay) {
            noteCountDisplay.textContent = '0 notes';
        }
        return;
    }

    // Update note count
    const selectedCount = currentProject.noteFiles.filter(f => f.selected).length;
    if (noteCountDisplay) {
        noteCountDisplay.innerHTML = `${currentProject.noteFiles.length} ${currentProject.noteFiles.length === 1 ? 'note' : 'notes'} <span style="color: var(--success);">• ${selectedCount} selected</span>`;
    }

    // Sort files
    const sortedFiles = sortNoteFiles(currentProject.noteFiles);

    container.innerHTML = sortedFiles.map(file => {
        const isActive = currentNoteFile && currentNoteFile.id === file.id;
        // Get content preview
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = file.content || '';
        const contentPreview = (tempDiv.textContent || tempDiv.innerText || 'Empty note').substring(0, 120);

        return `
        <div class="note-file-card" data-file-id="${file.id}"
             style="background: var(--surface);
                    border: 2px solid ${isActive ? 'var(--primary)' : 'var(--border)'};
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                    min-height: 200px;
                    display: flex;
                    flex-direction: column;">
            <!-- Custom Checkbox -->
            <div style="position: absolute; top: 1rem; left: 1rem;">
                <label class="custom-checkbox-container" title="${file.selected ? 'Included in generation' : 'Excluded from generation'}">
                    <input type="checkbox" class="note-file-checkbox" ${file.selected ? 'checked' : ''}>
                    <div class="custom-checkbox">
                        <i class="fas fa-check custom-checkbox-icon"></i>
                    </div>
                </label>
            </div>

            <!-- Delete button -->
            <button class="note-card-delete-btn"
                    data-file-title="${escapeHtml(file.title)}"
                    style="position: absolute; top: 1rem; right: 1rem;
                           padding: 0.5rem;
                           background: transparent;
                           border: none;
                           color: var(--text-muted);
                           cursor: pointer;
                           opacity: 0;
                           transition: opacity 0.2s;
                           border-radius: var(--radius-sm);">
                <i class="fas fa-trash"></i>
            </button>

            <!-- Content -->
            <div style="margin-top: 2rem; flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <i class="fas fa-file-alt" style="color: var(--primary); font-size: 1.25rem;"></i>
                    <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${escapeHtml(file.title)}
                    </h3>
                </div>

                <p style="color: var(--text-muted); font-size: 0.875rem; line-height: 1.5; margin: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                    ${escapeHtml(contentPreview)}${contentPreview.length >= 120 ? '...' : ''}
                </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                    <i class="fas fa-clock"></i>
                    ${new Date(file.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style="font-size: 0.75rem; color: ${file.selected ? 'var(--success)' : 'var(--text-muted)'};">
                    <i class="fas fa-${file.selected ? 'check-circle' : 'times-circle'}"></i>
                    ${file.selected ? 'Included' : 'Excluded'}
                </div>
            </div>
        </div>
    `;
    }).join('');

    // Add hover effects and click handlers for cards
    document.querySelectorAll('.note-file-card').forEach(card => {
        const fileId = card.dataset.fileId;

        // Checkbox handler
        const checkbox = card.querySelector('.note-file-checkbox');
        if (checkbox) {
            checkbox.addEventListener('click', async (e) => {
                e.stopPropagation();
                await toggleNoteFileSelection(fileId);
            });
        }

        // Click handler to open fullscreen editor
        card.addEventListener('click', (e) => {
            // Don't open if clicking on checkbox or delete button
            if (e.target.type === 'checkbox' || e.target.closest('.note-card-delete-btn')) {
                return;
            }
            openNoteFileFullscreen(fileId);
        });

        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--primary)';
            card.style.boxShadow = 'var(--shadow-lg)';
            const deleteBtn = card.querySelector('.note-card-delete-btn');
            if (deleteBtn) deleteBtn.style.opacity = '0.6';
        });
        card.addEventListener('mouseleave', () => {
            const fileId = card.dataset.fileId;
            const isActive = currentNoteFile && currentNoteFile.id === fileId;
            card.style.borderColor = isActive ? 'var(--primary)' : 'var(--border)';
            card.style.boxShadow = 'none';
            const deleteBtn = card.querySelector('.note-card-delete-btn');
            if (deleteBtn) deleteBtn.style.opacity = '0';
        });

        const deleteBtn = card.querySelector('.note-card-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const fileId = card.dataset.fileId;
                const fileTitle = deleteBtn.dataset.fileTitle;
                const confirmed = await showConfirmDialog(
                    'Delete Note File',
                    `Are you sure you want to delete "${fileTitle}"? This action cannot be undone.`,
                    'Delete',
                    'btn-danger'
                );
                if (confirmed) {
                    await deleteNoteFile(fileId);
                }
            });

            deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.opacity = '1';
                deleteBtn.style.background = 'rgba(239, 68, 68, 0.1)';
                deleteBtn.style.color = 'var(--danger)';
            });
            deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.opacity = '0.6';
                deleteBtn.style.background = 'transparent';
                deleteBtn.style.color = 'var(--text-muted)';
            });
        }
    });
}

// Open note file in fullscreen editor
function openNoteFileFullscreen(fileId) {
    if (!currentProject || !currentProject.noteFiles) {
        return;
    }

    const file = currentProject.noteFiles.find(f => f.id === fileId);

    if (!file) {
        return;
    }

    currentNoteFile = file;

    // Show fullscreen editor
    const editorPage = document.getElementById('fullscreenNoteEditor');

    if (!editorPage) {
        return;
    }

    editorPage.style.display = 'block';

    // Load title
    const titleInput = document.getElementById('fullscreenNoteTitle');
    if (titleInput) {
        titleInput.value = file.title;
    }

    // Load content into fullscreen editor
    if (fullscreenQuillEditor) {
        fullscreenQuillEditor.root.innerHTML = file.content || '';
    }

    // Update sidebar project name
    const sidebarProjectName = document.getElementById('sidebarProjectName');
    if (sidebarProjectName && currentProject) {
        sidebarProjectName.textContent = currentProject.name;
    }

    // Render sidebar files list
    renderFullscreenSidebarFilesList();

    // Update include status
    updateIncludeStatusFullscreen();

    // Mark as saved
    markNoteAsSavedFullscreen();

    // Set up title auto-save
    if (titleInput) {
        titleInput.oninput = () => {
            if (currentNoteFile) {
                markNoteAsUnsavedFullscreen();
                scheduleAutoSave();
            }
        };
    }
}

// Render sidebar files list in fullscreen editor
function renderFullscreenSidebarFilesList() {
    const container = document.getElementById('sidebarNotesList');
    if (!container || !currentProject || !currentProject.noteFiles) return;

    // Sort files
    const sortedFiles = sortNoteFiles(currentProject.noteFiles);

    container.innerHTML = sortedFiles.map(file => {
        const isActive = currentNoteFile && currentNoteFile.id === file.id;
        return `
        <div class="sidebar-note-item ${isActive ? 'active' : ''}" data-file-id="${file.id}"
             style="padding: 0.75rem;
                    background: ${isActive ? 'var(--primary)' : 'transparent'};
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <label class="custom-checkbox-container" style="width: 20px; height: 20px;" onclick="event.stopPropagation()">
                    <input type="checkbox" class="sidebar-file-checkbox" ${file.selected ? 'checked' : ''} style="width: 20px; height: 20px;">
                    <div class="custom-checkbox" style="width: 20px; height: 20px; border-radius: 4px; ${isActive ? 'border-color: rgba(255,255,255,0.5);' : ''}">
                        <i class="fas fa-check custom-checkbox-icon" style="font-size: 11px;"></i>
                    </div>
                </label>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.875rem; font-weight: 500;
                                color: ${isActive ? '#fff' : 'var(--text)'};
                                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        <i class="fas fa-file-alt" style="font-size: 0.75rem;"></i> ${escapeHtml(file.title)}
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');

    // Add event handlers
    document.querySelectorAll('.sidebar-note-item').forEach(item => {
        const fileId = item.dataset.fileId;
        const isActive = item.classList.contains('active');

        // Checkbox handler
        const checkbox = item.querySelector('.sidebar-file-checkbox');
        if (checkbox) {
            checkbox.addEventListener('click', async (e) => {
                e.stopPropagation();
                await toggleNoteFileSelection(fileId);
            });
        }

        // Click handler to switch files
        item.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;
            switchNoteFileInFullscreen(fileId);
        });

        // Hover effects (only for non-active items)
        if (!isActive) {
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--surface-light)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
        }
    });
}

// Switch note file within fullscreen editor
async function switchNoteFileInFullscreen(fileId) {
    if (!currentProject || !currentProject.noteFiles) return;

    // Save current note before switching
    if (currentNoteFile) {
        await saveCurrentNoteFileFullscreen();
    }

    const file = currentProject.noteFiles.find(f => f.id === fileId);
    if (!file) return;

    currentNoteFile = file;

    // Load new note
    const titleInput = document.getElementById('fullscreenNoteTitle');
    if (titleInput) {
        titleInput.value = file.title;
    }

    if (fullscreenQuillEditor) {
        fullscreenQuillEditor.root.innerHTML = file.content || '';
    }

    // Update UI
    renderFullscreenSidebarFilesList();
    updateIncludeStatusFullscreen();
    markNoteAsSavedFullscreen();
}

// Close fullscreen editor
async function closeFullscreenEditor() {
    // Save before closing
    if (currentNoteFile) {
        await saveCurrentNoteFileFullscreen();
    }

    // Hide fullscreen editor
    const editorPage = document.getElementById('fullscreenNoteEditor');
    editorPage.style.display = 'none';

    // Update main file browser
    renderNoteFilesList();
}

// Toggle sidebar collapse
function toggleSidebar() {
    const sidebar = document.getElementById('editorSidebar');
    const showSidebarBtn = document.getElementById('showSidebarBtn');
    const toggleBtn = document.getElementById('toggleSidebarBtn');

    sidebarCollapsed = !sidebarCollapsed;

    if (sidebarCollapsed) {
        sidebar.style.transform = 'translateX(-100%)';
        sidebar.style.width = '0';
        showSidebarBtn.style.display = 'block';
    } else {
        sidebar.style.transform = 'translateX(0)';
        sidebar.style.width = '280px';
        showSidebarBtn.style.display = 'none';
    }
}

// Save current note file from fullscreen editor
async function saveCurrentNoteFileFullscreen() {
    if (!currentNoteFile || !currentProject) return;

    try {
        const titleInput = document.getElementById('fullscreenNoteTitle');
        const title = titleInput ? titleInput.value.trim() : currentNoteFile.title;
        const content = fullscreenQuillEditor ? fullscreenQuillEditor.root.innerHTML : '';

        // Update current file
        const fileIndex = currentProject.noteFiles.findIndex(f => f.id === currentNoteFile.id);
        if (fileIndex !== -1) {
            currentProject.noteFiles[fileIndex].title = title || 'Untitled Note';
            currentProject.noteFiles[fileIndex].content = content;
            currentProject.noteFiles[fileIndex].updatedAt = Date.now();
        }

        // Save to Firebase
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const user = window.auth.currentUser;
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            noteFiles: currentProject.noteFiles
        });

        currentNoteFile.title = title || 'Untitled Note';
        currentNoteFile.content = content;
        currentNoteFile.updatedAt = Date.now();

        // Invalidate cache since notes have changed
        if (window.generationOptimizer) {
            await window.generationOptimizer.invalidateCache(currentProject.id, user.uid);
        }

        renderFullscreenSidebarFilesList();
        markNoteAsSavedFullscreen();
    } catch (error) {
        console.error('Error saving note:', error);
        showNotification('Failed to save note', 'error');
    }
}

// Update include status indicator for fullscreen editor
function updateIncludeStatusFullscreen() {
    if (!currentNoteFile) return;

    const status = document.getElementById('fullscreenNoteIncludeStatus');
    if (!status) return;

    if (currentNoteFile.selected) {
        status.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success);"></i> Included';
    } else {
        status.innerHTML = '<i class="fas fa-times-circle" style="color: var(--text-muted);"></i> Excluded';
    }
}

// Mark note as unsaved for fullscreen editor
function markNoteAsUnsavedFullscreen() {
    const status = document.getElementById('fullscreenNoteSaveStatus');
    if (status) {
        status.innerHTML = '<i class="fas fa-circle" style="font-size: 0.5rem; color: var(--warning);"></i> Unsaved';
    }
}

// Mark note as saved for fullscreen editor
function markNoteAsSavedFullscreen() {
    const status = document.getElementById('fullscreenNoteSaveStatus');
    if (status) {
        status.innerHTML = '<i class="fas fa-circle" style="font-size: 0.5rem; color: var(--success);"></i> Saved';
    }
}

// Expose fullscreen editor functions to window
window.openNoteFileFullscreen = openNoteFileFullscreen;
window.switchNoteFileInFullscreen = switchNoteFileInFullscreen;
window.closeFullscreenEditor = closeFullscreenEditor;
window.toggleSidebar = toggleSidebar;

// Open note file
function openNoteFile(fileId) {
    if (!currentProject || !currentProject.noteFiles) return;

    const file = currentProject.noteFiles.find(f => f.id === fileId);
    if (!file) return;

    currentNoteFile = file;

    // Show editor header and hide empty state
    document.getElementById('editorHeader').style.display = 'block';
    document.getElementById('editorEmptyState').style.display = 'none';
    document.getElementById('notesEditor').style.display = 'block';

    // Load title
    document.getElementById('currentNoteTitle').value = file.title;

    // Load content
    if (quillEditor) {
        quillEditor.root.innerHTML = file.content || '';
    }

    // Update include status
    updateIncludeStatus();

    // Update file list selection
    renderNoteFilesList();

    // Mark as saved
    markNoteAsSaved();
}

// Save current note file
async function saveCurrentNoteFile() {
    if (!currentNoteFile || !currentProject) return;

    try {
        const titleInput = document.getElementById('currentNoteTitle');
        if (!titleInput) {
            // Element doesn't exist, likely not in inline editor mode
            return;
        }
        const title = titleInput.value.trim();
        const content = quillEditor ? quillEditor.root.innerHTML : '';

        // Update current file
        const fileIndex = currentProject.noteFiles.findIndex(f => f.id === currentNoteFile.id);
        if (fileIndex !== -1) {
            currentProject.noteFiles[fileIndex].title = title || 'Untitled Note';
            currentProject.noteFiles[fileIndex].content = content;
            currentProject.noteFiles[fileIndex].updatedAt = Date.now();
        }

        // Save to Firebase
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const user = window.auth.currentUser;
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            noteFiles: currentProject.noteFiles
        });

        currentNoteFile.title = title || 'Untitled Note';
        currentNoteFile.content = content;
        currentNoteFile.updatedAt = Date.now();

        // Invalidate cache since notes have changed
        if (window.generationOptimizer) {
            const user = window.auth.currentUser;
            await window.generationOptimizer.invalidateCache(currentProject.id, user.uid);
        }

        renderNoteFilesList();
        markNoteAsSaved();
        showNotification('Note saved', 'success');
    } catch (error) {
        console.error('Error saving note:', error);
        showNotification('Failed to save note', 'error');
    }
}

// Toggle note file selection
async function toggleNoteFileSelection(fileId) {
    if (!currentProject || !currentProject.noteFiles) return;

    const file = currentProject.noteFiles.find(f => f.id === fileId);
    if (!file) return;

    file.selected = !file.selected;

    try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const user = window.auth.currentUser;
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            noteFiles: currentProject.noteFiles
        });

        renderNoteFilesList();
        if (currentNoteFile && currentNoteFile.id === fileId) {
            // Check if fullscreen editor is open
            const fullscreenEditor = document.getElementById('fullscreenNoteEditor');
            if (fullscreenEditor && fullscreenEditor.style.display !== 'none') {
                updateIncludeStatusFullscreen();
                renderFullscreenSidebarFilesList();
            } else {
                updateIncludeStatus();
            }
        }
    } catch (error) {
        console.error('Error toggling selection:', error);
        showNotification('Failed to update selection', 'error');
    }
}

// Toggle select all notes
async function toggleSelectAllNotes() {
    if (!currentProject || !currentProject.noteFiles || currentProject.noteFiles.length === 0) return;

    const allSelected = currentProject.noteFiles.every(f => f.selected);
    const newState = !allSelected;

    currentProject.noteFiles.forEach(f => f.selected = newState);

    try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const user = window.auth.currentUser;
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            noteFiles: currentProject.noteFiles
        });

        renderNoteFilesList();
        if (currentNoteFile) {
            // Check if fullscreen editor is open
            const fullscreenEditor = document.getElementById('fullscreenNoteEditor');
            if (fullscreenEditor && fullscreenEditor.style.display !== 'none') {
                updateIncludeStatusFullscreen();
                renderFullscreenSidebarFilesList();
            } else {
                updateIncludeStatus();
            }
        }

        const btn = document.getElementById('selectAllNotesBtn');
        if (btn) {
            btn.textContent = newState ? 'Deselect All' : 'Select All';
        }

        // Update sidebar button too
        const sidebarBtn = document.getElementById('selectAllNotesSidebarBtn');
        if (sidebarBtn) {
            sidebarBtn.textContent = newState ? 'None' : 'All';
        }
    } catch (error) {
        console.error('Error toggling selection:', error);
        showNotification('Failed to update selection', 'error');
    }
}

// Delete note file
async function deleteNoteFile(fileId) {
    if (!currentProject || !currentProject.noteFiles) return;

    const file = currentProject.noteFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        currentProject.noteFiles = currentProject.noteFiles.filter(f => f.id !== fileId);

        const user = window.auth.currentUser;
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            noteFiles: currentProject.noteFiles
        });

        if (currentNoteFile && currentNoteFile.id === fileId) {
            currentNoteFile = null;

            // Close fullscreen editor if it's open
            const fullscreenEditor = document.getElementById('fullscreenNoteEditor');
            if (fullscreenEditor && fullscreenEditor.style.display !== 'none') {
                fullscreenEditor.style.display = 'none';
            }
        }

        // Invalidate cache since notes have changed
        if (window.generationOptimizer) {
            await window.generationOptimizer.invalidateCache(currentProject.id, user.uid);
        }

        renderNoteFilesList();
        showNotification('Note file deleted', 'success');
    } catch (error) {
        console.error('Error deleting note:', error);
        showNotification('Failed to delete note', 'error');
    }
}

// Update include status indicator
function updateIncludeStatus() {
    if (!currentNoteFile) return;

    const icon = document.getElementById('noteIncludeIcon');
    const text = document.getElementById('noteIncludeText');

    // Check if elements exist before updating them
    if (!icon || !text) return;

    if (currentNoteFile.selected) {
        icon.className = 'fas fa-check-circle';
        icon.style.color = 'var(--success)';
        text.textContent = 'Included in generation';
    } else {
        icon.className = 'fas fa-times-circle';
        icon.style.color = 'var(--text-muted)';
        text.textContent = 'Excluded from generation';
    }
}

// Auto-save scheduling
function scheduleAutoSave() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }

    autoSaveTimeout = setTimeout(async () => {
        if (currentNoteFile) {
            // Check if fullscreen editor is open
            const fullscreenEditor = document.getElementById('fullscreenNoteEditor');
            if (fullscreenEditor && fullscreenEditor.style.display !== 'none') {
                await saveCurrentNoteFileFullscreen();
            } else {
                await saveCurrentNoteFile();
            }
        }
    }, 2000); // Auto-save after 2 seconds of inactivity
}

// Mark note as unsaved
function markNoteAsUnsaved() {
    const status = document.getElementById('noteSaveStatus');
    if (status) {
        status.innerHTML = '<i class="fas fa-circle" style="font-size: 0.5rem; color: var(--warning);"></i> Unsaved';
    }
}

// Mark note as saved
function markNoteAsSaved() {
    const status = document.getElementById('noteSaveStatus');
    if (status) {
        status.innerHTML = '<i class="fas fa-circle" style="font-size: 0.5rem; color: var(--success);"></i> Saved';
    }
}

// Expose functions to window
window.openNoteFileById = openNoteFile;
window.toggleNoteFileSelection = toggleNoteFileSelection;
window.deleteNoteFile = deleteNoteFile;

// Save notes (legacy - deprecated, keeping for compatibility)
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

// Helper function to retry API calls with better error handling
async function retryAPICall(apiCall, maxRetries = 2, timeoutMs = 60000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const startTime = Date.now();
        try {
            if (attempt > 1) {
                // Show retry notification
                showNotification(`Retrying API request (attempt ${attempt}/${maxRetries})...`, 'info');
            }

            // Add timeout wrapper
            const result = await Promise.race([
                apiCall(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout - API took too long to respond')), timeoutMs)
                )
            ]);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✓ API call succeeded in ${duration}s`);
            return result;
        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.error(`✗ API call attempt ${attempt} failed after ${duration}s:`, error);

            // Check for specific error types and provide helpful messages
            if (error.message.includes('CORS') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                if (attempt === maxRetries) {
                    throw new Error('Network error: Unable to connect to API server. This could be due to:\n- Poor internet connection\n- API server maintenance\n- CORS configuration issues\n\nPlease try again in a few minutes.');
                }
            }

            if (error.message.includes('timeout')) {
                if (attempt === maxRetries) {
                    throw new Error('API timeout: The server took too long to respond. This could be because:\n- Your input is too large (try reducing content)\n- The API server is overloaded\n- Slow internet connection\n\nPlease try again with smaller content or wait a few minutes.');
                } else {
                    showNotification('Request timed out, retrying with longer timeout...', 'warning');
                }
            }

            if (attempt === maxRetries) {
                // Last attempt failed, throw detailed error
                const errorMsg = error.message || 'Unknown error occurred';
                throw new Error(`Failed after ${maxRetries} attempts: ${errorMsg}`);
            }

            // Wait longer before retrying (5 seconds)
            const waitTime = 5000;
            console.log(`⏳ Retrying in ${waitTime/1000} seconds... (attempt ${attempt + 1}/${maxRetries})`);
            console.log(`   Reason: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

// Regenerate project (test cards and study cards) - OPTIMIZED VERSION
async function regenerateProject() {
    try {
        if (!window.auth || !window.auth.currentUser || !currentProject) {
            showNotification('Please log in to regenerate project', 'error');
            return;
        }

        // Get selected note files
        const selectedNotes = currentProject.noteFiles?.filter(f => f.selected) || [];

        if (selectedNotes.length === 0) {
            showNotification('Please select at least one note file to include in generation', 'error');
            return;
        }

        // Basic validation
        const totalLength = selectedNotes.reduce((sum, note) => sum + (note.content || '').length, 0);
        if (totalLength < 50) {
            showNotification('Please add more content to your selected notes (at least 50 characters)', 'error');
            return;
        }

        // Confirm action
        const selectedCount = selectedNotes.length;
        const message = selectedCount === 1
            ? `This will regenerate cards from "${selectedNotes[0].title}". Continue?`
            : `This will regenerate cards from ${selectedCount} selected note files. Continue?`;

        const confirmed = await new Promise((resolve) => {
            // Set cancel callback
            window.confirmCancelCallback = () => {
                resolve(false);
            };

            window.showConfirm(
                message,
                () => {
                    resolve(true);
                },
                {
                    title: 'Regenerate Cards',
                    confirmText: 'Continue',
                    confirmIcon: 'fa-sync',
                    confirmClass: 'btn-primary'
                }
            );
        });

        if (!confirmed) {
            return;
        }

        // Check if running on localhost
        const isLocalhost = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('localhost');

        if (isLocalhost) {
            const proceedAnyway = await new Promise((resolve) => {
                window.confirmCancelCallback = () => {
                    resolve(false);
                };

                window.showConfirm(
                    'You are running on localhost. The API may not work due to CORS restrictions. For best results, please deploy your app to a server (GitHub Pages, Vercel, Netlify, etc.). Do you want to try anyway?',
                    () => {
                        resolve(true);
                    },
                    {
                        title: 'Localhost Warning',
                        confirmText: 'Try Anyway',
                        confirmIcon: 'fa-exclamation-triangle',
                        confirmClass: 'btn-warning'
                    }
                );
            });

            if (!proceedAnyway) {
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

        // Show progress modal
        const progressModal = document.getElementById('generationProgressModal');
        const statusLog = document.getElementById('generationStatusLog');
        const cacheNotice = document.getElementById('cacheNotice');

        // Ensure modal displays properly on mobile
        console.log('Showing progress modal...');
        progressModal.classList.remove('hidden');
        progressModal.style.display = 'flex';
        cacheNotice.classList.add('hidden');
        statusLog.innerHTML = '<div><i class="fas fa-spinner fa-spin" style="color: var(--primary);"></i> Starting generation...</div>';

        // Reset progress bar
        document.getElementById('generationProgressStatus').textContent = 'Initializing...';
        document.getElementById('generationProgressPercent').textContent = '0%';
        document.getElementById('generationProgressBar').style.width = '0%';

        // Disable regenerate button
        const regenerateBtn = document.getElementById('regenerateProjectBtn');
        const originalText = regenerateBtn.innerHTML;
        regenerateBtn.disabled = true;

        const user = window.auth.currentUser;
        const model = 'gpt-4o-mini';

        // Set up progress callback
        window.generationOptimizer.setProgressCallback((message, percent) => {
            // Update progress bar
            document.getElementById('generationProgressStatus').textContent = message;
            document.getElementById('generationProgressPercent').textContent = `${Math.round(percent)}%`;
            document.getElementById('generationProgressBar').style.width = `${percent}%`;

            // Add to status log
            const logEntry = document.createElement('div');
            logEntry.style.marginTop = '0.5rem';
            logEntry.innerHTML = `<i class="fas fa-check" style="color: var(--success);"></i> ${message}`;
            statusLog.appendChild(logEntry);
            statusLog.scrollTop = statusLog.scrollHeight;
        });

        // OPTIMIZED GENERATION
        const generatedData = await window.generationOptimizer.generateOptimized(selectedNotes, {
            userId: user.uid,
            isPro: isPro || isDev || isAdmin,
            model: model,
            language: language,
            languageInstruction: `Generate all content in ${languageName}. Questions, answers, explanations, and all text should be in ${languageName}.`
        });

        // Show cache notice if loaded from cache
        if (generatedData.fromCache) {
            cacheNotice.classList.remove('hidden');
        }

        // Import Firebase functions
        const { ref, push, update, remove } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

        // Delete old cards
        window.generationOptimizer.updateProgress('Deleting old cards...', 70);
        if (window.cards) {
            const projectCards = window.cards.filter(c => c.projectId === currentProject.id);
            for (const card of projectCards) {
                if (!card.locked) {
                    const cardRef = ref(window.db, `users/${user.uid}/cards/${card.id}`);
                    await remove(cardRef);
                }
            }
        }

        // Save new test cards
        window.generationOptimizer.updateProgress('Saving test cards...', 80);
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
        window.generationOptimizer.updateProgress('Saving to database...', 90);
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
        window.generationOptimizer.updateProgress('Complete!', 100);

        const successMessage = generatedData.fromCache
            ? `Loaded ${generatedData.studyCardCount} study cards and ${generatedData.testCardCount} test cards from cache! ⚡`
            : `Generated ${generatedData.studyCardCount} study cards and ${generatedData.testCardCount} test cards in ${generatedData.duration.toFixed(1)}s! ${generatedData.chunksProcessed > 1 ? `(${generatedData.chunksProcessed} chunks processed in parallel)` : ''}`;

        showNotification(successMessage, 'success');

        // Reload the cards display
        loadTestCards(currentProject.id);
        loadStudyCards(currentProject.id);

        // Show close button
        document.getElementById('closeProgressModal').classList.remove('hidden');

        regenerateBtn.disabled = false;
        regenerateBtn.innerHTML = originalText;

    } catch (error) {
        console.error('Error regenerating project:', error);

        // Provide helpful error message
        let errorMessage = error.message || 'Unknown error occurred';

        // Add helpful tips for common issues
        if (errorMessage.includes('Network error')) {
            errorMessage += ' Make sure you\'re connected to the internet and the API server is accessible.';
        } else if (errorMessage.includes('CORS')) {
            errorMessage += ' Try deploying your app to a server instead of running it locally.';
        } else if (errorMessage.includes('timed out')) {
            errorMessage += ' Try reducing the amount of content or simplifying your notes.';
        }

        showNotification('Failed to regenerate: ' + errorMessage, 'error');

        // Hide progress modal
        const progressModal = document.getElementById('generationProgressModal');
        progressModal.classList.add('hidden');
        progressModal.style.display = 'none';

        // Hide close button
        const closeBtn = document.getElementById('closeProgressModal');
        if (closeBtn) {
            closeBtn.classList.add('hidden');
        }

        const regenerateBtn = document.getElementById('regenerateProjectBtn');
        if (regenerateBtn) {
            regenerateBtn.disabled = false;
            regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate Project';
        }
    }
}

// Close progress modal
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeProgressModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const modal = document.getElementById('generationProgressModal');
            modal.classList.add('hidden');
            modal.style.display = 'none';
            closeBtn.classList.add('hidden');
        });
    }
});

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

        testCardsList.innerHTML = projectCards.map((card, index) => `
            <div class="card-item test-card" data-card-id="${card.id}" data-card-index="${index}">
                <!-- Display Mode -->
                <div class="test-card-display">
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
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; opacity: 0.7; margin-top: var(--spacing-sm);">
                        Click to edit
                    </div>
                </div>

                <!-- Edit Mode -->
                <div class="test-card-edit-form">
                    <div class="form-group" style="margin-bottom: var(--spacing-md);">
                        <label>Question</label>
                        <textarea class="text-input test-card-question" rows="3">${escapeHtml(card.question)}</textarea>
                    </div>
                    <div class="form-group" style="margin-bottom: var(--spacing-md);">
                        <label>Answer Options</label>
                        <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: var(--spacing-sm);">
                            <i class="fas fa-info-circle"></i> Select the correct answer
                        </p>
                        ${card.options.map((opt, idx) => `
                            <div class="answer-option" style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); align-items: center;">
                                <input type="radio" name="testCardCorrect_${card.id}" value="${idx}" ${idx === card.correctAnswer ? 'checked' : ''}>
                                <input type="text" class="text-input test-card-option" data-option-index="${idx}" value="${escapeHtml(opt)}" style="flex: 1;">
                            </div>
                        `).join('')}
                    </div>
                    <div class="form-group" style="margin-bottom: var(--spacing-md);">
                        <label>Explanation (Optional)</label>
                        <textarea class="text-input test-card-explanation" rows="2">${escapeHtml(card.explanation || '')}</textarea>
                    </div>
                    <div class="form-group" style="margin-bottom: var(--spacing-md);">
                        <label>Difficulty</label>
                        <select class="text-input test-card-difficulty">
                            <option value="easy" ${card.difficulty === 'easy' ? 'selected' : ''}>◯ Easy</option>
                            <option value="medium" ${card.difficulty === 'medium' ? 'selected' : ''}>◉ Medium</option>
                            <option value="hard" ${card.difficulty === 'hard' ? 'selected' : ''}>⬤ Hard</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: var(--spacing-sm); justify-content: flex-end;">
                        <button class="btn btn-secondary cancel-test-card-edit" data-card-id="${card.id}">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button class="btn btn-primary save-test-card" data-card-id="${card.id}">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers for test cards to enable editing
        document.querySelectorAll('.test-card').forEach(cardEl => {
            cardEl.addEventListener('click', (e) => {
                // Don't trigger edit mode if already editing or clicking inside edit form
                if (cardEl.classList.contains('editing') ||
                    e.target.closest('.test-card-edit-form')) {
                    return;
                }
                cardEl.classList.add('editing');
            });
        });

        // Add save handlers
        document.querySelectorAll('.save-test-card').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const cardId = btn.dataset.cardId;
                await saveTestCardEdit(cardId);
            });
        });

        // Add cancel handlers
        document.querySelectorAll('.cancel-test-card-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardEl = btn.closest('.test-card');
                cardEl.classList.remove('editing');
            });
        });

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

// Render mind map - HORIZONTAL CIRCULAR LAYOUT
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
    d3.select(svgElement).selectAll('*').remove();

    const studyCards = project.studyCards;
    const width = mindMapContainer.clientWidth;
    const height = mindMapContainer.clientHeight;

    console.log('Rendering mindmap with study cards:', studyCards.length);

    // Helper to calculate node width based on text
    const calculateNodeWidth = (name) => {
        const textLength = name.length;
        return Math.max(140, Math.min(textLength * 8.5 + 50, 300));
    };

    // Mastery colors
    const masteryColors = {
        'mastered': '#43e97b',
        'good': '#48dbfb',
        'learning': '#feca57',
        'weak': '#ff6b6b',
        'none': '#6b7280'
    };

    // Group cards by level for horizontal positioning
    const levelGroups = {};
    studyCards.forEach((card, i) => {
        const level = card.level || 0;
        if (!levelGroups[level]) levelGroups[level] = [];
        levelGroups[level].push({ ...card, index: i });
    });

    const levels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);

    // Calculate maximum node width per level to ensure proper spacing
    const maxWidthPerLevel = {};
    levels.forEach(level => {
        const cardsInLevel = levelGroups[level];
        const widths = cardsInLevel.map(card => {
            const name = card.topic || card.term || card.name || card.title || `Card ${card.index + 1}`;
            return calculateNodeWidth(name);
        });
        maxWidthPerLevel[level] = Math.max(...widths);
    });

    // Calculate X positions respecting node widths
    const levelXPositions = [];
    let currentX = 100; // Start padding
    levels.forEach(level => {
        levelXPositions.push(currentX);
        currentX += maxWidthPerLevel[level] + 80; // Node width + gap (reduced from 150)
    });

    // Position nodes in horizontal tree layout (left-to-right)
    const nodes = [];
    const rectHeight = 64; // Node height
    levels.forEach((level, levelIdx) => {
        const cardsInLevel = levelGroups[level];
        // Ensure nodes don't overlap vertically - minimum spacing is rectHeight + gap
        const minSpacing = rectHeight + 30; // 64 + 30 = 94px minimum
        const spacing = Math.max(minSpacing, height / (cardsInLevel.length + 1));
        const x = levelXPositions[levelIdx];

        cardsInLevel.forEach((card, idx) => {
            const y = spacing * (idx + 1);
            const name = card.topic || card.term || card.name || card.title || `Card ${idx + 1}`;
            const nodeWidth = calculateNodeWidth(name);
            const mastery = card.mastery || 'none';
            const masteryColor = masteryColors[mastery];

            nodes.push({
                id: card.index,
                x: x,
                y: y,
                name: name,
                definition: card.content || card.definition || card.description || '',
                topic: card.topic || 'Untitled',
                content: card.content || '',
                level: level,
                mastery: mastery,
                masteryColor: masteryColor,
                color: card.color || '#667eea',
                parentIndex: card.parentIndex,
                width: nodeWidth
            });
        });
    });

    // Create links
    const links = [];
    studyCards.forEach((card, index) => {
        if (card.parentIndex !== null && card.parentIndex !== undefined && card.parentIndex >= 0) {
            const sourceNode = nodes.find(n => n.id === card.parentIndex);
            const targetNode = nodes.find(n => n.id === index);
            if (sourceNode && targetNode) {
                links.push({
                    source: sourceNode,
                    target: targetNode
                });
            }
        }
    });

    // Setup SVG
    const svg = d3.select(svgElement);
    svg.attr('width', width).attr('height', height);

    // Create container for zoom/pan
    const container = svg.append('g');

    // Add zoom
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            container.attr('transform', event.transform);
            // Update tooltip position if one is open
            if (window.updateMindMapTooltipPosition) {
                window.updateMindMapTooltipPosition();
            }
        });

    svg.call(zoom);

    // Double-click to reset zoom
    svg.on('dblclick.zoom', null);
    svg.on('dblclick', () => {
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
        );
    });

    // Draw links
    container.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('class', 'mind-map-link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', d => d.target.color || '#667eea')
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.4)
        .style('stroke-linecap', 'round');

    // Draw nodes
    const nodeGroups = container.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('class', 'mind-map-node')
        .attr('data-node-id', d => d.id)
        .attr('transform', d => `translate(${d.x},${d.y})`);

    // Rectangle dimensions
    const getRectWidth = (d) => d.width;
    // rectHeight is defined earlier at line 2231

    // Outer glow for mastery (outside the node)
    nodeGroups.append('rect')
        .attr('class', 'mastery-glow')
        .attr('x', d => -getRectWidth(d) / 2 - 10)
        .attr('y', -rectHeight / 2 - 10)
        .attr('width', d => getRectWidth(d) + 20)
        .attr('height', rectHeight + 20)
        .attr('rx', 14)
        .attr('ry', 14)
        .attr('fill', d => d.masteryColor || 'none')
        .attr('opacity', d => d.masteryColor ? 0.2 : 0)
        .style('filter', d => d.masteryColor ? `blur(12px)` : 'none')
        .attr('pointer-events', 'none');

    // Main rectangle background
    nodeGroups.append('rect')
        .attr('class', 'main-rect')
        .attr('x', d => -getRectWidth(d) / 2)
        .attr('y', -rectHeight / 2)
        .attr('width', d => getRectWidth(d))
        .attr('height', rectHeight)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', '#1e2329')
        .attr('stroke', d => d.masteryColor || d.color || '#667eea')
        .attr('stroke-width', d => d.masteryColor ? 2.5 : 1.5)
        .attr('stroke-opacity', d => d.masteryColor ? 0.8 : 0.3)
        .style('filter', d => {
            const outerShadow = d.masteryColor
                ? `drop-shadow(0 0 10px ${d.masteryColor}40) drop-shadow(0 4px 12px rgba(0,0,0,0.4))`
                : 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))';
            return outerShadow;
        })
        .attr('pointer-events', 'none');

    // Inner glow rectangle (for inside glow effect based on node color)
    nodeGroups.append('rect')
        .attr('class', 'inner-glow')
        .attr('x', d => -getRectWidth(d) / 2)
        .attr('y', -rectHeight / 2)
        .attr('width', d => getRectWidth(d))
        .attr('height', rectHeight)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', d => d.color)
        .attr('opacity', 0.08)
        .attr('pointer-events', 'none');

    // Name label inside rectangle
    nodeGroups.append('text')
        .text(d => d.name)
        .attr('x', d => -getRectWidth(d) / 2 + 14)
        .attr('text-anchor', 'start')
        .attr('dy', -8)
        .attr('fill', '#e8eaed')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('pointer-events', 'none');

    // Level label inside rectangle
    nodeGroups.append('text')
        .text(d => d.level >= 0 ? `Level ${d.level}` : '')
        .attr('x', d => -getRectWidth(d) / 2 + 14)
        .attr('text-anchor', 'start')
        .attr('dy', 10)
        .attr('fill', '#9da7b3')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('pointer-events', 'none');

    // Mastery badge on the right
    const masteryLabels = {
        'mastered': '✓ Mastered',
        'good': 'Good',
        'learning': 'Learning',
        'weak': 'Weak',
        'none': 'Not studied'
    };

    nodeGroups.append('text')
        .text(d => masteryLabels[d.mastery] || 'Not studied')
        .attr('x', d => getRectWidth(d) / 2 - 10)
        .attr('text-anchor', 'end')
        .attr('dy', 8)
        .attr('fill', d => d.masteryColor)
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('opacity', 0.85)
        .attr('pointer-events', 'none');

    // Invisible hover area
    nodeGroups.append('rect')
        .attr('x', d => -getRectWidth(d) / 2 - 12)
        .attr('y', -rectHeight / 2 - 12)
        .attr('width', d => getRectWidth(d) + 24)
        .attr('height', rectHeight + 24)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer');

    // Track currently open tooltip
    let currentOpenTooltip = null;
    let currentTooltipNode = null;

    // Function to update tooltip position
    const updateTooltipPosition = () => {
        if (!currentTooltipNode || !tooltip || currentOpenTooltip === null) return;

        // Get tooltip dimensions
        const tooltipWidth = tooltip.offsetWidth || 300;
        const tooltipHeight = tooltip.offsetHeight || 100;

        // Get container dimensions
        const containerRect = mindMapContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // Always position tooltip at the bottom center of the container
        const padding = 10;
        const left = (containerWidth - tooltipWidth) / 2;
        const top = containerHeight - tooltipHeight - padding;

        tooltip.style.left = Math.max(padding, left) + 'px';
        tooltip.style.top = Math.max(padding, top) + 'px';
    };

    // Make updateTooltipPosition available globally for zoom handler
    window.updateMindMapTooltipPosition = updateTooltipPosition;

    // Detect if device supports touch
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Click/Tap to show tooltip
    nodeGroups.on('click', function(event, d) {
        event.stopPropagation();

        // On touch devices or click, toggle tooltip
        if (currentOpenTooltip === d.id && isTouchDevice) {
            // Close if already open (for touch devices)
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            }
            currentOpenTooltip = null;
            currentTooltipNode = null;
        } else {
            // Open tooltip
            currentOpenTooltip = d.id;
            currentTooltipNode = d;

            if (tooltip) {
                tooltip.querySelector('h4').textContent = d.name;
                tooltip.querySelector('p').textContent = d.definition || 'No description';
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';

                setTimeout(() => {
                    updateTooltipPosition();
                }, 10);
            }
        }
    })
    .on('mouseenter', function(event, d) {
        // Only show tooltip on hover for non-touch devices
        if (isTouchDevice) {
            // Just highlight on touch devices, don't show tooltip
            const nodeColor = d.color || '#667eea';

            d3.select(this).select('.main-rect')
                .transition()
                .duration(200)
                .attr('stroke', nodeColor)
                .attr('stroke-width', 3)
                .attr('stroke-opacity', 0.9);

            d3.select(this).select('.inner-glow')
                .transition()
                .duration(200)
                .attr('opacity', 0.15);
            return;
        }

        // Highlight and show tooltip on hover (desktop only)
        const nodeColor = d.color || '#667eea';

        d3.select(this).select('.main-rect')
            .transition()
            .duration(200)
            .attr('stroke', nodeColor)
            .attr('stroke-width', 3)
            .attr('stroke-opacity', 0.9);

        d3.select(this).select('.inner-glow')
            .transition()
            .duration(200)
            .attr('opacity', 0.15);

        // Show tooltip on hover
        currentOpenTooltip = d.id;
        currentTooltipNode = d;

        if (tooltip) {
            // Set tooltip content
            tooltip.querySelector('h4').textContent = d.name;
            tooltip.querySelector('p').textContent = d.definition || 'No description';

            // Show tooltip
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';

            // Position tooltip after content is set
            setTimeout(() => {
                updateTooltipPosition();
            }, 10);
        }
    })
    .on('mouseleave', function(event, d) {
        // Reset highlight on leave
        d3.select(this).select('.main-rect')
            .transition()
            .duration(200)
            .attr('stroke', d.masteryColor || d.color)
            .attr('stroke-width', d.masteryColor ? 2.5 : 1.5)
            .attr('stroke-opacity', d.masteryColor ? 0.8 : 0.3);

        d3.select(this).select('.inner-glow')
            .transition()
            .duration(200)
            .attr('opacity', 0.08);

        // Hide tooltip when leaving the node (desktop only)
        if (!isTouchDevice) {
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            }
            currentOpenTooltip = null;
            currentTooltipNode = null;
        }
    });

    // Close tooltip when clicking on background
    svg.on('click', function(event) {
        // Only close if clicking on the SVG background, not on nodes
        if (event.target === svg.node() || event.target.tagName === 'rect') {
            if (tooltip && !event.target.closest('.mind-map-node')) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
                currentOpenTooltip = null;
            }
        }
    });
}

// Study Mode State
let studyModeState = {
    cards: [],
    currentIndex: 0,
    returnToPage: null  // Track where to return after study mode
};

// Track if study mode listeners are initialized
let studyModeListenersInitialized = false;

// Initialize Study Mode
function initStudyMode() {
    const startBtn = document.getElementById('startStudyModeBtn');
    const prevBtn = document.getElementById('studyModePrev');
    const nextBtn = document.getElementById('studyModeNext');
    const restartBtn = document.getElementById('restartStudyModeBtn');
    const closeBtn = document.getElementById('closeStudyModeBtn');

    startBtn?.addEventListener('click', startStudyMode);
    prevBtn?.addEventListener('click', () => navigateStudyMode(-1));
    nextBtn?.addEventListener('click', () => navigateStudyMode(1));
    restartBtn?.addEventListener('click', startStudyMode);
    closeBtn?.addEventListener('click', closeStudyMode);

    // Only add document-level listeners once
    if (!studyModeListenersInitialized) {
        studyModeListenersInitialized = true;

        // Use event delegation for exit button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exitStudyModeBtn' || e.target.closest('#exitStudyModeBtn')) {
                console.log('Exit button clicked');
                closeStudyMode();
            }
        });

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

        // Touch/Swipe navigation for mobile and desktop
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let isDragging = false;

        const studyCardContainer = document.getElementById('studyCardContainer');
        const activeCard = document.getElementById('activeStudyCard');

        // Mouse and Touch start
        const handleStart = (e) => {
            const studyModeActive = document.getElementById('studyModeCard')?.classList.contains('hidden') === false;
            if (!studyModeActive) return;

            isDragging = true;
            touchStartX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            touchStartY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

            if (activeCard) {
                activeCard.style.transition = 'none';
            }

            if (studyCardContainer) {
                studyCardContainer.style.cursor = 'grabbing';
            }
        };

        // Mouse and Touch move
        const handleMove = (e) => {
            if (!isDragging) return;

            const studyModeActive = document.getElementById('studyModeCard')?.classList.contains('hidden') === false;
            if (!studyModeActive) return;

            const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const diffX = currentX - touchStartX;
            const diffY = currentY - touchStartY;

            // Only apply transform if horizontal swipe is dominant
            if (Math.abs(diffX) > Math.abs(diffY) && activeCard) {
                e.preventDefault();
                const rotation = diffX / 20;
                const opacity = 1 - Math.abs(diffX) / 400;
                activeCard.style.transform = `translateX(${diffX}px) rotate(${rotation}deg)`;
                activeCard.style.opacity = Math.max(0.3, opacity);
            }
        };

        // Mouse and Touch end
        const handleEnd = (e) => {
            if (!isDragging) return;

            const studyModeActive = document.getElementById('studyModeCard')?.classList.contains('hidden') === false;
            if (!studyModeActive) return;

            isDragging = false;
            touchEndX = e.type.includes('mouse') ? e.clientX : e.changedTouches[0].clientX;
            touchEndY = e.type.includes('mouse') ? e.clientY : e.changedTouches[0].clientY;

            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            if (activeCard) {
                activeCard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            }

            if (studyCardContainer) {
                studyCardContainer.style.cursor = 'grab';
            }

            // Check if horizontal swipe is dominant (more horizontal than vertical)
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Smaller threshold for PC (50px) to avoid triggering navigation bar
                // Larger threshold for touch devices (100px) for intentional swipes
                const isTouchDevice = e.type.includes('touch');
                const swipeThreshold = isTouchDevice ? 100 : 50;

                if (diffX > swipeThreshold) {
                    // Swipe right - go to previous card (skip animation for smooth swipe)
                    navigateStudyMode(-1, true);
                } else if (diffX < -swipeThreshold) {
                    // Swipe left - go to next card (skip animation for smooth swipe)
                    navigateStudyMode(1, true);
                } else {
                    // Reset position if swipe wasn't far enough
                    if (activeCard) {
                        activeCard.style.transform = '';
                        activeCard.style.opacity = '';
                    }
                }
            } else {
                // Reset position for vertical swipes
                if (activeCard) {
                    activeCard.style.transform = '';
                    activeCard.style.opacity = '';
                }
            }
        };

        // Add touch event listeners
        if (studyCardContainer) {
            studyCardContainer.addEventListener('touchstart', handleStart, { passive: false });
            studyCardContainer.addEventListener('touchmove', handleMove, { passive: false });
            studyCardContainer.addEventListener('touchend', handleEnd);

            // Add mouse event listeners for desktop dragging
            studyCardContainer.addEventListener('mousedown', handleStart);
            studyCardContainer.addEventListener('mousemove', handleMove);
            studyCardContainer.addEventListener('mouseup', handleEnd);
            studyCardContainer.addEventListener('mouseleave', () => {
                if (isDragging && activeCard) {
                    isDragging = false;
                    activeCard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    activeCard.style.transform = '';
                    activeCard.style.opacity = '';
                    studyCardContainer.style.cursor = 'grab';
                }
            });
        }
    }
}

// Close Study Mode
async function closeStudyMode() {
    const returnTo = studyModeState.returnToPage || 'projectDetailPage';
    studyModeState.cards = [];
    studyModeState.currentIndex = 0;
    studyModeState.returnToPage = null;

    // Reload project data to get updated mastery (using window.projects)
    if (currentProject && currentProject.id && window.projects) {
        const updatedProject = window.projects.find(p => p.id === currentProject.id);
        if (updatedProject) {
            currentProject = updatedProject;
        }
    }

    // Navigate back to appropriate page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    const targetPage = document.getElementById(returnTo);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.classList.remove('hidden');
    }

    // If returning to study materials page, refresh the mind map
    if (returnTo === 'studyMaterialsPage') {
        if (typeof window.refreshStudyMaterialsView === 'function') {
            window.refreshStudyMaterialsView();
        }
    }
}

// Start Study Mode
function startStudyMode() {
    if (!currentProject || !currentProject.studyCards || currentProject.studyCards.length === 0) {
        showNotification('No study cards available', 'error');
        return;
    }

    // Sort cards with spaced repetition prioritization
    studyModeState.cards = sortCardsWithSpacedRepetition(currentProject.studyCards);
    studyModeState.currentIndex = 0;

    // Navigate to study mode page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    const studyPage = document.getElementById('studyModePage');
    if (studyPage) {
        studyPage.classList.add('active');
        studyPage.classList.remove('hidden');
    }

    document.getElementById('studyModeTitle').textContent = `Study Session - ${currentProject.name}`;
    document.getElementById('studyModeCard').classList.remove('hidden');
    document.getElementById('studyModeComplete').classList.add('hidden');
    document.getElementById('studyModeControls').classList.remove('hidden');

    // Display first card
    displayStudyCard();
}

// Sort cards using spaced repetition algorithm
function sortCardsWithSpacedRepetition(cards) {
    const now = new Date().getTime();

    // Calculate priority for each card based on spaced repetition
    const cardsWithPriority = cards.map((card, index) => {
        const mastery = card.mastery || 'none';
        const lastStudied = card.lastStudied ? new Date(card.lastStudied).getTime() : 0;
        const daysSinceStudied = (now - lastStudied) / (1000 * 60 * 60 * 24);

        // Priority score (lower = higher priority)
        let priority = 0;

        // Mastery-based priority
        const masteryPriority = {
            'none': 1,      // Highest priority - never studied
            'weak': 2,      // Very high priority - needs review
            'learning': 3,  // Medium-high priority
            'good': 4,      // Medium priority
            'mastered': 5   // Lowest priority
        };
        priority += masteryPriority[mastery] * 1000;

        // Time-based priority (spaced repetition intervals)
        const intervals = {
            'none': 0,       // Review immediately
            'weak': 1,       // Review after 1 day
            'learning': 3,   // Review after 3 days
            'good': 7,       // Review after 7 days
            'mastered': 14   // Review after 14 days
        };

        const targetInterval = intervals[mastery];
        const needsReview = daysSinceStudied >= targetInterval;

        if (needsReview) {
            // Cards that need review get higher priority
            priority -= (daysSinceStudied - targetInterval) * 100;
        } else {
            // Cards that don't need review yet get lower priority
            priority += (targetInterval - daysSinceStudied) * 100;
        }

        // Add some hierarchy consideration (prefer lower levels first for foundation)
        priority += (card.level || 0) * 10;

        return {
            ...card,
            originalIndex: index,
            priority: priority,
            needsReview: needsReview,
            daysSinceStudied: daysSinceStudied
        };
    });

    // Sort by priority (ascending - lower priority value = shown first)
    return cardsWithPriority.sort((a, b) => a.priority - b.priority);
}

// Expose functions for study materials viewer
window.startStudyMode = startStudyMode;
window.setCurrentProjectForStudy = function(project) {
    currentProject = project;
};
window.studyModeState = studyModeState;
window.displayStudyCard = displayStudyCard;

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
function displayStudyCard(targetElement = null) {
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

    // Determine which element to update (default is active card)
    const cardElement = targetElement || document.getElementById('activeStudyCard');

    // Update card content
    const levelLabels = {
        0: 'Overview',
        1: 'Main Topic',
        2: 'Subtopic',
        3: 'Detailed Concept',
        4: 'Specific Detail'
    };

    const levelBadge = targetElement ? cardElement.querySelector('[data-card-level]') : document.getElementById('studyCardLevel');
    const topicElement = targetElement ? cardElement.querySelector('[data-card-topic]') : document.getElementById('studyCardTopic');
    const contentElement = targetElement ? cardElement.querySelector('[data-card-content]') : document.getElementById('studyCardContent');

    if (levelBadge) {
        levelBadge.textContent = levelLabels[card.level] || `Level ${card.level}`;
        levelBadge.style.background = card.color || '#667eea';
    }
    if (topicElement) {
        topicElement.textContent = card.topic || card.term || 'Untitled';
    }
    if (contentElement) {
        contentElement.textContent = card.content || card.definition || '';
    }

    // Reset active card transform (only for main card)
    if (!targetElement) {
        const activeCard = document.getElementById('activeStudyCard');
        if (activeCard && !activeCard.classList.contains('slide-in-from-back')) {
            activeCard.style.transform = '';
            activeCard.style.opacity = '';
        }

        // Update navigation buttons
        document.getElementById('studyModePrev').disabled = studyModeState.currentIndex === 0;
        document.getElementById('studyModeNext').disabled = studyModeState.currentIndex === totalCards - 1;

        // Highlight current mastery level (reset all first, then highlight current if exists)
        const currentMastery = card.mastery || null;
        document.querySelectorAll('.mastery-btn').forEach(btn => {
            if (currentMastery && btn.dataset.mastery === currentMastery) {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.3)';
                btn.style.opacity = '1';
            } else {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = 'none';
                btn.style.opacity = '0.8';
            }
        });
    }
}

// Preload next card content onto a background stack card
function preloadNextCard(nextIndex) {
    if (nextIndex < 0 || nextIndex >= studyModeState.cards.length) return;

    const card = studyModeState.cards[nextIndex];
    const stackCards = document.querySelectorAll('.study-card-stack');

    // Use the first stack card (back-3) to show the next card
    if (stackCards.length > 0) {
        const preloadCard = stackCards[0];

        // Update card content
        const levelLabels = {
            0: 'Overview',
            1: 'Main Topic',
            2: 'Subtopic',
            3: 'Detailed Concept',
            4: 'Specific Detail'
        };

        // FIRST: Disable transitions to prevent fade/transform effects
        preloadCard.style.setProperty('transition', 'none', 'important');

        // Force a reflow to ensure transition is disabled before changing other properties
        preloadCard.offsetHeight;

        // THEN: Remove ALL visual effects - make it look EXACTLY like the active card
        preloadCard.style.setProperty('opacity', '1', 'important');
        preloadCard.style.setProperty('transform', 'none', 'important');
        preloadCard.style.setProperty('filter', 'none', 'important');
        preloadCard.style.setProperty('backdrop-filter', 'none', 'important');
        preloadCard.style.setProperty('will-change', 'auto', 'important');
        preloadCard.style.setProperty('-webkit-font-smoothing', 'auto', 'important');
        preloadCard.style.setProperty('backface-visibility', 'visible', 'important');

        // Create content HTML similar to active card
        preloadCard.innerHTML = `
            <div style="text-align: center; margin-bottom: var(--spacing-sm);">
                <div data-card-level style="display: inline-block; padding: 0.375rem 0.75rem; background: ${card.color || '#667eea'}; color: white; border-radius: var(--radius-md); font-size: 0.75rem;">${levelLabels[card.level] || `Level ${card.level}`}</div>
            </div>
            <h2 data-card-topic style="color: var(--primary); margin-bottom: var(--spacing-md); font-size: 1.5rem; text-align: center;">${card.topic || card.term || 'Untitled'}</h2>
            <div style="height: 2px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: var(--spacing-md) 0;"></div>
            <div data-card-content style="color: var(--text); font-size: 1rem; line-height: 1.6;">${card.content || card.definition || ''}</div>
        `;
    }
}

// Navigate study mode with animation (NO SCALING)
function navigateStudyMode(direction, skipAnimation = false) {
    const newIndex = studyModeState.currentIndex + direction;
    if (newIndex < 0 || newIndex >= studyModeState.cards.length) return;

    const activeCard = document.getElementById('activeStudyCard');

    if (skipAnimation) {
        // Simple fade for swipe navigation
        activeCard.style.transition = 'opacity 0.15s ease';
        activeCard.style.opacity = '0';

        setTimeout(() => {
            // Clear any transforms
            activeCard.style.transform = '';

            // Update index
            studyModeState.currentIndex = newIndex;

            // Update content
            displayStudyCard();

            // Fade back in
            requestAnimationFrame(() => {
                activeCard.style.opacity = '1';
            });

            // Clean up
            setTimeout(() => {
                activeCard.style.transition = '';
            }, 150);
        }, 150);
    } else {
        // Full animation for button clicks

        if (direction > 0) {
            // NEXT: Show preloaded card behind, current card slides left

            // STEP 1: Preload the next card behind
            preloadNextCard(newIndex);

            // STEP 2: Slide current card to left
            activeCard.classList.add('slide-out-left');

            // STEP 3: After animation, just update content
            setTimeout(() => {
                activeCard.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-from-back', 'slide-in-from-left');

                studyModeState.currentIndex = newIndex;
                displayStudyCard();

                // Hide preloaded card
                const stackCards = document.querySelectorAll('.study-card-stack');
                if (stackCards.length > 0) {
                    stackCards[0].innerHTML = '';
                    stackCards[0].style.setProperty('opacity', '0', 'important');
                    stackCards[0].style.setProperty('transform', 'none', 'important');
                    stackCards[0].style.setProperty('transition', 'none', 'important');
                }

                activeCard.style.transform = '';
                activeCard.style.opacity = '1';
            }, 400);

        } else {
            // PREVIOUS: Current card stays visible, new card slides in from left on top

            const stackCards = document.querySelectorAll('.study-card-stack');
            if (stackCards.length > 0) {
                const slideInCard = stackCards[0];

                // Load the previous card content onto the stack card
                const card = studyModeState.cards[newIndex];
                const levelLabels = {
                    0: 'Overview',
                    1: 'Main Topic',
                    2: 'Subtopic',
                    3: 'Detailed Concept',
                    4: 'Specific Detail'
                };

                // Position stack card off-screen to the left
                slideInCard.style.setProperty('transition', 'none', 'important');
                slideInCard.style.setProperty('transform', 'translateX(-150%) translateY(50px) rotateZ(-15deg)', 'important');
                slideInCard.style.setProperty('opacity', '0', 'important');
                slideInCard.style.setProperty('z-index', '20', 'important'); // Above active card

                // Add content to the stack card
                slideInCard.innerHTML = `
                    <div style="text-align: center; margin-bottom: var(--spacing-sm);">
                        <div data-card-level style="display: inline-block; padding: 0.375rem 0.75rem; background: ${card.color || '#667eea'}; color: white; border-radius: var(--radius-md); font-size: 0.75rem;">${levelLabels[card.level] || `Level ${card.level}`}</div>
                    </div>
                    <h2 data-card-topic style="color: var(--primary); margin-bottom: var(--spacing-md); font-size: 1.5rem; text-align: center;">${card.topic || card.term || 'Untitled'}</h2>
                    <div style="height: 2px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: var(--spacing-md) 0;"></div>
                    <div data-card-content style="color: var(--text); font-size: 1rem; line-height: 1.6;">${card.content || card.definition || ''}</div>
                `;

                // Force reflow
                slideInCard.offsetHeight;

                // Animate slide in from left
                requestAnimationFrame(() => {
                    slideInCard.style.setProperty('transition', 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 'important');
                    slideInCard.style.setProperty('transform', 'translateX(0) translateY(0) rotateZ(0deg)', 'important');
                    slideInCard.style.setProperty('opacity', '1', 'important');

                    // After animation completes, swap content to active card
                    setTimeout(() => {
                        studyModeState.currentIndex = newIndex;
                        displayStudyCard();

                        // Hide and reset stack card
                        slideInCard.innerHTML = '';
                        slideInCard.style.setProperty('opacity', '0', 'important');
                        slideInCard.style.setProperty('transform', 'none', 'important');
                        slideInCard.style.setProperty('z-index', '1', 'important');
                        slideInCard.style.setProperty('transition', 'none', 'important');
                    }, 400);
                });
            }
        }
    }
}

// Animate stack card position
function animateStackCard(card, fromPos, toPos) {
    const positions = {
        0: { y: 0, opacity: 1 },
        1: { y: 4, opacity: 0.7 },
        2: { y: 8, opacity: 0.5 },
        3: { y: 12, opacity: 0.3 }
    };

    const from = positions[fromPos];
    const to = positions[toPos];

    card.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    card.style.transform = `translateY(${to.y}px)`;
    card.style.opacity = to.opacity;
}

// Show study complete
function showStudyComplete() {
    document.getElementById('studyModeCard').classList.add('hidden');
    document.getElementById('studyModeComplete').classList.remove('hidden');
    document.getElementById('studyModeControls').classList.add('hidden');
}

// Set card mastery level
async function setCardMastery(mastery) {
    if (!currentProject || !studyModeState.cards[studyModeState.currentIndex]) {
        return;
    }

    const card = studyModeState.cards[studyModeState.currentIndex];
    const originalIndex = card.originalIndex;

    // Update in studyModeState
    card.mastery = mastery;
    card.lastStudied = new Date().toISOString();

    // Update in current project
    if (currentProject.studyCards && currentProject.studyCards[originalIndex]) {
        currentProject.studyCards[originalIndex].mastery = mastery;
        currentProject.studyCards[originalIndex].lastStudied = new Date().toISOString();
    }

    // Save to Firebase
    try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const user = window.auth.currentUser;
        if (user && currentProject.id) {
            const cardRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}/studyCards/${originalIndex}`);
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
                    btn.style.opacity = '1';
                } else {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = 'none';
                    btn.style.opacity = '0.8';
                }
            });

            // Update mindmap analytics if on mindmap tab
            updateMindmapAnalytics(currentProject.studyCards);

            // Refresh mindmap if visible to show updated mastery
            if (document.getElementById('projectMindMapContainer')?.offsetParent !== null) {
                renderMindMap();
            }

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

        // Create new note file with imported content
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        const noteFile = {
            id: Date.now().toString(),
            title: fileName,
            content: `<p>${parseData.text.replace(/\n/g, '</p><p>')}</p>`, // Convert to HTML
            selected: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (!currentProject.noteFiles) {
            currentProject.noteFiles = [];
        }

        currentProject.noteFiles.push(noteFile);

        // Save to Firebase
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const user = window.auth.currentUser;
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            noteFiles: currentProject.noteFiles
        });

        const wordCount = parseData.text.split(/\s+/).length;
        showNotification(`File imported! Created "${fileName}" with ${wordCount} words.`, 'success');

        // Render and open the new file
        renderNoteFilesList();
        openNoteFile(noteFile.id);

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
        const confirmed = await new Promise((resolve) => {
            let hasResponded = false;
            window.showConfirm(
                `Your notes are very long (${wordCount} words). AI cleaning may take a while and could be expensive. Continue?`,
                () => {
                    hasResponded = true;
                    resolve(true);
                },
                {
                    title: 'Long Notes Warning',
                    confirmText: 'Continue',
                    confirmIcon: 'fa-exclamation-triangle',
                    confirmClass: 'btn-primary'
                }
            );
            setTimeout(() => {
                if (!hasResponded) resolve(false);
            }, 50);
        });
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

    // Update sidebar navigation highlighting
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    // Map page IDs to navigation items
    const pageToNavMap = {
        'dashboardPage': 'dashboard',
        'projectsPage': 'projects',
        'projectDetailPage': 'projects', // Project detail should highlight Projects tab
        'cardsPage': 'cards',
        'studyPage': 'study',
        'explorePage': 'explore',
        'leaderboardPage': 'leaderboard',
        'devPage': 'dev',
        'adminPage': 'admin',
        'accountPage': 'account',
        'studyModePage': 'projects', // Study mode should also highlight Projects tab
        'publicQuizPage': 'explore', // Public quiz should highlight Explore tab
        'projectTestPage': 'projects' // Project test should highlight Projects tab
    };

    const navPage = pageToNavMap[pageId];
    if (navPage) {
        const navLink = document.querySelector(`.nav-link[data-page="${navPage}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }
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

// Project Test State
let currentProjectTest = null;

function startProjectTest() {
    if (!currentProject) {
        showNotification('No project loaded', 'error');
        return;
    }

    // Get test cards for this project
    const projectCards = window.cards ? window.cards.filter(c => c.projectId === currentProject.id) : [];

    if (projectCards.length === 0) {
        showNotification('No test cards available. Add some test cards first!', 'error');
        return;
    }

    // Shuffle cards for the test
    const shuffledCards = shuffleArray([...projectCards]);

    currentProjectTest = {
        projectId: currentProject.id,
        projectName: currentProject.name,
        cards: shuffledCards,
        currentIndex: 0,
        score: 0,
        startTime: Date.now(),
        answers: []
    };

    // Navigate to project test page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    const testPage = document.getElementById('projectTestPage');
    if (testPage) {
        testPage.classList.add('active');
        testPage.classList.remove('hidden');
    }

    document.getElementById('projectTestPageTitle').textContent = `Test - ${currentProject.name}`;
    showProjectTestQuestion();
}

// Shuffle array helper
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function showProjectTestQuestion() {
    if (!currentProjectTest) return;

    const card = currentProjectTest.cards[currentProjectTest.currentIndex];
    const content = document.getElementById('projectTestPageContent');

    content.innerHTML = `
        <div class="test-header">
            <div class="test-progress">Question ${currentProjectTest.currentIndex + 1} of ${currentProjectTest.cards.length}</div>
            <div class="test-score">Score: ${currentProjectTest.score}/${currentProjectTest.currentIndex}</div>
        </div>
        <div class="test-card">
            <div class="question-text">${escapeHtml(card.question)}</div>
            <div class="answers-list" id="projectAnswersList">
                ${card.options.map((opt, idx) => `
                    <button class="answer-btn" onclick="window.selectProjectTestAnswer(${idx})">
                        <div class="answer-letter">${String.fromCharCode(65 + idx)}</div>
                        <div>${escapeHtml(opt)}</div>
                    </button>
                `).join('')}
            </div>
            <div class="feedback hidden" id="projectTestFeedback"></div>
            <div class="test-actions" style="position: relative; display: flex; justify-content: center; align-items: center; min-height: 48px;">
                <button id="nextProjectTestQuestionBtn" class="btn btn-primary hidden" onclick="window.nextProjectTestQuestion()">
                    <i class="fas fa-arrow-right"></i> Next Question
                </button>
                <button class="btn btn-primary" onclick="window.exitProjectTest()" style="position: absolute; right: 0; background: var(--danger); border-color: var(--danger);">
                    <i class="fas fa-sign-out-alt"></i> Exit Test
                </button>
            </div>
        </div>
    `;
}

window.selectProjectTestAnswer = function(selectedIdx) {
    const card = currentProjectTest.cards[currentProjectTest.currentIndex];
    const buttons = document.querySelectorAll('#projectAnswersList .answer-btn');
    const feedback = document.getElementById('projectTestFeedback');

    // Disable buttons immediately
    buttons.forEach(btn => btn.disabled = true);

    // Instant validation (we have the answers locally)
    const isCorrect = selectedIdx === card.correctAnswer;

    // Store answer
    currentProjectTest.answers.push({
        cardId: card.id,
        selectedAnswer: selectedIdx,
        isCorrect
    });

    // Show correct/incorrect styling
    buttons.forEach((btn, idx) => {
        if (idx === card.correctAnswer) btn.classList.add('correct');
        else if (idx === selectedIdx && !isCorrect) btn.classList.add('incorrect');
    });

    if (isCorrect) currentProjectTest.score++;

    feedback.classList.remove('hidden');
    feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
    feedback.innerHTML = `<strong>${isCorrect ? 'Correct!' : 'Incorrect'}</strong>${card.explanation ? `<p style="margin-top: 0.5rem;">${escapeHtml(card.explanation)}</p>` : ''}`;
    document.getElementById('nextProjectTestQuestionBtn').classList.remove('hidden');
};

window.nextProjectTestQuestion = function() {
    currentProjectTest.currentIndex++;
    if (currentProjectTest.currentIndex >= currentProjectTest.cards.length) {
        showProjectTestResults();
    } else {
        showProjectTestQuestion();
    }
};

function showProjectTestResults() {
    const score = currentProjectTest.score;
    const total = currentProjectTest.cards.length;
    const percentage = Math.round((score / total) * 100);
    const timeSpent = Math.round((Date.now() - currentProjectTest.startTime) / 1000);

    document.getElementById('projectTestPageContent').innerHTML = `
        <div class="results-card">
            <div class="results-icon"><i class="fas fa-trophy"></i></div>
            <h3>Test Complete!</h3>
            <div class="results-score">
                <div class="score-big">${score}/${total}</div>
                <div class="score-percentage">${percentage}%</div>
            </div>
            <div style="color: var(--text-secondary); margin-top: var(--spacing-md);">
                Time: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s
            </div>
            <div class="results-actions">
                <button class="btn btn-primary" onclick="window.closeProjectTest()">Close Test</button>
            </div>
        </div>
    `;
}

window.exitProjectTest = function() {
    if (!currentProjectTest) return;
    // Show results screen early
    showProjectTestResults();
};

window.closeProjectTest = function() {
    currentProjectTest = null;
    // Navigate back to project detail page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    const projectPage = document.getElementById('projectDetailPage');
    if (projectPage) {
        projectPage.classList.add('active');
        projectPage.classList.remove('hidden');
    }
};

export { quillEditor, currentProject };

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectDetailPage);
} else {
    // DOM already loaded
    setTimeout(initProjectDetailPage, 100);
}
