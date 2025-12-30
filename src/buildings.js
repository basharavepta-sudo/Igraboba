import { GameObject } from './objects.js';

export class Building extends GameObject {
    constructor(x, y, type) {
        super(x, y, type);
        this.isBuilding = true;
    }
}

export class Wall extends Building {
    constructor(x, y) {
        super(x, y, 'wall');
        this.width = 40;
        this.height = 40;
        this.radius = 20; // For collision
        this.health = 200;
        this.maxHealth = 200;
        this.cost = { wood: 10, stone: 0, food: 0, gold: 0 };
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

        // Wood texture lines
        ctx.strokeStyle = '#5c2e0b';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        ctx.lineTo(this.width/2, 0);
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(0, this.height/2);
        ctx.stroke();

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}

export class Windmill extends Building {
    constructor(x, y) {
        super(x, y, 'windmill');
        this.width = 50;
        this.height = 50;
        this.radius = 25;
        this.health = 150;
        this.maxHealth = 150;
        this.cost = { wood: 50, stone: 20, food: 0, gold: 0 };

        this.productionTimer = 0;
        this.productionRate = 1000;
        this.rotation = 0;
    }

    update(deltaTime) {
        this.productionTimer += deltaTime;
        this.rotation += deltaTime * 0.001;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Base
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

        this.drawHealthBar(ctx);

        // Blades
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(-60, -5, 120, 10);
        ctx.fillRect(-5, -60, 10, 120);

        ctx.restore();
    }
}

export class Portal extends Building {
    constructor(x, y, destination) {
        super(x, y, 'portal');
        this.destination = destination; // 'raid' or 'home'
        this.width = 100;
        this.height = 100;
        this.radius = 50;
        this.health = 99999; // Indestructible
        this.maxHealth = 99999;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = this.destination === 'raid' ? 'rgba(231, 76, 60, 0.5)' : 'rgba(46, 204, 113, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.destination === 'raid' ? 'TO RAID' : 'EXTRACT', 0, 5);

        ctx.restore();
    }
}

export class Stash extends Building {
    constructor(x, y) {
        super(x, y, 'stash');
        this.width = 60;
        this.height = 40;
        this.radius = 30;
        this.health = 500;
        this.maxHealth = 500;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#34495e';
        ctx.fillRect(-30, -20, 60, 40);
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.strokeRect(-30, -20, 60, 40);

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('STASH', 0, 5);

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}

export class StoneWall extends Building {
    constructor(x, y) {
        super(x, y, 'stone_wall');
        this.width = 40;
        this.height = 40;
        this.radius = 20;
        this.health = 500;
        this.maxHealth = 500;
        this.cost = { wood: 0, stone: 10, food: 0, gold: 0 };
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

        // Stone texture
        ctx.strokeStyle = '#2c3e50';
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}

export class GoldMine extends Building {
    constructor(x, y) {
        super(x, y, 'gold_mine');
        this.width = 60;
        this.height = 60;
        this.radius = 30;
        this.health = 300;
        this.maxHealth = 300;
        this.cost = { wood: 50, stone: 50, food: 0, gold: 0 };

        this.productionTimer = 0;
        this.productionRate = 1000; // 1 gold per second
    }

    update(deltaTime) {
        this.productionTimer += deltaTime;
        // Game will handle giving gold to player, or we do it here if we pass player/game reference
        // Ideally, Buildings shouldn't know about Game.
        // Game should iterate buildings and collect resources.
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#f39c12';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI*2);
        ctx.fill();

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}

export class Tower extends Building {
    constructor(x, y) {
        super(x, y, 'tower');
        this.width = 50;
        this.height = 50;
        this.radius = 25;
        this.health = 400;
        this.maxHealth = 400;
        this.cost = { wood: 50, stone: 20, food: 0, gold: 0 };

        this.range = 300;
        this.fireTimer = 0;
        this.fireRate = 1000;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Base
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

        // Top
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI*2);
        ctx.fill();

        // Cannon/Archer indicator
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI*2);
        ctx.fill();

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}
