/**
 * Visual Physics - Projectile Entity
 * Models a physics projectile particle, tracks its trajectory, handles trails,
 * and draws the vector component velocity arrows in real-time.
 */

class Projectile {
    constructor(u, angleDegrees, g) {
        this.u = u; // Initial velocity magnitude (m/s)
        this.angle = angleDegrees; // Launch angle (degrees)
        this.gravity = g; // Acceleration due to gravity (m/s^2)
        
        // Convert angle to radians
        const theta = (angleDegrees * Math.PI) / 180;
        
        // Position and Velocity vectors
        this.pos = new Vector2D(0, 0);
        this.vel = new Vector2D(u * Math.cos(theta), u * Math.sin(theta));
        
        // Launch states
        this.initialVelX = this.vel.x;
        this.initialVelY = this.vel.y;
        
        // Flight metadata
        this.isActive = true;
        this.timeElapsed = 0;
        this.maxHeight = 0;
        this.trail = [];
        this.trailCap = 250; // Cap trail items for high performance
        
        // Colors
        this.colorMain = '#06b6d4'; // Glowing Cyan
        this.colorTrail = 'rgba(245, 158, 11, 0.7)'; // Translucent Amber glow
    }

    // Step physics forward in time
    update(dt) {
        if (!this.isActive) return;

        // Save current position for trail line
        this.trail.push(this.pos.copy());
        if (this.trail.length > this.trailCap) {
            this.trail.shift();
        }

        // Keep track of maximum height achieved during flight
        if (this.pos.y > this.maxHeight) {
            this.maxHeight = this.pos.y;
        }

        // Standard equations of motion (Euler-Cromer integration)
        this.vel.y -= this.gravity * dt;
        
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;
        
        this.timeElapsed += dt;

        // Landing collision check (ground is at physics y = 0)
        if (this.pos.y <= 0 && this.vel.y < 0) {
            this.pos.y = 0;
            this.isActive = false;
            this.vel.set(0, 0);
            
            // Log final landing telemetry
            this.rangeReached = this.pos.x;
            this.landingTime = this.timeElapsed;
        }
    }

    // Draw the projectile body, glowing path trail, and real-time velocity components
    draw(engine) {
        const ctx = engine.ctx;
        
        // Draw parabolic path trail
        if (this.trail.length > 1) {
            ctx.beginPath();
            const startPt = this.trail[0];
            ctx.moveTo(engine.toScreenX(startPt.x), engine.toScreenY(startPt.y));
            
            for (let i = 1; i < this.trail.length; i++) {
                const pt = this.trail[i];
                ctx.lineTo(engine.toScreenX(pt.x), engine.toScreenY(pt.y));
            }
            // Include current position
            ctx.lineTo(engine.toScreenX(this.pos.x), engine.toScreenY(this.pos.y));
            
            ctx.strokeStyle = this.colorTrail;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
            ctx.shadowBlur = 6;
            ctx.stroke();
            
            // Reset shadow properties immediately so they don't leak
            ctx.shadowBlur = 0;
        }

        // Convert current physics coordinate to screen canvas coordinates
        const sx = engine.toScreenX(this.pos.x);
        const sy = engine.toScreenY(this.pos.y);

        // Draw Vector component arrows if active and toggle is ON
        const vectorToggle = document.getElementById('vectorToggle');
        const showVectors = vectorToggle ? vectorToggle.checked : true;

        if (this.isActive && showVectors) {
            const vectorScale = 0.8; // Scale factor for vector line lengths on screen
            
            // 1. Horizontal Velocity Vector (Vx) -> Emerald Green
            const vxLength = this.vel.x * vectorScale * engine.scale;
            this.drawArrow(
                ctx, 
                sx, 
                sy, 
                sx + vxLength, 
                sy, 
                '#10b981', 
                2.5, 
                'Vx'
            );
            
            // 2. Vertical Velocity Vector (Vy) -> Violet Purple
            // Note: Canvas Y is downward, physics Y is upward.
            // Hence, a positive physical velocity goes UP on screen (subtraction from sy).
            const vyLength = -this.vel.y * vectorScale * engine.scale;
            this.drawArrow(
                ctx, 
                sx, 
                sy, 
                sx, 
                sy + vyLength, 
                '#8b5cf6', 
                2.5, 
                'Vy'
            );

            // 3. Combined Resultant Velocity Vector (V) -> Electric Cyan
            const rxLength = this.vel.x * vectorScale * engine.scale;
            const ryLength = -this.vel.y * vectorScale * engine.scale;
            this.drawArrow(
                ctx, 
                sx, 
                sy, 
                sx + rxLength, 
                sy + ryLength, 
                '#06b6d4', 
                3.5, 
                'V'
            );
        }

        // Draw Projection & Selector Halo if paused mid-flight
        const isPaused = this.isActive && !engine.isPlaying && this.timeElapsed > 0;
        if (isPaused) {
            const groundY = engine.toScreenY(0);
            const originX = engine.originOffset.x;

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.2;

            // 1. Vertical height projection line
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, groundY);
            ctx.stroke();

            // Height text label
            ctx.fillStyle = '#f59e0b';
            ctx.font = '600 10px "Fira Code", monospace';
            ctx.fillText(`y = ${this.pos.y.toFixed(2)}m`, sx + 8, (sy + groundY) / 2);

            // 2. Horizontal distance projection line
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(originX, sy);
            ctx.stroke();

            // Distance text label
            ctx.fillStyle = '#06b6d4';
            ctx.fillText(`x = ${this.pos.x.toFixed(2)}m`, (sx + originX) / 2 - 20, sy - 8);

            // 3. Ambient paused selector halo around projectile body
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, 14, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        // Draw projectile particle orb
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        
        // Metallic outer body shading
        const radialGrad = ctx.createRadialGradient(sx - 2, sy - 2, 1, sx, sy, 7);
        radialGrad.addColorStop(0, '#ffffff');
        radialGrad.addColorStop(0.3, '#22d3ee'); // bright cyan
        radialGrad.addColorStop(1, '#0891b2'); // deep cyan
        
        ctx.fillStyle = radialGrad;
        
        // Add neon ambient glow around the body
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    // Helper utility to draw clean geometric arrows with arrowhead pointers
    drawArrow(ctx, fromX, fromY, toX, toY, color, thickness = 2, label = '') {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Do not draw tiny arrows to avoid rendering visual artifacts
        if (distance < 5) return;
        
        // Draw the shaft line
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        
        // Calculate arrowhead parameters
        const arrowSize = 7 + thickness; // Size of arrow whiskers
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
        
        // Draw textual vector label alongside arrow shaft
        if (label) {
            ctx.fillStyle = color;
            ctx.font = '600 10px "Fira Code", monospace';
            
            // Offset text from arrow end point
            const labelDist = 12;
            const lx = toX + labelDist * Math.cos(angle);
            const ly = toY + labelDist * Math.sin(angle) + 3; // vertical center alignment
            
            ctx.fillText(label, lx - 4, ly);
        }
    }
}
