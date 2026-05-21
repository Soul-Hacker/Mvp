/**
 * Visual Physics - Generic Core Engine
 * Manages canvas rendering, coordinate mapping, high-DPI scaling, and global loops.
 * Agnostic of specific physical entities or mathematical topics.
 */

window.PhysicsLab = window.PhysicsLab || {};

window.PhysicsLab.Vector2D = class Vector2D {
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
};

window.PhysicsLab.PhysicsEngine = class PhysicsEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with ID '${canvasId}' not found.`);
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Base coordinate settings
        this.scale = 12; // Pixels per physical unit (meter/etc)
        this.originOffset = new window.PhysicsLab.Vector2D(60, 50); // Offset from bottom-left in pixels
        
        // Environment settings (controlled by active topic)
        this.showGrid = true;
        this.showGround = true;
        this.showLauncher = true;
        this.launcherOrigin = new window.PhysicsLab.Vector2D(0, 0); // physical launcher coords
        
        // Simulation timing loop state
        this.isPlaying = false;
        this.lastTime = 0;
        this.timeScale = 1.0; 
        
        // Substitutable simulation entities
        this.entities = [];
        
        // Active topic back-reference & update hook
        this.activeTopic = null;
        this.onUpdateCallback = null;
        
        // High-DPI handling & Resizing
        this.resize();
        this.resizeListener = () => this.resize();
        window.addEventListener('resize', this.resizeListener);
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        this.ctx.scale(dpr, dpr);
        this.logicalWidth = rect.width;
        this.logicalHeight = rect.height;
        
        if (!this.isPlaying) {
            this.render();
        }
    }

    destroy() {
        window.removeEventListener('resize', this.resizeListener);
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    // Coordinate conversions: Physics space (positive Y is up) to Screen space (positive Y is down)
    toScreenX(physicsX) {
        return this.originOffset.x + physicsX * this.scale;
    }

    toScreenY(physicsY) {
        return this.logicalHeight - this.originOffset.y - physicsY * this.scale;
    }

    toPhysicsX(screenX) {
        return (screenX - this.originOffset.x) / this.scale;
    }

    toPhysicsY(screenY) {
        return (this.logicalHeight - this.originOffset.y - screenY) / this.scale;
    }

    // Dynamic autoScale helper called by topics to auto-fit their visual elements
    autoScale(predictedWidth, predictedHeight, padding = 80) {
        const maxWidthAvailable = this.logicalWidth - this.originOffset.x - padding;
        const maxHeightAvailable = this.logicalHeight - this.originOffset.y - padding;
        
        const width = Math.max(1, predictedWidth);
        const height = Math.max(1, predictedHeight);
        
        const scaleX = maxWidthAvailable / width;
        const scaleY = maxHeightAvailable / height;
        
        const targetScale = Math.min(scaleX, scaleY);
        this.scale = Math.min(Math.max(targetScale, 0.1), 50);
        
        const scaleIndicator = document.getElementById('scaleIndicator');
        if (scaleIndicator) {
            scaleIndicator.textContent = `Scale: 1m = ${this.scale.toFixed(1)}px`;
        }
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    clear() {
        this.entities = [];
        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
        
        if (this.showGrid) this.drawGrid();
        if (this.showGround) this.drawGround();
        if (this.showLauncher) this.drawLauncherBase();
        
        // Render custom entities
        for (const entity of this.entities) {
            entity.draw(this.ctx, this);
        }

        // Hook for topic specific overlays (like solvers, field streams)
        if (this.activeTopic && typeof this.activeTopic.drawOverlay === 'function') {
            this.activeTopic.drawOverlay(this.ctx, this);
        }
    }

    drawGrid() {
        const idealSpacing = 80 / this.scale;
        const roundSteps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
        let spacing = 10;
        let bestDiff = Infinity;
        for (const step of roundSteps) {
            const diff = Math.abs(step - idealSpacing);
            if (diff < bestDiff) {
                bestDiff = diff;
                spacing = step;
            }
        }
        
        const minorSpacing = spacing % 5 === 0 ? spacing / 5 : spacing / 2;
        const numLinesX = Math.ceil(this.logicalWidth / (spacing * this.scale));
        const numLinesY = Math.ceil(this.logicalHeight / (spacing * this.scale));
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        const maxMinorLinesX = Math.ceil(this.logicalWidth / (minorSpacing * this.scale));
        const maxMinorLinesY = Math.ceil(this.logicalHeight / (minorSpacing * this.scale));
        
        for (let i = 0; i <= Math.min(maxMinorLinesX, 500); i++) {
            const px = this.toScreenX(i * minorSpacing);
            this.ctx.moveTo(px, 0);
            this.ctx.lineTo(px, this.logicalHeight);
        }
        for (let j = 0; j <= Math.min(maxMinorLinesY, 500); j++) {
            const py = this.toScreenY(j * minorSpacing);
            this.ctx.moveTo(0, py);
            this.ctx.lineTo(this.logicalWidth, py);
        }
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        this.ctx.fillStyle = '#64748b'; 
        this.ctx.font = '500 10px "Fira Code", monospace';
        this.ctx.beginPath();
        
        for (let i = 0; i <= Math.min(numLinesX, 100); i++) {
            const mVal = i * spacing;
            const px = this.toScreenX(mVal);
            this.ctx.moveTo(px, 0);
            this.ctx.lineTo(px, this.logicalHeight);
            if (mVal > 0) {
                this.ctx.fillText(`${mVal}m`, px - 10, this.logicalHeight - this.originOffset.y + 18);
            }
        }
        
        for (let j = 0; j <= Math.min(numLinesY, 100); j++) {
            const mVal = j * spacing;
            const py = this.toScreenY(mVal);
            this.ctx.moveTo(0, py);
            this.ctx.lineTo(this.logicalWidth, py);
            if (mVal > 0) {
                const labelOffset = mVal >= 1000 ? 44 : 32;
                this.ctx.fillText(`${mVal}m`, this.originOffset.x - labelOffset, py + 4);
            }
        }
        this.ctx.stroke();
    }

    drawGround() {
        const screenY = this.toScreenY(0);
        this.ctx.strokeStyle = '#312e81'; 
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, screenY + 2);
        this.ctx.lineTo(this.logicalWidth, screenY + 2);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#4f46e5'; 
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, screenY);
        this.ctx.lineTo(this.logicalWidth, screenY);
        this.ctx.stroke();
        
        const groundGrad = this.ctx.createLinearGradient(0, screenY, 0, this.logicalHeight);
        groundGrad.addColorStop(0, 'rgba(79, 70, 229, 0.05)');
        groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = groundGrad;
        this.ctx.fillRect(0, screenY, this.logicalWidth, this.logicalHeight - screenY);
    }

    drawLauncherBase() {
        const sx = this.toScreenX(this.launcherOrigin.x);
        const sy = this.toScreenY(this.launcherOrigin.y);
        
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
        
        this.ctx.fillStyle = '#06b6d4'; 
        this.ctx.beginPath();
        this.ctx.arc(sx, sy - 4, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    tick(timestamp) {
        if (!this.isPlaying) return;
        
        if (!this.lastTime) this.lastTime = timestamp;
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        if (dt > 0.1) dt = 0.1;
        const physicsDt = dt * this.timeScale;
        
        let allFinished = true;
        for (const entity of this.entities) {
            if (entity.isActive) {
                entity.update(physicsDt, this);
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
            this.animationFrameId = requestAnimationFrame((t) => this.tick(t));
        }
    }

    startSimulation() {
        this.isPlaying = true;
        this.lastTime = 0;
        
        const hasActive = this.entities.some(e => e.isActive);
        if (hasActive) {
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = requestAnimationFrame((t) => this.tick(t));
        }
    }

    pauseSimulation() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.lastTime = 0;
        this.render();
    }

    // Global utility method: Draw dashed geometric arrows (extremely useful for vector components in multiple labs)
    drawDashedArrow(ctx, fromX, fromY, toX, toY, color, thickness = 1.5, label = '') {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 5) return;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        
        const arrowSize = 5 + thickness;
        const angle = Math.atan2(dy, dx);
        
        ctx.fillStyle = color;
        ctx.setLineDash([]); 
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - arrowSize * Math.cos(angle - Math.PI / 6),
            toY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            toX - arrowSize * Math.cos(angle + Math.PI / 6),
            toY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        if (label) {
            ctx.fillStyle = color;
            ctx.font = '500 9px "Fira Code", monospace';
            const lx = toX + 6 * Math.cos(angle);
            const ly = toY + 6 * Math.sin(angle) + 3;
            ctx.fillText(label, lx - 2, ly);
        }
        ctx.restore();
    }

    // Global utility method: Draw standard arrows
    drawArrow(ctx, fromX, fromY, toX, toY, color, thickness = 2, label = '') {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 5) return;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        
        const arrowSize = 7 + thickness; 
        const angle = Math.atan2(dy, dx);
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - arrowSize * Math.cos(angle - Math.PI / 6),
            toY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            toX - arrowSize * Math.cos(angle + Math.PI / 6),
            toY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        if (label) {
            ctx.fillStyle = color;
            ctx.font = '600 10px "Fira Code", monospace';
            const labelDist = 12;
            const lx = toX + labelDist * Math.cos(angle);
            const ly = toY + labelDist * Math.sin(angle) + 3; 
            ctx.fillText(label, lx - 4, ly);
        }
        ctx.restore();
    }
};
