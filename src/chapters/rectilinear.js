/**
 * Visual Physics - Rectilinear Motion Chapter Module
 * Self-contained chapter implementing 1D Kinematics, double tracks, ticker trails,
 * overlapping-free vectors, and three live side-by-side graphs.
 */

(function() {
    // 1. Rectilinear Body Entity (handles physics state & history)
    class RectilinearBody {
        constructor(id, type, u, aOrK, varType = 'kt') {
            this.id = id; // 'track1' (constant) or 'track2' (variable)
            this.type = type; // 'constant' or 'variable'
            this.u = u;
            this.aOrK = aOrK; // acceleration a (constant) or damping/time factor k
            this.varType = varType; // 'kt' or 'kv'

            this.pos = 0;
            this.vel = u;
            this.acc = type === 'constant' ? aOrK : 0;
            
            this.isActive = true;
            this.timeElapsed = 0;
            
            this.history = []; // Array of { t, x, vel, acc } for trails and graphs
            this.trailTimer = 0;
        }

        update(dt, engine) {
            if (!this.isActive) return;

            // Integrator math
            if (this.type === 'constant') {
                this.acc = this.aOrK;
            } else {
                // Variable acceleration based on dropdown selection
                if (this.varType === 'kt') {
                    this.acc = this.aOrK * this.timeElapsed;
                } else if (this.varType === 'kv') {
                    this.acc = -this.aOrK * this.vel;
                }
            }

            // Save history at regular ticker tape time intervals (0.05 seconds)
            this.trailTimer += dt;
            if (this.trailTimer >= 0.05) {
                this.history.push({
                    t: this.timeElapsed,
                    x: this.pos,
                    vel: this.vel,
                    acc: this.acc
                });
                // Keep history capped to prevent memory leaks
                if (this.history.length > 600) {
                    this.history.shift();
                }
                this.trailTimer = 0;
            }

            // Standard Euler integration step
            this.vel += this.acc * dt;
            this.pos += this.vel * dt;
            this.timeElapsed += dt;

            // Cap simulation at 25 seconds
            if (this.timeElapsed >= 25) {
                this.isActive = false;
            }
        }
    }

    // 2. Custom Physics Engine for Rectilinear Chapter (draws stacked tracks, vectors, trails, and 3 graphs)
    class RectilinearEngine extends window.PhysicsLab.PhysicsEngine {
        constructor(canvasId) {
            super(canvasId);
            this.cameraX = 0;
            this.scale = 8; // 1 meter = 8 pixels
        }

        render() {
            // Clear canvas and draw base grid/ground (handled generic by parent)
            this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
            
            const bodies = this.entities;
            const body1 = bodies[0]; // Track 1
            const body2 = bodies[1]; // Track 2

            // Calculate dynamic sliding camera X position centered on average of bodies
            if (body1 && body2) {
                this.cameraX = (body1.pos + body2.pos) / 2;
            } else if (body1) {
                this.cameraX = body1.pos;
            } else {
                this.cameraX = 0;
            }

            // Stacked Track heights
            const trackY1 = this.logicalHeight * 0.18;
            const trackY2 = this.logicalHeight * 0.42;

            // Render Stacked Tracks
            this.drawTrack(trackY1, "Track 1: Constant Acceleration (a = const)", '#06b6d4', body1);
            this.drawTrack(trackY2, `Track 2: Variable Acceleration (${body2 ? (body2.varType === 'kt' ? 'a = k*t' : 'a = -k*v') : 'a = var'})`, '#8b5cf6', body2);

            // Render three live side-by-side graphs at the bottom of the canvas
            this.drawGraphs(body1, body2);
        }

        drawTrack(trackY, label, trackColor, body) {
            const ctx = this.ctx;
            const width = this.logicalWidth;
            const cameraX = this.cameraX;
            const scale = this.scale;

            // Draw track banner background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
            ctx.fillRect(0, trackY - 35, width, 70);

            // Draw track horizontal boundary rails
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, trackY - 15);
            ctx.lineTo(width, trackY - 15);
            ctx.moveTo(0, trackY + 15);
            ctx.lineTo(width, trackY + 15);
            ctx.stroke();

            // Draw track center line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, trackY);
            ctx.lineTo(width, trackY);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash

            // Calculate range of meters visible in current viewport
            const leftPhysicsX = cameraX - (width / 2) / scale;
            const rightPhysicsX = cameraX + (width / 2) / scale;
            const gridSpacing = 20; // major ticks every 20 meters
            const startMeter = Math.floor(leftPhysicsX / gridSpacing) * gridSpacing;

            // Draw sliding grid ticks and numerical markings
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillStyle = '#64748b';
            ctx.font = '500 9px "Fira Code", monospace';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let m = startMeter; m <= rightPhysicsX; m += gridSpacing) {
                const sx = width / 2 + (m - cameraX) * scale;
                ctx.moveTo(sx, trackY - 10);
                ctx.lineTo(sx, trackY + 10);
                ctx.fillText(`${m}m`, sx - 8, trackY + 22);
            }
            ctx.stroke();

            // Draw starting checkered line at x = 0m
            const zeroX = width / 2 + (0 - cameraX) * scale;
            if (zeroX >= 0 && zeroX <= width) {
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(zeroX, trackY - 15);
                ctx.lineTo(zeroX, trackY + 15);
                ctx.stroke();
                
                ctx.fillStyle = '#f59e0b';
                ctx.font = '700 8px "Outfit", sans-serif';
                ctx.fillText("START (0m)", zeroX - 22, trackY - 18);
            }

            // Track Label Banner
            ctx.fillStyle = '#94a3b8';
            ctx.font = '600 10px "Outfit", sans-serif';
            ctx.fillText(label, 20, trackY - 22);

            if (!body) return;

            // 1. Draw ticker-tape spaced dots trail from history
            body.history.forEach((pt, idx) => {
                const dotX = width / 2 + (pt.x - cameraX) * scale;
                if (dotX >= 0 && dotX <= width) {
                    const opacity = (idx / body.history.length) * 0.6;
                    ctx.beginPath();
                    ctx.arc(dotX, trackY, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = body.type === 'constant' ? `rgba(6, 182, 212, ${opacity})` : `rgba(139, 92, 246, ${opacity})`;
                    ctx.fill();
                }
            });

            // 2. Draw the moving sphere object
            const sphereX = width / 2 + (body.pos - cameraX) * scale;
            
            // Draw sphere if inside viewport bounds
            if (sphereX >= -20 && sphereX <= width + 20) {
                // Sphere shadow glow
                ctx.save();
                ctx.beginPath();
                ctx.arc(sphereX, trackY, 11, 0, Math.PI * 2);
                ctx.shadowColor = trackColor;
                ctx.shadowBlur = 10;
                ctx.fillStyle = 'transparent';
                ctx.fill();
                ctx.restore();

                // Sphere body metallic gradient fill
                ctx.beginPath();
                ctx.arc(sphereX, trackY, 11, 0, Math.PI * 2);
                const radialGrad = ctx.createRadialGradient(sphereX - 3, trackY - 3, 2, sphereX, trackY, 11);
                radialGrad.addColorStop(0, '#ffffff');
                radialGrad.addColorStop(0.3, trackColor);
                radialGrad.addColorStop(1, '#0f172a');
                ctx.fillStyle = radialGrad;
                ctx.fill();
                
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // 3. Render velocity (green) and acceleration (red) arrows directly on sphere
                // Offset velocity arrow and acceleration arrow vertically so they NEVER overlap
                const vScale = 2.0; // pixels per m/s
                const aScale = 5.0; // pixels per m/s²
                
                const vxLength = body.vel * vScale;
                const axLength = body.acc * aScale;

                // Velocity Arrow (drawn horizontally through center line)
                if (Math.abs(body.vel) > 0.1) {
                    this.drawArrow(ctx, sphereX, trackY, sphereX + vxLength, trackY, '#10b981', 2, `v: ${body.vel.toFixed(1)}`);
                }

                // Acceleration Arrow (drawn with 16px vertical offset below center line to prevent overlap)
                if (Math.abs(body.acc) > 0.05) {
                    this.drawArrow(ctx, sphereX, trackY + 16, sphereX + axLength, trackY + 16, '#ef4444', 2, `a: ${body.acc.toFixed(1)}`);
                }
            }
        }

        drawGraphs(body1, body2) {
            const ctx = this.ctx;
            const width = this.logicalWidth;
            const height = this.logicalHeight;

            // Graphs vertical bounding region
            const gy1 = height * 0.63;
            const gy2 = height * 0.94;
            const gHeight = gy2 - gy1;
            
            const margin = 20;
            const gap = 20;
            const numGraphs = 3;
            const gWidth = (width - 2 * margin - (numGraphs - 1) * gap) / numGraphs;

            // 1. Gather all history timestamps to build dynamic sliding time axis
            let maxTime = 0;
            if (body1 && body1.timeElapsed > maxTime) maxTime = body1.timeElapsed;
            if (body2 && body2.timeElapsed > maxTime) maxTime = body2.timeElapsed;

            // Sliding horizontal time window of the last 10 seconds
            let tMin = 0;
            let tMax = 10;
            if (maxTime > 10) {
                tMin = maxTime - 10;
                tMax = maxTime;
            }

            // 2. Scan history data points to auto-scale vertical Y-axes comfortable within bounds
            const history1 = body1 ? body1.history : [];
            const history2 = body2 ? body2.history : [];
            const fullHistory = [...history1, ...history2];

            let xMin = -5, xMax = 20;
            let vMin = -15, vMax = 25;
            let aMin = -4, aMax = 6;

            if (fullHistory.length > 0) {
                const xVals = fullHistory.map(h => h.x);
                const vVals = fullHistory.map(h => h.vel);
                const aVals = fullHistory.map(h => h.acc);

                if (body1) {
                    xVals.push(body1.pos);
                    vVals.push(body1.vel);
                    aVals.push(body1.acc);
                }
                if (body2) {
                    xVals.push(body2.pos);
                    vVals.push(body2.vel);
                    aVals.push(body2.acc);
                }

                xMin = Math.min(-10, ...xVals);
                xMax = Math.max(20, ...xVals);
                
                vMin = Math.min(-15, ...vVals);
                vMax = Math.max(15, ...vVals);

                aMin = Math.min(-3, ...aVals);
                aMax = Math.max(3, ...aVals);
            }

            // Add margin padding to auto-scaled parameters
            const padX = (xMax - xMin) * 0.1 || 1;
            xMin -= padX; xMax += padX;
            
            const padV = (vMax - vMin) * 0.1 || 1;
            vMin -= padV; vMax += padV;
            
            const padA = (aMax - aMin) * 0.1 || 1;
            aMin -= padA; aMax += padA;

            // Draw each curve graph: Position, Velocity, Acceleration
            this.drawSingleGraph(margin + 0 * (gWidth + gap), gWidth, gy1, gy2, tMin, tMax, xMin, xMax, "Position (m) vs Time (s)", 'x', body1, body2);
            this.drawSingleGraph(margin + 1 * (gWidth + gap), gWidth, gy1, gy2, tMin, tMax, vMin, vMax, "Velocity (v) vs Time (s)", 'vel', body1, body2);
            this.drawSingleGraph(margin + 2 * (gWidth + gap), gWidth, gy1, gy2, tMin, tMax, aMin, aMax, "Acceleration (a) vs Time (s)", 'acc', body1, body2);
        }

        drawSingleGraph(gx1, gWidth, gy1, gy2, tMin, tMax, valMin, valMax, title, field, body1, body2) {
            const ctx = this.ctx;
            const gx2 = gx1 + gWidth;
            const gHeight = gy2 - gy1;

            // Draw dark glassmorphic graph base card
            ctx.fillStyle = 'rgba(13, 18, 32, 0.55)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.rect(gx1, gy1, gWidth, gHeight);
            ctx.fill();
            ctx.stroke();

            // Overlay subtle grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.beginPath();
            for (let i = 1; i < 4; i++) {
                const yGrid = gy1 + (i / 4) * gHeight;
                ctx.moveTo(gx1, yGrid);
                ctx.lineTo(gx2, yGrid);
            }
            for (let i = 1; i < 4; i++) {
                const xGrid = gx1 + (i / 4) * gWidth;
                ctx.moveTo(xGrid, gy1);
                ctx.lineTo(xGrid, gy2);
            }
            ctx.stroke();

            // Helper mapping coordinates function
            const getPt = (t, val) => {
                const px = gx1 + ((t - tMin) / (tMax - tMin || 1)) * gWidth;
                const py = gy2 - ((val - valMin) / (valMax - valMin || 1)) * gHeight;
                return { x: px, y: py };
            };

            // Draw zero-reference axis line if within scale range
            if (valMin < 0 && valMax > 0) {
                const zeroAxis = getPt(tMin, 0);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(gx1, zeroAxis.y);
                ctx.lineTo(gx2, zeroAxis.y);
                ctx.stroke();
            }

            // Draw graph curves
            const drawCurve = (body, color) => {
                if (!body) return;
                
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.8;
                ctx.beginPath();

                let first = true;
                const pts = body.history;
                
                // Draw curve path
                for (let i = 0; i < pts.length; i++) {
                    const pt = pts[i];
                    if (pt.t >= tMin && pt.t <= tMax) {
                        const screenPt = getPt(pt.t, pt[field]);
                        if (first) {
                            ctx.moveTo(screenPt.x, screenPt.y);
                            first = false;
                        } else {
                            ctx.lineTo(screenPt.x, screenPt.y);
                        }
                    }
                }

                // Add current live position to continuous curve path
                if (body.timeElapsed >= tMin && body.timeElapsed <= tMax) {
                    const currVal = field === 'x' ? body.pos : (field === 'vel' ? body.vel : body.acc);
                    const screenPt = getPt(body.timeElapsed, currVal);
                    if (first) {
                        ctx.moveTo(screenPt.x, screenPt.y);
                    } else {
                        ctx.lineTo(screenPt.x, screenPt.y);
                    }
                }
                ctx.stroke();

                // Draw small flashing flashing current dot at end of curve
                const currVal = field === 'x' ? body.pos : (field === 'vel' ? body.vel : body.acc);
                const dotPt = getPt(body.timeElapsed, currVal);
                if (dotPt.x >= gx1 && dotPt.x <= gx2 && dotPt.y >= gy1 && dotPt.y <= gy2) {
                    ctx.beginPath();
                    ctx.arc(dotPt.x, dotPt.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                }
            };

            drawCurve(body1, '#06b6d4'); // Draw Track 1 curve in Cyan
            drawCurve(body2, '#8b5cf6'); // Draw Track 2 curve in Violet

            // Text titles and Y-axis limits labels
            ctx.fillStyle = '#64748b';
            ctx.font = '600 8.5px "Inter", sans-serif';
            ctx.fillText(title, gx1 + 8, gy1 + 14);

            // Min and Max Y-axis bounds markings
            ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
            ctx.font = '500 7.5px "Fira Code", monospace';
            ctx.fillText(valMax.toFixed(1), gx1 + 6, gy1 + 25);
            ctx.fillText(valMin.toFixed(1), gx1 + 6, gy2 - 6);
        }
    }

    // 3. Chapter Declarative Subclass
    class RectilinearChapter extends window.PhysicsLab.BaseChapter {
        constructor() {
            super('rectilinear', 'Mechanics: Rectilinear 1D', 'Compare Uniform Accelerated Motion (Track 1) and Non-Uniform Variable Accelerated Motion (Track 2) side-by-side.', 'Mechanics Sandbox');
            
            this.launchBtnText = 'Run Simulation';
            this.hasPauseControl = true;

            // Dynamic controls registry schemas
            this.controls = [
                {
                    id: 'speedSlider',
                    type: 'range',
                    label: 'Initial Velocity ($u$):',
                    min: -20,
                    max: 40,
                    value: 0,
                    step: 1,
                    unit: ' m/s',
                    ticks: ['-20', '0 (Rest)', '40 m/s']
                },
                {
                    id: 'constAccSlider',
                    type: 'range',
                    label: 'Track 1 Const Accel ($a$):',
                    min: -10,
                    max: 10,
                    value: 2,
                    step: 0.5,
                    unit: ' m/s²',
                    ticks: ['-10', '0 (Zero)', '10 m/s²']
                },
                {
                    id: 'varAccSelect',
                    type: 'select',
                    label: 'Track 2 Accel Mode ($a(t, v)$):',
                    value: 'kt',
                    options: [
                        { value: 'kt', label: 'Time-dependent (a = k * t)' },
                        { value: 'kv', label: 'Velocity drag (a = -k * v)' }
                    ]
                },
                {
                    id: 'varKSlider',
                    type: 'range',
                    label: 'Track 2 Constant ($k$):',
                    min: 0.1,
                    max: 5.0,
                    value: 0.5,
                    step: 0.1,
                    unit: '',
                    ticks: ['0.1 (Low)', '2.5', '5.0 (High)']
                }
            ];

            // Dashboard aggregate summary telemetry cards
            this.telemetry = [
                { id: 'metricTime', label: 'Simulation Time (t)', unit: 's', value: '0.00', color: 'amber' },
                { id: 'metricPosDiff', label: 'Separation (Δx)', unit: 'm', value: '0.00', color: 'emerald' },
                { id: 'metricVelDiff', label: 'Velocity Diff (Δv)', unit: 'm/s', value: '0.00', color: 'indigo' }
            ];

            // Instantaneous inspector cards
            this.inspectorTitle = 'Live Telemetry Readings';
            this.inspectorTelemetry = [
                { id: 'metricPos1', label: 'Track 1 Position ($x_1$)', unit: 'm', value: '0.00', color: 'cyan' },
                { id: 'metricPos2', label: 'Track 2 Position ($x_2$)', unit: 'm', value: '0.00', color: 'violet' },
                { id: 'metricVel1', label: 'Track 1 Velocity ($v_1$)', unit: 'm/s', value: '0.00', color: 'cyan' },
                { id: 'metricVel2', label: 'Track 2 Velocity ($v_2$)', unit: 'm/s', value: '0.00', color: 'violet' },
                { id: 'metricAcc1', label: 'Track 1 Accel ($a_1$)', unit: 'm/s²', value: '0.00', color: 'cyan' },
                { id: 'metricAcc2', label: 'Track 2 Accel ($a_2$)', unit: 'm/s²', value: '0.00', color: 'violet' }
            ];
        }

        createEngine(canvasId) {
            return new RectilinearEngine(canvasId);
        }

        init(engine) {
            super.init(engine);
            engine.showGrid = false; // Custom tracks have their own graduation lines
            engine.showGround = false;
            
            // Build initial static snapshot
            this.launch(engine);
            engine.isPlaying = false; // Freeze simulation on initial startup
        }

        launch(engine) {
            engine.clear();

            const u = parseFloat(this.getControlVal('speedSlider'));
            const a1 = parseFloat(this.getControlVal('constAccSlider'));
            const mode = this.getControlVal('varAccSelect');
            const k = parseFloat(this.getControlVal('varKSlider'));

            const body1 = new RectilinearBody('track1', 'constant', u, a1);
            const body2 = new RectilinearBody('track2', 'variable', u, k, mode);

            engine.addEntity(body1);
            engine.addEntity(body2);

            engine.startSimulation();
        }

        onControlChange(controlId, value, engine) {
            // Interactive sandbox: immediately rebuild physical bodies on any parameter slides
            this.launch(engine);
            engine.isPlaying = false; // Freeze so users can inspect static starting positions
            this.updateDashboard(engine, false);
            engine.render();
        }

        updateDashboard(engine, isLive) {
            const body1 = engine.entities[0];
            const body2 = engine.entities[1];

            // Selector cards caching
            const mTime = document.getElementById('metricTime');
            const mPosDiff = document.getElementById('metricPosDiff');
            const mVelDiff = document.getElementById('metricVelDiff');

            const mPos1 = document.getElementById('metricPos1');
            const mPos2 = document.getElementById('metricPos2');
            const mVel1 = document.getElementById('metricVel1');
            const mVel2 = document.getElementById('metricVel2');
            const mAcc1 = document.getElementById('metricAcc1');
            const mAcc2 = document.getElementById('metricAcc2');

            if (body1 && body2) {
                const t = Math.max(body1.timeElapsed, body2.timeElapsed);
                const posDiff = Math.abs(body1.pos - body2.pos);
                const velDiff = Math.abs(body1.vel - body2.vel);

                if (mTime) mTime.textContent = t.toFixed(2);
                if (mPosDiff) mPosDiff.textContent = posDiff.toFixed(2);
                if (mVelDiff) mVelDiff.textContent = velDiff.toFixed(2);

                if (mPos1) mPos1.textContent = body1.pos.toFixed(2);
                if (mPos2) mPos2.textContent = body2.pos.toFixed(2);
                
                if (mVel1) mVel1.textContent = body1.vel.toFixed(2);
                if (mVel2) mVel2.textContent = body2.vel.toFixed(2);
                
                if (mAcc1) mAcc1.textContent = body1.acc.toFixed(2);
                if (mAcc2) mAcc2.textContent = body2.acc.toFixed(2);
            }
        }

        getControlVal(controlId) {
            const el = document.getElementById(controlId);
            if (!el) {
                const schema = this.controls.find(c => c.id === controlId);
                return schema ? schema.value : null;
            }
            if (el.type === 'checkbox') return el.checked;
            return el.value;
        }
    }

    // Register Rectilinear Chapter to window.PhysicsLab global namespace
    window.PhysicsLab.registerChapter('rectilinear', new RectilinearChapter());
})();
