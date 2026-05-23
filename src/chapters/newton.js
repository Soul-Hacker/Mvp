/**
 * Visual Physics - Newton's Laws of Motion Chapter Module
 * Self-contained chapter implementing the three laws of motion, tension, pulleys, and spring force.
 */

(function() {
    const Vector2D = window.PhysicsLab.Vector2D;

    // ==========================================
    // 1. Scenario Physics Entities
    // ==========================================

    // Scenario 1: Inertia glider
    class InertiaBlockEntity {
        constructor(m, initialImpulse, mu) {
            this.mass = m;
            this.initialImpulse = initialImpulse;
            this.mu = mu;
            
            this.pos = new Vector2D(2, 1.5); // Start at x=2m, y=1.5m (on plank)
            this.vel = new Vector2D(0, 0);
            this.acc = new Vector2D(0, 0);
            
            this.isActive = true;
            this.timeElapsed = 0;
            this.trail = [];
            this.impulseApplied = false;
            this.impulseDuration = 0.25; // 0.25 seconds of initial force push
            
            // Forces for telemetry
            this.F_applied = 0;
            this.F_friction = 0;
            this.F_normal = this.mass * 9.8;
            this.F_gravity = this.mass * 9.8;
        }

        update(dt, engine) {
            if (!this.isActive) return;

            this.timeElapsed += dt;

            // Compute applied force (impulse phase)
            if (this.timeElapsed <= this.impulseDuration) {
                // Apply a strong initial force to accelerate the glider
                this.F_applied = this.initialImpulse;
            } else {
                this.F_applied = 0;
            }

            // Normal and gravity
            this.F_normal = this.mass * 9.8;
            this.F_gravity = this.mass * 9.8;

            // Friction force: f_k = mu * N
            const g = 9.8;
            const N = this.mass * g;
            if (this.vel.x > 0.05) {
                this.F_friction = this.mu * N;
            } else if (this.vel.x < -0.05) {
                this.F_friction = -this.mu * N;
            } else {
                this.F_friction = 0;
            }

            // Net force: F_net = F_applied - F_friction
            let netForce = this.F_applied;
            if (this.vel.x > 0.05) {
                netForce -= this.F_friction;
            } else if (this.vel.x < -0.05) {
                netForce += this.F_friction;
            } else if (this.F_applied > this.mu * N) {
                netForce -= this.mu * N;
            } else if (this.F_applied < -this.mu * N) {
                netForce += this.mu * N;
            } else {
                netForce = 0;
                if (this.timeElapsed > this.impulseDuration) {
                    this.vel.x = 0;
                }
            }

            // Acceleration: a = F_net / m
            this.acc.x = netForce / this.mass;

            // Update equations
            this.vel.x += this.acc.x * dt;
            this.pos.x += this.vel.x * dt;

            // Keep track of trail
            this.trail.push(this.pos.copy());
            if (this.trail.length > 150) this.trail.shift();

            // Boundaries: stop at edge
            if (this.pos.x > 32 || this.pos.x < 0.5) {
                this.isActive = false;
                this.vel.set(0, 0);
                this.acc.set(0, 0);
            }
        }

        draw(ctx, engine) {
            const size = 1.6 + 0.05 * this.mass;
            const sx = engine.toScreenX(this.pos.x - size / 2);
            const sy = engine.toScreenY(this.pos.y + size);
            const sw = size * engine.scale;
            const sh = size * engine.scale;

            // Draw sliding surface trail
            if (this.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(engine.toScreenX(this.trail[0].x), engine.toScreenY(this.pos.y));
                for (let i = 1; i < this.trail.length; i++) {
                    ctx.lineTo(engine.toScreenX(this.trail[i].x), engine.toScreenY(this.pos.y));
                }
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
                ctx.lineWidth = 4;
                ctx.stroke();
            }

            // Draw Block
            ctx.save();
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            
            // Glassmorphic block style
            ctx.shadowColor = '#6366f1';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(sx, sy, sw, sh, 8);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Label mass
            ctx.fillStyle = '#f8fafc';
            ctx.font = '600 11px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.mass.toFixed(1)}kg`, sx + sw / 2, sy + sh / 2 + 4);
            ctx.restore();

            // Center of Mass for vectors
            const cx = sx + sw / 2;
            const cy = sy + sh / 2;

            // Draw Vector Forces
            const vScale = 1.5; // Scale force Newton to screen pixels
            
            // Weight (Down) - Blue
            engine.drawArrow(ctx, cx, cy, cx, cy + this.F_gravity * vScale, '#6366f1', 2, 'W = mg');
            // Normal (Up) - Violet
            engine.drawArrow(ctx, cx, cy, cx, cy - this.F_normal * vScale, '#8b5cf6', 2, 'N');

            // Applied push force (Impulse phase) - Emerald
            if (this.F_applied > 0) {
                engine.drawArrow(ctx, cx - sw/2 - 20, cy, cx - sw/2, cy, '#10b981', 3, 'F_app');
            }

            // Friction force (Opposes motion) - Neon Red
            if (Math.abs(this.F_friction) > 0.1 && Math.abs(this.vel.x) > 0.05) {
                const fDir = this.vel.x > 0 ? -1 : 1;
                engine.drawArrow(ctx, cx, cy + sh/2 - 2, cx + fDir * Math.abs(this.F_friction) * vScale, cy + sh/2 - 2, '#f43f5e', 2, 'f_k');
            }
        }
    }

    // Scenario 2: Block on Plank (F = ma)
    class PlankBlockEntity {
        constructor(m, F_app, mu) {
            this.mass = m;
            this.F_applied = F_app;
            this.mu = mu;
            
            this.pos = new Vector2D(1.5, 1.5);
            this.vel = new Vector2D(0, 0);
            this.acc = new Vector2D(0, 0);
            
            this.isActive = true;
            this.timeElapsed = 0;
            
            this.F_normal = this.mass * 9.8;
            this.F_gravity = this.mass * 9.8;
            this.F_friction = 0;
            this.isMoving = false;
        }

        update(dt, engine) {
            if (!this.isActive) return;

            this.timeElapsed += dt;
            const g = 9.8;
            const N = this.mass * g;
            this.F_normal = N;
            this.F_gravity = N;

            // Static/Kinetic friction logic
            const f_limit = this.mu * N;

            if (!this.isMoving) {
                if (Math.abs(this.F_applied) > f_limit) {
                    this.isMoving = true;
                    this.F_friction = f_limit;
                } else {
                    this.F_friction = Math.abs(this.F_applied);
                }
            } else {
                this.F_friction = f_limit;
            }

            if (this.isMoving) {
                const netForce = this.F_applied - this.F_friction;
                this.acc.x = netForce / this.mass;
                this.vel.x += this.acc.x * dt;
                this.pos.x += this.vel.x * dt;
            } else {
                this.acc.x = 0;
                this.vel.x = 0;
            }

            // Boundary
            if (this.pos.x > 32 || this.pos.x < 0.5) {
                this.isActive = false;
                this.vel.set(0, 0);
                this.acc.set(0, 0);
            }
        }

        draw(ctx, engine) {
            const size = 1.5 + 0.05 * this.mass;
            const sx = engine.toScreenX(this.pos.x - size / 2);
            const sy = engine.toScreenY(this.pos.y + size);
            const sw = size * engine.scale;
            const sh = size * engine.scale;

            // Draw Block
            ctx.save();
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(sx, sy, sw, sh, 8);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Text info
            ctx.fillStyle = '#f8fafc';
            ctx.font = '600 11px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.mass.toFixed(1)}kg`, sx + sw / 2, sy + sh / 2 + 4);
            ctx.restore();

            const cx = sx + sw / 2;
            const cy = sy + sh / 2;
            const vScale = 1.5;

            // 1. Gravity Vector (Down)
            engine.drawArrow(ctx, cx, cy, cx, cy + this.F_gravity * vScale, '#6366f1', 2, 'W = mg');
            // 2. Normal Force Vector (Up)
            engine.drawArrow(ctx, cx, cy, cx, cy - this.F_normal * vScale, '#8b5cf6', 2, 'N');
            
            // 3. Applied Pulling Force (Right)
            if (this.F_applied > 0) {
                engine.drawArrow(ctx, cx, cy, cx + this.F_applied * vScale, cy, '#10b981', 3, 'F_app');
            }

            // 4. Friction Force Vector (Left)
            if (this.F_friction > 0.1) {
                engine.drawArrow(ctx, cx, cy + sh/2 - 2, cx - this.F_friction * vScale, cy + sh/2 - 2, '#f43f5e', 2.5, 'f');
            }
        }
    }

    // Scenario 3: Action-Reaction (Newton's 3rd Law)
    class ContactBlocksEntity {
        constructor(mA, mB, F_app, mu) {
            this.massA = mA;
            this.massB = mB;
            this.F_applied = F_app;
            this.mu = mu;
            
            this.posA = new Vector2D(1.5, 1.5);
            this.vel = new Vector2D(0, 0);
            this.acc = new Vector2D(0, 0);
            
            this.isActive = true;
            this.timeElapsed = 0;
            this.isMoving = false;
            
            // Newton 3rd Law details
            this.F_contact = 0;
            this.F_frictionTotal = 0;
        }

        update(dt, engine) {
            if (!this.isActive) return;

            this.timeElapsed += dt;
            const g = 9.8;
            const f_limitA = this.mu * this.massA * g;
            const f_limitB = this.mu * this.massB * g;
            const f_limitTotal = f_limitA + f_limitB;

            this.F_frictionTotal = f_limitTotal;

            if (!this.isMoving) {
                if (this.F_applied > f_limitTotal) {
                    this.isMoving = true;
                }
            }

            if (this.isMoving) {
                // Acceleration of both blocks together
                const netForce = this.F_applied - f_limitTotal;
                this.acc.x = netForce / (this.massA + this.massB);
                
                // Solve for reaction force: F_contact - f_limitB = mB * a
                this.F_contact = this.massB * this.acc.x + f_limitB;
                
                this.vel.x += this.acc.x * dt;
                this.posA.x += this.vel.x * dt;
            } else {
                this.acc.x = 0;
                this.vel.x = 0;
                if (this.F_applied > f_limitA) {
                    this.F_contact = this.F_applied - f_limitA;
                } else {
                    this.F_contact = 0;
                }
            }

            // Boundary
            const sizeA = 1.3 + 0.04 * this.massA;
            const sizeB = 1.3 + 0.04 * this.massB;
            if (this.posA.x + sizeA + sizeB > 32) {
                this.isActive = false;
                this.vel.set(0, 0);
                this.acc.set(0, 0);
            }
        }

        draw(ctx, engine) {
            const sizeA = 1.3 + 0.04 * this.massA;
            const sizeB = 1.3 + 0.04 * this.massB;

            const xA = this.posA.x;
            const xB = xA + sizeA; // Placed side-by-side in contact

            const sxA = engine.toScreenX(xA - sizeA / 2);
            const syA = engine.toScreenY(1.5 + sizeA);
            const swA = sizeA * engine.scale;
            const shA = sizeA * engine.scale;

            const sxB = engine.toScreenX(xB - sizeB / 2);
            const syB = engine.toScreenY(1.5 + sizeB);
            const swB = sizeB * engine.scale;
            const shB = sizeB * engine.scale;

            ctx.save();

            // 1. Draw Block A (Indigo/Emerald highlights)
            ctx.fillStyle = '#1e1b4b';
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(sxA, syA, swA, shA, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.font = '700 10px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`A`, sxA + swA / 2, syA + 16);
            ctx.fillText(`${this.massA.toFixed(1)}kg`, sxA + swA / 2, syA + shA / 2 + 6);

            // 2. Draw Block B
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(sxB, syB, swB, shB, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.fillText(`B`, sxB + swB / 2, syB + 16);
            ctx.fillText(`${this.massB.toFixed(1)}kg`, sxB + swB / 2, syB + shB / 2 + 6);

            ctx.restore();

            // Force vector overlays
            const cy = syA + shA / 2; // Approximate center height
            const boundaryX = engine.toScreenX(xB - sizeB / 2); // Exact interface coordinate
            const vScale = 1.8;

            // Continuous Applied Push on Box A
            if (this.F_applied > 0) {
                engine.drawArrow(ctx, sxA - 30, cy, sxA, cy, '#10b981', 3.5, 'F_app');
            }

            // Contact Action-Reaction pair
            if (this.F_contact > 0.1) {
                // Action: A pushes B (starts at contact boundary, goes right)
                engine.drawArrow(ctx, boundaryX, cy - 10, boundaryX + this.F_contact * vScale, cy - 10, '#a855f7', 2.5, 'F_A→B');
                
                // Reaction: B pushes back on A (starts at contact boundary, goes left)
                engine.drawArrow(ctx, boundaryX, cy + 10, boundaryX - this.F_contact * vScale, cy + 10, '#f43f5e', 2.5, 'F_B→A');
            }
        }
    }

    // Scenario 4: Tension & Pulley (Atwood Machine)
    class PulleySystemEntity {
        constructor(m1, m2) {
            this.mass1 = m1; // Left mass
            this.mass2 = m2; // Right mass
            
            this.pulleyPos = new Vector2D(15, 12); // Pulley center at x=15m, y=12m
            this.pulleyRadius = 1.2;
            
            // Heights of masses
            this.y1 = 6;
            this.y2 = 6;
            
            this.vel = 0;
            this.acc = 0;
            this.tension = 0;
            
            this.isActive = true;
            this.timeElapsed = 0;
        }

        update(dt, engine) {
            if (!this.isActive) return;

            this.timeElapsed += dt;
            const g = 9.8;

            // Formulas: a = g * (m2 - m1) / (m1 + m2)
            // T = 2 * m1 * m2 * g / (m1 + m2)
            this.acc = g * (this.mass2 - this.mass1) / (this.mass1 + this.mass2);
            this.tension = (2 * this.mass1 * this.mass2 * g) / (this.mass1 + this.mass2);

            this.vel += this.acc * dt;
            
            // Left block goes up (acc positive is left block going down? No, standard sign is right block going down as positive)
            this.y2 -= this.vel * dt; // Right block moves down when vel is positive
            this.y1 += this.vel * dt; // Left block moves up

            // Boundaries: block hitting pulley or ground
            if (this.y1 <= 1.0 || this.y2 <= 1.0 || this.y1 >= this.pulleyPos.y - 1.5 || this.y2 >= this.pulleyPos.y - 1.5) {
                this.isActive = false;
                this.vel = 0;
                this.acc = 0;
            }
        }

        draw(ctx, engine) {
            const px = engine.toScreenX(this.pulleyPos.x);
            const py = engine.toScreenY(this.pulleyPos.y);
            const pr = this.pulleyRadius * engine.scale;

            const size1 = 1.0 + 0.05 * this.mass1;
            const size2 = 1.0 + 0.05 * this.mass2;

            const x1 = this.pulleyPos.x - this.pulleyRadius;
            const x2 = this.pulleyPos.x + this.pulleyRadius;

            const sx1 = engine.toScreenX(x1);
            const sy1 = engine.toScreenY(this.y1);
            const sw1 = size1 * engine.scale;
            const sh1 = size1 * engine.scale;

            const sx2 = engine.toScreenX(x2);
            const sy2 = engine.toScreenY(this.y2);
            const sw2 = size2 * engine.scale;
            const sh2 = size2 * engine.scale;

            ctx.save();

            // 1. Draw Pulley support and wheel
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px, engine.toScreenY(this.pulleyPos.y + 2.5));
            ctx.stroke();

            // Pulley Wheel body
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw central pivot
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();

            // 2. Draw Strings
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.5;
            
            // Left String
            ctx.beginPath();
            ctx.moveTo(engine.toScreenX(x1), py);
            ctx.lineTo(engine.toScreenX(x1), sy1);
            ctx.stroke();

            // Right String
            ctx.beginPath();
            ctx.moveTo(engine.toScreenX(x2), py);
            ctx.lineTo(engine.toScreenX(x2), sy2);
            ctx.stroke();

            // 3. Draw Left Hanging Block (m1)
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#f59e0b'; // Amber
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.roundRect(sx1 - sw1/2, sy1, sw1, sh1, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.font = '600 10px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.mass1.toFixed(1)}kg`, sx1, sy1 + sh1/2 + 4);

            // 4. Draw Right Hanging Block (m2)
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#10b981'; // Emerald
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.roundRect(sx2 - sw2/2, sy2, sw2, sh2, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.fillText(`${this.mass2.toFixed(1)}kg`, sx2, sy2 + sh2/2 + 4);

            ctx.restore();

            // Draw Force Vectors
            const vScale = 1.6;

            // Box 1 Vectors (Tension Up, Gravity Down)
            const cy1 = sy1 + sh1/2;
            engine.drawArrow(ctx, sx1, cy1, sx1, cy1 - this.tension * vScale, '#06b6d4', 2.2, 'T');
            engine.drawArrow(ctx, sx1, cy1, sx1, cy1 + this.mass1 * 9.8 * vScale, '#6366f1', 2, 'W₁');

            // Box 2 Vectors (Tension Up, Gravity Down)
            const cy2 = sy2 + sh2/2;
            engine.drawArrow(ctx, sx2, cy2, sx2, cy2 - this.tension * vScale, '#06b6d4', 2.2, 'T');
            engine.drawArrow(ctx, sx2, cy2, sx2, cy2 + this.mass2 * 9.8 * vScale, '#6366f1', 2, 'W₂');
        }
    }

    // Scenario 5: Hooke's Law Spring-Mass System
    class SpringMassEntity {
        constructor(m, k, x0) {
            this.mass = m;
            this.k = k;
            this.x0 = x0; // Stretched or compressed displacement
            
            this.eqPos = 16.0; // Equilibrium position at x=16m
            this.pos = new Vector2D(this.eqPos + x0, 1.5);
            this.vel = new Vector2D(0, 0);
            this.acc = new Vector2D(0, 0);
            
            this.isActive = true;
            this.timeElapsed = 0;
            
            this.F_spring = 0;
            this.E_kinetic = 0;
            this.E_potential = 0.5 * this.k * this.x0 * this.x0;
            this.E_total = this.E_potential;
        }

        update(dt, engine) {
            if (!this.isActive) return;

            this.timeElapsed += dt;

            // Simple Harmonic Motion analytic step for perfect stability
            const omega = Math.sqrt(this.k / this.mass);
            const x = this.x0 * Math.cos(omega * this.timeElapsed);
            this.vel.x = -this.x0 * omega * Math.sin(omega * this.timeElapsed);
            
            this.pos.x = this.eqPos + x;
            this.F_spring = -this.k * x;
            this.acc.x = this.F_spring / this.mass;

            // Energies
            this.E_kinetic = 0.5 * this.mass * this.vel.x * this.vel.x;
            this.E_potential = 0.5 * this.k * x * x;
            this.E_total = this.E_kinetic + this.E_potential;
        }

        draw(ctx, engine) {
            const size = 1.5;
            const sx = engine.toScreenX(this.pos.x - size / 2);
            const sy = engine.toScreenY(this.pos.y + size);
            const sw = size * engine.scale;
            const sh = size * engine.scale;

            const wallX = engine.toScreenX(6.0); // Support wall at x=6m
            const tableY = engine.toScreenY(1.5);

            ctx.save();

            // 1. Draw Support Wall on Left
            ctx.fillStyle = '#334155';
            ctx.fillRect(wallX - 15, tableY - 120, 15, 120);
            
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(wallX, tableY);
            ctx.lineTo(wallX, tableY - 120);
            ctx.stroke();

            // 2. Draw Coil Spring (zig-zag vector lines)
            ctx.strokeStyle = '#38bdf8'; // Sky blue spring
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            
            const startX = wallX;
            const endX = sx;
            const numCoils = 18;
            ctx.moveTo(startX, sy + sh/2);
            
            const coilDelta = (endX - startX) / numCoils;
            for (let i = 1; i < numCoils; i++) {
                const cx = startX + i * coilDelta;
                const cy = sy + sh/2 + (i % 2 === 0 ? -12 : 12);
                ctx.lineTo(cx, cy);
            }
            ctx.lineTo(endX, sy + sh/2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 3. Draw Block
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(sx, sy, sw, sh, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.font = '600 10px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.mass.toFixed(1)}kg`, sx + sw / 2, sy + sh / 2 + 4);

            // 4. Draw vertical dashed equilibrium reference line
            const eqScreenX = engine.toScreenX(this.eqPos);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(eqScreenX, tableY);
            ctx.lineTo(eqScreenX, tableY - 130);
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 9px "Fira Code", monospace';
            ctx.fillText('Equilibrium', eqScreenX, tableY - 138);

            ctx.restore();

            // Dynamic Force Vector: Restoring Spring Force
            const cx = sx + sw/2;
            const cy = sy + sh/2;
            const vScale = 2.0;

            if (Math.abs(this.F_spring) > 0.5) {
                // Pointing back to equilibrium
                engine.drawArrow(ctx, cx, cy - 10, cx + this.F_spring * vScale, cy - 10, '#ef4444', 2.5, 'F_s = -kx');
            }

            // Draw inline Energy bar graph to WOW the user
            ctx.save();
            const barW = 120;
            const barH = 10;
            const bx = sx + sw/2 - barW/2;
            const by = sy - 30;

            // Kinetic energy bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(bx, by, barW, barH);
            ctx.fillStyle = '#10b981';
            const kFraction = Math.min(1, this.E_kinetic / this.E_total);
            ctx.fillRect(bx, by, barW * kFraction, barH);

            // Potential energy bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(bx, by + 13, barW, barH);
            ctx.fillStyle = '#f97316';
            const pFraction = Math.min(1, this.E_potential / this.E_total);
            ctx.fillRect(bx, by + 13, barW * pFraction, barH);

            ctx.fillStyle = '#10b981';
            ctx.font = '700 8px "Fira Code", monospace';
            ctx.fillText(`KE: ${this.E_kinetic.toFixed(1)}J`, bx - 28, by + 8);

            ctx.fillStyle = '#f97316';
            ctx.fillText(`PE: ${this.E_potential.toFixed(1)}J`, bx - 28, by + 21);

            ctx.restore();
        }
    }

    // ==========================================
    // 2. Main Chapter Controller Class
    // ==========================================
    class NewtonChapter extends window.PhysicsLab.BaseChapter {
        constructor() {
            super('newton', "Newton's Laws of Motion", "Explore the mathematical mechanics of weight, friction, tension, pulleys, and spring restoration.", 'Class 11 Labs');
            
            this.launchBtnText = 'Launch Simulation';
            this.hasPauseControl = true;

            // Declarative control deck containing ALL potential sliders
            this.controls = [
                {
                    id: 'scenarioSelect',
                    type: 'select',
                    label: 'Choose Physics Lab Scenario:',
                    value: 'inertia',
                    options: [
                        { value: 'inertia', label: '1. Inertia & 1st Law (Constant Speed)' },
                        { value: 'mass_on_plank', label: '2. Plank Sandbox (F = ma & 2nd Law)' },
                        { value: 'action_reaction', label: '3. Contact Blocks (3rd Law Reactions)' },
                        { value: 'tension', label: '4. Atwood Machine (String Pulley)' },
                        { value: 'spring', label: '5. Hooke\'s Spring (Simple Harmonic Motion)' }
                    ]
                },
                {
                    id: 'massSlider',
                    type: 'range',
                    label: 'Block Mass ($m$):',
                    min: 1,
                    max: 20,
                    value: 6,
                    step: 0.5,
                    unit: ' kg',
                    ticks: ['1kg', '10kg', '20kg']
                },
                {
                    id: 'mass2Slider',
                    type: 'range',
                    label: 'Block B Mass ($m_B$):',
                    min: 1,
                    max: 20,
                    value: 10,
                    step: 0.5,
                    unit: ' kg',
                    ticks: ['1kg', '10kg', '20kg']
                },
                {
                    id: 'mass1Slider',
                    type: 'range',
                    label: 'Left Mass ($m_1$):',
                    min: 1,
                    max: 20,
                    value: 5,
                    step: 0.5,
                    unit: ' kg',
                    ticks: ['1kg', '10kg', '20kg']
                },
                {
                    id: 'appliedForce',
                    type: 'range',
                    label: 'Continuous Pull Force ($F$):',
                    min: 0,
                    max: 120,
                    value: 40,
                    step: 1,
                    unit: ' N',
                    ticks: ['0N', '60N', '120N']
                },
                {
                    id: 'frictionSlider',
                    type: 'range',
                    label: 'Friction Coefficient ($\\mu$):',
                    min: 0,
                    max: 0.8,
                    value: 0.2,
                    step: 0.02,
                    unit: '',
                    ticks: ['0.00 (Ice)', '0.40', '0.80 (Heavy)']
                },
                {
                    id: 'springKSlider',
                    type: 'range',
                    label: 'Spring Stiffness ($k$):',
                    min: 5,
                    max: 60,
                    value: 25,
                    step: 1,
                    unit: ' N/m',
                    ticks: ['5 N/m', '30 N/m', '60 N/m']
                },
                {
                    id: 'springXSlider',
                    type: 'range',
                    label: 'Extension/Compression ($x_0$):',
                    min: -7,
                    max: 7,
                    value: 5,
                    step: 0.5,
                    unit: ' m',
                    ticks: ['-7m', '0m (Eq)', '7m']
                }
            ];

            // Telemetry Readouts
            this.telemetry = [
                { id: 'netForceCard', label: 'Net Force ($F_{net}$)', unit: 'N', value: '0.00' },
                { id: 'frictionForceCard', label: 'Friction Force ($f$)', unit: 'N', value: '0.00' },
                { id: 'accelerationCard', label: 'Acceleration ($a$)', unit: 'm/s²', value: '0.00' },
                { id: 'velocityCard', label: 'Velocity ($v$)', unit: 'm/s', value: '0.00' },
                { id: 'tensionCard', label: 'String Tension ($T$)', unit: 'N', value: '0.00' },
                { id: 'springForceCard', label: 'Spring Force ($F_s$)', unit: 'N', value: '0.00' },
                { id: 'energyCard', label: 'Total Energy ($E$)', unit: 'J', value: '0.00' }
            ];

            // Instant Inspector metrics
            this.inspectorTitle = 'Live Telemetry Readings';
            this.inspectorTelemetry = [
                { id: 'timeElapsedCard', label: 'Time Elapsed ($t$)', unit: 's', value: '0.00' },
                { id: 'positionCard', label: 'Position ($x$)', unit: 'm', value: '0.00' },
                { id: 'potentialEnergyCard', label: 'Elastic PE ($U$)', unit: 'J', value: '0.00' },
                { id: 'kineticEnergyCard', label: 'Kinetic KE ($K$)', unit: 'J', value: '0.00' },
                { id: 'contactForceCard', label: 'Contact Reaction ($F_c$)', unit: 'N', value: '0.00' }
            ];

            // Theoretical Solver bounds
            this.hasSolver = true;
            this.solverTitle = 'Theoretical Time Solver';
            this.solverSubtitle = 'Compute dynamic coordinates theoretically';
            this.solverUnit = 's';
            this.solverLabel = 'Target Time ($t$):';
            this.solverRange = { min: 0, max: 4.0, step: 'any', value: 0 };
            this.solverTelemetry = [
                { id: 'solverPos', label: 'Solved Position ($x$)', unit: 'm', value: '0.00' },
                { id: 'solverSpeed', label: 'Solved Velocity ($v$)', unit: 'm/s', value: '0.00' },
                { id: 'solverAcc', label: 'Solved Accel ($a$)', unit: 'm/s²', value: '0.00' }
            ];

            this.ghostState = null;
        }

        init(engine) {
            super.init(engine);
            engine.showGrid = true;
            engine.showGround = true;

            // Enforce layout setup dynamically in the DOM
            this.updateUILayout();
            
            // Re-render solver inputs
            const solverInput = document.getElementById('timeSolverInput');
            if (solverInput) {
                solverInput.value = "0";
            }
            this.updateSolverState(0, engine);

            // Establish starting preview body
            this.setupPreview(engine);
            this.updateDashboard(engine, false);
            engine.render();
        }

        // Show/Hide sliders and telemetry cards in the DOM based on active scenario
        updateUILayout() {
            const scenario = this.getControlVal('scenarioSelect') || 'inertia';

            // 1. Sync Control Slider Visibilities
            this.setControlDisplay('massSlider', scenario === 'inertia' || scenario === 'mass_on_plank' || scenario === 'action_reaction' || scenario === 'spring', 
                scenario === 'action_reaction' ? 'Box A Mass ($m_A$):' : 'Block Mass ($m$):');
            this.setControlDisplay('mass2Slider', scenario === 'action_reaction', 'Box B Mass ($m_B$):');
            this.setControlDisplay('mass1Slider', scenario === 'tension', 'Left Mass ($m_1$):');
            this.setControlDisplay('appliedForce', scenario === 'inertia' || scenario === 'mass_on_plank' || scenario === 'action_reaction',
                scenario === 'inertia' ? 'Momentary Push Force ($F_{\\text{push}}$):' : 'Applied Push Force ($F_{app}$):');
            this.setControlDisplay('frictionSlider', scenario === 'inertia' || scenario === 'mass_on_plank' || scenario === 'action_reaction');
            this.setControlDisplay('springKSlider', scenario === 'spring');
            this.setControlDisplay('springXSlider', scenario === 'spring');

            // 2. Sync Dashboard Card Visibilities
            this.setCardDisplay('netForceCard', scenario !== 'tension');
            this.setCardDisplay('frictionForceCard', scenario === 'inertia' || scenario === 'mass_on_plank' || scenario === 'action_reaction');
            this.setCardDisplay('accelerationCard', true);
            this.setCardDisplay('velocityCard', true);
            this.setCardDisplay('tensionCard', scenario === 'tension');
            this.setCardDisplay('springForceCard', scenario === 'spring');
            this.setCardDisplay('energyCard', scenario === 'spring');

            // 3. Sync Inspector Card Visibilities
            this.setCardDisplay('timeElapsedCard', true);
            this.setCardDisplay('positionCard', scenario !== 'tension');
            this.setCardDisplay('potentialEnergyCard', scenario === 'spring');
            this.setCardDisplay('kineticEnergyCard', scenario === 'spring');
            this.setCardDisplay('contactForceCard', scenario === 'action_reaction');

            // Set up Launch button labels
            const launchBtn = document.getElementById('launchBtn');
            if (launchBtn) {
                const btnText = launchBtn.querySelector('span:not(.btn-icon)');
                if (btnText) {
                    btnText.textContent = scenario === 'inertia' ? 'Momentary Impulse' : 'Release Sandbox';
                }
            }
        }

        setControlDisplay(ctrlId, visible, customLabel = null) {
            const ctrl = document.getElementById(ctrlId);
            if (ctrl) {
                const group = ctrl.closest('.control-group') || ctrl.closest('.checkbox-group');
                if (group) {
                    group.style.display = visible ? 'flex' : 'none';
                    if (customLabel) {
                        const label = group.querySelector('label');
                        if (label) label.innerHTML = customLabel;
                    }
                }
            }
        }

        setCardDisplay(cardId, visible) {
            const card = document.getElementById(`${cardId}-card`);
            if (card) {
                card.style.display = visible ? 'flex' : 'none';
            }
        }

        onControlChange(controlId, value, engine) {
            if (controlId === 'scenarioSelect') {
                this.updateUILayout();
            }

            const solverInput = document.getElementById('timeSolverInput');
            if (solverInput) {
                solverInput.value = "0";
            }
            
            this.updateSolverState(0, engine);
            this.setupPreview(engine);
            this.updateDashboard(engine, false);
            engine.render();
        }

        setupPreview(engine) {
            engine.entities = []; // Clear existing
            const scenario = this.getControlVal('scenarioSelect');

            let entity = null;
            if (scenario === 'inertia') {
                const m = parseFloat(this.getControlVal('massSlider'));
                const force = parseFloat(this.getControlVal('appliedForce'));
                const mu = parseFloat(this.getControlVal('frictionSlider'));
                entity = new InertiaBlockEntity(m, force, mu);
                entity.F_gravity = m * 9.8;
                entity.F_normal = m * 9.8;
                entity.F_friction = mu * m * 9.8;
                entity.F_applied = force; 
            } else if (scenario === 'mass_on_plank') {
                const m = parseFloat(this.getControlVal('massSlider'));
                const force = parseFloat(this.getControlVal('appliedForce'));
                const mu = parseFloat(this.getControlVal('frictionSlider'));
                entity = new PlankBlockEntity(m, force, mu);
                entity.F_gravity = m * 9.8;
                entity.F_normal = m * 9.8;
                entity.F_friction = mu * m * 9.8;
            } else if (scenario === 'action_reaction') {
                const mA = parseFloat(this.getControlVal('massSlider'));
                const mB = parseFloat(this.getControlVal('mass2Slider'));
                const force = parseFloat(this.getControlVal('appliedForce'));
                const mu = parseFloat(this.getControlVal('frictionSlider'));
                entity = new ContactBlocksEntity(mA, mB, force, mu);
                entity.F_frictionTotal = mu * (mA + mB) * 9.8;
                entity.F_contact = force > mu * mA * 9.8 ? force - mu * mA * 9.8 : 0;
            } else if (scenario === 'tension') {
                const m1 = parseFloat(this.getControlVal('mass1Slider'));
                const m2 = parseFloat(this.getControlVal('mass2Slider'));
                entity = new PulleySystemEntity(m1, m2);
                entity.tension = (2 * m1 * m2 * 9.8) / (m1 + m2);
            } else if (scenario === 'spring') {
                const m = parseFloat(this.getControlVal('massSlider'));
                const k = parseFloat(this.getControlVal('springKSlider'));
                const x0 = parseFloat(this.getControlVal('springXSlider'));
                entity = new SpringMassEntity(m, k, x0);
                entity.F_spring = -k * x0;
            }

            if (entity) {
                entity.isActive = false; 
                engine.addEntity(entity);
            }
        }

        onSolverChange(value, engine) {
            this.updateSolverState(value, engine);
            engine.render();
        }

        launch(engine) {
            engine.clear();
            const scenario = this.getControlVal('scenarioSelect');

            let entity = null;
            if (scenario === 'inertia') {
                const m = parseFloat(this.getControlVal('massSlider'));
                const force = parseFloat(this.getControlVal('appliedForce'));
                const mu = parseFloat(this.getControlVal('frictionSlider'));
                entity = new InertiaBlockEntity(m, force, mu);
            } else if (scenario === 'mass_on_plank') {
                const m = parseFloat(this.getControlVal('massSlider'));
                const force = parseFloat(this.getControlVal('appliedForce'));
                const mu = parseFloat(this.getControlVal('frictionSlider'));
                entity = new PlankBlockEntity(m, force, mu);
            } else if (scenario === 'action_reaction') {
                const mA = parseFloat(this.getControlVal('massSlider'));
                const mB = parseFloat(this.getControlVal('mass2Slider'));
                const force = parseFloat(this.getControlVal('appliedForce'));
                const mu = parseFloat(this.getControlVal('frictionSlider'));
                entity = new ContactBlocksEntity(mA, mB, force, mu);
            } else if (scenario === 'tension') {
                const m1 = parseFloat(this.getControlVal('mass1Slider'));
                const m2 = parseFloat(this.getControlVal('mass2Slider'));
                entity = new PulleySystemEntity(m1, m2);
            } else if (scenario === 'spring') {
                const m = parseFloat(this.getControlVal('massSlider'));
                const k = parseFloat(this.getControlVal('springKSlider'));
                const x0 = parseFloat(this.getControlVal('springXSlider'));
                entity = new SpringMassEntity(m, k, x0);
            }

            if (entity) {
                engine.addEntity(entity);
            }

            const solverInput = document.getElementById('timeSolverInput');
            if (solverInput) {
                solverInput.value = "0";
                this.updateSolverState(0, engine);
            }

            engine.startSimulation();
        }

        updateDashboard(engine, isLive) {
            const scenario = this.getControlVal('scenarioSelect');
            const activeEnt = engine.entities[0];

            // Card links
            const mNetForce = document.getElementById('netForceCard');
            const mFriction = document.getElementById('frictionForceCard');
            const mAcc = document.getElementById('accelerationCard');
            const mVel = document.getElementById('velocityCard');
            const mTension = document.getElementById('tensionCard');
            const mSpringForce = document.getElementById('springForceCard');
            const mEnergy = document.getElementById('energyCard');

            const mTime = document.getElementById('timeElapsedCard');
            const mPos = document.getElementById('positionCard');
            const mPE = document.getElementById('potentialEnergyCard');
            const mKE = document.getElementById('kineticEnergyCard');
            const mContact = document.getElementById('contactForceCard');

            if (isLive && activeEnt) {
                mTime.textContent = activeEnt.timeElapsed.toFixed(2);

                if (scenario === 'inertia') {
                    const nf = activeEnt.F_applied - activeEnt.F_friction;
                    if (mNetForce) mNetForce.textContent = nf.toFixed(2);
                    if (mFriction) mFriction.textContent = Math.abs(activeEnt.F_friction).toFixed(2);
                    mAcc.textContent = activeEnt.acc.x.toFixed(2);
                    mVel.textContent = activeEnt.vel.x.toFixed(2);
                    mPos.textContent = activeEnt.pos.x.toFixed(2);
                } else if (scenario === 'mass_on_plank') {
                    const nf = activeEnt.isMoving ? activeEnt.F_applied - activeEnt.F_friction : 0;
                    if (mNetForce) mNetForce.textContent = nf.toFixed(2);
                    if (mFriction) mFriction.textContent = activeEnt.F_friction.toFixed(2);
                    mAcc.textContent = activeEnt.acc.x.toFixed(2);
                    mVel.textContent = activeEnt.vel.x.toFixed(2);
                    mPos.textContent = activeEnt.pos.x.toFixed(2);
                } else if (scenario === 'action_reaction') {
                    const nf = activeEnt.isMoving ? activeEnt.F_applied - activeEnt.F_frictionTotal : 0;
                    if (mNetForce) mNetForce.textContent = nf.toFixed(2);
                    if (mFriction) mFriction.textContent = activeEnt.F_frictionTotal.toFixed(2);
                    mAcc.textContent = activeEnt.acc.x.toFixed(2);
                    mVel.textContent = activeEnt.vel.x.toFixed(2);
                    mPos.textContent = activeEnt.posA.x.toFixed(2);
                    mContact.textContent = activeEnt.F_contact.toFixed(2);
                } else if (scenario === 'tension') {
                    mAcc.textContent = activeEnt.acc.toFixed(2);
                    mVel.textContent = activeEnt.vel.toFixed(2);
                    mTension.textContent = activeEnt.tension.toFixed(2);
                } else if (scenario === 'spring') {
                    if (mNetForce) mNetForce.textContent = activeEnt.F_spring.toFixed(2);
                    mAcc.textContent = activeEnt.acc.x.toFixed(2);
                    mVel.textContent = activeEnt.vel.x.toFixed(2);
                    mPos.textContent = (activeEnt.pos.x - activeEnt.eqPos).toFixed(2);
                    mSpringForce.textContent = activeEnt.F_spring.toFixed(2);
                    mPE.textContent = activeEnt.E_potential.toFixed(2);
                    mKE.textContent = activeEnt.E_kinetic.toFixed(2);
                    mEnergy.textContent = activeEnt.E_total.toFixed(2);
                }
            } else {
                // Stationary or theoretical default reads
                mTime.textContent = "0.00";

                if (scenario === 'inertia') {
                    const m = parseFloat(this.getControlVal('massSlider'));
                    const mu = parseFloat(this.getControlVal('frictionSlider'));
                    const force = parseFloat(this.getControlVal('appliedForce'));
                    const f_k = mu * m * 9.8;
                    
                    if (mNetForce) mNetForce.textContent = force.toFixed(2);
                    if (mFriction) mFriction.textContent = f_k.toFixed(2);
                    mAcc.textContent = "0.00";
                    mVel.textContent = "0.00";
                    mPos.textContent = "2.00";
                } else if (scenario === 'mass_on_plank') {
                    const m = parseFloat(this.getControlVal('massSlider'));
                    const mu = parseFloat(this.getControlVal('frictionSlider'));
                    const f_k = mu * m * 9.8;
                    
                    if (mNetForce) mNetForce.textContent = "0.00";
                    if (mFriction) mFriction.textContent = f_k.toFixed(2);
                    mAcc.textContent = "0.00";
                    mVel.textContent = "0.00";
                    mPos.textContent = "1.50";
                } else if (scenario === 'action_reaction') {
                    const mA = parseFloat(this.getControlVal('massSlider'));
                    const mB = parseFloat(this.getControlVal('mass2Slider'));
                    const mu = parseFloat(this.getControlVal('frictionSlider'));
                    const f_total = mu * (mA + mB) * 9.8;
                    
                    if (mNetForce) mNetForce.textContent = "0.00";
                    if (mFriction) mFriction.textContent = f_total.toFixed(2);
                    mAcc.textContent = "0.00";
                    mVel.textContent = "0.00";
                    mPos.textContent = "1.50";
                    mContact.textContent = "0.00";
                } else if (scenario === 'tension') {
                    mAcc.textContent = "0.00";
                    mVel.textContent = "0.00";
                    mTension.textContent = "0.00";
                } else if (scenario === 'spring') {
                    const k = parseFloat(this.getControlVal('springKSlider'));
                    const x0 = parseFloat(this.getControlVal('springXSlider'));
                    if (mNetForce) mNetForce.textContent = (-k * x0).toFixed(2);
                    if (mFriction) mFriction.textContent = "0.00";
                    mAcc.textContent = "0.00";
                    mVel.textContent = "0.00";
                    mPos.textContent = x0.toFixed(2);
                    mSpringForce.textContent = (-k * x0).toFixed(2);
                    mPE.textContent = (0.5 * k * x0 * x0).toFixed(2);
                    mKE.textContent = "0.00";
                    mEnergy.textContent = (0.5 * k * x0 * x0).toFixed(2);
                }
            }
        }

        updateSolverState(t, engine) {
            const scenario = this.getControlVal('scenarioSelect');
            const g = 9.8;
            
            let posX = 0, velX = 0, accX = 0;

            if (scenario === 'inertia') {
                const m = parseFloat(this.getControlVal('massSlider'));
                const force = parseFloat(this.getControlVal('appliedForce'));
                const mu = parseFloat(this.getControlVal('frictionSlider'));
                
                // Solve standard equations
                const impulseDuration = 0.25;
                const N = m * g;
                const f_k = mu * N;
                
                // Stage 1: Impulse Acceleration
                const a_acc = force / m;
                const v_max = a_acc * impulseDuration;
                const x_impulse = 2.0 + 0.5 * a_acc * impulseDuration * impulseDuration;

                if (t <= impulseDuration) {
                    accX = a_acc;
                    velX = a_acc * t;
                    posX = 2.0 + 0.5 * a_acc * t * t;
                } else {
                    // Stage 2: Gliding deceleration under friction
                    const glideT = t - impulseDuration;
                    const a_dec = -f_k / m;
                    
                    velX = Math.max(0, v_max + a_dec * glideT);
                    accX = velX > 0 ? a_dec : 0;
                    
                    const timeToStop = -v_max / a_dec;
                    if (glideT < timeToStop) {
                        posX = x_impulse + v_max * glideT + 0.5 * a_dec * glideT * glideT;
                    } else {
                        posX = x_impulse + 0.5 * v_max * timeToStop;
                    }
                }
            } else if (scenario === 'mass_on_plank') {
                const m = parseFloat(this.getControlVal('massSlider'));
                const force = parseFloat(this.getControlVal('appliedForce'));
                const mu = parseFloat(this.getControlVal('frictionSlider'));
                const N = m * g;
                const f_limit = mu * N;

                if (force > f_limit) {
                    accX = (force - f_limit) / m;
                    velX = accX * t;
                    posX = 1.5 + 0.5 * accX * t * t;
                } else {
                    accX = 0;
                    velX = 0;
                    posX = 1.5;
                }
            } else if (scenario === 'action_reaction') {
                const mA = parseFloat(this.getControlVal('massSlider'));
                const mB = parseFloat(this.getControlVal('mass2Slider'));
                const force = parseFloat(this.getControlVal('appliedForce'));
                const mu = parseFloat(this.getControlVal('frictionSlider'));
                const f_limitTotal = mu * (mA + mB) * g;

                if (force > f_limitTotal) {
                    accX = (force - f_limitTotal) / (mA + mB);
                    velX = accX * t;
                    posX = 1.5 + 0.5 * accX * t * t;
                } else {
                    accX = 0;
                    velX = 0;
                    posX = 1.5;
                }
            } else if (scenario === 'tension') {
                const m1 = parseFloat(this.getControlVal('mass1Slider'));
                const m2 = parseFloat(this.getControlVal('mass2Slider'));
                
                accX = g * (m2 - m1) / (m1 + m2);
                velX = accX * t;
                posX = 6.0 + 0.5 * accX * t * t; // Solves standard pulley displacement
            } else if (scenario === 'spring') {
                const m = parseFloat(this.getControlVal('massSlider'));
                const k = parseFloat(this.getControlVal('springKSlider'));
                const x0 = parseFloat(this.getControlVal('springXSlider'));

                const omega = Math.sqrt(k / m);
                posX = x0 * Math.cos(omega * t);
                velX = -x0 * omega * Math.sin(omega * t);
                accX = -x0 * omega * omega * Math.cos(omega * t);
            }

            this.ghostState = { scenario, posX, velX, accX, t };
            this.syncSolverTelemetry(posX, velX, accX, t);
        }

        syncSolverTelemetry(posX, velX, accX, t) {
            const solverTimeVal = document.getElementById('solverTimeVal');
            if (solverTimeVal) solverTimeVal.textContent = t.toFixed(2);
            
            const sPos = document.getElementById('solverPos');
            if (sPos) sPos.textContent = posX.toFixed(2);
            
            const sSpd = document.getElementById('solverSpeed');
            if (sSpd) sSpd.textContent = velX.toFixed(2);
            
            const sAcc = document.getElementById('solverAcc');
            if (sAcc) sAcc.textContent = accX.toFixed(2);
        }

        drawOverlay(ctx, engine) {
            if (!this.ghostState || engine.isPlaying) return;

            const gp = this.ghostState;
            if (gp.scenario === 'tension') return; // Hide visual overlay for simple pulleys in solver mode to avoid overlaps

            ctx.save();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);

            // Draw a red phantom ghost of the block at the solver time position
            const scenario = gp.scenario;
            if (scenario === 'spring') {
                const eqScreenX = engine.toScreenX(16.0 + gp.posX);
                const sy = engine.toScreenY(2.5);
                ctx.beginPath();
                ctx.arc(eqScreenX, sy, 8, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#ef4444';
                ctx.font = '700 8px "Fira Code", monospace';
                ctx.fillText(`t = ${gp.t.toFixed(2)}s`, eqScreenX - 16, sy - 14);
            } else {
                const sx = engine.toScreenX(gp.posX);
                const sy = engine.toScreenY(2.5);
                ctx.beginPath();
                ctx.arc(sx, sy, 8, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#ef4444';
                ctx.font = '700 8px "Fira Code", monospace';
                ctx.fillText(`t = ${gp.t.toFixed(2)}s`, sx - 16, sy - 14);
            }

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

        destroy(engine) {
            super.destroy(engine);
        }
    }

    // Register chapter
    window.PhysicsLab.registerChapter('newton', new NewtonChapter());
})();
