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
    const btnTreeBack = document.getElementById('btn-tree-back');
    const treeChapterIndex = document.getElementById('tree-chapter-index');
    const treeChapterTitle = document.getElementById('tree-chapter-title');
    const treeChapterProgressFill = document.getElementById('tree-chapter-progress-fill');
    const treeChapterProgressText = document.getElementById('tree-chapter-progress-text');
    const chapterLessonsList = document.getElementById('chapter-lessons-list');
    const chapterChecklistCard = document.getElementById('chapter-checklist-card');

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

        // Update Chapter progress bar on homepage if rendered
        document.querySelectorAll('.chapter-card').forEach(card => {
            const chapterId = card.getAttribute('data-chapter-id');
            const chapterObj = findChapterById(chapterId);
            if (chapterObj) {
                const chTotal = chapterObj.lessons.length;
                const chCompleted = chapterObj.lessons.filter(l => userProgress.completedLessons[l.id]).length;
                const progressPct = chTotal > 0 ? Math.round((chCompleted / chTotal) * 100) : 0;
                
                const fill = card.querySelector('.chapter-card-progress-fill');
                if (fill) fill.style.width = `${progressPct}%`;
                
                const ratioText = card.querySelector('.chapter-card-progress-wrap span:first-child');
                if (ratioText) ratioText.textContent = `${chCompleted}/${chTotal} lessons completed`;
                
                const pctText = card.querySelector('.pct-text');
                if (pctText) pctText.textContent = `${progressPct}%`;

                // Also update lesson bullets checkmarks in the homepage cards preview list!
                card.querySelectorAll('.chapter-card-lesson-bullet').forEach((bullet, bIdx) => {
                    const linkedLesson = chapterObj.lessons[bIdx];
                    if (linkedLesson) {
                        const isLCompleted = !!userProgress.completedLessons[linkedLesson.id];
                        if (isLCompleted) {
                            bullet.classList.add('mastered');
                        } else {
                            bullet.classList.remove('mastered');
                        }
                    }
                });
            }
        });
    }

    // Helper: Find chapter by ID anywhere in the curriculum
    function findChapterById(chapterId) {
        for (let cls of ['class11', 'class12']) {
            for (let subj of ['physics', 'chemistry', 'mathematics']) {
                const topics = JEE_CURRICULUM[cls][subj] || [];
                for (let topic of topics) {
                    const chapter = topic.chapters.find(ch => ch.id === chapterId);
                    if (chapter) return chapter;
                }
            }
        }
        return null;
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

        // Compile Physics Chapters
        let phyIdx = 0;
        (classCurriculum.physics || []).forEach(topic => {
            topic.chapters.forEach(ch => {
                gridPhysics.appendChild(createChapterCard(ch, phyIdx, topic));
                phyIdx++;
            });
        });

        // Compile Chemistry Chapters
        let chemIdx = 0;
        (classCurriculum.chemistry || []).forEach(topic => {
            topic.chapters.forEach(ch => {
                gridChemistry.appendChild(createChapterCard(ch, chemIdx, topic));
                chemIdx++;
            });
        });

        // Compile Mathematics Chapters
        let mathIdx = 0;
        (classCurriculum.mathematics || []).forEach(topic => {
            topic.chapters.forEach(ch => {
                gridMathematics.appendChild(createChapterCard(ch, mathIdx, topic));
                mathIdx++;
            });
        });
    }

    function createChapterCard(ch, chIdx, topic) {
        const card = document.createElement('div');
        card.className = 'chapter-card';
        card.setAttribute('data-chapter-id', ch.id);
        
        const chTotal = ch.lessons.length;
        const chCompleted = ch.lessons.filter(l => userProgress.completedLessons[l.id]).length;
        const pct = chTotal > 0 ? Math.round((chCompleted / chTotal) * 100) : 0;

        // Render first 3 lessons preview
        let previewHtml = '';
        const previewLessons = ch.lessons.slice(0, 3);
        previewLessons.forEach(l => {
            const isLCompleted = !!userProgress.completedLessons[l.id];
            previewHtml += `
                <div class="chapter-card-lesson-bullet ${isLCompleted ? 'mastered' : ''}">
                    <span class="bullet-circle"></span>
                    <span class="bullet-text">${l.title}</span>
                </div>
            `;
        });

        // Overflow count
        const overflow = ch.lessons.length - 3;
        const overflowHtml = overflow > 0 ? `<span class="chapter-card-more-lessons">+${overflow} more lessons</span>` : '';

        card.innerHTML = `
            <div class="chapter-card-header">
                <div class="chapter-card-header-left">
                    <span class="icon-circle">📖</span>
                    <span class="index-label">Chapter ${String(chIdx + 1).padStart(2, '0')}</span>
                </div>
                <div class="chapter-card-header-right">
                    <span>&rsaquo;</span>
                </div>
            </div>
            <h3>${ch.title}</h3>
            <div class="chapter-card-progress-wrap">
                <span>${chCompleted}/${chTotal} lessons completed</span>
                <span class="pct-text">${pct}%</span>
            </div>
            <div class="chapter-card-progress-bar">
                <div class="chapter-card-progress-fill" style="width: ${pct}%"></div>
            </div>
            <div class="chapter-card-lessons-preview">
                ${previewHtml}
                ${overflowHtml}
            </div>
        `;

        card.addEventListener('click', () => {
            activeTopic = topic;
            activeChapter = ch;
            renderTreeRoadmap();
            showView('view-tree');
        });

        return card;
    }

    // 5. View 2: The Chapter Tree Roadmap Renderer
    function renderTreeRoadmap() {
        if (!activeChapter) return;

        // Find the index of the chapter in the topic
        const chIdx = activeTopic.chapters.findIndex(c => c.id === activeChapter.id);
        treeChapterIndex.textContent = `Chapter ${String(chIdx + 1).padStart(2, '0')}`;
        treeChapterTitle.textContent = activeChapter.title;

        // Calculate roadmap ratio
        const chTotal = activeChapter.lessons.length;
        const chCompleted = activeChapter.lessons.filter(l => userProgress.completedLessons[l.id]).length;
        const pct = chTotal > 0 ? Math.round((chCompleted / chTotal) * 100) : 0;
        
        treeChapterProgressFill.style.width = `${pct}%`;
        treeChapterProgressText.textContent = `${chCompleted}/${chTotal} completed`;

        // Render lessons list
        chapterLessonsList.innerHTML = '';
        activeChapter.lessons.forEach((lesson, lIdx) => {
            const btn = document.createElement('button');
            btn.className = 'lesson-row-btn';
            const isLCompleted = !!userProgress.completedLessons[lesson.id];
            if (isLCompleted) {
                btn.classList.add('mastered');
            }

            let typeIcon = "📖";
            if (lesson.type === 'derivation') typeIcon = "📐";
            else if (lesson.type === 'lab') typeIcon = "🧪";

            btn.innerHTML = `
                <div class="lesson-row-btn-left">
                    <div class="lesson-checkbox ${isLCompleted ? 'checked' : ''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span class="lesson-index-num">${String(lIdx + 1).padStart(2, '0')}</span>
                    <span class="lesson-icon-box">${typeIcon}</span>
                    <span class="lesson-title-text">${lesson.title}</span>
                </div>
                <div class="lesson-row-btn-right">
                    <span class="lesson-type-badge ${lesson.type}">${lesson.type}</span>
                    <span class="chevron">&rsaquo;</span>
                </div>
            `;

            // Checkbox click event toggles mastery status
            const checkBtn = btn.querySelector('.lesson-checkbox');
            checkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const nextState = !userProgress.completedLessons[lesson.id];
                userProgress.completedLessons[lesson.id] = nextState;
                saveUserProgress(userProgress);
                
                // Repaint
                updateProgressStats();
                renderTreeRoadmap();
            });

            btn.addEventListener('click', () => {
                activeLesson = lesson;
                renderLessonView();
                showView('view-lesson');
            });

            chapterLessonsList.appendChild(btn);
        });

        // Render checklist outcomes
        chapterChecklistCard.innerHTML = '';
        if (activeChapter.learningOutcomes && activeChapter.learningOutcomes.length > 0) {
            activeChapter.learningOutcomes.forEach((outcome, oIdx) => {
                const item = document.createElement('label');
                item.className = 'checklist-item';
                
                const linkedLesson = activeChapter.lessons[oIdx];
                const isChecked = linkedLesson ? !!userProgress.completedLessons[linkedLesson.id] : false;

                item.innerHTML = `
                    <input type="checkbox" ${isChecked ? 'checked' : ''} ${!linkedLesson ? 'disabled' : ''}>
                    <span class="custom-checkbox">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </span>
                    <span class="checklist-text">${outcome}</span>
                `;

                if (linkedLesson) {
                    const checkbox = item.querySelector('input');
                    checkbox.addEventListener('change', () => {
                        userProgress.completedLessons[linkedLesson.id] = checkbox.checked;
                        saveUserProgress(userProgress);
                        
                        // Repaint
                        updateProgressStats();
                        renderTreeRoadmap();
                    });
                }

                chapterChecklistCard.appendChild(item);
            });
        } else {
            chapterChecklistCard.innerHTML = `<p class="no-outcomes">No specific learning outcomes listed for this chapter.</p>`;
        }
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
        
        // Repaint Tree View
        if (activeChapter) {
            renderTreeRoadmap();
        }
    });

    // 11. Core Navigation Sidebar Bindings
    sidebarTabHome.addEventListener('click', () => {
        showView('view-home');
    });

    sidebarTabTree.addEventListener('click', () => {
        if (activeTopic && activeChapter) {
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
