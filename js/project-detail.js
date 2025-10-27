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
        addTestCardBtn.addEventListener('click', () => {
            showNotification('Add test card feature coming soon!', 'info');
        });
    }

    // Start test from project
    const startTestBtn = document.getElementById('startProjectTestBtn');
    if (startTestBtn) {
        startTestBtn.addEventListener('click', startProjectTest);
    }
}

// Open a project in detail view
async function openProject(projectId) {
    try {
        // Get project data from window.projects (already loaded)
        const project = window.projects ? window.projects.find(p => p.id === projectId) : null;

        if (!project) {
            showNotification('Project not found', 'error');
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

    // Load mind map if switching to that tab
    if (tabName === 'mindMap') {
        renderMindMap();
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

        // Import Firebase functions dynamically
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            notes: notes,
            updatedAt: new Date().toISOString()
        });

        // Update local project data
        currentProject.notes = notes;
        if (window.projects) {
            const projectIndex = window.projects.findIndex(p => p.id === currentProject.id);
            if (projectIndex !== -1) {
                window.projects[projectIndex].notes = notes;
            }
        }

        showNotification('Notes saved successfully', 'success');
    } catch (error) {
        console.error('Error saving notes:', error);
        showNotification('Failed to save notes: ' + error.message, 'error');
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
        const model = 'gpt-5-nano-2025-08-07';
        const quizCount = 30;

        // Import Firebase functions
        const { ref, push, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

        // Step 1: Generate study cards
        const studyCardsResponse = await fetch('https://quizapp2-eight.vercel.app/api/generate-study-cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.uid,
                isPro: isPro || isDev || isAdmin,
                text: notesText,
                model: model
            })
        });

        if (!studyCardsResponse.ok) {
            const error = await studyCardsResponse.json();
            throw new Error(error.error || 'Failed to generate study cards');
        }

        const studyCardsData = await studyCardsResponse.json();

        // Step 2: Generate quiz cards
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating test cards...';

        const quizCardsResponse = await fetch('https://quizapp2-eight.vercel.app/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.uid,
                isPro: isPro || isDev || isAdmin,
                text: notesText,
                count: quizCount,
                model: model,
                difficulty: 'mixed'
            })
        });

        if (!quizCardsResponse.ok) {
            const error = await quizCardsResponse.json();
            throw new Error(error.error || 'Failed to generate test cards');
        }

        const quizCardsData = await quizCardsResponse.json();

        // Step 3: Save everything
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving to project...';

        // Save quiz cards
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
                createdAt: Date.now()
            };
            await push(cardsRef, cardData);
        }

        // Save study cards to project
        const projectRef = ref(window.db, `users/${user.uid}/projects/${currentProject.id}`);
        await update(projectRef, {
            studyCards: studyCardsData.cards,
            studyCardsCount: studyCardsData.count,
            updatedAt: new Date().toISOString()
        });

        // Update local project data
        currentProject.studyCards = studyCardsData.cards;
        currentProject.studyCardsCount = studyCardsData.count;

        if (window.projects) {
            const projectIndex = window.projects.findIndex(p => p.id === currentProject.id);
            if (projectIndex !== -1) {
                window.projects[projectIndex].studyCards = studyCardsData.cards;
                window.projects[projectIndex].studyCardsCount = studyCardsData.count;
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

        studyCardsList.innerHTML = studyCards.map(card => `
            <div class="card-item">
                <div class="card-question">${escapeHtml(card.name || card.title || 'Untitled')}</div>
                <div style="margin-top: var(--spacing-md); color: var(--text-secondary);">
                    ${escapeHtml(card.description || '')}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading study cards:', error);
    }
}

// Render mind map
function renderMindMap() {
    const mindMapContainer = document.getElementById('projectMindMapContainer');
    if (!mindMapContainer) return;

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

    // Mind map visualization will be implemented later
    mindMapContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-project-diagram"></i>
            <p>Mind map visualization coming soon!</p>
        </div>
    `;
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
