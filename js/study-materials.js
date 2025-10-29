// Study Materials Generation and Visualization
// This file handles: dual AI generation (study cards + quiz cards), list view, and D3 mind map

// Expose as window properties so app.js can access them
window.currentGeneratingProjectId = null;
let currentViewingProject = null;
let mindMapSimulation = null;

// Open study materials (viewer if exists, generator if not)
window.generateStudyMaterials = function(projectId) {
    const project = window.projects.find(p => p.id === projectId);

    // If project has study materials, view them with mind map auto-opened
    if (project && project.studyCards && project.studyCards.length > 0) {
        window.viewStudyMaterials(projectId, true); // true = auto-open mind map
    } else {
        // Otherwise open generator
        window.currentGeneratingProjectId = projectId;
        openModal('studyMaterialsModal');
    }
};

// View study materials for a project
window.viewStudyMaterials = function(projectId, autoOpenMindMap = false) {
    const project = window.projects.find(p => p.id === projectId);
    if (!project || !project.studyCards) {
        showNotification('No study materials found for this project', 'error');
        return;
    }

    currentViewingProject = project;

    // Switch to study materials page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('studyMaterialsPage').classList.add('active');
    document.getElementById('studyMaterialsTitle').textContent = `Study Materials - ${project.name}`;

    // Auto-open mind map if requested (from brain icon), otherwise list view
    if (autoOpenMindMap) {
        document.getElementById('studyMindMapViewBtn').classList.add('active');
        document.getElementById('studyListViewBtn').classList.remove('active');
        document.getElementById('studyMindMapView').classList.add('active');
        document.getElementById('studyMindMapView').classList.remove('hidden');
        document.getElementById('studyListView').classList.add('hidden');
        document.getElementById('studyListView').classList.remove('active');
        renderMindMap();
    } else {
        // Default to list view
        renderStudyCardsList();
    }
};

// Refresh study materials view (called after returning from study mode)
window.refreshStudyMaterialsView = async function() {
    if (!currentViewingProject || !currentViewingProject.id) return;

    // Reload projects to get updated mastery data
    await window.loadProjects();
    const updatedProject = window.projects.find(p => p.id === currentViewingProject.id);
    if (updatedProject) {
        currentViewingProject = updatedProject;
    }

    // Check which view is active and refresh it
    const mindMapView = document.getElementById('studyMindMapView');
    const listView = document.getElementById('studyListView');

    if (mindMapView && !mindMapView.classList.contains('hidden')) {
        // Refresh mind map
        renderMindMap();
    } else if (listView && !listView.classList.contains('hidden')) {
        // Refresh list view
        renderStudyCardsList();
    }
};

// Close study materials viewer
function closeStudyMaterialsViewer() {
    currentViewingProject = null;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('projectsPage').classList.add('active');
}

// Initialize study materials modal
function initStudyMaterials() {
    const generateBtn = document.getElementById('generateStudyMaterialsBtn');
    const generateOnCreate = document.getElementById('generateOnCreate');
    const generateContentSection = document.getElementById('generateContentSection');
    const listViewBtn = document.getElementById('studyListViewBtn');
    const mindMapViewBtn = document.getElementById('studyMindMapViewBtn');
    const closeBtn = document.getElementById('closeStudyMaterialsBtn');
    const viewStudyListBtn = document.getElementById('viewStudyListBtn');
    const viewStudyMindMapBtn = document.getElementById('viewStudyMindMapBtn');
    const studyProjectSelect = document.getElementById('studyProjectSelect');

    // Toggle content section when checkbox changes
    if (generateOnCreate) {
        generateOnCreate.addEventListener('change', (e) => {
            if (e.target.checked) {
                generateContentSection.classList.remove('hidden');
            } else {
                generateContentSection.classList.add('hidden');
            }
        });
    }

    // View toggle buttons
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            listViewBtn.classList.add('active');
            mindMapViewBtn.classList.remove('active');
            document.getElementById('studyListView').classList.add('active');
            document.getElementById('studyListView').classList.remove('hidden');
            document.getElementById('studyMindMapView').classList.add('hidden');
            document.getElementById('studyMindMapView').classList.remove('active');
            renderStudyCardsList();
        });
    }

    if (mindMapViewBtn) {
        mindMapViewBtn.addEventListener('click', () => {
            mindMapViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            document.getElementById('studyMindMapView').classList.add('active');
            document.getElementById('studyMindMapView').classList.remove('hidden');
            document.getElementById('studyListView').classList.add('hidden');
            document.getElementById('studyListView').classList.remove('active');
            renderMindMap();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeStudyMaterialsViewer);
    }

    // Start study mode button
    const startStudyModeFromViewerBtn = document.getElementById('startStudyModeFromViewerBtn');
    if (startStudyModeFromViewerBtn) {
        startStudyModeFromViewerBtn.addEventListener('click', () => {
            if (!currentViewingProject) {
                showNotification('No project selected', 'error');
                return;
            }
            // Set the global currentProject so study mode can access it
            if (typeof window.setCurrentProjectForStudy === 'function' && typeof window.startStudyMode === 'function') {
                window.setCurrentProjectForStudy(currentViewingProject);
                // Set return page to study materials viewer
                if (window.studyModeState) {
                    window.studyModeState.returnToPage = 'studyMaterialsPage';
                }
                window.startStudyMode();
            } else {
                showNotification('Study mode not available', 'error');
            }
        });
    }

    // Study page buttons
    if (viewStudyListBtn) {
        viewStudyListBtn.addEventListener('click', () => {
            const projectId = studyProjectSelect?.value;
            if (!projectId) {
                showNotification('Please select a project', 'error');
                return;
            }
            window.viewStudyMaterials(projectId, false); // false = list view
        });
    }

    if (viewStudyMindMapBtn) {
        viewStudyMindMapBtn.addEventListener('click', () => {
            const projectId = studyProjectSelect?.value;
            if (!projectId) {
                showNotification('Please select a project', 'error');
                return;
            }
            window.viewStudyMaterials(projectId, true); // true = mind map
        });
    }

    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        const text = document.getElementById('studyMaterialInput').value.trim();
        const model = document.getElementById('studyMaterialModel').value;
        const quizCount = parseInt(document.getElementById('quizCardCount').value);

        if (!text) {
            showNotification('Please enter study material content', 'error');
            return;
        }

        if (!window.currentGeneratingProjectId) {
            showNotification('Please select a project', 'error');
            return;
        }

        // Show loading
        document.getElementById('studyMaterialGenerating').classList.remove('hidden');
        document.getElementById('studyMaterialError').classList.add('hidden');
        generateBtn.disabled = true;

        try {
            const statusEl = document.getElementById('studyMaterialStatus');

            // Step 1: Generate study cards
            statusEl.textContent = 'Generating study cards...';
            const studyCardsResponse = await fetch('https://quizapp2-eight.vercel.app/api/generate-study-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: window.currentUser.uid,
                    isPro: window.isProUser || window.isDevUser || window.isAdminUser,
                    text,
                    model
                })
            });

            if (!studyCardsResponse.ok) {
                const error = await studyCardsResponse.json();
                throw new Error(error.error || 'Failed to generate study cards');
            }

            const studyCardsData = await studyCardsResponse.json();

            // Step 2: Generate quiz cards
            statusEl.textContent = 'Generating quiz cards...';
            const quizCardsResponse = await fetch('https://quizapp2-eight.vercel.app/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: window.currentUser.uid,
                    isPro: window.isProUser || window.isDevUser || window.isAdminUser,
                    text,
                    count: quizCount,
                    model,
                    difficulty: 'mixed'
                })
            });

            if (!quizCardsResponse.ok) {
                const error = await quizCardsResponse.json();
                throw new Error(error.error || 'Failed to generate quiz cards');
            }

            const quizCardsData = await quizCardsResponse.json();

            // Step 3: Save everything
            statusEl.textContent = 'Saving to project...';

            // Save quiz cards
            const cardsRef = ref(window.db, `users/${window.currentUser.uid}/cards`);
            for (const card of quizCardsData.cards) {
                const cardData = {
                    projectId: window.currentGeneratingProjectId,
                    question: card.question,
                    options: card.options,
                    correctAnswer: card.correctAnswer,
                    explanation: card.explanation || '',
                    mastered: false,
                    createdAt: Date.now()
                };
                await push(cardsRef, cardData);
            }

            // Save study cards to project
            const projectRef = ref(window.db, `users/${window.currentUser.uid}/projects/${window.currentGeneratingProjectId}`);
            await update(projectRef, {
                studyCards: studyCardsData.cards,
                studyCardsCount: studyCardsData.count
            });

            // Success!
            closeModal('studyMaterialsModal');
            showNotification(`Generated ${studyCardsData.count} study cards and ${quizCardsData.cards.length} quiz cards!`, 'success');

            // Reload data
            await loadProjects();
            await loadCards();
            updateDashboard();

        } catch (error) {
            console.error('Error generating study materials:', error);
            document.getElementById('studyMaterialError').classList.remove('hidden');
            document.getElementById('studyMaterialError').querySelector('p').textContent = error.message;
        } finally {
            document.getElementById('studyMaterialGenerating').classList.add('hidden');
            generateBtn.disabled = false;
        }
    });
}

// ============================================
// STUDY CARDS LIST VIEW
// ============================================

function renderStudyCardsList() {
    if (!currentViewingProject || !currentViewingProject.studyCards) return;

    const container = document.getElementById('studyCardsListViewer');
    const cards = currentViewingProject.studyCards;

    // Group by level for better organization
    const level0 = cards.filter(c => c.level === 0);
    const level1 = cards.filter(c => c.level === 1);
    const level2 = cards.filter(c => c.level === 2);
    const level3 = cards.filter(c => c.level === 3);
    const level4 = cards.filter(c => c.level === 4);

    container.innerHTML = `
        ${level0.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #1db954; margin-bottom: 1rem;">
                    <i class="fas fa-crown"></i> Overview (${level0.length})
                </h3>
                ${level0.map((card, idx) => renderStudyCard(card, idx, 'primary')).join('')}
            </div>
        ` : ''}

        ${level1.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--primary); margin-bottom: 1rem;">
                    <i class="fas fa-brain"></i> Main Topics (${level1.length})
                </h3>
                ${level1.map((card, idx) => renderStudyCard(card, idx, 'secondary')).join('')}
            </div>
        ` : ''}

        ${level2.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--secondary); margin-bottom: 1rem;">
                    <i class="fas fa-book"></i> Subtopics (${level2.length})
                </h3>
                ${level2.map((card, idx) => renderStudyCard(card, idx, 'tertiary')).join('')}
            </div>
        ` : ''}

        ${level3.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--text-secondary); margin-bottom: 1rem;">
                    <i class="fas fa-list"></i> Detailed Concepts (${level3.length})
                </h3>
                ${level3.map((card, idx) => renderStudyCard(card, idx, 'quaternary')).join('')}
            </div>
        ` : ''}

        ${level4.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #6c757d; margin-bottom: 1rem;">
                    <i class="fas fa-circle-notch"></i> Specific Details (${level4.length})
                </h3>
                ${level4.map((card, idx) => renderStudyCard(card, idx, 'quinary')).join('')}
            </div>
        ` : ''}
    `;
}

function renderStudyCard(card, index, category) {
    const colors = {
        primary: '#1db954',
        secondary: 'var(--primary)',
        tertiary: '#9d4edd',
        quaternary: 'var(--text-secondary)',
        quinary: '#6c757d'
    };

    return `
        <div class="study-card" style="
            padding: 1.5rem;
            background: var(--surface);
            border-radius: var(--radius-md);
            box-shadow: inset 0 0 30px ${colors[category]}15, var(--shadow-sm);
            transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='inset 0 0 40px ${colors[category]}25, var(--shadow-lg)'"
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='inset 0 0 30px ${colors[category]}15, var(--shadow-sm)'">
            <h4 style="margin: 0 0 1rem 0; color: ${colors[category]}; display: flex; align-items: center; gap: 0.5rem;">
                <span style="
                    display: inline-block;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: ${colors[category]}22;
                    color: ${colors[category]};
                    text-align: center;
                    line-height: 32px;
                    font-size: 0.875rem;
                    font-weight: 600;
                ">${index + 1}</span>
                ${escapeHtml(card.topic)}
            </h4>
            <p style="margin: 0; color: var(--text-secondary); line-height: 1.6;">
                ${escapeHtml(card.content)}
            </p>
        </div>
    `;
}

// ============================================
// D3.JS MIND MAP VISUALIZATION
// ============================================

function renderMindMap() {
    if (!currentViewingProject || !currentViewingProject.studyCards) return;
    if (typeof d3 === 'undefined') {
        console.error('D3.js not loaded');
        return;
    }

    const cards = currentViewingProject.studyCards;
    const container = document.getElementById('mindMapContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous
    d3.select('#mindMapSvg').selectAll('*').remove();
    if (mindMapSimulation) mindMapSimulation.stop();

    // Create SVG
    const svg = d3.select('#mindMapSvg')
        .attr('viewBox', [0, 0, width, height]);

    // Group cards by level for positioning
    const levelGroups = {};
    cards.forEach((card, i) => {
        const level = card.level || 0;
        if (!levelGroups[level]) levelGroups[level] = [];
        levelGroups[level].push({ ...card, index: i });
    });

    const levels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
    const levelSpacing = Math.min(200, width / (levels.length + 1));

    // Position nodes in horizontal tree layout (left-to-right)
    const nodes = [];
    levels.forEach((level, levelIdx) => {
        const cardsInLevel = levelGroups[level];
        const spacing = height / (cardsInLevel.length + 1);
        const x = levelSpacing * (levelIdx + 1);

        cardsInLevel.forEach((card, idx) => {
            const y = spacing * (idx + 1);
            nodes.push({
                id: card.index,
                x: x,
                y: y,
                topic: card.topic || 'Untitled',
                content: card.content || '',
                level: level,
                mastery: card.mastery || 'weak',
                parentIndex: card.parentIndex
            });
        });
    });

    // Create links
    const links = [];
    nodes.forEach(node => {
        if (node.parentIndex !== null && node.parentIndex !== undefined) {
            const parent = nodes.find(n => n.id === node.parentIndex);
            if (parent) {
                links.push({ source: parent, target: node });
            }
        }
    });

    // Colors and sizes
    const colorScale = d3.scaleOrdinal()
        .domain([0, 1, 2])
        .range(['#667eea', '#9d4edd', '#7c8591']);

    const radiusScale = d3.scaleOrdinal()
        .domain([0, 1, 2])
        .range([35, 25, 20]);

    const masteryColors = {
        'mastered': '#10b981',
        'good': '#3b82f6',
        'learning': '#f59e0b',
        'weak': '#ef4444',
        'none': '#6b7280'
    };

    // Draw links
    svg.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', '#3c4652')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.4);

    // Draw nodes
    const nodeGroups = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    // Background circle for mastery color tint
    nodeGroups.append('circle')
        .attr('r', d => radiusScale(d.level) + 8)
        .attr('fill', d => masteryColors[d.mastery])
        .attr('opacity', 0.25)
        .style('cursor', 'pointer');

    // Main node circle with level color
    nodeGroups.append('circle')
        .attr('r', d => radiusScale(d.level))
        .attr('fill', d => colorScale(d.level))
        .attr('stroke', 'none')
        .style('cursor', 'pointer');

    // Hover areas with click handler
    nodeGroups.append('circle')
        .attr('r', d => radiusScale(d.level) + 20)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            // Navigate to study mode and show the clicked card
            if (currentViewingProject && typeof window.setCurrentProjectForStudy === 'function' && typeof window.startStudyMode === 'function') {
                window.setCurrentProjectForStudy(currentViewingProject);

                // Set return page to study materials viewer
                if (window.studyModeState) {
                    window.studyModeState.returnToPage = 'studyMaterialsPage';
                }

                // Start study mode
                window.startStudyMode();

                // Find the card in the sorted array that matches this node's original index
                const sortedIndex = window.studyModeState.cards.findIndex(card => card.originalIndex === d.id);
                if (sortedIndex !== -1) {
                    window.studyModeState.currentIndex = sortedIndex;
                    // Re-display the card at the new index
                    if (typeof window.displayStudyCard === 'function') {
                        window.displayStudyCard();
                    }
                }
            }
        })
        .on('mouseenter', function(event, d) {
            const circles = d3.select(this.parentNode).selectAll('circle');
            // Enlarge both background and main circle
            circles.filter((_, i) => i === 0)
                .attr('r', radiusScale(d.level) + 12)
                .attr('opacity', 0.4);
            circles.filter((_, i) => i === 1)
                .attr('r', radiusScale(d.level) + 5);

            const tooltip = document.getElementById('mindMapTooltip');
            if (tooltip) {
                const h4 = tooltip.querySelector('h4');
                const p = tooltip.querySelector('p');
                if (h4) h4.textContent = d.topic;
                if (p) p.textContent = d.content;

                tooltip.style.left = (event.pageX + 20) + 'px';
                tooltip.style.top = (event.pageY - 30) + 'px';
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
                tooltip.style.pointerEvents = 'none';
            }
        })
        .on('mouseleave', function(event, d) {
            const circles = d3.select(this.parentNode).selectAll('circle');
            // Reset both circles
            circles.filter((_, i) => i === 0)
                .attr('r', radiusScale(d.level) + 8)
                .attr('opacity', 0.25);
            circles.filter((_, i) => i === 1)
                .attr('r', radiusScale(d.level));

            const tooltip = document.getElementById('mindMapTooltip');
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            }
        });

    // Node labels (positioned to the right of nodes for horizontal layout)
    nodeGroups.each(function(d) {
        const g = d3.select(this);
        let text = d.topic;
        if (text.length > 20) {
            text = text.substring(0, 17) + '...';
        }

        g.append('text')
            .text(text)
            .attr('text-anchor', 'start')
            .attr('dx', radiusScale(d.level) + 12)
            .attr('dy', '0.35em')
            .attr('font-size', '12px')
            .attr('fill', '#e8eaed')
            .attr('font-weight', '600')
            .style('pointer-events', 'none')
            .style('user-select', 'none');
    });
}

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initStudyMaterials();
    });
}
