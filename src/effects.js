export class FloatingText {
    constructor(x, y, text, color = 'white') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1000;
        this.active = true;
        this.vy = -0.05;
        this.alpha = 1;
    }

    update(deltaTime) {
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        this.alpha = this.life / 1000;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

export class MuzzleFlash {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 50;
        this.active = true;
        this.size = 15 + Math.random() * 10;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const alpha = this.life / 50;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);

        // Outer glow
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class BloodSplatter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 300;
        this.active = true;
        this.particles = [];

        // Generate particles
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.2;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4
            });
        }
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
        }

        this.particles.forEach(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vx *= 0.95;
            p.vy *= 0.95;
        });
    }

    draw(ctx) {
        if (!this.active) return;

        const alpha = this.life / 300;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);

        this.particles.forEach(p => {
            ctx.fillStyle = '#8b0000';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}
