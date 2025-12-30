export class Projectile {
    constructor(x, y, angle, owner, stats = {}) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;
        this.speed = stats.speed || 0.8;
        this.damage = stats.damage || 20;
        this.active = true;
        this.life = stats.life || 2000;
        this.radius = 4;
        this.color = stats.color || '#f1c40f';
        this.trail = [];
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // Store trail position
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) {
            this.trail.shift();
        }

        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
        }

        // Draw bullet
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
