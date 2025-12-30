import { GameObject } from './objects.js';

export class Unit extends GameObject {
    constructor(x, y, type) {
        super(x, y, type);
        this.speed = 0.1;
        this.damage = 5;
        this.attackRange = 40;
        this.attackCooldown = 0;
        this.attackRate = 1000;
        this.team = 'neutral';
        this.radius = 15;
        this.target = null;
    }

    update(deltaTime, gameObjects, player) {
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        // AI logic implemented in subclasses
    }

    moveTowards(x, y, deltaTime) {
        const dx = x - this.x;
        const dy = y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 5) { // Don't jitter
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
            // Face target
            this.angle = Math.atan2(dy, dx);
        }
        return dist;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw Unit Circle
        ctx.fillStyle = this.color || 'white';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // Draw Eye/Direction
        ctx.rotate(this.angle || 0);
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.radius/2, 0, 3, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();

        // HP Bar
        const hpPct = this.health / this.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 15, this.y - 25, 30, 4);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.x - 15, this.y - 25, 30 * hpPct, 4);
    }
}

export class Peasant extends Unit {
    constructor(x, y) {
        super(x, y, 'peasant');
        this.health = 50;
        this.maxHealth = 50;
        this.color = '#d35400';
        this.team = 'player';
        this.speed = 0.08;
    }

    update(deltaTime, gameObjects, player) {
        super.update(deltaTime, gameObjects, player);
        if (!this.active) return;

        // Find nearest resource
        if (!this.target || !this.target.active) {
            let minDist = Infinity;
            let nearest = null;
            for (const obj of gameObjects) {
                if (!obj.active) continue;
                if (obj.type === 'tree' || obj.type === 'stone') {
                    const dx = obj.x - this.x;
                    const dy = obj.y - this.y;
                    const dist = dx*dx + dy*dy;
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = obj;
                    }
                }
            }
            this.target = nearest;
        }

        if (this.target) {
            const dist = this.moveTowards(this.target.x, this.target.y, deltaTime);
            if (dist < this.attackRange + this.target.radius) {
                // Attack
                if (this.attackCooldown <= 0) {
                    this.target.health -= this.damage;
                    this.attackCooldown = this.attackRate;
                    if (this.target.health <= 0) {
                        this.target.active = false;
                        // Give resource to player
                        if (player) {
                            player.resources[this.target.resourceType] += this.target.resourceAmount;
                            // dirty hack: trigger UI update if possible, or wait for next frame
                        }
                        this.target = null;
                    }
                }
            }
        } else {
            // Follow player if no trees
            if (player) this.moveTowards(player.x, player.y, deltaTime);
        }
    }
}

export class Guard extends Unit {
    constructor(x, y) {
        super(x, y, 'guard');
        this.health = 100;
        this.maxHealth = 100;
        this.color = '#3498db';
        this.team = 'player';
        this.damage = 15;
    }

    update(deltaTime, gameObjects, player) {
        super.update(deltaTime, gameObjects, player);
        if (!this.active) return;

        // Find nearest enemy (Wolf)
        let minDist = 400 * 400; // Aggro range
        let nearest = null;
        for (const obj of gameObjects) {
            if (!obj.active) continue;
            if (obj.type === 'wolf') {
                const dx = obj.x - this.x;
                const dy = obj.y - this.y;
                const dist = dx*dx + dy*dy;
                if (dist < minDist) {
                    minDist = dist;
                    nearest = obj;
                }
            }
        }
        this.target = nearest;

        if (this.target) {
            const dist = this.moveTowards(this.target.x, this.target.y, deltaTime);
            if (dist < this.attackRange + this.target.radius) {
                if (this.attackCooldown <= 0) {
                    this.target.health -= this.damage;
                    this.attackCooldown = this.attackRate;
                }
            }
        } else {
            // Follow player
            if (player) {
                const dist = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
                if (dist > 100) { // Keep some distance
                    this.moveTowards(player.x, player.y, deltaTime);
                }
            }
        }
    }
}

export class Wolf extends Unit {
    constructor(x, y) {
        super(x, y, 'wolf');
        this.health = 60;
        this.maxHealth = 60;
        this.color = '#2c3e50';
        this.team = 'enemy';
        this.damage = 10;
        this.speed = 0.12;

        // Loot
        this.resourceType = 'gold';
        this.resourceAmount = 20;
    }

    update(deltaTime, gameObjects, player) {
        super.update(deltaTime, gameObjects, player);
        if (!this.active) return;

        // Find nearest Player or Player Unit
        let minDist = 500 * 500;
        let nearest = null;

        // Check Player
        if (player) {
            const d = (player.x - this.x)**2 + (player.y - this.y)**2;
            if (d < minDist) {
                minDist = d;
                nearest = player;
            }
        }

        // Check Units (optimize later, checking all is slow but fine for MVP)
        for (const obj of gameObjects) {
            if (!obj.active) continue;
            if (obj.team === 'player') {
                const d = (obj.x - this.x)**2 + (obj.y - this.y)**2;
                if (d < minDist) {
                    minDist = d;
                    nearest = obj;
                }
            }
        }

        this.target = nearest;

        if (this.target) {
            const dist = this.moveTowards(this.target.x, this.target.y, deltaTime);
            // Player doesn't have radius property exposed maybe? It does (20).
            const targetRadius = this.target.radius || 20;

            if (dist < this.attackRange + targetRadius) {
                if (this.attackCooldown <= 0) {
                    // Deal damage
                    if (this.target === player) {
                        // Player takes damage (needs logic in Player or here)
                        // Player doesn't have takeDamage method yet, just hp
                        player.hp -= this.damage;
                    } else {
                        this.target.health -= this.damage;
                    }
                    this.attackCooldown = this.attackRate;
                }
            }
        }
    }
}
