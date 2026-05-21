/**
 * Visual Physics - Core Engine
 * Contains Vector2D algebra class and the main canvas physics visualizer engine.
 */

class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    magSq() {
        return this.x * this.x + this.y * this.y;
    }

    mag() {
        return Math.sqrt(this.magSq());
    }

    heading() {
        return Math.atan2(this.y, this.x);
    }

    copy() {
        return new Vector2D(this.x, this.y);
    }

    dist(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }
}

class PhysicsEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with ID '${canvasId}' not found.`);
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Settings
        this.scale = 12; // Pixels per meter (will auto-adjust)
        this.originOffset = new Vector2D(60, 50); // Margin from bottom-left of screen in pixels
        
        // Timing
        this.isPlaying = false;
        this.lastTime = 0;
        this.timeScale = 1.0; // Playback speed multiplier (for slow-mo)
        
        // Entities
        this.projectiles = [];
        
        // Callbacks
        this.onUpdateCallback = null;
        
        // High-DPI handling & Resizing
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // Adjust canvas resolution for high-DPI screens
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Set actual stylesheet dimensions
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        this.ctx.scale(dpr, dpr);
        
        // Recalculate screen dimensions in logical pixels
        this.logicalWidth = rect.width;
        this.logicalHeight = rect.height;
        
        if (!this.isPlaying) {
            this.render();
        }
    }

    // Coordinate Conversion: Physics (bottom-left origin) to Canvas Space (top-left origin)
    toScreenX(physicsX) {
        return this.originOffset.x + physicsX * this.scale;
    }

    toScreenY(physicsY) {
        return this.logicalHeight - this.originOffset.y - physicsY * this.scale;
    }

    // Coordinate Conversion: Canvas Space to Physics Space
    toPhysicsX(screenX) {
        return (screenX - this.originOffset.x) / this.scale;
    }

    toPhysicsY(screenY) {
        return (this.logicalHeight - this.originOffset.y - screenY) / this.scale;
    }

    // Auto-adjust scale dynamically to fit the predicted trajectory
    autoScale(predictedRange, predictedHeight) {
        const maxWidthAvailable = this.logicalWidth - this.originOffset.x - 80;
        const maxHeightAvailable = this.logicalHeight - this.originOffset.y - 80;
        
        // Safety checks to prevent division by zero or negative bounds
        const range = Math.max(1, predictedRange);
        const height = Math.max(1, predictedHeight);
        
        const scaleX = maxWidthAvailable / range;
        const scaleY = maxHeightAvailable / height;
        
        // Choose conservative scale to fit both width and height, constrained to reasonable ranges
        const targetScale = Math.min(scaleX, scaleY);
        this.scale = Math.min(Math.max(targetScale, 4), 30);
        
        // Update display indicator if exists
        const scaleIndicator = document.getElementById('scaleIndicator');
        if (scaleIndicator) {
            scaleIndicator.textContent = `Scale: 1m = ${this.scale.toFixed(1)}px`;
        }
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    clear() {
        this.projectiles = [];
        this.render();
    }

    // The rendering pipeline
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
        
        // Draw elegant grid
        this.drawGrid();
        
        // Draw ground platform
        this.drawGround();

        // Draw launcher pad visual
        this.drawLauncherBase();
        
        // Render all projectile entities
        for (const proj of this.projectiles) {
            proj.draw(this);
        }
    }

    // Background fine grid lines
    drawGrid() {
        const spacing = 10; // Major grid spacing in meters
        const numLinesX = Math.ceil(this.logicalWidth / (spacing * this.scale));
        const numLinesY = Math.ceil(this.logicalHeight / (spacing * this.scale));
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        this.ctx.lineWidth = 1;
        
        // Minor grid lines every 2 meters
        const minorSpacing = 2;
        this.ctx.beginPath();
        for (let i = 0; i * minorSpacing * this.scale < this.logicalWidth; i++) {
            const px = this.toScreenX(i * minorSpacing);
            this.ctx.moveTo(px, 0);
            this.ctx.lineTo(px, this.logicalHeight);
        }
        for (let j = 0; j * minorSpacing * this.scale < this.logicalHeight; j++) {
            const py = this.toScreenY(j * minorSpacing);
            this.ctx.moveTo(0, py);
            this.ctx.lineTo(this.logicalWidth, py);
        }
        this.ctx.stroke();

        // Major grid lines every 10 meters
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        this.ctx.fillStyle = '#64748b'; // grid labels
        this.ctx.font = '500 10px "Fira Code", monospace';
        this.ctx.beginPath();
        
        // Vertical grids
        for (let i = 0; i < numLinesX; i++) {
            const mVal = i * spacing;
            const px = this.toScreenX(mVal);
            
            this.ctx.moveTo(px, 0);
            this.ctx.lineTo(px, this.logicalHeight);
            
            // X-axis label
            if (mVal > 0) {
                this.ctx.fillText(`${mVal}m`, px - 10, this.logicalHeight - this.originOffset.y + 18);
            }
        }
        
        // Horizontal grids
        for (let j = 0; j < numLinesY; j++) {
            const mVal = j * spacing;
            const py = this.toScreenY(mVal);
            
            this.ctx.moveTo(0, py);
            this.ctx.lineTo(this.logicalWidth, py);
            
            // Y-axis label
            if (mVal > 0) {
                this.ctx.fillText(`${mVal}m`, this.originOffset.x - 32, py + 4);
            }
        }
        this.ctx.stroke();
    }

    drawGround() {
        const screenY = this.toScreenY(0);
        
        // Glowing futuristic ground line
        this.ctx.strokeStyle = '#312e81'; // dark indigo
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, screenY + 2);
        this.ctx.lineTo(this.logicalWidth, screenY + 2);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#4f46e5'; // bright indigo core
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, screenY);
        this.ctx.lineTo(this.logicalWidth, screenY);
        this.ctx.stroke();
        
        // Underground solid panel shading
        const groundGrad = this.ctx.createLinearGradient(0, screenY, 0, this.logicalHeight);
        groundGrad.addColorStop(0, 'rgba(79, 70, 229, 0.05)');
        groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = groundGrad;
        this.ctx.fillRect(0, screenY, this.logicalWidth, this.logicalHeight - screenY);
    }

    drawLauncherBase() {
        const sx = this.toScreenX(0);
        const sy = this.toScreenY(0);
        
        // Decorative metallic launch pad base
        this.ctx.fillStyle = '#1e293b';
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(sx - 15, sy);
        this.ctx.lineTo(sx - 8, sy - 8);
        this.ctx.lineTo(sx + 8, sy - 8);
        this.ctx.lineTo(sx + 15, sy);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Core emitter dot
        this.ctx.fillStyle = '#06b6d4'; // Cyan emitter
        this.ctx.beginPath();
        this.ctx.circle = this.ctx.arc(sx, sy - 4, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Engine loop controller
    tick(timestamp) {
        if (!this.isPlaying) return;
        
        if (!this.lastTime) this.lastTime = timestamp;
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        // Safety cap for frame delays (e.g. background tab switching)
        if (dt > 0.1) dt = 0.1;
        
        // Physics time-stepping
        const physicsDt = dt * this.timeScale;
        
        let allFinished = true;
        for (const proj of this.projectiles) {
            if (proj.isActive) {
                proj.update(physicsDt);
                allFinished = false;
            }
        }
        
        this.render();
        
        if (this.onUpdateCallback) {
            this.onUpdateCallback();
        }
        
        if (allFinished) {
            this.isPlaying = false;
            this.lastTime = 0;
        } else {
            requestAnimationFrame((t) => this.tick(t));
        }
    }

    startSimulation() {
        this.isPlaying = true;
        this.lastTime = 0;
        
        // Ensure at least one projectile is active
        const hasActive = this.projectiles.some(p => p.isActive);
        if (hasActive) {
            requestAnimationFrame((t) => this.tick(t));
        }
    }
}
