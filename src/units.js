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

    update(deltaTime, game) {
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

        // Bobbing Animation
        const bob = Math.sin(Date.now() / 200) * 0.05;
        ctx.scale(1 + bob, 1 - bob);

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

    update(deltaTime, game) {
        super.update(deltaTime, game);
        if (!this.active) return;

        const gameObjects = game.gameObjects;
        const player = game.player;

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
                    game.addFloatingText(this.target.x, this.target.y - 20, `-${this.damage}`, 'white');
                    this.attackCooldown = this.attackRate;
                    if (this.target.health <= 0) {
                        this.target.active = false;
                        // Give resource to player
                        if (player) {
                            player.resources[this.target.resourceType] += this.target.resourceAmount;
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

export class Bear extends Unit {
    constructor(x, y) {
        super(x, y, 'bear');
        this.health = 200;
        this.maxHealth = 200;
        this.color = '#5d4037'; // Brown
        this.team = 'enemy';
        this.damage = 25;
        this.speed = 0.05;
        this.radius = 25;

        // Loot
        this.resourceType = 'gold';
        this.resourceAmount = 50;
    }

    update(deltaTime, game) {
        super.update(deltaTime, game);
        if (!this.active) return;

        const gameObjects = game.gameObjects;
        const player = game.player;

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

        // Check Units
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
            const targetRadius = this.target.radius || 20;

            if (dist < this.attackRange + targetRadius) {
                if (this.attackCooldown <= 0) {
                    // Deal damage
                    if (this.target === player) {
                        player.hp -= this.damage;
                        game.addFloatingText(player.x, player.y - 30, `-${this.damage}`, 'red');
                    } else {
                        this.target.health -= this.damage;
                        game.addFloatingText(this.target.x, this.target.y - 20, `-${this.damage}`, 'white');
                    }
                    this.attackCooldown = this.attackRate;
                }
            }
        }
    }
}

export class Horse extends Unit {
    constructor(x, y) {
        super(x, y, 'horse');
        this.health = 100;
        this.maxHealth = 100;
        this.color = '#8d6e63'; // Brown/Tan
        this.team = 'neutral';
        this.speed = 0.05; // Roam slowly
        this.radius = 25;
        this.moveTimer = 0;
        this.wanderDir = 0;
    }

    update(deltaTime, game) {
        // Wander logic
        this.moveTimer -= deltaTime;
        if (this.moveTimer <= 0) {
            this.moveTimer = 2000;
            this.wanderDir = Math.random() * Math.PI * 2;
        }

        this.x += Math.cos(this.wanderDir) * this.speed * deltaTime;
        this.y += Math.sin(this.wanderDir) * this.speed * deltaTime;
    }
}

export class Bandit extends Unit {
    constructor(x, y) {
        super(x, y, 'bandit');
        this.health = 80;
        this.maxHealth = 80;
        this.color = '#e74c3c'; // Red
        this.team = 'enemy';
        this.speed = 0.08;
        this.attackRate = 2000;
        this.radius = 20;

        // Loot
        this.resourceType = 'gold';
        this.resourceAmount = 40;
    }

    update(deltaTime, game) {
        super.update(deltaTime, game);
        if (!this.active) return;

        const player = game.player;

        // Simple logic: Chase player, shoot if in range
        if (player) {
            const dist = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
            if (dist < 400) {
                 // Move towards
                 if (dist > 150) {
                     this.moveTowards(player.x, player.y, deltaTime);
                 }
                 // Shoot
                 if (this.attackCooldown <= 0) {
                     const angle = Math.atan2(player.y - this.y, player.x - this.x);
                     game.addProjectile(this.x, this.y, angle, 'enemy');
                     this.attackCooldown = this.attackRate;
                 }
            }
        }
    }

    draw(ctx) {
        super.draw(ctx);
        if (this.active) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = 'black';
            ctx.fillRect(10, -3, 15, 6);
            ctx.restore();
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

    update(deltaTime, game) {
        super.update(deltaTime, game);
        if (!this.active) return;

        const gameObjects = game.gameObjects;
        const player = game.player;

        // Find nearest enemy (Wolf)
        let minDist = 400 * 400; // Aggro range
        let nearest = null;
        for (const obj of gameObjects) {
            if (!obj.active) continue;
            if (obj.type === 'wolf' || obj.type === 'bear') {
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
                    game.addFloatingText(this.target.x, this.target.y - 20, `-${this.damage}`, 'white');
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

    update(deltaTime, game) {
        super.update(deltaTime, game);
        if (!this.active) return;

        const gameObjects = game.gameObjects;
        const player = game.player;

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
                        player.hp -= this.damage;
                        game.addFloatingText(player.x, player.y - 30, `-${this.damage}`, 'red');
                    } else {
                        this.target.health -= this.damage;
                        game.addFloatingText(this.target.x, this.target.y - 20, `-${this.damage}`, 'white');
                    }
                    this.attackCooldown = this.attackRate;
                }
            }
        }
    }
}
