/**
 * Visual Physics - Application Controller
 * Handles DOM bindings, reactive slider tracking, pre-launch physical predictions,
 * and live-updating telemetry dashboards.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Selector Cache
    const speedSlider = document.getElementById('speedSlider');
    const speedVal = document.getElementById('speedVal');
    
    const angleSlider = document.getElementById('angleSlider');
    const angleVal = document.getElementById('angleVal');
    
    const gravitySlider = document.getElementById('gravitySlider');
    const gravityVal = document.getElementById('gravityVal');
    
    const vectorToggle = document.getElementById('vectorToggle');
    const launchBtn = document.getElementById('launchBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // Pause / Resume Elements
    const pauseBtn = document.getElementById('pauseBtn');
    const pauseIcon = document.getElementById('pauseIcon');
    const pauseBtnText = document.getElementById('pauseBtnText');
    
    // Telemetry Dashboard Elements
    const metricRange = document.getElementById('metricRange');
    const metricHeight = document.getElementById('metricHeight');
    const metricTime = document.getElementById('metricTime');

    // Instantaneous Vector Inspector Elements
    const metricTimeElapsed = document.getElementById('metricTimeElapsed');
    const metricPos = document.getElementById('metricPos');
    const metricSpeed = document.getElementById('metricSpeed');
    const metricVecAngle = document.getElementById('metricVecAngle');
    const metricVx = document.getElementById('metricVx');
    const metricVy = document.getElementById('metricVy');

    // Theoretical Time Solver Elements
    const timeSolverInput = document.getElementById('timeSolverInput');
    const solverTimeVal = document.getElementById('solverTimeVal');
    const solverPos = document.getElementById('solverPos');
    const solverSpeed = document.getElementById('solverSpeed');
    const solverAngle = document.getElementById('solverAngle');

    // Tab buttons for topic navigation
    const tabMechanics = document.getElementById('tab-mechanics');
    const tabElectrostatics = document.getElementById('tab-electrostatics');
    const tabOptics = document.getElementById('tab-optics');

    // 2. Initialize Physics Engine
    let engine;
    try {
        engine = new PhysicsEngine('physicsCanvas');
    } catch (err) {
        console.error("Failed to start physics engine:", err);
        return;
    }

    // 3. Pre-Calculations & State Sync
    function getLaunchParameters() {
        return {
            u: parseFloat(speedSlider.value),
            angle: parseFloat(angleSlider.value),
            g: parseFloat(gravitySlider.value)
        };
    }

    // Calculate standard parabolic trajectory metrics theoretically
    function predictTrajectory(u, angleDegrees, g) {
        const theta = (angleDegrees * Math.PI) / 180;
        
        // Range: R = (u^2 * sin(2*theta)) / g
        const range = (u * u * Math.sin(2 * theta)) / g;
        
        // Max Height: H = (u^2 * sin^2(theta)) / (2*g)
        const height = (u * u * Math.sin(theta) * Math.sin(theta)) / (2 * g);
        
        // Time of flight: T = (2 * u * sin(theta)) / g
        const time = (2 * u * Math.sin(theta)) / g;

        return { range, height, time };
    }

    // Update the live metrics dashboard
    function updateTelemetryDashboard(isLive = false) {
        const activeProj = engine.projectiles[0];
        const params = getLaunchParameters();

        if (isLive && activeProj) {
            // Live simulation telemetry ticker
            metricRange.textContent = activeProj.pos.x.toFixed(2);
            metricHeight.textContent = activeProj.maxHeight.toFixed(2);
            metricTime.textContent = activeProj.timeElapsed.toFixed(2);

            // Instantaneous coordinates
            metricTimeElapsed.textContent = activeProj.timeElapsed.toFixed(2);
            metricPos.textContent = `${activeProj.pos.x.toFixed(2)}, ${activeProj.pos.y.toFixed(2)}`;
            metricSpeed.textContent = activeProj.vel.mag().toFixed(2);
            
            const liveAngle = Math.atan2(activeProj.vel.y, activeProj.vel.x) * 180 / Math.PI;
            metricVecAngle.textContent = liveAngle.toFixed(2);
            
            metricVx.textContent = activeProj.vel.x.toFixed(2);
            metricVy.textContent = activeProj.vel.y.toFixed(2);
            
            // Highlight live elements styling if active
            setTelemetryActiveStyle(true);
        } else {
            // Pre-launch static theoretical prediction values
            const theoretical = predictTrajectory(params.u, params.angle, params.g);
            
            metricRange.textContent = theoretical.range.toFixed(2);
            metricHeight.textContent = theoretical.height.toFixed(2);
            metricTime.textContent = theoretical.time.toFixed(2);

            // Compute theoretical initial components for pre-launch preview
            const theta = (params.angle * Math.PI) / 180;
            const initVx = params.u * Math.cos(theta);
            const initVy = params.u * Math.sin(theta);

            metricTimeElapsed.textContent = "0.00";
            metricPos.textContent = "0.00, 0.00";
            metricSpeed.textContent = params.u.toFixed(2);
            metricVecAngle.textContent = params.angle.toFixed(2);
            metricVx.textContent = initVx.toFixed(2);
            metricVy.textContent = initVy.toFixed(2);
            
            setTelemetryActiveStyle(false);
        }
    }

    // Evaluate theoretical kinematics at a given target time t
    function updateTimeSolver() {
        const params = getLaunchParameters();
        const t = parseFloat(timeSolverInput.value);
        solverTimeVal.textContent = t.toFixed(2);

        const theta = (params.angle * Math.PI) / 180;
        const u = params.u;
        const g = params.g;

        // Position coordinates at time t
        const x = u * Math.cos(theta) * t;
        const y = Math.max(0, u * Math.sin(theta) * t - 0.5 * g * t * t);

        // Velocity components at time t
        const vx = u * Math.cos(theta);
        const vy = u * Math.sin(theta) - g * t;
        const speed = Math.sqrt(vx * vx + vy * vy);
        const angle = Math.atan2(vy, vx) * 180 / Math.PI;

        solverPos.textContent = `${x.toFixed(2)}, ${y.toFixed(2)}`;
        solverSpeed.textContent = speed.toFixed(2);
        solverAngle.textContent = angle.toFixed(2);

        // Set ghost state in the engine
        engine.ghostPreview = { x, y, vx, vy, angle, t };
        
        // Re-render the canvas with the ghost overlay
        engine.render();
    }

    // Styling utility to indicate real-time stream state
    function setTelemetryActiveStyle(isActive) {
        const cards = [
            document.getElementById('metric-range-card'),
            document.getElementById('metric-height-card'),
            document.getElementById('metric-time-card')
        ];
        
        cards.forEach(card => {
            if (card) {
                if (isActive) {
                    card.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                    card.style.background = 'rgba(6, 182, 212, 0.03)';
                } else {
                    card.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                    card.style.background = 'rgba(255, 255, 255, 0.02)';
                }
            }
        });
    }

    // Trigger scale recalibration based on sliders to make path fit beautifully
    function recalibrateZoom() {
        const params = getLaunchParameters();
        const theoretical = predictTrajectory(params.u, params.angle, params.g);
        
        // Let the engine adjust pixel scaling dynamically
        engine.autoScale(theoretical.range, theoretical.height);
        
        // Sync Time Solver Slider Limits
        if (timeSolverInput) {
            const currentVal = parseFloat(timeSolverInput.value);
            timeSolverInput.max = theoretical.time.toString();
            timeSolverInput.step = (theoretical.time / 100).toString();
            
            if (currentVal > theoretical.time || currentVal === 0) {
                timeSolverInput.value = "0";
            }
            // Update time solver display metrics & ghost preview
            updateTimeSolver();
        } else {
            // Redraw environment grids according to new scale
            engine.render();
        }
    }

    // Link engine ticks to app's dashboard
    engine.onUpdateCallback = () => {
        updateTelemetryDashboard(true);

        const activeProj = engine.projectiles[0];
        // If projectile has naturally completed and landed, clean up pause controls
        if (activeProj && !activeProj.isActive) {
            pauseBtn.disabled = true;
            pauseBtnText.textContent = "Pause";
            pauseIcon.textContent = "⏸️";
            removePausedDecorations();
        }
    };

    // Helper to clean up paused decorative UI borders/shadows
    function removePausedDecorations() {
        const canvasContainer = engine.canvas.parentElement;
        if (canvasContainer) {
            canvasContainer.classList.remove('paused-canvas');
        }
        const insCards = ['metric-pos-card', 'metric-speed-card', 'metric-vx-card', 'metric-vy-card'];
        insCards.forEach(id => {
            const card = document.getElementById(id);
            if (card) card.classList.remove('paused-card-glow');
        });
    }

    // 4. Slider Reactive Controls
    function handleSliderInput(slider, displayEl, suffix = '') {
        displayEl.textContent = slider.value;
        
        // Recalculate zoom and refresh grid values dynamically
        recalibrateZoom();
        updateTelemetryDashboard(false);
    }

    speedSlider.addEventListener('input', () => {
        handleSliderInput(speedSlider, speedVal);
    });

    angleSlider.addEventListener('input', () => {
        handleSliderInput(angleSlider, angleVal);
    });

    gravitySlider.addEventListener('input', () => {
        handleSliderInput(gravitySlider, gravityVal);
    });

    timeSolverInput.addEventListener('input', () => {
        updateTimeSolver();
    });

    vectorToggle.addEventListener('change', () => {
        engine.render();
    });

    // 5. Button Actions
    launchBtn.addEventListener('click', () => {
        // Stop current animation if any
        engine.isPlaying = false;
        
        // Clear ghost preview during launch
        engine.ghostPreview = null;
        if (timeSolverInput) {
            timeSolverInput.value = "0";
            solverTimeVal.textContent = "0.00";
        }
        
        const params = getLaunchParameters();
        
        // Clear past projectiles and instantiate fresh one
        engine.clear();
        
        // Automatically make sure scale fits before fire
        recalibrateZoom();

        const newProj = new Projectile(params.u, params.angle, params.g);
        engine.addProjectile(newProj);
        
        // Add nice CSS activation visual on button
        launchBtn.classList.add('active');
        setTimeout(() => launchBtn.classList.remove('active'), 200);

        // Reset and enable pause button
        pauseBtn.disabled = false;
        pauseBtnText.textContent = "Pause";
        pauseIcon.textContent = "⏸️";
        removePausedDecorations();

        // Run simulation
        engine.startSimulation();
    });

    pauseBtn.addEventListener('click', () => {
        const activeProj = engine.projectiles[0];
        if (!activeProj || !activeProj.isActive) return;

        if (engine.isPlaying) {
            // Pause simulation
            engine.isPlaying = false;
            pauseBtnText.textContent = "Resume";
            pauseIcon.textContent = "▶️";

            // Add glowing orange decorative effects to highlight the frozen state
            const canvasContainer = engine.canvas.parentElement;
            if (canvasContainer) {
                canvasContainer.classList.add('paused-canvas');
            }
            const insCards = ['metric-pos-card', 'metric-speed-card', 'metric-vx-card', 'metric-vy-card'];
            insCards.forEach(id => {
                const card = document.getElementById(id);
                if (card) card.classList.add('paused-card-glow');
            });

            // Re-render instantly to display projection coordinate lines and selector halo
            engine.render();
        } else {
            // Resume simulation
            engine.isPlaying = true;
            pauseBtnText.textContent = "Pause";
            pauseIcon.textContent = "⏸️";

            removePausedDecorations();
            engine.startSimulation();
        }
    });

    clearBtn.addEventListener('click', () => {
        engine.isPlaying = false;
        engine.ghostPreview = null;
        if (timeSolverInput) {
            timeSolverInput.value = "0";
            solverTimeVal.textContent = "0.00";
        }
        engine.clear();
        recalibrateZoom();
        updateTelemetryDashboard(false);

        // Reset and disable pause button
        pauseBtn.disabled = true;
        pauseBtnText.textContent = "Pause";
        pauseIcon.textContent = "⏸️";
        removePausedDecorations();
    });

    // 6. Navigation Tabs Feedback (Locked/Class 12 labs)
    const disabledTabs = [tabElectrostatics, tabOptics];
    disabledTabs.forEach(tab => {
        if (tab) {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Laboratory is currently locked! This content is scheduled for Class 12 Electrostatics & Wave Optics modules.");
            });
        }
    });

    // 7. Initial Page Load Execution
    recalibrateZoom();
    updateTelemetryDashboard(false);
});
