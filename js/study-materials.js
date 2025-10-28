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
    const startStudyModeBtn = document.getElementById('startStudyModeBtn');
    if (startStudyModeBtn) {
        startStudyModeBtn.addEventListener('click', () => {
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

    const container = document.getElementById('studyCardsList');
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
            border-left: 4px solid ${colors[category]};
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-sm);
            transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-lg)'"
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-sm)'">
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

    // Build nodes and links (include mastery data)
    const nodes = cards.map((card, i) => ({
        id: i,
        topic: card.topic,
        content: card.content,
        level: card.level,
        category: card.category,
        mastery: card.mastery || 'none'
    }));

    const links = [];
    cards.forEach((card, i) => {
        if (card.parentIndex !== null && card.parentIndex !== undefined) {
            links.push({
                source: card.parentIndex,
                target: i
            });
        }
    });

    // Colors by level
    const colorScale = d3.scaleOrdinal()
        .domain([0, 1, 2])
        .range(['#1db954', '#9d4edd', '#7c8591']);

    // Radius by level
    const radiusScale = d3.scaleOrdinal()
        .domain([0, 1, 2])
        .range([30, 20, 15]);

    // Create SVG
    const svg = d3.select('#mindMapSvg')
        .attr('viewBox', [0, 0, width, height]);

    // Force simulation with physics (optimized for closer nodes)
    mindMapSimulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(60)  // Reduced from 100 to bring nodes closer
            .strength(0.8))  // Increased strength for tighter connections
        .force('charge', d3.forceManyBody()
            .strength(-150)  // Reduced repulsion from -300
            .distanceMax(250))  // Reduced from 400 for tighter layout
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide()
            .radius(d => radiusScale(d.level) + 8))  // Reduced padding
        .force('x', d3.forceX(width / 2).strength(0.05))  // Gentle pull to center
        .force('y', d3.forceY(height / 2).strength(0.05));  // Gentle pull to center

    // Draw links with curves to prevent overlap
    const link = svg.append('g')
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('stroke', '#3c4652')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.6)
        .attr('fill', 'none')
        .style('transition', 'all 0.3s ease')
        .on('mouseover', function() {
            d3.select(this)
                .attr('stroke', '#667eea')
                .attr('stroke-width', 3)
                .attr('stroke-opacity', 0.9);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('stroke', '#3c4652')
                .attr('stroke-width', 2)
                .attr('stroke-opacity', 0.6);
        });

    // Draw nodes
    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .call(drag(mindMapSimulation));

    // Mastery color mapping
    const masteryColors = {
        'mastered': '#10b981',  // Green
        'good': '#3b82f6',      // Blue
        'learning': '#f59e0b',  // Orange
        'weak': '#ef4444',      // Red
        'none': '#6b7280'       // Gray
    };

    // Node circles
    node.append('circle')
        .attr('r', d => radiusScale(d.level))
        .attr('fill', d => colorScale(d.level))
        .attr('stroke', d => masteryColors[d.mastery])
        .attr('stroke-width', d => d.mastery !== 'none' ? 4 : 2)  // Thicker border for mastered cards
        .style('cursor', 'pointer')
        .style('transition', 'all 0.3s ease')
        .on('mouseover', function(event, d) {
            // Scale up on hover
            d3.select(this)
                .attr('stroke-width', d.mastery !== 'none' ? 6 : 4)
                .style('filter', 'brightness(1.2)');
            showTooltip(event, d);
        })
        .on('mouseout', function(event, d) {
            // Scale back on hover out
            d3.select(this)
                .attr('stroke-width', d.mastery !== 'none' ? 4 : 2)
                .style('filter', 'brightness(1)');
            hideTooltip();
        })
        .on('click', (event, d) => {
            // Pulse animation on click
            d3.select(event.target)
                .transition()
                .duration(300)
                .attr('r', radiusScale(d.level) + 10)
                .transition()
                .duration(300)
                .attr('r', radiusScale(d.level));
        });

    // Node labels (abbreviated)
    node.append('text')
        .text(d => {
            const words = d.topic.split(' ');
            return words.length > 3 ? words.slice(0, 3).join(' ') + '...' : d.topic;
        })
        .attr('text-anchor', 'middle')
        .attr('dy', d => radiusScale(d.level) + 20)
        .attr('font-size', '11px')
        .attr('fill', '#e8eaed')
        .style('pointer-events', 'none')
        .style('user-select', 'none');

    // Update positions on tick with curved links
    mindMapSimulation.on('tick', () => {
        link.attr('d', d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);

            // Add slight curve to prevent overlap (curve amount based on distance)
            const curve = dr * 0.15;

            // Calculate control point for quadratic curve
            const midX = (d.source.x + d.target.x) / 2;
            const midY = (d.source.y + d.target.y) / 2;

            // Perpendicular offset for curve
            const offsetX = -dy / dr * curve;
            const offsetY = dx / dr * curve;

            return `M${d.source.x},${d.source.y} Q${midX + offsetX},${midY + offsetY} ${d.target.x},${d.target.y}`;
        });

        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Tooltip functions
    function showTooltip(event, d) {
        const tooltip = document.getElementById('mindMapTooltip');
        const masteryLabels = {
            'mastered': '✓ Mastered',
            'good': '👍 Good',
            'learning': '📚 Learning',
            'weak': '⚠️ Weak',
            'none': '○ Not studied'
        };
        const masteryColors = {
            'mastered': '#10b981',
            'good': '#3b82f6',
            'learning': '#f59e0b',
            'weak': '#ef4444',
            'none': '#6b7280'
        };

        tooltip.querySelector('h4').textContent = d.topic;
        tooltip.querySelector('p').innerHTML = d.content +
            `<br><br><span style="color: ${masteryColors[d.mastery]}; font-weight: 600; font-size: 0.9em;">${masteryLabels[d.mastery]}</span>`;
        tooltip.style.left = (event.pageX + 15) + 'px';
        tooltip.style.top = (event.pageY + 15) + 'px';
        tooltip.style.opacity = '1';
        tooltip.style.zIndex = '10000';
    }

    function hideTooltip() {
        const tooltip = document.getElementById('mindMapTooltip');
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.style.zIndex = '-1';
        }, 200);
    }

    // Drag behavior
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
}

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initStudyMaterials();
    });
}
