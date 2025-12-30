export class Projectile {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner; // 'player' or 'enemy'
        this.speed = 0.8; // Fast
        this.damage = 20;
        this.active = true;
        this.life = 2000; // 2 seconds range
        this.radius = 5;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Trail effect (simple line)
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.restore();
    }
}
