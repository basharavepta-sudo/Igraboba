export class Effect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
    }
    update(deltaTime) {}
    draw(ctx) {}
}

export class FloatingText extends Effect {
    constructor(x, y, text, color = 'white') {
        super(x, y);
        this.text = text;
        this.color = color;
        this.life = 1000; // ms
        this.maxLife = 1000;
        this.vy = -0.05; // Move up speed
        this.alpha = 1.0;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        this.y += this.vy * deltaTime;
        this.alpha = this.life / this.maxLife;
    }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}
