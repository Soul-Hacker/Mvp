/**
 * Elite JEE Prep Platform - Application Orchestrator & View Controller
 * Integrates curriculum data, local storage progress tracking, dynamic KaTeX math,
 * and standard 2D physical telemetry labs into a premium minimalist interface.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Selector Cache
    const sidebarTabHome = document.getElementById('sidebar-tab-home');
    const sidebarTabTree = document.getElementById('sidebar-tab-tree');
    const sidebarTabLesson = document.getElementById('sidebar-tab-lesson');
    
    const sidebarRoadmapBadge = document.getElementById('sidebar-roadmap-badge');
    const sidebarLessonBadge = document.getElementById('sidebar-lesson-badge');
    
    const overallProgressText = document.getElementById('overall-progress-text');
    const overallProgressBar = document.getElementById('overall-progress-bar');
    const overallCompletedCount = document.getElementById('overall-completed-count');
    const overallTotalCount = document.getElementById('overall-total-count');

    // View Containers
    const viewHome = document.getElementById('view-home');
    const viewTree = document.getElementById('view-tree');
    const viewLesson = document.getElementById('view-lesson');

    // Homepage Elements
    const classSelector11 = document.getElementById('segment-class11');
    const classSelector12 = document.getElementById('segment-class12');
    const gridPhysics = document.getElementById('grid-physics');
    const gridChemistry = document.getElementById('grid-chemistry');
    const gridMathematics = document.getElementById('grid-mathematics');

    // Tree View Elements
    const treeClassNum = document.getElementById('tree-class-num');
    const treeTopicBadge = document.getElementById('tree-topic-badge');
    const treeProgressRatio = document.getElementById('tree-progress-ratio');
    const treeTopicTitle = document.getElementById('tree-topic-title');
    const treeTopicDesc = document.getElementById('tree-topic-desc');
    const roadmapTreeNodes = document.getElementById('roadmap-tree-nodes');
    const btnTreeBack = document.getElementById('btn-tree-back');

    // Lesson View Elements
    const btnLessonBack = document.getElementById('btn-lesson-back');
    const lessonMasteredCheck = document.getElementById('lesson-mastered-check');
    const lessonArticleBody = document.getElementById('lesson-article-body');
    const lessonLabContainer = document.getElementById('lesson-lab-container');
    const lessonWorkspaceContainer = document.getElementById('lesson-workspace-container');
    
    const btnLessonPrev = document.getElementById('btn-lesson-prev');
    const btnLessonNext = document.getElementById('btn-lesson-next');
    const prevLessonTitle = document.getElementById('prev-lesson-title');
    const nextLessonTitle = document.getElementById('next-lesson-title');

    // Embedded Physics Lab Cache
    const labCanvasTitle = document.getElementById('lab-canvas-title');
    const controlsDeck = document.getElementById('dynamic-controls-deck');
    const dashboardDeck = document.getElementById('dynamic-dashboard-deck');
    
    const inspectorPanel = document.getElementById('inspector-panel');
    const inspectorTitle = document.getElementById('inspector-title');
    const inspectorDeck = document.getElementById('dynamic-inspector-deck');
    
    const solverPanel = document.getElementById('solver-panel');
    const solverTitle = document.getElementById('solver-title');
    const solverSubtitle = document.getElementById('solver-subtitle');
    const solverSliderLabel = document.getElementById('solver-slider-label');
    const solverUnitLabel = document.getElementById('solver-unit-label');
    const timeSolverInput = document.getElementById('timeSolverInput');
    const solverTimeVal = document.getElementById('solverTimeVal');
    const solverDeck = document.getElementById('dynamic-solver-deck');

    const launchBtn = document.getElementById('launchBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const pauseIcon = document.getElementById('pauseIcon');
    const pauseBtnText = document.getElementById('pauseBtnText');
    const clearBtn = document.getElementById('clearBtn');

    // 2. State Pointers
    let userProgress = loadUserProgress();
    let currentClass = "class11"; // class11 or class12
    let activeTopic = null;      // Active topic object from JEE_CURRICULUM
    let activeChapter = null;    // Active chapter object
    let activeLesson = null;     // Active lesson object
    let activeEngine = null;     // Physics Engine instance
    let activeLabTopic = null;   // Physics BaseChapter instance

    // Total Count Calculations for Sidebar Stats
    let totalLessonsCount = 0;
    function calculateTotalLessons() {
        totalLessonsCount = 0;
        ['class11', 'class12'].forEach(cls => {
            ['physics', 'chemistry', 'mathematics'].forEach(subj => {
                const topics = JEE_CURRICULUM[cls][subj] || [];
                topics.forEach(topic => {
                    topic.chapters.forEach(ch => {
                        totalLessonsCount += ch.lessons.length;
                    });
                });
            });
        });
        overallTotalCount.textContent = totalLessonsCount;
    }

    // Update Global Progress Counters
    function updateProgressStats() {
        const completedKeys = Object.keys(userProgress.completedLessons).filter(key => userProgress.completedLessons[key]);
        const completedCount = completedKeys.length;
        overallCompletedCount.textContent = completedCount;
        
        const pct = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;
        overallProgressText.textContent = `${pct}%`;
        overallProgressBar.style.width = `${pct}%`;

        // Update Topic progress bar on homepage if rendered
        document.querySelectorAll('.topic-card').forEach(card => {
            const topicId = card.getAttribute('data-topic-id');
            const topicObj = findTopicById(topicId);
            if (topicObj) {
                const topicPct = getTopicProgressPercent(topicObj);
                const fill = card.querySelector('.topic-card-progress-fill');
                if (fill) fill.style.width = `${topicPct}%`;
            }
        });
    }

    // Helper: Find topic by ID anywhere in the curriculum
    function findTopicById(topicId) {
        for (let cls of ['class11', 'class12']) {
            for (let subj of ['physics', 'chemistry', 'mathematics']) {
                const topic = (JEE_CURRICULUM[cls][subj] || []).find(t => t.id === topicId);
                if (topic) return topic;
            }
        }
        return null;
    }

    // Helper: Get completed percentage of a topic
    function getTopicProgressPercent(topic) {
        let total = 0;
        let completed = 0;
        topic.chapters.forEach(ch => {
            ch.lessons.forEach(l => {
                total++;
                if (userProgress.completedLessons[l.id]) completed++;
            });
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    // 3. Dynamic SPA View Manager
    function showView(viewId) {
        // Hide all views
        viewHome.classList.remove('active');
        viewTree.classList.remove('active');
        viewLesson.classList.remove('active');

        // Remove active class from sidebar tabs
        sidebarTabHome.classList.remove('active');
        sidebarTabTree.classList.remove('active');
        sidebarTabLesson.classList.remove('active');

        // Shutdown active simulation engine if moving away from lesson
        if (viewId !== 'view-lesson' && activeEngine) {
            cleanupActiveEngine();
        }

        // Show targets
        if (viewId === 'view-home') {
            viewHome.classList.add('active');
            sidebarTabHome.classList.add('active');
        } else if (viewId === 'view-tree') {
            viewTree.classList.add('active');
            sidebarTabTree.classList.add('active');
            sidebarTabTree.removeAttribute('disabled');
            if (activeTopic) {
                sidebarRoadmapBadge.textContent = activeTopic.badge;
                sidebarRoadmapBadge.className = "badge badge-indigo";
            }
        } else if (viewId === 'view-lesson') {
            viewLesson.classList.add('active');
            sidebarTabLesson.classList.add('active');
            sidebarTabLesson.removeAttribute('disabled');
            if (activeLesson) {
                sidebarLessonBadge.textContent = activeLesson.title.substring(0, 10) + "...";
                sidebarLessonBadge.className = "badge badge-indigo";
            }
        }
        
        // Auto Scroll to Top
        document.querySelector('.workspace').scrollTop = 0;
    }

    // 4. View 1: Main Course Homepage Renderer
    function renderHomepage() {
        // Empty old items
        gridPhysics.innerHTML = '';
        gridChemistry.innerHTML = '';
        gridMathematics.innerHTML = '';

        const classCurriculum = JEE_CURRICULUM[currentClass];

        // Compile Physics Topics
        (classCurriculum.physics || []).forEach(topic => {
            gridPhysics.appendChild(createTopicCard(topic));
        });

        // Compile Chemistry Topics
        (classCurriculum.chemistry || []).forEach(topic => {
            gridChemistry.appendChild(createTopicCard(topic));
        });

        // Compile Mathematics Topics
        (classCurriculum.mathematics || []).forEach(topic => {
            gridMathematics.appendChild(createTopicCard(topic));
        });
    }

    function createTopicCard(topic) {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.setAttribute('data-topic-id', topic.id);
        
        const completedPct = getTopicProgressPercent(topic);

        card.innerHTML = `
            <div class="topic-card-header">
                <span class="topic-badge">${topic.badge}</span>
                <span class="topic-metrics">${topic.chapterCount} ch • ${topic.lessonCount} lessons</span>
            </div>
            <h3>${topic.title}</h3>
            <p>${topic.description}</p>
            <div class="topic-card-progress">
                <div class="topic-card-progress-fill" style="width: ${completedPct}%"></div>
            </div>
        `;

        card.addEventListener('click', () => {
            activeTopic = topic;
            renderTreeRoadmap();
            showView('view-tree');
        });

        return card;
    }

    // 5. View 2: The Chapter Tree Roadmap Renderer
    function renderTreeRoadmap() {
        if (!activeTopic) return;

        treeClassNum.textContent = currentClass === "class11" ? "11" : "12";
        treeTopicTitle.textContent = activeTopic.title;
        treeTopicDesc.textContent = activeTopic.description;
        treeTopicBadge.textContent = activeTopic.badge;

        // Calculate roadmap ratio
        let total = 0;
        let completed = 0;
        activeTopic.chapters.forEach(ch => {
            ch.lessons.forEach(l => {
                total++;
                if (userProgress.completedLessons[l.id]) completed++;
            });
        });
        treeProgressRatio.textContent = `${completed}/${total} Mastered (${total > 0 ? Math.round((completed / total) * 100) : 0}%)`;

        roadmapTreeNodes.innerHTML = '';

        // Generate chapters list vertically
        activeTopic.chapters.forEach((ch, chIdx) => {
            const accordion = document.createElement('div');
            accordion.className = 'chapter-accordion';

            // Calculate chapter completion percentage
            let chTotal = ch.lessons.length;
            let chCompleted = ch.lessons.filter(l => userProgress.completedLessons[l.id]).length;
            const isCompleted = chCompleted === chTotal;

            if (isCompleted) {
                accordion.classList.add('completed');
            } else if (chCompleted > 0) {
                accordion.classList.add('in-progress');
            }

            accordion.innerHTML = `
                <div class="chapter-header">
                    <div class="chapter-header-main">
                        <span class="chapter-index">Chapter ${String(chIdx + 1).padStart(2, '0')}</span>
                        <h3>${ch.title}</h3>
                    </div>
                    <div class="chapter-header-meta">
                        <span class="chapter-stats-badge">${chCompleted}/${chTotal} mastered</span>
                        <span class="accordion-arrow">▼</span>
                    </div>
                </div>
                <div class="chapter-lessons-list">
                    <!-- Lesson row items dynamically injected -->
                </div>
            `;

            const listContainer = accordion.querySelector('.chapter-lessons-list');
            
            ch.lessons.forEach((lesson, lIdx) => {
                const row = document.createElement('div');
                row.className = 'lesson-row-item';
                if (userProgress.completedLessons[lesson.id]) {
                    row.classList.add('mastered');
                }

                // Render specific visual icons per lesson content types
                let typeIcon = "📖";
                if (lesson.type === 'derivation') typeIcon = "📐";
                else if (lesson.type === 'lab') typeIcon = "🧪";

                row.innerHTML = `
                    <div class="lesson-row-left">
                        <div class="lesson-icon-circle">${typeIcon}</div>
                        <span class="lesson-title-label">${lesson.title}</span>
                        <span class="lesson-type-badge ${lesson.type}">${lesson.type}</span>
                    </div>
                    <div class="lesson-check-status"></div>
                `;

                row.addEventListener('click', (e) => {
                    e.stopPropagation(); // Avoid triggering accordion toggling
                    activeChapter = ch;
                    activeLesson = lesson;
                    renderLessonView();
                    showView('view-lesson');
                });

                listContainer.appendChild(row);
            });

            // Bind chapter accordion drawer trigger
            accordion.querySelector('.chapter-header').addEventListener('click', () => {
                const isOpen = accordion.classList.contains('open');
                // Close all other chapters for focused visual roadmap sequence
                document.querySelectorAll('.chapter-accordion').forEach(acc => acc.classList.remove('open'));
                if (!isOpen) {
                    accordion.classList.add('open');
                }
            });

            // Auto-expand first chapter on initial topic load
            if (chIdx === 0) {
                accordion.classList.add('open');
            }

            roadmapTreeNodes.appendChild(accordion);
        });
    }

    // 6. View 3: Technical Lesson Reader Renderer
    function renderLessonView() {
        if (!activeLesson) return;

        // Cleanup any older engines
        cleanupActiveEngine();

        // 1. Math formulas or standard theory prose rendering
        lessonArticleBody.innerHTML = activeLesson.content;

        // 2. Synch circular Mastery Checkbox state
        lessonMasteredCheck.checked = !!userProgress.completedLessons[activeLesson.id];

        // 3. Dynamic layout configuration based on content type: Lab vs Core Reading
        if (activeLesson.type === 'lab' && activeLesson.labType) {
            lessonLabContainer.style.display = 'flex';
            lessonWorkspaceContainer.classList.add('split-mode');
            initLaboratoryEngine(activeLesson.labType);
        } else {
            lessonLabContainer.style.display = 'none';
            lessonWorkspaceContainer.classList.remove('split-mode');
        }

        // Run LaTeX KaTeX parse
        renderMathFormulas();

        // 4. Bottom relative pagination logic
        const pagination = findSiblingLessons();
        
        // Render Previous Button
        if (pagination.prev) {
            btnLessonPrev.style.visibility = 'visible';
            prevLessonTitle.textContent = pagination.prev.title;
            btnLessonPrev.onclick = () => {
                activeLesson = pagination.prev;
                renderLessonView();
            };
        } else {
            btnLessonPrev.style.visibility = 'hidden';
        }

        // Render Next Button
        if (pagination.next) {
            btnLessonNext.style.visibility = 'visible';
            nextLessonTitle.textContent = pagination.next.title;
            btnLessonNext.onclick = () => {
                activeLesson = pagination.next;
                renderLessonView();
            };
        } else {
            btnLessonNext.style.visibility = 'hidden';
        }
    }

    // Helper: Find previous and next sibling lessons in active topic hierarchy
    function findSiblingLessons() {
        let allLessons = [];
        activeTopic.chapters.forEach(ch => {
            ch.lessons.forEach(l => {
                allLessons.push(l);
            });
        });

        const activeIdx = allLessons.findIndex(l => l.id === activeLesson.id);
        return {
            prev: activeIdx > 0 ? allLessons[activeIdx - 1] : null,
            next: activeIdx < allLessons.length - 1 ? allLessons[activeIdx + 1] : null
        };
    }

    // 7. Embedded Simulation Laboratory Engine Initializer
    function initLaboratoryEngine(labType) {
        // Resolve registered simulator chapters
        const chapterKey = labType === 'rectilinear' ? 'rectilinear' : 'mechanics';
        const topic = window.PhysicsLab.chapters.get(chapterKey);
        
        if (!topic) {
            console.error(`Physics chapter registry not found for key '${chapterKey}'.`);
            return;
        }

        activeLabTopic = topic;

        // Instantiate canvas physical sandbox
        try {
            activeEngine = topic.createEngine('physicsCanvas');
        } catch (err) {
            console.error("Failed to start laboratory engine:", err);
            return;
        }

        activeEngine.activeTopic = activeLabTopic;

        // Sync buttons controls state
        pauseBtn.disabled = true;
        pauseBtnText.textContent = "Pause";
        pauseIcon.textContent = "⏸️";
        removePausedDecorations();

        // Update Title metadata
        labCanvasTitle.textContent = topic.title;

        // Generate GUI cards inside laboratory panels
        renderControls(topic);
        renderTelemetry(topic);
        renderInspector(topic);
        renderSolver(topic);

        // Run baseline setup
        topic.init(activeEngine);

        // Map updates to dynamic presentational dashboards
        activeEngine.onUpdateCallback = () => {
            topic.updateDashboard(activeEngine, true);
        };

        activeEngine.onSimulationEndCallback = () => {
            pauseBtn.disabled = true;
            pauseBtnText.textContent = "Pause";
            pauseIcon.textContent = "⏸️";
            removePausedDecorations();
        };

        // Custom launcher button label adjustments
        launchBtn.querySelector('span:not(.btn-icon)').textContent = topic.launchBtnText || "Launch";

        // Push baseline graphics to layout
        topic.updateDashboard(activeEngine, false);
        activeEngine.render();

        // Force a manual high-DPI resize repaint once browser layout stabilizes
        requestAnimationFrame(() => {
            if (activeEngine) {
                activeEngine.resize();
                topic.updateDashboard(activeEngine, false);
            }
        });
    }

    function cleanupActiveEngine() {
        if (activeEngine) {
            if (activeLabTopic) {
                activeLabTopic.destroy(activeEngine);
            }
            activeEngine.destroy();
            activeEngine = null;
            activeLabTopic = null;
        }
    }

    // 8. GUI Compilers for Lab Panels (Ported from sandbox app.js)
    function renderControls(topic) {
        controlsDeck.innerHTML = '';
        topic.controls.forEach(ctrl => {
            const group = document.createElement('div');
            
            if (ctrl.type === 'range') {
                group.className = 'control-group';
                group.innerHTML = `
                    <div class="control-label-row">
                        <label for="${ctrl.id}">${ctrl.label}</label>
                        <span class="val-display"><span id="${ctrl.id}Val" class="numeric-val">${ctrl.value}</span>${ctrl.unit}</span>
                    </div>
                    <input type="range" id="${ctrl.id}" min="${ctrl.min}" max="${ctrl.max}" value="${ctrl.value}" step="${ctrl.step}">
                `;
                
                const slider = group.querySelector('input');
                const display = group.querySelector(`#${ctrl.id}Val`);
                slider.addEventListener('input', () => {
                    display.textContent = slider.value;
                    topic.onControlChange(ctrl.id, slider.value, activeEngine);
                });
            } else if (ctrl.type === 'checkbox') {
                group.className = 'checkbox-group';
                group.innerHTML = `
                    <label class="custom-checkbox">
                        <input type="checkbox" id="${ctrl.id}" ${ctrl.value ? 'checked' : ''}>
                        <span class="checkbox-box"></span>
                        <span class="checkbox-text">${ctrl.label}</span>
                    </label>
                `;
                
                const checkbox = group.querySelector('input');
                checkbox.addEventListener('change', () => {
                    topic.onControlChange(ctrl.id, checkbox.checked, activeEngine);
                });
            } else if (ctrl.type === 'select') {
                group.className = 'control-group';
                group.innerHTML = `
                    <div class="control-label-row">
                        <label for="${ctrl.id}">${ctrl.label}</label>
                    </div>
                    <div class="select-wrapper">
                        <select id="${ctrl.id}">
                            ${ctrl.options.map(opt => `<option value="${opt.value}" ${opt.value === ctrl.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                    </div>
                `;
                
                const select = group.querySelector('select');
                select.addEventListener('change', () => {
                    topic.onControlChange(ctrl.id, select.value, activeEngine);
                });
            }
            controlsDeck.appendChild(group);
        });
    }

    function renderTelemetry(topic) {
        dashboardDeck.innerHTML = '';
        topic.telemetry.forEach(tel => {
            const card = document.createElement('div');
            card.className = 'metric';
            card.id = `${tel.id}-card`;
            card.innerHTML = `
                <span class="label">${tel.label}</span>
                <div class="value-wrap">
                    <span id="${tel.id}" class="numeric-val">${tel.value}</span>
                    <span class="unit">${tel.unit}</span>
                </div>
            `;
            dashboardDeck.appendChild(card);
        });
    }

    function renderInspector(topic) {
        if (!topic.inspectorTelemetry) {
            inspectorPanel.style.display = 'none';
            return;
        }
        inspectorPanel.style.display = 'block';
        inspectorTitle.textContent = topic.inspectorTitle || 'Instantaneous Inspector';
        
        inspectorDeck.innerHTML = '';
        topic.inspectorTelemetry.forEach(tel => {
            const card = document.createElement('div');
            card.className = 'metric';
            card.id = `${tel.id}-card`;
            card.innerHTML = `
                <span class="label">${tel.label}</span>
                <div class="value-wrap">
                    <span id="${tel.id}" class="numeric-val">${tel.value}</span>
                    <span class="unit">${tel.unit}</span>
                </div>
            `;
            inspectorDeck.appendChild(card);
        });
    }

    function renderSolver(topic) {
        if (!topic.hasSolver) {
            solverPanel.style.display = 'none';
            return;
        }
        solverPanel.style.display = 'block';
        solverTitle.textContent = topic.solverTitle;
        solverSubtitle.textContent = topic.solverSubtitle;
        solverSliderLabel.innerHTML = topic.solverLabel;
        solverUnitLabel.textContent = topic.solverUnit;

        // Sync slider
        timeSolverInput.min = topic.solverRange.min.toString();
        timeSolverInput.max = topic.solverRange.max.toString();
        timeSolverInput.step = topic.solverRange.step.toString();
        timeSolverInput.value = topic.solverRange.value.toString();
        solverTimeVal.textContent = topic.solverRange.value.toFixed(2);
        
        solverDeck.innerHTML = '';
        topic.solverTelemetry.forEach(tel => {
            const card = document.createElement('div');
            card.className = 'metric';
            card.id = `${tel.id}-card`;
            card.innerHTML = `
                <span class="label">${tel.label}</span>
                <div class="value-wrap">
                    <span id="${tel.id}" class="numeric-val">${tel.value}</span>
                    <span class="unit">${tel.unit}</span>
                </div>
            `;
            solverDeck.appendChild(card);
        });
    }

    // 9. GUI Actions Bindings
    launchBtn.addEventListener('click', () => {
        if (!activeEngine) return;
        activeEngine.isPlaying = false;
        
        activeLabTopic.launch(activeEngine);
        launchBtn.classList.add('active');
        setTimeout(() => launchBtn.classList.remove('active'), 200);

        if (activeLabTopic.hasPauseControl) {
            pauseBtn.disabled = false;
            pauseBtnText.textContent = "Pause";
            pauseIcon.textContent = "⏸️";
        } else {
            pauseBtn.disabled = true;
        }
        removePausedDecorations();
    });

    pauseBtn.addEventListener('click', () => {
        if (!activeEngine) return;
        const hasActive = activeEngine.entities.some(e => e.isActive);
        if (!hasActive) return;

        if (activeEngine.isPlaying) {
            activeEngine.pauseSimulation();
            pauseBtnText.textContent = "Resume";
            pauseIcon.textContent = "▶️";

            activeEngine.canvas.parentElement.classList.add('paused-canvas');
            const inspectorCards = inspectorDeck.querySelectorAll('.metric');
            inspectorCards.forEach(card => card.classList.add('paused-card-glow'));
        } else {
            removePausedDecorations();
            pauseBtnText.textContent = "Pause";
            pauseIcon.textContent = "⏸️";
            activeEngine.startSimulation();
        }
    });

    clearBtn.addEventListener('click', () => {
        if (!activeEngine) return;
        activeEngine.isPlaying = false;
        activeEngine.clear();
        
        timeSolverInput.value = activeLabTopic.solverRange.value.toString();
        solverTimeVal.textContent = activeLabTopic.solverRange.value.toFixed(2);
        
        activeLabTopic.onSolverChange(activeLabTopic.solverRange.value, activeEngine);
        activeLabTopic.updateDashboard(activeEngine, false);

        pauseBtn.disabled = true;
        pauseBtnText.textContent = "Pause";
        pauseIcon.textContent = "⏸️";
        removePausedDecorations();
    });

    timeSolverInput.addEventListener('input', () => {
        if (!activeEngine) return;
        solverTimeVal.textContent = parseFloat(timeSolverInput.value).toFixed(2);
        activeLabTopic.onSolverChange(parseFloat(timeSolverInput.value), activeEngine);
    });

    function removePausedDecorations() {
        if (activeEngine && activeEngine.canvas) {
            activeEngine.canvas.parentElement.classList.remove('paused-canvas');
        }
        const inspectorCards = inspectorDeck.querySelectorAll('.metric');
        inspectorCards.forEach(card => card.classList.remove('paused-card-glow'));
    }

    // Dynamic Math (KaTeX) rendering engine call
    function renderMathFormulas() {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false
            });
        }
    }

    // 10. Mastery Checkbox event trigger
    lessonMasteredCheck.addEventListener('change', () => {
        if (!activeLesson) return;
        userProgress.completedLessons[activeLesson.id] = lessonMasteredCheck.checked;
        saveUserProgress(userProgress);
        
        // Instant visual feedback repaints
        updateProgressStats();
        
        // Repaint Tree View counts
        if (activeTopic) {
            let total = 0;
            let completed = 0;
            activeTopic.chapters.forEach(ch => {
                ch.lessons.forEach(l => {
                    total++;
                    if (userProgress.completedLessons[l.id]) completed++;
                });
            });
            treeProgressRatio.textContent = `${completed}/${total} Mastered (${total > 0 ? Math.round((completed / total) * 100) : 0}%)`;

            // Repaint list borders
            document.querySelectorAll('.lesson-row-item').forEach(row => {
                const label = row.querySelector('.lesson-title-label');
                if (label && label.textContent === activeLesson.title) {
                    if (lessonMasteredCheck.checked) {
                        row.classList.add('mastered');
                    } else {
                        row.classList.remove('mastered');
                    }
                }
            });
        }
    });

    // 11. Core Navigation Sidebar Bindings
    sidebarTabHome.addEventListener('click', () => {
        showView('view-home');
    });

    sidebarTabTree.addEventListener('click', () => {
        if (activeTopic) {
            renderTreeRoadmap();
            showView('view-tree');
        }
    });

    sidebarTabLesson.addEventListener('click', () => {
        if (activeLesson) {
            renderLessonView();
            showView('view-lesson');
        }
    });

    // Back to Homepage navigation binding
    btnTreeBack.addEventListener('click', () => {
        showView('view-home');
    });

    // Back to Roadmap navigation binding
    btnLessonBack.addEventListener('click', () => {
        renderTreeRoadmap();
        showView('view-tree');
    });

    // Class selection segment toggle binding
    classSelector11.addEventListener('change', () => {
        if (classSelector11.checked) {
            currentClass = "class11";
            renderHomepage();
        }
    });

    classSelector12.addEventListener('change', () => {
        if (classSelector12.checked) {
            currentClass = "class12";
            renderHomepage();
        }
    });

    // 12. App Initial Boot setup
    calculateTotalLessons();
    updateProgressStats();
    renderHomepage();
    showView('view-home');
});
