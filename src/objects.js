export class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.hitTimer = 0;
    }

    update(deltaTime) {
        if (this.hitTimer > 0) this.hitTimer -= deltaTime;
    }

    draw(ctx) {
        // Base draw
    }

    drawHealthBar(ctx) {
        if (this.maxHealth && this.health < this.maxHealth) {
            const width = 30;
            const height = 4;
            const y = -this.radius - 10;
            ctx.fillStyle = 'red';
            ctx.fillRect(-width/2, y, width, height);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-width/2, y, width * (this.health / this.maxHealth), height);
        }
    }
}

export class Tree extends GameObject {
    constructor(x, y) {
        super(x, y, 'tree');
        this.radius = 30;
        this.health = 50;
        this.maxHealth = 50;
        this.resourceType = 'wood';
        this.resourceAmount = 10;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw Tree Trunk
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Draw Leaves (Simplified clumpy look)
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(0, -10, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        ctx.stroke();

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}

export class MysteryCrate extends GameObject {
    constructor(x, y) {
        super(x, y, 'mystery_crate');
        this.radius = 20;
        this.health = 300;
        this.maxHealth = 300;
        this.resourceType = 'gold';
        this.resourceAmount = 100;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#9b59b6'; // Purple
        ctx.fillRect(-20, -20, 40, 40);

        ctx.fillStyle = '#f1c40f'; // Gold Question Mark
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('?', 0, 8);

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}

export class Stone extends GameObject {
    constructor(x, y) {
        super(x, y, 'stone');
        this.radius = 25;
        this.health = 80;
        this.maxHealth = 80;
        this.resourceType = 'stone';
        this.resourceAmount = 5;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Detail cracks
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(5, 5);
        ctx.stroke();

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}

export class FoodCrate extends GameObject {
    constructor(x, y) {
        super(x, y, 'food');
        this.radius = 15;
        this.health = 20;
        this.maxHealth = 20;
        this.resourceType = 'food';
        this.resourceAmount = 15;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Apple/Food look
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(-2, -15, 4, 6);

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}
