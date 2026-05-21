/**
 * Visual Physics - Projectile Motion Chapter Module
 * Self-contained chapter implementing 2D Kinematics and registry schemas.
 */

(function() {
    const Vector2D = window.PhysicsLab.Vector2D;

    // 1. Projectile Entity (isolated closure)
    class ProjectileEntity {
        constructor(u, angleDegrees, g, showVectors) {
            this.u = u;
            this.angle = angleDegrees;
            this.gravity = g;
            this.showVectors = showVectors;
            
            const theta = (angleDegrees * Math.PI) / 180;
            
            this.pos = new Vector2D(0, 0);
            this.vel = new Vector2D(u * Math.cos(theta), u * Math.sin(theta));
            
            this.isActive = true;
            this.timeElapsed = 0;
            this.maxHeight = 0;
            
            this.trail = [];
            this.trailCap = 250;
            
            this.colorMain = '#06b6d4'; 
            this.colorTrail = 'rgba(245, 158, 11, 0.7)'; 
        }

        update(dt, engine) {
            if (!this.isActive) return;

            this.trail.push(this.pos.copy());
            if (this.trail.length > this.trailCap) {
                this.trail.shift();
            }

            if (this.pos.y > this.maxHeight) {
                this.maxHeight = this.pos.y;
            }

            // Equations of motion
            this.vel.y -= this.gravity * dt;
            this.pos.x += this.vel.x * dt;
            this.pos.y += this.vel.y * dt;
            this.timeElapsed += dt;

            // Collision (ground is y = 0)
            if (this.pos.y <= 0 && this.vel.y < 0) {
                this.pos.y = 0;
                this.isActive = false;
                this.vel.set(0, 0);
                
                this.rangeReached = this.pos.x;
                this.landingTime = this.timeElapsed;
            }
        }

        draw(ctx, engine) {
            // Draw parabolic path trail
            if (this.trail.length > 1) {
                ctx.beginPath();
                const startPt = this.trail[0];
                ctx.moveTo(engine.toScreenX(startPt.x), engine.toScreenY(startPt.y));
                
                for (let i = 1; i < this.trail.length; i++) {
                    const pt = this.trail[i];
                    ctx.lineTo(engine.toScreenX(pt.x), engine.toScreenY(pt.y));
                }
                ctx.lineTo(engine.toScreenX(this.pos.x), engine.toScreenY(this.pos.y));
                
                ctx.strokeStyle = this.colorTrail;
                ctx.lineWidth = 2.5;
                ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
                ctx.shadowBlur = 6;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            const sx = engine.toScreenX(this.pos.x);
            const sy = engine.toScreenY(this.pos.y);

            // Vector component arrows
            if (this.isActive && this.showVectors) {
                const vectorScale = 0.8;
                
                const vxLength = this.vel.x * vectorScale * engine.scale;
                engine.drawArrow(ctx, sx, sy, sx + vxLength, sy, '#10b981', 2.5, 'Vx');
                
                const vyLength = -this.vel.y * vectorScale * engine.scale;
                engine.drawArrow(ctx, sx, sy, sx, sy + vyLength, '#8b5cf6', 2.5, 'Vy');

                const rxLength = this.vel.x * vectorScale * engine.scale;
                const ryLength = -this.vel.y * vectorScale * engine.scale;
                engine.drawArrow(ctx, sx, sy, sx + rxLength, sy + ryLength, '#06b6d4', 3.5, 'V');
            }

            // Draw paused projection halo
            const isPaused = this.isActive && !engine.isPlaying && this.timeElapsed > 0;
            if (isPaused) {
                const groundY = engine.toScreenY(0);
                const originX = engine.originOffset.x;

                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1.2;

                ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx, groundY);
                ctx.stroke();

                ctx.fillStyle = '#f59e0b';
                ctx.font = '600 10px "Fira Code", monospace';
                ctx.fillText(`y = ${this.pos.y.toFixed(2)}m`, sx + 8, (sy + groundY) / 2);

                ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(originX, sy);
                ctx.stroke();

                ctx.fillStyle = '#06b6d4';
                ctx.fillText(`x = ${this.pos.x.toFixed(2)}m`, (sx + originX) / 2 - 20, sy - 8);

                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(sx, sy, 14, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }

            // Draw particle orb
            ctx.beginPath();
            ctx.arc(sx, sy, 7, 0, Math.PI * 2);
            
            const radialGrad = ctx.createRadialGradient(sx - 2, sy - 2, 1, sx, sy, 7);
            radialGrad.addColorStop(0, '#ffffff');
            radialGrad.addColorStop(0.3, '#22d3ee');
            radialGrad.addColorStop(1, '#0891b2');
            
            ctx.fillStyle = radialGrad;
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0; 
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }

    // 2. Chapter Subclass
    class ProjectileChapter extends window.PhysicsLab.BaseChapter {
        constructor() {
            super('mechanics', 'Kinematics: 2D Projectile Motion', 'Observe how independent horizontal and vertical velocities compose standard parabolic trajectories.', 'Mechanics Sandbox');
            
            // Declarative UI Sliders
            this.controls = [
                {
                    id: 'speedSlider',
                    type: 'range',
                    label: 'Initial Velocity ($u$):',
                    min: 10,
                    max: 50,
                    value: 25,
                    step: 1,
                    unit: 'm/s',
                    ticks: ['10 m/s', '30 m/s', '50 m/s']
                },
                {
                    id: 'angleSlider',
                    type: 'range',
                    label: 'Launch Angle ($\\theta$):',
                    min: 5,
                    max: 85,
                    value: 45,
                    step: 1,
                    unit: '°',
                    ticks: ['5°', '45°', '85°']
                },
                {
                    id: 'gravitySlider',
                    type: 'range',
                    label: 'Acceleration ($g$):',
                    min: 1.6,
                    max: 25,
                    value: 9.8,
                    step: 0.1,
                    unit: 'm/s²',
                    ticks: ['1.6 (Moon)', '9.8 (Earth)', '25.0 (Heavy)']
                },
                {
                    id: 'vectorToggle',
                    type: 'checkbox',
                    label: 'Show Vector Component Arrows',
                    value: true
                }
            ];

            // Declarative Dashboard Metrics
            this.telemetry = [
                { id: 'metricRange', label: 'Theoretical Range (R)', unit: 'm', value: '0.00', color: 'emerald' },
                { id: 'metricHeight', label: 'Max Height (H)', unit: 'm', value: '0.00', color: 'violet' },
                { id: 'metricTime', label: 'Time of Flight (T)', unit: 's', value: '0.00', color: 'amber' }
            ];

            // Live Vector Inspector widgets
            this.inspectorTitle = 'Live Telemetry Readings';
            this.inspectorTelemetry = [
                { id: 'metricTimeElapsed', label: 'Time Elapsed ($t$)', unit: 's', value: '0.00', color: 'main' },
                { id: 'metricPos', label: 'Position ($x, y$)', unit: 'm', value: '0.00, 0.00', color: 'cyan' },
                { id: 'metricSpeed', label: 'Instant Speed ($v$)', unit: 'm/s', value: '0.00', color: 'indigo' },
                { id: 'metricVecAngle', label: 'Vector Angle ($\\theta_v$)', unit: '°', value: '0.00', color: 'rose' },
                { id: 'metricVx', label: 'Horizontal ($v_x$)', unit: 'm/s', value: '0.00', color: 'emerald' },
                { id: 'metricVy', label: 'Vertical ($v_y$)', unit: 'm/s', value: '0.00', color: 'violet' }
            ];

            // Declarative Time Solver Panel
            this.hasSolver = true;
            this.solverTitle = 'Theoretical Time Solver';
            this.solverSubtitle = 'Evaluate exact kinematics at any timestamp';
            this.solverUnit = 's';
            this.solverLabel = 'Target Time ($t$):';
            this.solverRange = { min: 0, max: 1.0, step: 0.01, value: 0 };
            this.solverTelemetry = [
                { id: 'solverPos', label: 'Position ($x, y$)', unit: 'm', value: '0.00, 0.00', color: 'cyan' },
                { id: 'solverSpeed', label: 'Velocity ($v$)', unit: 'm/s', value: '0.00', color: 'indigo' },
                { id: 'solverAngle', label: 'Vector Angle ($\\theta_v$)', unit: '°', value: '0.00', color: 'rose' }
            ];

            this.ghostState = null;
        }

        init(engine) {
            super.init(engine);
            engine.showGrid = true;
            engine.showGround = true;
            engine.showLauncher = true;
            engine.launcherOrigin.set(0, 0);

            this.recalibrateZoom(engine);
        }

        predictTrajectory(u, angleDegrees, g) {
            const theta = (angleDegrees * Math.PI) / 180;
            const range = (u * u * Math.sin(2 * theta)) / g;
            const height = (u * u * Math.sin(theta) * Math.sin(theta)) / (2 * g);
            const time = (2 * u * Math.sin(theta)) / g;
            return { range, height, time };
        }

        recalibrateZoom(engine) {
            const speed = parseFloat(this.getControlVal('speedSlider'));
            const angle = parseFloat(this.getControlVal('angleSlider'));
            const gravity = parseFloat(this.getControlVal('gravitySlider'));
            
            const predicted = this.predictTrajectory(speed, angle, gravity);
            engine.autoScale(predicted.range, predicted.height);

            // Solver range updates
            const solverInput = document.getElementById('timeSolverInput');
            if (solverInput) {
                solverInput.max = predicted.time.toString();
                solverInput.step = (predicted.time / 100).toString();
                if (parseFloat(solverInput.value) > predicted.time) {
                    solverInput.value = "0";
                }
            }
            this.updateSolverState(parseFloat(solverInput ? solverInput.value : 0), engine);
        }

        updateSolverState(t, engine) {
            const speed = parseFloat(this.getControlVal('speedSlider'));
            const angle = parseFloat(this.getControlVal('angleSlider'));
            const gravity = parseFloat(this.getControlVal('gravitySlider'));
            
            const theta = (angle * Math.PI) / 180;
            
            const x = speed * Math.cos(theta) * t;
            const y = Math.max(0, speed * Math.sin(theta) * t - 0.5 * gravity * t * t);
            
            const vx = speed * Math.cos(theta);
            const vy = speed * Math.sin(theta) - gravity * t;
            const s = Math.sqrt(vx * vx + vy * vy);
            const a = Math.atan2(vy, vx) * 180 / Math.PI;

            this.ghostState = { x, y, vx, vy, speed: s, angle: a, t };
            this.syncSolverTelemetry(x, y, s, a, t);
        }

        syncSolverTelemetry(x, y, s, a, t) {
            const solverTimeVal = document.getElementById('solverTimeVal');
            if (solverTimeVal) solverTimeVal.textContent = t.toFixed(2);
            
            const sPos = document.getElementById('solverPos');
            if (sPos) sPos.textContent = `${x.toFixed(2)}, ${y.toFixed(2)}`;
            
            const sSpd = document.getElementById('solverSpeed');
            if (sSpd) sSpd.textContent = s.toFixed(2);
            
            const sAng = document.getElementById('solverAngle');
            if (sAng) sAng.textContent = a.toFixed(2);
        }

        onControlChange(controlId, value, engine) {
            this.recalibrateZoom(engine);
            this.updateDashboard(engine, false);
            engine.render();
        }

        onSolverChange(value, engine) {
            this.updateSolverState(value, engine);
            engine.render();
        }

        launch(engine) {
            engine.clear();
            this.recalibrateZoom(engine);
            
            const speed = parseFloat(this.getControlVal('speedSlider'));
            const angle = parseFloat(this.getControlVal('angleSlider'));
            const gravity = parseFloat(this.getControlVal('gravitySlider'));
            const showVectors = this.getControlVal('vectorToggle');

            const projectile = new ProjectileEntity(speed, angle, gravity, showVectors);
            engine.addEntity(projectile);
            
            const solverInput = document.getElementById('timeSolverInput');
            if (solverInput) {
                solverInput.value = "0";
                this.updateSolverState(0, engine);
            }

            engine.startSimulation();
        }

        updateDashboard(engine, isLive) {
            const activeProj = engine.entities[0];
            
            const mRange = document.getElementById('metricRange');
            const mHeight = document.getElementById('metricHeight');
            const mTime = document.getElementById('metricTime');
            
            const mTimeElapsed = document.getElementById('metricTimeElapsed');
            const mPos = document.getElementById('metricPos');
            const mSpeed = document.getElementById('metricSpeed');
            const mVecAngle = document.getElementById('metricVecAngle');
            const mVx = document.getElementById('metricVx');
            const mVy = document.getElementById('metricVy');

            if (isLive && activeProj) {
                if (mRange) mRange.textContent = activeProj.pos.x.toFixed(2);
                if (mHeight) mHeight.textContent = activeProj.maxHeight.toFixed(2);
                if (mTime) mTime.textContent = activeProj.timeElapsed.toFixed(2);

                if (mTimeElapsed) mTimeElapsed.textContent = activeProj.timeElapsed.toFixed(2);
                if (mPos) mPos.textContent = `${activeProj.pos.x.toFixed(2)}, ${activeProj.pos.y.toFixed(2)}`;
                if (mSpeed) mSpeed.textContent = activeProj.vel.mag().toFixed(2);
                
                const liveAngle = Math.atan2(activeProj.vel.y, activeProj.vel.x) * 180 / Math.PI;
                if (mVecAngle) mVecAngle.textContent = liveAngle.toFixed(2);
                if (mVx) mVx.textContent = activeProj.vel.x.toFixed(2);
                if (mVy) mVy.textContent = activeProj.vel.y.toFixed(2);

                this.setTelemetryActiveStyle(true);
            } else {
                const speed = parseFloat(this.getControlVal('speedSlider'));
                const angle = parseFloat(this.getControlVal('angleSlider'));
                const gravity = parseFloat(this.getControlVal('gravitySlider'));
                
                const pred = this.predictTrajectory(speed, angle, gravity);
                
                if (mRange) mRange.textContent = pred.range.toFixed(2);
                if (mHeight) mHeight.textContent = pred.height.toFixed(2);
                if (mTime) mTime.textContent = pred.time.toFixed(2);

                const theta = (angle * Math.PI) / 180;
                if (mTimeElapsed) mTimeElapsed.textContent = "0.00";
                if (mPos) mPos.textContent = "0.00, 0.00";
                if (mSpeed) mSpeed.textContent = speed.toFixed(2);
                if (mVecAngle) mVecAngle.textContent = angle.toFixed(2);
                if (mVx) mVx.textContent = (speed * Math.cos(theta)).toFixed(2);
                if (mVy) mVy.textContent = (speed * Math.sin(theta)).toFixed(2);

                this.setTelemetryActiveStyle(false);
            }
        }

        setTelemetryActiveStyle(isActive) {
            const cards = ['metric-range-card', 'metric-height-card', 'metric-time-card'];
            cards.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (isActive) {
                        el.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                        el.style.background = 'rgba(6, 182, 212, 0.03)';
                    } else {
                        el.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                        el.style.background = 'rgba(255, 255, 255, 0.02)';
                    }
                }
            });
        }

        drawOverlay(ctx, engine) {
            if (!this.ghostState || engine.isPlaying) return;

            const gp = this.ghostState;
            const sx = engine.toScreenX(gp.x);
            const sy = engine.toScreenY(gp.y);
            
            if (gp.y < 0) return;

            ctx.save();
            
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)'; 
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(sx, sy, 7, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
            ctx.beginPath();
            ctx.arc(sx, sy, 12, 0, Math.PI * 2);
            ctx.stroke();
            
            const groundY = engine.toScreenY(0);
            const originX = engine.originOffset.x;
            
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, groundY);
            ctx.moveTo(sx, sy);
            ctx.lineTo(originX, sy);
            ctx.stroke();
            
            const vectorScale = 0.8;
            const vxLength = gp.vx * vectorScale * engine.scale;
            const vyLength = -gp.vy * vectorScale * engine.scale; 
            
            engine.drawDashedArrow(ctx, sx, sy, sx + vxLength, sy, 'rgba(16, 185, 129, 0.55)', 1.5, `v_x`);
            engine.drawDashedArrow(ctx, sx, sy, sx, sy + vyLength, 'rgba(139, 92, 246, 0.55)', 1.5, `v_y`);
            engine.drawDashedArrow(ctx, sx, sy, sx + vxLength, sy + vyLength, 'rgba(244, 63, 94, 0.75)', 2.2, `v (${gp.angle.toFixed(1)}°)`);
            
            ctx.fillStyle = '#f43f5e';
            ctx.font = '700 9px "Fira Code", monospace';
            ctx.fillText(`t = ${gp.t.toFixed(2)}s`, sx + 8, sy - 8);
            
            ctx.restore();
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

    // Register chapter
    window.PhysicsLab.registerChapter('mechanics', new ProjectileChapter());
})();
