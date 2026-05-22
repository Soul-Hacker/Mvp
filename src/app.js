/**
 * Visual Physics - Application Controller
 * Dynamic Orchestrator using the window.PhysicsLab global registry namespace.
 * Generates widgets dynamically, binds listeners, and manages loop ticks.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Selector Cache
    const navTabsContainer = document.getElementById('dynamic-nav-tabs');
    const topicTitleEl = document.getElementById('current-topic-title');
    const topicDescEl = document.getElementById('current-topic-desc');
    const topicBadgeEl = document.getElementById('current-topic-badge');

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
    let engine = null;
    let activeTopic = null;

    // 3. Dynamic Chapter Loading Orchestration
    function loadTopic(topicId) {
        const topic = window.PhysicsLab.chapters.get(topicId);
        if (!topic) {
            console.error(`Chapter with id '${topicId}' not found in registry.`);
            return;
        }

        // Clean up previous active topic and engine
        if (engine) {
            if (activeTopic) {
                activeTopic.destroy(engine);
            }
            engine.destroy();
        }

        activeTopic = topic;
        
        // Instantiate the custom or base engine for this chapter
        try {
            engine = topic.createEngine('physicsCanvas');
        } catch (err) {
            console.error("Failed to start chapter physics engine:", err);
            return;
        }
        engine.activeTopic = activeTopic;

        // Reset play controls state
        pauseBtn.disabled = true;
        pauseBtnText.textContent = "Pause";
        pauseIcon.textContent = "⏸️";
        removePausedDecorations();

        // Update Topic Metadata HUD
        topicTitleEl.textContent = topic.title;
        topicDescEl.textContent = topic.subtitle;
        topicBadgeEl.textContent = topic.badge;
        topicBadgeEl.className = `badge-pill ${topic.id}`;

        // Compile and render the Dynamic UI elements
        renderControls(topic);
        renderTelemetry(topic);
        renderInspector(topic);
        renderSolver(topic);

        // Initialize topic variables
        topic.init(engine);

        // Synchronize engine updates with presentational UI dashboard
        engine.onUpdateCallback = () => {
            topic.updateDashboard(engine, true);
        };

        engine.onSimulationEndCallback = () => {
            pauseBtn.disabled = true;
            pauseBtnText.textContent = "Pause";
            pauseIcon.textContent = "⏸️";
            removePausedDecorations();
        };

        // Run LaTeX KaTeX parser
        renderMathFormulas();

        // Dynamic Main Launch button configurations
        launchBtn.querySelector('span:not(.btn-icon)').textContent = topic.launchBtnText || "Launch";

        // Initial GUI sync
        topic.updateDashboard(engine, false);
        engine.render();
    }

    // 4. GUI Dynamic Card Compilers
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
                    <div class="slider-ticks">
                        ${ctrl.ticks ? ctrl.ticks.map(t => `<span>${t}</span>`).join('') : ''}
                    </div>
                `;
                
                const slider = group.querySelector('input');
                const display = group.querySelector(`#${ctrl.id}Val`);
                slider.addEventListener('input', () => {
                    display.textContent = slider.value;
                    topic.onControlChange(ctrl.id, slider.value, engine);
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
                    topic.onControlChange(ctrl.id, checkbox.checked, engine);
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
                    topic.onControlChange(ctrl.id, select.value, engine);
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

        // Sync solver slider bounds
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

    // 5. Dynamic LaTeX (KaTeX) Parser
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

    // 6. Simulator Actions Trigger Bindings
    launchBtn.addEventListener('click', () => {
        engine.isPlaying = false;
        
        // Execute dynamic chapter setup
        activeTopic.launch(engine);

        launchBtn.classList.add('active');
        setTimeout(() => launchBtn.classList.remove('active'), 200);

        // Standard timing control bounds
        if (activeTopic.hasPauseControl) {
            pauseBtn.disabled = false;
            pauseBtnText.textContent = "Pause";
            pauseIcon.textContent = "⏸️";
        } else {
            pauseBtn.disabled = true;
        }
        removePausedDecorations();
    });

    pauseBtn.addEventListener('click', () => {
        const hasActive = engine.entities.some(e => e.isActive);
        if (!hasActive) return;

        if (engine.isPlaying) {
            engine.pauseSimulation();
            pauseBtnText.textContent = "Resume";
            pauseIcon.textContent = "▶️";

            // Visual decorations
            engine.canvas.parentElement.classList.add('paused-canvas');
            const inspectorCards = inspectorDeck.querySelectorAll('.metric');
            inspectorCards.forEach(card => {
                card.classList.add('paused-card-glow');
            });
        } else {
            removePausedDecorations();
            pauseBtnText.textContent = "Pause";
            pauseIcon.textContent = "⏸️";
            engine.startSimulation();
        }
    });

    clearBtn.addEventListener('click', () => {
        engine.isPlaying = false;
        engine.clear();
        
        // Reset solver slider
        timeSolverInput.value = activeTopic.solverRange.value.toString();
        solverTimeVal.textContent = activeTopic.solverRange.value.toFixed(2);
        
        activeTopic.onSolverChange(activeTopic.solverRange.value, engine);
        activeTopic.updateDashboard(engine, false);

        pauseBtn.disabled = true;
        pauseBtnText.textContent = "Pause";
        pauseIcon.textContent = "⏸️";
        removePausedDecorations();
    });

    timeSolverInput.addEventListener('input', () => {
        solverTimeVal.textContent = parseFloat(timeSolverInput.value).toFixed(2);
        activeTopic.onSolverChange(parseFloat(timeSolverInput.value), engine);
    });

    function removePausedDecorations() {
        if (engine && engine.canvas) {
            engine.canvas.parentElement.classList.remove('paused-canvas');
        }
        const inspectorCards = inspectorDeck.querySelectorAll('.metric');
        inspectorCards.forEach(card => {
            card.classList.remove('paused-card-glow');
        });
    }

    // 7. Navigation Tab Bindings
    navTabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;

        if (btn.classList.contains('disabled')) {
            e.preventDefault();
            alert("Laboratory is currently locked! This content is scheduled for Wave Optics or Electrostatics modules.");
            return;
        }

        navTabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const topicId = btn.getAttribute('data-tab');
        loadTopic(topicId);
    });

    // 8. Boot Primary Chapter (Mechanics Projectile Lab)
    loadTopic('mechanics');
});
