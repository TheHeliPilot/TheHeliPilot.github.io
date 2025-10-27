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

        studyCardsList.innerHTML = studyCards.map((card, index) => `
            <div class="card-item study-card" data-card-index="${index}">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div class="card-question">${escapeHtml(card.topic || card.term || card.name || card.title || 'Untitled')}</div>
                        <div style="margin-top: var(--spacing-md); color: var(--text-secondary);">
                            ${escapeHtml(card.content || card.definition || card.description || '')}
                        </div>
                        ${card.level !== undefined ? `
                            <div style="margin-top: var(--spacing-sm); font-size: 0.875rem; color: var(--text-muted);">
                                <i class="fas fa-layer-group"></i> Level ${card.level}
                                ${card.category ? ` • <i class="fas fa-tag"></i> ${card.category}` : ''}
                            </div>
                        ` : ''}
                    </div>
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

    // Create gradients
    const defs = svg.append('defs');
    const gradients = [
        { id: 'grad0', color1: '#667eea', color2: '#764ba2' },
        { id: 'grad1', color1: '#f093fb', color2: '#f5576c' },
        { id: 'grad2', color1: '#4facfe', color2: '#00f2fe' },
        { id: 'grad3', color1: '#43e97b', color2: '#38f9d7' },
        { id: 'grad4', color1: '#fa709a', color2: '#fee140' },
        { id: 'grad5', color1: '#30cfd0', color2: '#330867' }
    ];

    gradients.forEach(grad => {
        const gradient = defs.append('linearGradient')
            .attr('id', grad.id)
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '100%');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', grad.color1);
        gradient.append('stop').attr('offset', '100%').attr('stop-color', grad.color2);
    });

    // Create tree layout
    const treeLayout = d3.tree()
        .size([height - 100, width - 300])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

    // Create hierarchy
    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // Draw links (tree branches)
    const links = container.selectAll('.link')
        .data(root.links())
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y + 100)
            .y(d => d.x + 50))
        .attr('fill', 'none')
        .attr('stroke', '#666')
        .attr('stroke-width', 3)
        .attr('stroke-opacity', 0.4);

    // Draw nodes
    const nodes = container.selectAll('.node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y + 100},${d.x + 50})`);

    // Outer glow
    nodes.append('circle')
        .attr('r', d => 40 + Math.max(0, d.data.level) * 5)
        .attr('fill', 'none')
        .attr('stroke', d => `url(#grad${Math.max(0, d.data.level % gradients.length)})`)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.3);

    // Main circle
    nodes.append('circle')
        .attr('r', d => 35 + Math.max(0, d.data.level) * 4)
        .attr('fill', d => `url(#grad${Math.max(0, d.data.level % gradients.length)})`)
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))')
        .style('cursor', 'pointer');

    // Level text inside circle
    nodes.append('text')
        .text(d => d.data.level >= 0 ? `L${d.data.level}` : '')
        .attr('text-anchor', 'middle')
        .attr('dy', 5)
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none');

    // Name label below circle
    nodes.append('text')
        .text(d => {
            const maxLength = 25;
            return d.data.name.length > maxLength ?
                d.data.name.substring(0, maxLength) + '...' : d.data.name;
        })
        .attr('text-anchor', 'middle')
        .attr('dy', d => (40 + Math.max(0, d.data.level) * 5) + 18)
        .attr('fill', '#fff')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)')
        .attr('pointer-events', 'none');

    // Hover effects
    nodes.on('mouseenter', function(event, d) {
        d3.select(this).selectAll('circle')
            .transition().duration(200)
            .attr('r', function() {
                const currentR = parseFloat(d3.select(this).attr('r'));
                return currentR * 1.15;
            })
            .attr('stroke-width', 5);

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
        d3.select(this).selectAll('circle')
            .transition().duration(200)
            .attr('r', function(d, i) {
                return i === 0 ?
                    40 + Math.max(0, d.data ? d.data.level : 0) * 5 :
                    35 + Math.max(0, d.data ? d.data.level : 0) * 4;
            })
            .attr('stroke-width', function(d, i) { return i === 0 ? 2 : 3; });

        if (tooltip) {
            tooltip.style.opacity = '0';
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
