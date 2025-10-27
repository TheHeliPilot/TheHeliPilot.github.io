// Import Firebase functions
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    deleteUser,
    signInWithPopup,
    GoogleAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

import {
    ref,
    push,
    set,
    get,
    update,
    remove,
    onValue,
    query,
    orderByChild,
    equalTo
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

// Global state
let currentUser = null;
let projects = [];
let cards = [];
let currentTest = null;
let currentStudy = null;
let editingProject = null;
let editingCard = null;
let isRegistering = false;
let isProUser = false;
let isDevUser = false;
let isAdminUser = false;
let publicProjects = [];
let editingPublicProject = null;
let currentPublicQuiz = null;

// Pro API Configuration - Using Vercel for security
const PRO_API_CONFIG = {
    workerUrl: 'https://quizapp2-eight.vercel.app/api/generate',
};

// ============================================
// AUTHENTICATION
// ============================================

function initAuth() {
    const authForm = document.getElementById('authForm');
    const toggleRegisterBtn = document.getElementById('toggleRegisterBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');

    // Toggle between login and register
    toggleRegisterBtn.addEventListener('click', () => {
        isRegistering = !isRegistering;
        loginBtn.textContent = isRegistering ? 'Create Account' : 'Sign In';
        toggleRegisterBtn.innerHTML = isRegistering
            ? `Already have an account? <strong>Sign in</strong>`
            : `Don't have an account? <strong>Create one</strong>`;
    });

    // Handle form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;

        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(window.auth, email, password);
                showNotification('Account created successfully!', 'success');
            } else {
                await signInWithEmailAndPassword(window.auth, email, password);
                showNotification('Welcome back!', 'success');
            }
            authForm.reset();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Google login
    googleLoginBtn.addEventListener('click', async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(window.auth, provider);
            showNotification('Welcome!', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(window.auth);
            showNotification('Logged out successfully', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Auth state observer
    onAuthStateChanged(window.auth, async (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('authPage').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            document.getElementById('userDisplayName').textContent = user.displayName || user.email.split('@')[0];
            await loadUserData();
        } else {
            currentUser = null;
            document.getElementById('authPage').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
        }
    });
}

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('pageTitle');
    const userMenuBtn = document.getElementById('userMenuBtn');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.dataset.page;

            // Update active nav
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show page
            pages.forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById(`${pageName}Page`);
            if (targetPage) {
                targetPage.classList.add('active');
                pageTitle.textContent = link.querySelector('span').textContent;
            }

            // Load page data
            if (pageName === 'projects') loadProjects();
            if (pageName === 'cards') loadCards();
            if (pageName === 'study') updateProjectSelects();
            if (pageName === 'account') loadAccountPage();
            if (pageName === 'explore') loadPublicProjects();
            if (pageName === 'dev') loadPublicProjects();
            if (pageName === 'admin') { loadPublicProjects(); loadAdminAnalytics(); }
        });
    });

    // User menu button navigates to account page
    userMenuBtn.addEventListener('click', () => {
        const accountLink = document.querySelector('.nav-link[data-page="account"]');
        if (accountLink) {
            accountLink.click();
        }
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadUserData() {
    await Promise.all([
        loadProStatus(),
        loadProjects(),
        loadCards()
    ]);
    updateDashboard();
}

async function loadProStatus() {
    if (!currentUser) return;

    try {
        const proRef = ref(window.db, `users/${currentUser.uid}/isPro`);
        const devRef = ref(window.db, `users/${currentUser.uid}/isDev`);
        const adminRef = ref(window.db, `users/${currentUser.uid}/isAdmin`);

        const [proSnapshot, devSnapshot, adminSnapshot] = await Promise.all([
            get(proRef),
            get(devRef),
            get(adminRef)
        ]);

        isProUser = proSnapshot.exists() ? proSnapshot.val() : false;
        isDevUser = devSnapshot.exists() ? devSnapshot.val() : false;
        isAdminUser = adminSnapshot.exists() ? adminSnapshot.val() : false;

        updateProUI();
        updateDevUI();
        updateAdminUI();
    } catch (error) {
        console.error('Error loading pro/dev/admin status:', error);
        isProUser = false;
        isDevUser = false;
        isAdminUser = false;
    }
}

function updateProUI() {
    // Update pro badge in top bar
    const proBadge = document.getElementById('proBadge');
    if (isProUser) {
        proBadge.classList.remove('hidden');
    } else {
        proBadge.classList.add('hidden');
    }

    // Update AI modal for pro users
    const proAINote = document.getElementById('proAINote');
    const proProviderOption = document.getElementById('proProviderOption');
    if (isProUser) {
        proAINote.classList.remove('hidden');
        proProviderOption.classList.remove('hidden');
    } else {
        proAINote.classList.add('hidden');
        proProviderOption.classList.add('hidden');
    }
}

function updateDevUI() {
    // Show/hide dev dashboard link
    const devDashboardLink = document.getElementById('devDashboardLink');
    if (devDashboardLink) {
        if (isDevUser || isAdminUser) {
            devDashboardLink.classList.remove('hidden');
        } else {
            devDashboardLink.classList.add('hidden');
        }
    }

    // Update dev status on account page
    const isDevUserEl = document.getElementById('isDevUser');
    const notDevUserEl = document.getElementById('notDevUser');
    if (isDevUserEl && notDevUserEl) {
        if (isDevUser || isAdminUser) {
            isDevUserEl.classList.remove('hidden');
            notDevUserEl.classList.add('hidden');
        } else {
            isDevUserEl.classList.add('hidden');
            notDevUserEl.classList.remove('hidden');
        }
    }
}

function updateAdminUI() {
    const adminDashboardLink = document.getElementById('adminDashboardLink');
    if (adminDashboardLink) {
        if (isAdminUser) {
            adminDashboardLink.classList.remove('hidden');
        } else {
            adminDashboardLink.classList.add('hidden');
        }
    }
}

async function loadProjects() {
    if (!currentUser) return;

    try {
        const projectsRef = ref(window.db, `users/${currentUser.uid}/projects`);
        const snapshot = await get(projectsRef);

        projects = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            projects = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            // Sort by createdAt descending
            projects.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }

        renderProjects();
        updateProjectSelects();
    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Error loading projects', 'error');
    }
}

async function loadCards() {
    if (!currentUser) return;

    try {
        const cardsRef = ref(window.db, `users/${currentUser.uid}/cards`);
        const snapshot = await get(cardsRef);

        cards = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            cards = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        }

        renderCards();
    } catch (error) {
        console.error('Error loading cards:', error);
        showNotification('Error loading cards', 'error');
    }
}

function updateDashboard() {
    const totalProjects = projects.length;
    const totalCards = cards.length;
    const masteredCards = cards.filter(c => c.mastered).length;
    const easyCards = cards.filter(c => (c.difficulty || 'medium') === 'easy').length;
    const mediumCards = cards.filter(c => (c.difficulty || 'medium') === 'medium').length;
    const hardCards = cards.filter(c => (c.difficulty || 'medium') === 'hard').length;

    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('totalCards').textContent = totalCards;
    document.getElementById('masteredCards').textContent = masteredCards;
    document.getElementById('studyStreak').textContent = '0';
    document.getElementById('easyCards').textContent = easyCards;
    document.getElementById('mediumCards').textContent = mediumCards;
    document.getElementById('hardCards').textContent = hardCards;

    // Render recent projects
    const recentProjects = projects.slice(0, 3);
    const recentProjectsEl = document.getElementById('recentProjects');

    if (recentProjects.length === 0) {
        recentProjectsEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No projects yet. Create your first project to get started!</p>
            </div>
        `;
    } else {
        recentProjectsEl.innerHTML = recentProjects.map(project => `
            <div class="project-card" style="border-left-color: ${project.color || '#1db954'}">
                <div class="project-header">
                    <div>
                        <div class="project-title">${escapeHtml(project.name)}</div>
                        <div class="project-stats">${getProjectCardCount(project.id)} cards</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// ============================================
// PROJECTS
// ============================================

function renderProjects() {
    const projectsList = document.getElementById('projectsList');

    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No projects yet. Create one to organize your cards!</p>
            </div>
        `;
        return;
    }

    projectsList.innerHTML = projects.map(project => `
        <div class="project-card" style="border-left-color: ${project.color || '#1db954'}">
            <div class="project-header">
                <div>
                    <div class="project-title">${escapeHtml(project.name)}</div>
                    <div class="project-stats">${getProjectCardCount(project.id)} cards</div>
                </div>
                <div class="project-actions">
                    <button class="project-action-btn" onclick="window.editProject('${project.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="project-action-btn" onclick="window.deleteProject('${project.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${project.description ? `<p style="color: var(--text-secondary); margin-top: 0.5rem;">${escapeHtml(project.description)}</p>` : ''}
        </div>
    `).join('');
}

function initProjects() {
    const createProjectBtn = document.getElementById('createProjectBtn');
    const saveProjectBtn = document.getElementById('saveProjectBtn');

    createProjectBtn.addEventListener('click', () => {
        editingProject = null;
        document.getElementById('projectModalTitle').textContent = 'Create Project';
        document.getElementById('projectNameInput').value = '';
        document.getElementById('projectDescInput').value = '';
        document.getElementById('projectColorInput').value = '#1db954';
        openModal('projectModal');
    });

    saveProjectBtn.addEventListener('click', async () => {
        const name = document.getElementById('projectNameInput').value.trim();
        const description = document.getElementById('projectDescInput').value.trim();
        const color = document.getElementById('projectColorInput').value;

        if (!name) {
            showNotification('Please enter a project name', 'error');
            return;
        }

        try {
            const projectData = {
                name,
                description,
                color,
                createdAt: Date.now()
            };

            if (editingProject) {
                const projectRef = ref(window.db, `users/${currentUser.uid}/projects/${editingProject}`);
                await update(projectRef, projectData);
                showNotification('Project updated successfully', 'success');
            } else {
                const projectsRef = ref(window.db, `users/${currentUser.uid}/projects`);
                await push(projectsRef, projectData);
                showNotification('Project created successfully', 'success');
            }

            closeModal('projectModal');
            await loadProjects();
            updateDashboard();
        } catch (error) {
            console.error('Error saving project:', error);
            showNotification('Error saving project', 'error');
        }
    });
}

window.editProject = async function(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    editingProject = projectId;
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    document.getElementById('projectNameInput').value = project.name;
    document.getElementById('projectDescInput').value = project.description || '';
    document.getElementById('projectColorInput').value = project.color || '#1db954';
    openModal('projectModal');
};

window.deleteProject = async function(projectId) {
    if (!confirm('Are you sure you want to delete this project? All cards in this project will also be deleted.')) {
        return;
    }

    try {
        // Delete all cards in this project
        const projectCards = cards.filter(c => c.projectId === projectId);
        for (const card of projectCards) {
            const cardRef = ref(window.db, `users/${currentUser.uid}/cards/${card.id}`);
            await remove(cardRef);
        }

        // Delete the project
        const projectRef = ref(window.db, `users/${currentUser.uid}/projects/${projectId}`);
        await remove(projectRef);

        showNotification('Project deleted successfully', 'success');
        await loadProjects();
        await loadCards();
        updateDashboard();
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Error deleting project', 'error');
    }
};

function updateProjectSelects() {
    const selects = [
        document.getElementById('projectFilter'),
        document.getElementById('cardProjectSelect'),
        document.getElementById('testProjectSelect'),
        document.getElementById('studyProjectSelect'),
        document.getElementById('aiProjectSelect')
    ];

    selects.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        const isFilter = select.id === 'projectFilter';

        select.innerHTML = isFilter
            ? '<option value="all">All Projects</option>'
            : '<option value="">Select a project</option>';

        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    });
}

function getProjectCardCount(projectId) {
    return cards.filter(c => c.projectId === projectId).length;
}

// ============================================
// CARDS
// ============================================

function getDifficultyBadge(difficulty) {
    const diff = difficulty || 'medium';
    const colors = {
        easy: { bg: 'rgba(29, 185, 84, 0.15)', text: '#1db954', border: '#1db954' },
        medium: { bg: 'rgba(255, 173, 102, 0.15)', text: '#ffad66', border: '#ffad66' },
        hard: { bg: 'rgba(255, 92, 92, 0.15)', text: '#ff5c5c', border: '#ff5c5c' }
    };
    const style = colors[diff];
    const icon = diff === 'easy' ? '○' : diff === 'medium' ? '◐' : '●';

    return `<span style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; background: ${style.bg}; color: ${style.text}; border: 1px solid ${style.border}; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">${icon} ${diff}</span>`;
}

function renderCards() {
    const cardsList = document.getElementById('cardsList');
    const projectFilter = document.getElementById('projectFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;

    let filteredCards = cards;
    if (projectFilter && projectFilter !== 'all') {
        filteredCards = filteredCards.filter(c => c.projectId === projectFilter);
    }
    if (difficultyFilter && difficultyFilter !== 'all') {
        filteredCards = filteredCards.filter(c => (c.difficulty || 'medium') === difficultyFilter);
    }

    if (filteredCards.length === 0) {
        cardsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-layer-group"></i>
                <p>No cards yet. Create or generate cards to start learning!</p>
            </div>
        `;
        return;
    }

    cardsList.innerHTML = filteredCards.map(card => {
        const project = projects.find(p => p.id === card.projectId);
        return `
            <div class="card-item">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <div class="card-question" style="margin-bottom: 0; flex: 1;">${escapeHtml(card.question)}</div>
                    ${getDifficultyBadge(card.difficulty)}
                </div>
                <div class="card-options">
                    ${card.options.map((opt, idx) => `
                        <div class="card-option ${idx === card.correctAnswer ? 'correct' : ''}">
                            ${String.fromCharCode(65 + idx)}. ${escapeHtml(opt)}
                        </div>
                    `).join('')}
                </div>
                ${card.explanation ? `<p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;"><strong>Explanation:</strong> ${escapeHtml(card.explanation)}</p>` : ''}
                <div style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">
                    Project: ${project ? escapeHtml(project.name) : 'Unknown'}
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary" onclick="window.editCard('${card.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="window.deleteCard('${card.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function initCards() {
    const createCardBtn = document.getElementById('createCardBtn');
    const saveCardBtn = document.getElementById('saveCardBtn');
    const generateCardsBtn = document.getElementById('generateCardsBtn');
    const projectFilter = document.getElementById('projectFilter');
    const difficultyFilter = document.getElementById('difficultyFilter');

    createCardBtn.addEventListener('click', () => {
        editingCard = null;
        document.getElementById('cardModalTitle').textContent = 'Create Card';
        document.getElementById('cardProjectSelect').value = '';
        document.getElementById('cardQuestionInput').value = '';
        document.getElementById('option0').value = '';
        document.getElementById('option1').value = '';
        document.getElementById('option2').value = '';
        document.getElementById('option3').value = '';
        document.getElementById('cardExplanationInput').value = '';
        document.getElementById('cardDifficultySelect').value = 'medium';
        document.querySelector('input[name="correctAnswer"]').checked = true;
        openModal('cardModal');
    });

    saveCardBtn.addEventListener('click', async () => {
        const projectId = document.getElementById('cardProjectSelect').value;
        const question = document.getElementById('cardQuestionInput').value.trim();
        const options = [
            document.getElementById('option0').value.trim(),
            document.getElementById('option1').value.trim(),
            document.getElementById('option2').value.trim(),
            document.getElementById('option3').value.trim()
        ];
        const correctAnswer = parseInt(document.querySelector('input[name="correctAnswer"]:checked').value);
        const explanation = document.getElementById('cardExplanationInput').value.trim();
        const difficulty = document.getElementById('cardDifficultySelect').value;

        if (!projectId) {
            showNotification('Please select a project', 'error');
            return;
        }
        if (!question) {
            showNotification('Please enter a question', 'error');
            return;
        }
        if (options.some(opt => !opt)) {
            showNotification('Please fill in all answer options', 'error');
            return;
        }

        try {
            const cardData = {
                projectId,
                question,
                options,
                correctAnswer,
                explanation,
                difficulty,
                mastered: false,
                createdAt: Date.now()
            };

            if (editingCard) {
                const cardRef = ref(window.db, `users/${currentUser.uid}/cards/${editingCard}`);
                await update(cardRef, cardData);
                showNotification('Card updated successfully', 'success');
            } else {
                const cardsRef = ref(window.db, `users/${currentUser.uid}/cards`);
                await push(cardsRef, cardData);
                showNotification('Card created successfully', 'success');
            }

            closeModal('cardModal');
            await loadCards();
            updateDashboard();
        } catch (error) {
            console.error('Error saving card:', error);
            showNotification('Error saving card', 'error');
        }
    });

    generateCardsBtn.addEventListener('click', () => {
        openModal('aiModal');
    });

    projectFilter.addEventListener('change', () => {
        renderCards();
    });

    difficultyFilter.addEventListener('change', () => {
        renderCards();
    });
}

window.editCard = async function(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    editingCard = cardId;
    document.getElementById('cardModalTitle').textContent = 'Edit Card';
    document.getElementById('cardProjectSelect').value = card.projectId;
    document.getElementById('cardQuestionInput').value = card.question;
    document.getElementById('option0').value = card.options[0];
    document.getElementById('option1').value = card.options[1];
    document.getElementById('option2').value = card.options[2];
    document.getElementById('option3').value = card.options[3];
    document.getElementById('cardExplanationInput').value = card.explanation || '';
    document.getElementById('cardDifficultySelect').value = card.difficulty || 'medium';
    document.querySelector(`input[name="correctAnswer"][value="${card.correctAnswer}"]`).checked = true;
    openModal('cardModal');
};

window.deleteCard = async function(cardId) {
    if (!confirm('Are you sure you want to delete this card?')) {
        return;
    }

    try {
        const cardRef = ref(window.db, `users/${currentUser.uid}/cards/${cardId}`);
        await remove(cardRef);
        showNotification('Card deleted successfully', 'success');
        await loadCards();
        updateDashboard();
    } catch (error) {
        console.error('Error deleting card:', error);
        showNotification('Error deleting card', 'error');
    }
};

// ============================================
// AI GENERATION
// ============================================

function initAI() {
    const generateBtn = document.getElementById('generateBtn');
    const aiTabs = document.querySelectorAll('.ai-tab');
    const uploadFileBtn = document.getElementById('uploadFileBtn');
    const fileUpload = document.getElementById('fileUpload');
    const manualUploadFileBtn = document.getElementById('manualUploadFileBtn');
    const manualFileUpload = document.getElementById('manualFileUpload');
    const generatePromptBtn = document.getElementById('generatePromptBtn');
    const copyPromptBtn = document.getElementById('copyPromptBtn');
    const importCardsBtn = document.getElementById('importCardsBtn');
    const importJsonBtn = document.getElementById('importJsonBtn');

    // Tab switching
    aiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Update active tab
            aiTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show/hide tab content
            document.querySelectorAll('.ai-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}Tab`).classList.add('active');

            // Show/hide generate button
            if (tabName === 'auto') {
                generateBtn.style.display = 'inline-flex';
            } else {
                generateBtn.style.display = 'none';
            }
        });
    });

    // Show/hide Pro model selector based on provider selection
    const aiProviderSelect = document.getElementById('aiProvider');
    const proModelSelector = document.getElementById('proModelSelector');

    aiProviderSelect.addEventListener('change', () => {
        if (aiProviderSelect.value === 'pro') {
            proModelSelector.classList.remove('hidden');
        } else {
            proModelSelector.classList.add('hidden');
        }
    });

    // File upload - Auto tab
    uploadFileBtn.addEventListener('click', () => fileUpload.click());
    fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('fileName').textContent = file.name;
            const text = await readFile(file);
            document.getElementById('aiTextInput').value = text;
        }
    });

    // File upload - Manual tab
    manualUploadFileBtn.addEventListener('click', () => manualFileUpload.click());
    manualFileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('manualFileName').textContent = file.name;
            const text = await readFile(file);
            document.getElementById('manualTextInput').value = text;
        }
    });

    // Auto generate with API
    generateBtn.addEventListener('click', async () => {
        const projectId = document.getElementById('aiProjectSelect').value;
        const provider = document.getElementById('aiProvider').value;
        const text = document.getElementById('aiTextInput').value.trim();
        const count = parseInt(document.getElementById('aiCardCount').value);
        const difficulty = document.getElementById('aiDifficultySelect').value;

        if (!projectId) {
            showNotification('Please select a project', 'error');
            return;
        }
        if (!provider) {
            showNotification('Please select an AI provider', 'error');
            return;
        }
        if (!text) {
            showNotification('Please enter some study material', 'error');
            return;
        }

        document.getElementById('aiGenerating').classList.remove('hidden');
        document.getElementById('aiError').classList.add('hidden');
        generateBtn.disabled = true;

        try {
            let cards;

            if (provider === 'pro') {
                // Pro users: Use secure Cloudflare Worker
                if (!isProUser) {
                    showNotification('Pro API is only available to Pro members', 'error');
                    return;
                }

                if (!PRO_API_CONFIG.workerUrl) {
                    showNotification('Pro API is not configured. Please contact support.', 'error');
                    return;
                }

                // Get selected model
                const selectedModel = document.getElementById('proModel').value;

                // Call Cloudflare Worker
                const response = await fetch(PRO_API_CONFIG.workerUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: currentUser.uid,
                        isPro: isProUser,
                        text: text,
                        count: count,
                        model: selectedModel,
                        difficulty: difficulty
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to generate cards');
                }

                const data = await response.json();
                cards = data.cards;

            } else {
                // Free users: Use their own API keys
                const apiKey = getAPIKey(provider);
                if (!apiKey) {
                    showNotification(`Please add your ${provider.toUpperCase()} API key in Account settings first`, 'error');
                    return;
                }
                cards = await generateCardsWithAI(provider, apiKey, text, count, difficulty);
            }

            await saveGeneratedCards(projectId, cards);

            closeModal('aiModal');
            showNotification(`Successfully generated ${cards.length} cards!`, 'success');
            await loadCards();
            updateDashboard();
        } catch (error) {
            console.error('Error generating cards:', error);
            document.getElementById('aiError').classList.remove('hidden');
            document.getElementById('aiError').querySelector('p').textContent = error.message;
        } finally {
            document.getElementById('aiGenerating').classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    // Manual method: Generate prompt
    generatePromptBtn.addEventListener('click', () => {
        const text = document.getElementById('manualTextInput').value.trim();
        const count = parseInt(document.getElementById('manualCardCount').value);
        const difficulty = document.getElementById('manualDifficultySelect').value;

        if (!text) {
            showNotification('Please enter study material first', 'error');
            return;
        }

        const prompt = generateAIPrompt(text, count, difficulty);
        document.getElementById('promptText').value = prompt;
        document.getElementById('generatedPrompt').classList.remove('hidden');
    });

    // Copy prompt to clipboard
    copyPromptBtn.addEventListener('click', async () => {
        const promptText = document.getElementById('promptText').value;
        try {
            await navigator.clipboard.writeText(promptText);
            showNotification('Prompt copied to clipboard!', 'success');
        } catch (error) {
            showNotification('Failed to copy prompt', 'error');
        }
    });

    // Import cards from JSON response
    importCardsBtn.addEventListener('click', async () => {
        const projectId = document.getElementById('aiProjectSelect').value;
        const jsonResponse = document.getElementById('aiResponse').value.trim();

        if (!projectId) {
            showNotification('Please select a project', 'error');
            return;
        }
        if (!jsonResponse) {
            showNotification('Please paste the AI response', 'error');
            return;
        }

        try {
            const cards = parseAIResponse(jsonResponse);
            await saveGeneratedCards(projectId, cards);

            closeModal('aiModal');
            showNotification(`Successfully imported ${cards.length} cards!`, 'success');
            await loadCards();
            updateDashboard();

            // Reset manual tab
            document.getElementById('manualTextInput').value = '';
            document.getElementById('aiResponse').value = '';
            document.getElementById('generatedPrompt').classList.add('hidden');
        } catch (error) {
            console.error('Error importing cards:', error);
            showNotification('Error parsing AI response: ' + error.message, 'error');
        }
    });

    // Import cards directly from JSON
    importJsonBtn.addEventListener('click', async () => {
        const projectId = document.getElementById('aiProjectSelect').value;
        const jsonInput = document.getElementById('jsonInput').value.trim();

        if (!projectId) {
            showNotification('Please select a project', 'error');
            return;
        }
        if (!jsonInput) {
            showNotification('Please paste JSON data', 'error');
            return;
        }

        try {
            const cards = parseAIResponse(jsonInput);
            await saveGeneratedCards(projectId, cards);

            closeModal('aiModal');
            showNotification(`Successfully imported ${cards.length} cards!`, 'success');
            await loadCards();
            updateDashboard();

            // Reset JSON tab
            document.getElementById('jsonInput').value = '';
        } catch (error) {
            console.error('Error importing JSON:', error);
            showNotification('Error parsing JSON: ' + error.message, 'error');
        }
    });
}

// Read file content
async function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Generate AI prompt for manual method
function generateAIPrompt(text, count, difficulty = 'medium') {
    const difficultyGuidance = {
        easy: 'mostly easy difficulty with some medium questions',
        medium: 'mostly medium difficulty with a mix of easy and hard questions',
        hard: 'mostly hard difficulty with some medium questions',
        mixed: 'a balanced mix of easy, medium, and hard questions'
    };

    return `Generate ${count} multiple-choice quiz questions from the following study material. Return ONLY a JSON array with no additional text or markdown.

Format:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this is correct",
    "difficulty": "easy|medium|hard"
  }
]

Rules:
- Each question must have exactly 4 options
- correctAnswer is the index (0-3) of the correct option
- Include a difficulty field: "easy", "medium", or "hard"
- Target ${difficultyGuidance[difficulty]} for natural variety
- Make questions educational and accurate
- Provide clear explanations
- Return ONLY the JSON array, nothing else

Study Material:
${text}`;
}

// Parse AI JSON response
function parseAIResponse(jsonText) {
    // Try to extract JSON if it's wrapped in markdown
    let cleaned = jsonText.trim();

    // Remove markdown code blocks if present
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleaned);

    // Validate format
    if (!Array.isArray(parsed)) {
        throw new Error('Response must be a JSON array');
    }

    parsed.forEach((card, index) => {
        if (!card.question || !Array.isArray(card.options) || card.options.length !== 4) {
            throw new Error(`Invalid card format at index ${index}`);
        }
        if (typeof card.correctAnswer !== 'number' || card.correctAnswer < 0 || card.correctAnswer > 3) {
            throw new Error(`Invalid correctAnswer at index ${index}`);
        }
    });

    return parsed;
}

// Generate cards using AI API (for free users with their own keys)
async function generateCardsWithAI(provider, apiKey, text, count, difficulty = 'medium') {
    const prompt = generateAIPrompt(text, count, difficulty);

    let response;

    if (provider === 'openai') {
        const model = 'gpt-4-turbo-preview';

        response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that generates quiz questions. Always return valid JSON arrays only.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        return parseAIResponse(data.choices[0].message.content);

    } else if (provider === 'claude') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Claude API error');
        }

        const data = await response.json();
        return parseAIResponse(data.content[0].text);

    } else if (provider === 'gemini') {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API error');
        }

        const data = await response.json();
        return parseAIResponse(data.candidates[0].content.parts[0].text);
    }

    throw new Error('Unknown AI provider');
}

// Save generated cards to database
async function saveGeneratedCards(projectId, cards) {
    const cardsRef = ref(window.db, `users/${currentUser.uid}/cards`);

    for (const card of cards) {
        const cardData = {
            projectId,
            question: card.question,
            options: card.options,
            correctAnswer: card.correctAnswer,
            explanation: card.explanation || '',
            mastered: false,
            createdAt: Date.now()
        };
        await push(cardsRef, cardData);
    }
}

// API Key management
function getAPIKey(provider) {
    return localStorage.getItem(`apiKey_${provider}`);
}

function setAPIKey(provider, key) {
    if (key) {
        localStorage.setItem(`apiKey_${provider}`, key);
    } else {
        localStorage.removeItem(`apiKey_${provider}`);
    }
}

// ============================================
// TEST MODE
// ============================================

function initTest() {
    const startTestBtn = document.getElementById('startTestBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const endTestBtn = document.getElementById('endTestBtn');
    const retakeTestBtn = document.getElementById('retakeTestBtn');
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');

    startTestBtn.addEventListener('click', startTest);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    endTestBtn.addEventListener('click', endTest);
    retakeTestBtn.addEventListener('click', () => {
        document.getElementById('testResults').classList.add('hidden');
        document.getElementById('testSetup').classList.remove('hidden');
    });
    backToDashboardBtn.addEventListener('click', () => {
        document.querySelector('.nav-link[data-page="dashboard"]').click();
    });
}

function startTest() {
    const projectId = document.getElementById('testProjectSelect').value;
    const questionCount = parseInt(document.getElementById('testQuestionCount').value);
    const randomOrder = document.getElementById('testRandomOrder').checked;

    if (!projectId) {
        showNotification('Please select a project', 'error');
        return;
    }

    let testCards = cards.filter(c => c.projectId === projectId);

    if (testCards.length === 0) {
        showNotification('This project has no cards', 'error');
        return;
    }

    if (randomOrder) {
        testCards = shuffleArray([...testCards]);
    }

    testCards = testCards.slice(0, Math.min(questionCount, testCards.length));

    currentTest = {
        cards: testCards,
        currentIndex: 0,
        score: 0,
        answers: []
    };

    document.getElementById('testSetup').classList.add('hidden');
    document.getElementById('testActive').classList.remove('hidden');
    document.getElementById('totalQuestions').textContent = testCards.length;

    showQuestion();
}

function showQuestion() {
    if (!currentTest) return;

    const card = currentTest.cards[currentTest.currentIndex];
    const questionText = document.getElementById('questionText');
    const answersList = document.getElementById('answersList');
    const answerFeedback = document.getElementById('answerFeedback');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');

    document.getElementById('currentQuestion').textContent = currentTest.currentIndex + 1;
    document.getElementById('testScore').textContent = currentTest.score;
    document.getElementById('testTotal').textContent = currentTest.currentIndex;

    questionText.textContent = card.question;
    answerFeedback.innerHTML = '';
    answerFeedback.classList.remove('correct', 'incorrect');
    nextQuestionBtn.classList.add('hidden');

    answersList.innerHTML = card.options.map((option, idx) => `
        <button class="answer-btn" onclick="window.selectAnswer(${idx})">
            <div class="answer-letter">${String.fromCharCode(65 + idx)}</div>
            <div>${escapeHtml(option)}</div>
        </button>
    `).join('');
}

window.selectAnswer = function(selectedIdx) {
    const card = currentTest.cards[currentTest.currentIndex];
    const isCorrect = selectedIdx === card.correctAnswer;
    const answerButtons = document.querySelectorAll('.answer-btn');
    const answerFeedback = document.getElementById('answerFeedback');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');

    // Disable all buttons
    answerButtons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === card.correctAnswer) {
            btn.classList.add('correct');
        } else if (idx === selectedIdx && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // Update score
    if (isCorrect) {
        currentTest.score++;
        document.getElementById('testScore').textContent = currentTest.score;
    }

    // Show feedback
    answerFeedback.classList.add(isCorrect ? 'correct' : 'incorrect');
    answerFeedback.innerHTML = `
        <strong>${isCorrect ? 'Correct!' : 'Incorrect'}</strong>
        ${card.explanation ? `<p style="margin-top: 0.5rem;">${escapeHtml(card.explanation)}</p>` : ''}
    `;

    // Show next button
    nextQuestionBtn.classList.remove('hidden');
};

function nextQuestion() {
    currentTest.currentIndex++;
    document.getElementById('testTotal').textContent = currentTest.currentIndex;

    if (currentTest.currentIndex >= currentTest.cards.length) {
        showTestResults();
    } else {
        showQuestion();
    }
}

function showTestResults() {
    const total = currentTest.cards.length;
    const score = currentTest.score;
    const percentage = Math.round((score / total) * 100);

    document.getElementById('testActive').classList.add('hidden');
    document.getElementById('testResults').classList.remove('hidden');
    document.getElementById('finalScore').textContent = `${score}/${total}`;
    document.getElementById('scorePercentage').textContent = `${percentage}%`;
}

function endTest() {
    if (!confirm('Are you sure you want to end the test?')) {
        return;
    }
    showTestResults();
}

// ============================================
// ACCOUNT PAGE
// ============================================

function loadAccountPage() {
    if (!currentUser) return;

    document.getElementById('accountEmailInput').value = currentUser.email;
    document.getElementById('displayNameInput').value = currentUser.displayName || '';

    // Update Pro status UI (read-only)
    const proStatusCard = document.getElementById('proStatus');
    const proStatusTitle = document.getElementById('proStatusTitle');
    const proStatusDesc = document.getElementById('proStatusDesc');
    const proUserNote = document.getElementById('proUserNote');

    if (isProUser) {
        proStatusCard.classList.add('is-pro');
        proStatusTitle.textContent = 'Pro Member ⭐';
        proStatusDesc.textContent = 'You have unlimited access to AI-generated cards using our premium API!';
        proUserNote.classList.remove('hidden');
    } else {
        proStatusCard.classList.remove('is-pro');
        proStatusTitle.textContent = 'Free Plan';
        proStatusDesc.textContent = 'You are currently on the free plan. Contact support to upgrade to Pro for unlimited AI-generated cards!';
        proUserNote.classList.add('hidden');
    }

    // Load saved API keys (masked display)
    const openaiKey = getAPIKey('openai');
    const claudeKey = getAPIKey('claude');
    const geminiKey = getAPIKey('gemini');

    document.getElementById('openaiKeyInput').value = openaiKey ? maskAPIKey(openaiKey) : '';
    document.getElementById('claudeKeyInput').value = claudeKey ? maskAPIKey(claudeKey) : '';
    document.getElementById('geminiKeyInput').value = geminiKey ? maskAPIKey(geminiKey) : '';

    // When user focuses on masked key input, clear it so they can enter a new one
    const handleMaskedFocus = (inputId) => {
        const input = document.getElementById(inputId);
        if (input.value && input.value.includes('•')) {
            input.value = '';
        }
    };

    document.getElementById('openaiKeyInput').addEventListener('focus', () => handleMaskedFocus('openaiKeyInput'));
    document.getElementById('claudeKeyInput').addEventListener('focus', () => handleMaskedFocus('claudeKeyInput'));
    document.getElementById('geminiKeyInput').addEventListener('focus', () => handleMaskedFocus('geminiKeyInput'));
}

// Mask API key for display (show only last 4 characters)
function maskAPIKey(key) {
    if (!key || key.length < 8) return '••••••••';
    return '••••••••••••' + key.slice(-4);
}

function initAccount() {
    const updateProfileBtn = document.getElementById('updateProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const saveOpenAIKey = document.getElementById('saveOpenAIKey');
    const saveClaudeKey = document.getElementById('saveClaudeKey');
    const saveGeminiKey = document.getElementById('saveGeminiKey');
    const clearOpenAIKey = document.getElementById('clearOpenAIKey');
    const clearClaudeKey = document.getElementById('clearClaudeKey');
    const clearGeminiKey = document.getElementById('clearGeminiKey');

    updateProfileBtn.addEventListener('click', async () => {
        const displayName = document.getElementById('displayNameInput').value.trim();

        try {
            await updateProfile(currentUser, { displayName });
            document.getElementById('userDisplayName').textContent = displayName || currentUser.email.split('@')[0];
            showNotification('Profile updated successfully', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    changePasswordBtn.addEventListener('click', () => {
        const newPassword = prompt('Enter new password:');
        if (!newPassword) return;

        updatePassword(currentUser, newPassword)
            .then(() => showNotification('Password updated successfully', 'success'))
            .catch(error => showNotification(error.message, 'error'));
    });

    deleteAccountBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
            return;
        }

        try {
            // Delete all user data
            const userRef = ref(window.db, `users/${currentUser.uid}`);
            await remove(userRef);
            await deleteUser(currentUser);
            showNotification('Account deleted', 'success');
        } catch (error) {
            showNotification('Error deleting account. Please sign in again and try.', 'error');
        }
    });

    // API Key Management - OpenAI
    saveOpenAIKey.addEventListener('click', () => {
        const key = document.getElementById('openaiKeyInput').value.trim();
        if (!key) {
            showNotification('Please enter an API key', 'error');
            return;
        }
        setAPIKey('openai', key);
        showNotification('OpenAI API key saved', 'success');
    });

    clearOpenAIKey.addEventListener('click', () => {
        setAPIKey('openai', '');
        document.getElementById('openaiKeyInput').value = '';
        showNotification('OpenAI API key cleared', 'success');
    });

    // API Key Management - Claude
    saveClaudeKey.addEventListener('click', () => {
        const key = document.getElementById('claudeKeyInput').value.trim();
        if (!key) {
            showNotification('Please enter an API key', 'error');
            return;
        }
        setAPIKey('claude', key);
        showNotification('Claude API key saved', 'success');
    });

    clearClaudeKey.addEventListener('click', () => {
        setAPIKey('claude', '');
        document.getElementById('claudeKeyInput').value = '';
        showNotification('Claude API key cleared', 'success');
    });

    // API Key Management - Gemini
    saveGeminiKey.addEventListener('click', () => {
        const key = document.getElementById('geminiKeyInput').value.trim();
        if (!key) {
            showNotification('Please enter an API key', 'error');
            return;
        }
        setAPIKey('gemini', key);
        showNotification('Gemini API key saved', 'success');
    });

    clearGeminiKey.addEventListener('click', () => {
        setAPIKey('gemini', '');
        document.getElementById('geminiKeyInput').value = '';
        showNotification('Gemini API key cleared', 'success');
    });
}

// ============================================
// MODALS
// ============================================

function initModals() {
    // Close modal buttons
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
        el.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                const modalId = modal.id;
                closeModal(modalId);
            }
        });
    });

    // Close on buttons with data-modal
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            closeModal(modalId);
        });
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// ============================================
// UTILITIES
// ============================================

function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    notification.innerHTML = `
        <i class="fas ${iconMap[type]} notification-icon"></i>
        <div class="notification-content">${escapeHtml(message)}</div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================
// STUDY MODE
// ============================================

function initStudy() {
    const startStudyBtn = document.getElementById('startStudyBtn');
    const endStudyBtn = document.getElementById('endStudyBtn');
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    const studyCard = document.getElementById('studyCard');
    const studyProjectSelect = document.getElementById('studyProjectSelect');

    // Update study project select when projects load
    updateProjectSelects();

    startStudyBtn.addEventListener('click', startStudySession);
    endStudyBtn.addEventListener('click', endStudySession);
    prevCardBtn.addEventListener('click', () => navigateStudyCard(-1));
    nextCardBtn.addEventListener('click', () => navigateStudyCard(1));

    // Swipe and tap support
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    studyCard.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        touchStartTime = Date.now();
        isSwiping = false;
    }, false);

    studyCard.addEventListener('touchmove', (e) => {
        const currentX = e.changedTouches[0].screenX;
        const currentY = e.changedTouches[0].screenY;
        const diffX = Math.abs(currentX - touchStartX);
        const diffY = Math.abs(currentY - touchStartY);

        // If horizontal movement is greater than vertical, consider it a swipe
        if (diffX > 10 && diffX > diffY) {
            isSwiping = true;
        }
    }, false);

    studyCard.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        const touchDuration = Date.now() - touchStartTime;

        if (isSwiping) {
            handleSwipe();
        } else if (touchDuration < 300) {
            // Short tap without swipe - flip the card
            toggleCardFlip();
        }
    }, false);

    // Card flip on click (desktop)
    studyCard.addEventListener('click', (e) => {
        // Only flip if not during a touch interaction
        if (touchStartTime === 0 || Date.now() - touchStartTime > 500) {
            toggleCardFlip();
        }
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diffX = touchStartX - touchEndX;
        const diffY = Math.abs(touchStartY - touchEndY);

        // Only consider it a swipe if horizontal movement dominates
        if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > diffY * 2) {
            if (diffX > 0) {
                // Swiped left - next card
                navigateStudyCard(1);
            } else {
                // Swiped right - previous card
                navigateStudyCard(-1);
            }
        }
    }
}

function startStudySession() {
    const projectId = document.getElementById('studyProjectSelect').value;
    const randomOrder = document.getElementById('studyRandomOrder').checked;

    if (!projectId) {
        showNotification('Please select a project', 'error');
        return;
    }

    let studyCards = cards.filter(c => c.projectId === projectId);

    if (studyCards.length === 0) {
        showNotification('This project has no cards', 'error');
        return;
    }

    if (randomOrder) {
        studyCards = shuffleArray([...studyCards]);
    }

    currentStudy = {
        cards: studyCards,
        currentIndex: 0
    };

    document.getElementById('studySetup').classList.add('hidden');
    document.getElementById('studyActive').classList.remove('hidden');
    document.getElementById('totalStudyCards').textContent = studyCards.length;

    showStudyCard();
}

function showStudyCard(animationDirection = null) {
    if (!currentStudy) return;

    const card = currentStudy.cards[currentStudy.currentIndex];
    const studyCard = document.getElementById('studyCard');

    // Function to update card content
    const updateCardContent = () => {
        // Remove flipped class to show question side
        studyCard.classList.remove('flipped');

        // Update content
        document.getElementById('studyQuestion').textContent = card.question;

        // Find the correct answer text
        const correctAnswerText = card.options[card.correctAnswer];
        document.getElementById('studyAnswer').textContent = correctAnswerText;

        // Set explanation
        const explanationEl = document.getElementById('studyExplanation');
        if (card.explanation) {
            explanationEl.innerHTML = `<strong>Explanation:</strong> ${escapeHtml(card.explanation)}`;
        } else {
            explanationEl.innerHTML = '';
        }

        // Update progress
        document.getElementById('currentStudyCard').textContent = currentStudy.currentIndex + 1;

        // Update navigation buttons
        document.getElementById('prevCardBtn').disabled = currentStudy.currentIndex === 0;
        document.getElementById('nextCardBtn').disabled = currentStudy.currentIndex === currentStudy.cards.length - 1;
    };

    // If animation is specified, animate the transition
    if (animationDirection) {
        // Remove any existing animation classes
        studyCard.classList.remove('swipe-out-left', 'swipe-out-right', 'swipe-in-left', 'swipe-in-right');

        // Apply exit animation
        const exitClass = animationDirection === 1 ? 'swipe-out-left' : 'swipe-out-right';
        studyCard.classList.add(exitClass);

        // Wait for exit animation to complete
        setTimeout(() => {
            // Update content while card is off-screen
            updateCardContent();

            // Remove exit animation and apply enter animation
            studyCard.classList.remove(exitClass);
            const enterClass = animationDirection === 1 ? 'swipe-in-right' : 'swipe-in-left';
            studyCard.classList.add(enterClass);

            // Remove enter animation class after it completes
            setTimeout(() => {
                studyCard.classList.remove(enterClass);
            }, 400);
        }, 400);
    } else {
        // No animation, just update content
        updateCardContent();
    }
}

function toggleCardFlip() {
    const studyCard = document.getElementById('studyCard');
    studyCard.classList.toggle('flipped');
}

function navigateStudyCard(direction) {
    if (!currentStudy) return;

    const newIndex = currentStudy.currentIndex + direction;

    if (newIndex >= 0 && newIndex < currentStudy.cards.length) {
        currentStudy.currentIndex = newIndex;
        showStudyCard(direction);
    }
}

function endStudySession() {
    if (!confirm('Are you sure you want to end the study session?')) {
        return;
    }

    currentStudy = null;
    document.getElementById('studyActive').classList.add('hidden');
    document.getElementById('studySetup').classList.remove('hidden');
}

// ============================================
// MOBILE MENU
// ============================================

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle sidebar
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
    });

    // Close sidebar when backdrop is clicked
    backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    });

    // Close sidebar when nav link is clicked (mobile)
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                backdrop.classList.remove('active');
            }
        });
    });
}

// ============================================
// DARK MODE
// ============================================

function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', () => {
        showNotification('Dark mode is always on!', 'info');
    });
}

// ============================================
// PUBLIC PROJECTS & EXPLORE
// ============================================

async function loadPublicProjects() {
    try {
        const publicProjectsRef = ref(window.db, 'publicProjects');
        const snapshot = await get(publicProjectsRef);
        publicProjects = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            publicProjects = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        }
        renderExplore();
        if (isDevUser || isAdminUser) loadDevProjects();
    } catch (error) {
        console.error('Error loading public projects:', error);
    }
}

function renderExplore() {
    const list = document.getElementById('publicProjectsList');
    const category = document.getElementById('exploreCategory').value;
    const difficulty = document.getElementById('exploreDifficulty').value;
    const search = document.getElementById('exploreSearch').value.toLowerCase();

    let filtered = publicProjects.filter(p => p.published);
    if (category !== 'all') filtered = filtered.filter(p => p.category === category);
    if (difficulty !== 'all') filtered = filtered.filter(p => p.difficulty === difficulty);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || (p.tags && p.tags.some(t => t.toLowerCase().includes(search))));

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-globe"></i><p>No public quizzes found.</p></div>';
        return;
    }

    list.innerHTML = filtered.map(p => `
        <div class="project-card public-project-card" style="border-left-color: #9d4edd;">
            <div class="project-header">
                <div>
                    <div class="project-title">${escapeHtml(p.name)}</div>
                    <div class="project-stats">${p.cardCount || 0} cards • By ${escapeHtml(p.creatorName || 'Unknown')}</div>
                </div>
            </div>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">${escapeHtml(p.description || '')}</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap;">
                ${getDifficultyBadge(p.difficulty)}
                <span style="padding: 0.25rem 0.5rem; background: rgba(157, 78, 221, 0.15); color: #9d4edd; border-radius: 6px; font-size: 0.75rem;">${p.category}</span>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="window.startPublicQuiz('${p.id}')"><i class="fas fa-play"></i> Take Quiz</button>
                <button class="btn btn-secondary" onclick="window.showLeaderboard('${p.id}')"><i class="fas fa-trophy"></i> Leaderboard</button>
            </div>
        </div>
    `).join('');
}

function initExplore() {
    const categoryFilter = document.getElementById('exploreCategory');
    const difficultyFilter = document.getElementById('exploreDifficulty');
    const searchInput = document.getElementById('exploreSearch');

    if (categoryFilter) categoryFilter.addEventListener('change', renderExplore);
    if (difficultyFilter) difficultyFilter.addEventListener('change', renderExplore);
    if (searchInput) searchInput.addEventListener('input', renderExplore);
}

// ============================================
// DEV DASHBOARD
// ============================================

async function loadDevProjects() {
    if (!currentUser || (!isDevUser && !isAdminUser)) return;

    try {
        const userProjects = publicProjects.filter(p => p.createdBy === currentUser.uid);
        const list = document.getElementById('devProjectsList');

        if (userProjects.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-tools"></i><p>No public projects yet. Create your first public quiz!</p></div>';
            return;
        }

        list.innerHTML = userProjects.map(p => `
            <div class="project-card" style="border-left-color: #9d4edd;">
                <div class="project-header">
                    <div>
                        <div class="project-title">${escapeHtml(p.name)} ${p.published ? '✓' : '(Draft)'}</div>
                        <div class="project-stats">${p.cardCount || 0} cards • ${p.totalAttempts || 0} attempts</div>
                    </div>
                    <div class="project-actions">
                        <button class="project-action-btn" onclick="window.editPublicProject('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="project-action-btn" onclick="window.togglePublish('${p.id}', ${!p.published})"><i class="fas fa-${p.published ? 'eye-slash' : 'eye'}"></i></button>
                        <button class="project-action-btn" onclick="window.deletePublicProject('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">Avg Score: ${p.averageScore || 0}%</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading dev projects:', error);
    }
}

function initDevDashboard() {
    const createBtn = document.getElementById('createPublicProjectBtn');
    const saveBtn = document.getElementById('savePublicProjectBtn');

    if (createBtn) {
        createBtn.addEventListener('click', () => {
            editingPublicProject = null;
            document.getElementById('publicProjectModalTitle').textContent = 'Create Public Project';
            document.getElementById('publicProjectName').value = '';
            document.getElementById('publicProjectDesc').value = '';
            document.getElementById('publicProjectCategory').value = 'science';
            document.getElementById('publicProjectDifficulty').value = 'medium';
            document.getElementById('publicProjectTags').value = '';
            document.getElementById('publicProjectPublished').checked = false;
            openModal('publicProjectModal');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const name = document.getElementById('publicProjectName').value.trim();
            const description = document.getElementById('publicProjectDesc').value.trim();
            const category = document.getElementById('publicProjectCategory').value;
            const difficulty = document.getElementById('publicProjectDifficulty').value;
            const tags = document.getElementById('publicProjectTags').value.split(',').map(t => t.trim()).filter(t => t);
            const published = document.getElementById('publicProjectPublished').checked;

            if (!name) {
                showNotification('Please enter a project name', 'error');
                return;
            }

            try {
                const projectData = {
                    name,
                    description,
                    category,
                    difficulty,
                    tags,
                    published,
                    createdBy: currentUser.uid,
                    creatorName: currentUser.displayName || currentUser.email.split('@')[0],
                    cardCount: 0,
                    totalAttempts: 0,
                    averageScore: 0,
                    createdAt: Date.now()
                };

                if (editingPublicProject) {
                    await set(ref(window.db, `publicProjects/${editingPublicProject}`), { ...projectData, cardCount: publicProjects.find(p => p.id === editingPublicProject).cardCount });
                    showNotification('Public project updated!', 'success');
                } else {
                    await push(ref(window.db, 'publicProjects'), projectData);
                    showNotification('Public project created!', 'success');
                }

                closeModal('publicProjectModal');
                await loadPublicProjects();
            } catch (error) {
                console.error('Error saving public project:', error);
                showNotification('Error saving project', 'error');
            }
        });
    }
}

window.editPublicProject = async function(id) {
    const project = publicProjects.find(p => p.id === id);
    if (!project) return;

    editingPublicProject = id;
    document.getElementById('publicProjectModalTitle').textContent = 'Edit Public Project';
    document.getElementById('publicProjectName').value = project.name;
    document.getElementById('publicProjectDesc').value = project.description || '';
    document.getElementById('publicProjectCategory').value = project.category;
    document.getElementById('publicProjectDifficulty').value = project.difficulty;
    document.getElementById('publicProjectTags').value = (project.tags || []).join(', ');
    document.getElementById('publicProjectPublished').checked = project.published;
    openModal('publicProjectModal');
};

window.togglePublish = async function(id, publish) {
    try {
        await update(ref(window.db, `publicProjects/${id}`), { published: publish });
        showNotification(publish ? 'Project published!' : 'Project unpublished', 'success');
        await loadPublicProjects();
    } catch (error) {
        showNotification('Error updating project', 'error');
    }
};

window.deletePublicProject = async function(id) {
    if (!confirm('Delete this public project? This cannot be undone.')) return;
    try {
        await remove(ref(window.db, `publicProjects/${id}`));
        await remove(ref(window.db, `publicProjectResults/${id}`));
        showNotification('Project deleted', 'success');
        await loadPublicProjects();
    } catch (error) {
        showNotification('Error deleting project', 'error');
    }
};

// ============================================
// PUBLIC QUIZ TAKING
// ============================================

window.startPublicQuiz = async function(projectId) {
    const project = publicProjects.find(p => p.id === projectId);
    if (!project) return;

    try {
        const cardsSnapshot = await get(ref(window.db, `publicProjects/${projectId}/cards`));
        if (!cardsSnapshot.exists()) {
            showNotification('This quiz has no questions yet', 'error');
            return;
        }

        const cardsData = cardsSnapshot.val();
        const quizCards = Object.keys(cardsData).map(key => ({ id: key, ...cardsData[key] }));

        currentPublicQuiz = {
            projectId,
            projectName: project.name,
            cards: shuffleArray(quizCards),
            currentIndex: 0,
            score: 0,
            startTime: Date.now()
        };

        document.getElementById('publicQuizTitle').textContent = project.name;
        openModal('publicQuizModal');
        showPublicQuestion();
    } catch (error) {
        console.error('Error starting quiz:', error);
        showNotification('Error loading quiz', 'error');
    }
};

function showPublicQuestion() {
    if (!currentPublicQuiz) return;

    const card = currentPublicQuiz.cards[currentPublicQuiz.currentIndex];
    const content = document.getElementById('publicQuizContent');

    content.innerHTML = `
        <div class="test-header">
            <div class="test-progress">Question ${currentPublicQuiz.currentIndex + 1} of ${currentPublicQuiz.cards.length}</div>
            <div class="test-score">Score: ${currentPublicQuiz.score}/${currentPublicQuiz.currentIndex}</div>
        </div>
        <div class="test-card">
            <div class="question-text">${escapeHtml(card.question)}</div>
            <div class="answers-list" id="publicAnswersList">
                ${card.options.map((opt, idx) => `
                    <button class="answer-btn" onclick="window.selectPublicAnswer(${idx})">
                        <div class="answer-letter">${String.fromCharCode(65 + idx)}</div>
                        <div>${escapeHtml(opt)}</div>
                    </button>
                `).join('')}
            </div>
            <div class="feedback" id="publicFeedback"></div>
            <div class="test-actions">
                <button id="nextPublicQuestionBtn" class="btn btn-primary hidden" onclick="window.nextPublicQuestion()">Next Question</button>
            </div>
        </div>
    `;
}

window.selectPublicAnswer = function(selectedIdx) {
    const card = currentPublicQuiz.cards[currentPublicQuiz.currentIndex];
    const isCorrect = selectedIdx === card.correctAnswer;
    const buttons = document.querySelectorAll('#publicAnswersList .answer-btn');
    const feedback = document.getElementById('publicFeedback');

    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === card.correctAnswer) btn.classList.add('correct');
        else if (idx === selectedIdx && !isCorrect) btn.classList.add('incorrect');
    });

    if (isCorrect) currentPublicQuiz.score++;

    feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
    feedback.innerHTML = `<strong>${isCorrect ? 'Correct!' : 'Incorrect'}</strong>${card.explanation ? `<p style="margin-top: 0.5rem;">${escapeHtml(card.explanation)}</p>` : ''}`;
    document.getElementById('nextPublicQuestionBtn').classList.remove('hidden');
};

window.nextPublicQuestion = function() {
    currentPublicQuiz.currentIndex++;
    if (currentPublicQuiz.currentIndex >= currentPublicQuiz.cards.length) {
        showPublicQuizResults();
    } else {
        showPublicQuestion();
    }
};

async function showPublicQuizResults() {
    const score = currentPublicQuiz.score;
    const total = currentPublicQuiz.cards.length;
    const percentage = Math.round((score / total) * 100);
    const timeSpent = Math.round((Date.now() - currentPublicQuiz.startTime) / 1000);

    try {
        const resultData = {
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            score,
            total,
            percentage,
            completedAt: Date.now(),
            timeSpent
        };
        await set(ref(window.db, `publicProjectResults/${currentPublicQuiz.projectId}/${currentUser.uid}`), resultData);

        const attemptsRef = ref(window.db, `publicProjects/${currentPublicQuiz.projectId}/totalAttempts`);
        const snapshot = await get(attemptsRef);
        const attempts = (snapshot.val() || 0) + 1;
        await set(attemptsRef, attempts);
    } catch (error) {
        console.error('Error saving results:', error);
    }

    document.getElementById('publicQuizContent').innerHTML = `
        <div class="results-card">
            <div class="results-icon"><i class="fas fa-trophy"></i></div>
            <h3>Quiz Complete!</h3>
            <div class="results-score">
                <div class="score-big">${score}/${total}</div>
                <div class="score-percentage">${percentage}%</div>
            </div>
            <div class="results-actions">
                <button class="btn btn-primary" onclick="window.showLeaderboard('${currentPublicQuiz.projectId}')"><i class="fas fa-trophy"></i> View Leaderboard</button>
                <button class="btn btn-secondary" onclick="window.closePublicQuiz()">Close</button>
            </div>
        </div>
    `;
}

window.closePublicQuiz = function() {
    currentPublicQuiz = null;
    closeModal('publicQuizModal');
};

// ============================================
// LEADERBOARDS
// ============================================

window.showLeaderboard = async function(projectId) {
    try {
        const resultsSnapshot = await get(ref(window.db, `publicProjectResults/${projectId}`));
        const content = document.getElementById('leaderboardContent');

        if (!resultsSnapshot.exists()) {
            content.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>No results yet. Be the first to take this quiz!</p></div>';
            openModal('leaderboardModal');
            return;
        }

        const results = Object.values(resultsSnapshot.val()).sort((a, b) => b.percentage - a.percentage || a.timeSpent - b.timeSpent).slice(0, 50);

        content.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border);">
                        <th style="padding: 0.75rem; text-align: left;">Rank</th>
                        <th style="padding: 0.75rem; text-align: left;">User</th>
                        <th style="padding: 0.75rem; text-align: center;">Score</th>
                        <th style="padding: 0.75rem; text-align: center;">Percentage</th>
                        <th style="padding: 0.75rem; text-align: center;">Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map((r, idx) => `
                        <tr style="border-bottom: 1px solid var(--border); ${currentUser && r.displayName === (currentUser.displayName || currentUser.email.split('@')[0]) ? 'background: rgba(29, 185, 84, 0.1);' : ''}">
                            <td style="padding: 0.75rem; font-weight: 600;">${idx + 1}</td>
                            <td style="padding: 0.75rem;">${escapeHtml(r.displayName)}</td>
                            <td style="padding: 0.75rem; text-align: center;">${r.score}/${r.total}</td>
                            <td style="padding: 0.75rem; text-align: center; color: var(--primary);">${r.percentage}%</td>
                            <td style="padding: 0.75rem; text-align: center; font-family: monospace;">${r.timeSpent}s</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        openModal('leaderboardModal');
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showNotification('Error loading leaderboard', 'error');
    }
};

// ============================================
// ADMIN CONSOLE
// ============================================

function initAdminConsole() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');
            if (tab.dataset.tab === 'analytics') loadAdminAnalytics();
        });
    });

    const searchBtn = document.getElementById('searchUsersBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchUsers);
    }
}

async function loadAdminAnalytics() {
    if (!isAdminUser) return;
    try {
        const usersSnapshot = await get(ref(window.db, 'users'));
        const users = usersSnapshot.exists() ? Object.values(usersSnapshot.val()) : [];

        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalProUsers').textContent = users.filter(u => u.isPro).length;
        document.getElementById('totalDevUsers').textContent = users.filter(u => u.isDev).length;
        document.getElementById('totalPublicProjects').textContent = publicProjects.length;
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

async function searchUsers() {
    const query = document.getElementById('adminUserSearch').value.trim().toLowerCase();
    if (!query) {
        showNotification('Enter a search term', 'error');
        return;
    }

    try {
        const usersSnapshot = await get(ref(window.db, 'users'));
        if (!usersSnapshot.exists()) return;

        const users = Object.entries(usersSnapshot.val()).filter(([uid, data]) =>
            uid.toLowerCase().includes(query) || (data.email && data.email.toLowerCase().includes(query))
        );

        const list = document.getElementById('adminUsersList');
        if (users.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No users found</p></div>';
            return;
        }

        list.innerHTML = users.map(([uid, data]) => `
            <div class="account-section" style="margin-bottom: 1rem;">
                <h4>${escapeHtml(data.email || uid)}</h4>
                <p style="color: var(--text-muted); font-size: 0.875rem;">UID: ${uid}</p>
                <p>Pro: ${data.isPro ? '✅' : '❌'} | Dev: ${data.isDev ? '✅' : '❌'} | Admin: ${data.isAdmin ? '✅' : '❌'} | Banned: ${data.isBanned ? '✅' : '❌'}</p>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <button class="btn btn-secondary" onclick="window.toggleUserStatus('${uid}', 'isPro', ${!data.isPro})">Toggle Pro</button>
                    <button class="btn btn-secondary" onclick="window.toggleUserStatus('${uid}', 'isDev', ${!data.isDev})">Toggle Dev</button>
                    <button class="btn btn-danger" onclick="window.toggleUserStatus('${uid}', 'isBanned', ${!data.isBanned})">${data.isBanned ? 'Unban' : 'Ban'}</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error searching users:', error);
        showNotification('Error searching users', 'error');
    }
}

window.toggleUserStatus = async function(uid, field, value) {
    try {
        await update(ref(window.db, `users/${uid}`), { [field]: value });
        showNotification('User updated', 'success');
        searchUsers();
    } catch (error) {
        showNotification('Error updating user', 'error');
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be initialized
    setTimeout(() => {
        initAuth();
        initNavigation();
        initProjects();
        initCards();
        initAI();
        initStudy();
        initTest();
        initAccount();
        initModals();
        initDarkMode();
        initMobileMenu();
        initExplore();
        initDevDashboard();
        initAdminConsole();

        // Load public projects after a short delay
        setTimeout(() => {
            if (currentUser) {
                loadPublicProjects();
            }
        }, 500);
    }, 100);
});
