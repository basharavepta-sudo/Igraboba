import { ENEMY_TYPES } from './data.js';
import { distance } from './utils.js';

// Base Enemy class
class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.name = config.name;
        this.type = config.type;

        this.health = config.health;
        this.maxHealth = config.health;
        this.damage = config.damage;
        this.speed = config.speed;
        this.attackRange = config.attackRange;
        this.sightRange = config.sightRange;
        this.accuracy = config.accuracy;
        this.color = config.color;
        this.lootTable = config.lootTable;
        this.isRanged = config.isRanged || false;

        this.radius = 18;
        this.active = true;
        this.target = null;
        this.alerted = false;
        this.angle = Math.random() * Math.PI * 2;

        this.attackCooldown = 0;
        this.attackRate = 1500;

        this.xpValue = 50;

        // Patrol
        this.patrolPoint = { x, y };
        this.wanderTimer = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
    }

    update(deltaTime, game) {
        if (!this.active) return;

        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;

        const player = game.player;
        if (!player || !player.alive) {
            this.wander(deltaTime);
            return;
        }

        const distToPlayer = distance(this.x, this.y, player.x, player.y);

        // Detection
        if (distToPlayer < this.sightRange || this.alerted) {
            this.target = player;
        }

        if (this.target) {
            this.pursueAndAttack(deltaTime, game);
        } else {
            this.wander(deltaTime);
        }
    }

    pursueAndAttack(deltaTime, game) {
        if (!this.target) return;

        const dist = distance(this.x, this.y, this.target.x, this.target.y);

        // Face target
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

        if (dist > this.attackRange) {
            // Move towards target
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
        } else {
            // Attack
            if (this.attackCooldown <= 0) {
                this.attack(game);
                this.attackCooldown = this.attackRate;
            }
        }
    }

    attack(game) {
        // Override in subclasses
    }

    wander(deltaTime) {
        this.wanderTimer -= deltaTime;
        if (this.wanderTimer <= 0) {
            this.wanderTimer = 2000 + Math.random() * 3000;
            this.wanderAngle = Math.random() * Math.PI * 2;
        }

        // Move towards wander direction slowly
        this.x += Math.cos(this.wanderAngle) * this.speed * 0.3 * deltaTime;
        this.y += Math.sin(this.wanderAngle) * this.speed * 0.3 * deltaTime;
        this.angle = this.wanderAngle;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Bobbing animation
        const bob = Math.sin(Date.now() / 200) * 0.05;
        ctx.scale(1 + bob, 1 - bob);

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Direction indicator
        ctx.rotate(this.angle);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(this.radius / 2, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar
        if (this.health < this.maxHealth) {
            const hpWidth = 30;
            const hpPct = this.health / this.maxHealth;
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(this.x - hpWidth / 2 - 1, this.y - this.radius - 11, hpWidth + 2, 6);
            ctx.fillStyle = '#c41e3a';
            ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, hpWidth, 4);
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, hpWidth * hpPct, 4);
        }

        // Name
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y - this.radius - 15);
    }
}

// Scav - Human enemy
export class Scav extends Enemy {
    constructor(x, y, armed = false) {
        super(x, y, armed ? ENEMY_TYPES.scav_armed : ENEMY_TYPES.scav);
        this.armed = armed;
        this.attackRate = armed ? 1500 : 2000;
        this.xpValue = armed ? 75 : 50;
    }

    attack(game) {
        if (this.armed) {
            // Shoot
            const spread = (Math.random() - 0.5) * (1 - this.accuracy) * 0.5;
            game.addProjectile(this.x, this.y, this.angle + spread, this.name, {
                damage: this.damage,
                speed: 0.7,
                life: 500,
                color: '#f1c40f'
            });
        } else {
            // Melee
            if (distance(this.x, this.y, this.target.x, this.target.y) < 50) {
                game.damagePlayer(this.damage, this.name);
            }
        }
    }

    draw(ctx) {
        super.draw(ctx);

        // Draw weapon
        if (this.armed && this.active) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.radius, -3, 25, 6);
            ctx.restore();
        }
    }
}

// PMC - Strong human enemy
export class PMC extends Enemy {
    constructor(x, y, faction = 'usec') {
        const config = faction === 'usec' ? ENEMY_TYPES.pmc_usec : ENEMY_TYPES.pmc_bear;
        super(x, y, config);
        this.faction = faction;
        this.attackRate = 1200;
        this.xpValue = 150;
    }

    attack(game) {
        const spread = (Math.random() - 0.5) * (1 - this.accuracy) * 0.3;
        game.addProjectile(this.x, this.y, this.angle + spread, this.name, {
            damage: this.damage,
            speed: 1.0,
            life: 600,
            color: this.faction === 'usec' ? '#3498db' : '#e74c3c'
        });
    }

    draw(ctx) {
        super.draw(ctx);

        // Draw tactical gear
        if (this.active) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Helmet
            ctx.fillStyle = this.faction === 'usec' ? '#2980b9' : '#c0392b';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 3, -Math.PI / 3, Math.PI / 3);
            ctx.fill();

            // Gun
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(this.radius, -4, 35, 8);

            ctx.restore();
        }
    }
}

// Base Zombie
export class Zombie extends Enemy {
    constructor(x, y) {
        super(x, y, ENEMY_TYPES.zombie);
        this.attackRate = 1000;
        this.xpValue = 30;
    }

    attack(game) {
        if (distance(this.x, this.y, this.target.x, this.target.y) < 50) {
            game.damagePlayer(this.damage, 'Infected');
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Zombie look - tattered
        const bob = Math.sin(Date.now() / 150) * 0.08;
        ctx.scale(1 + bob, 1 - bob);

        // Body (greenish)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Tattered edges
        ctx.strokeStyle = '#1e5631';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
            ctx.lineTo(Math.cos(angle) * (this.radius + 5), Math.sin(angle) * (this.radius + 5));
            ctx.stroke();
        }

        // Eyes (glowing)
        ctx.rotate(this.angle);
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(8, -4, 3, 0, Math.PI * 2);
        ctx.arc(8, 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar
        if (this.health < this.maxHealth) {
            const hpWidth = 30;
            const hpPct = this.health / this.maxHealth;
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(this.x - hpWidth / 2 - 1, this.y - this.radius - 11, hpWidth + 2, 6);
            ctx.fillStyle = '#c41e3a';
            ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, hpWidth, 4);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, hpWidth * hpPct, 4);
        }
    }
}

// Fast Zombie (Runner)
export class ZombieFast extends Enemy {
    constructor(x, y) {
        super(x, y, ENEMY_TYPES.zombie_fast);
        this.attackRate = 600;
        this.xpValue = 40;
    }

    attack(game) {
        if (distance(this.x, this.y, this.target.x, this.target.y) < 50) {
            game.damagePlayer(this.damage, 'Runner');
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Fast zombie - leaner
        const bob = Math.sin(Date.now() / 100) * 0.1;
        ctx.scale(0.8 + bob, 1.2 - bob);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Speed lines
        ctx.rotate(this.angle + Math.PI);
        ctx.strokeStyle = 'rgba(30, 132, 73, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(this.radius + 5, (i - 1) * 8);
            ctx.lineTo(this.radius + 15, (i - 1) * 8);
            ctx.stroke();
        }

        ctx.restore();

        // Health bar
        if (this.health < this.maxHealth) {
            const hpWidth = 25;
            const hpPct = this.health / this.maxHealth;
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, hpWidth * hpPct, 4);
        }
    }
}

// Tank Zombie (Bloater)
export class ZombieTank extends Enemy {
    constructor(x, y) {
        super(x, y, ENEMY_TYPES.zombie_tank);
        this.radius = 30;
        this.attackRate = 2000;
        this.xpValue = 100;
    }

    attack(game) {
        if (distance(this.x, this.y, this.target.x, this.target.y) < 80) {
            game.damagePlayer(this.damage, 'Bloater');
            // Knockback
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            game.player.x += Math.cos(angle) * 50;
            game.player.y += Math.sin(angle) * 50;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Fat zombie
        const bob = Math.sin(Date.now() / 300) * 0.03;
        ctx.scale(1.2 + bob, 1 - bob);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Gross details
        ctx.fillStyle = '#0d3d1e';
        ctx.beginPath();
        ctx.arc(-8, -5, 8, 0, Math.PI * 2);
        ctx.arc(5, 8, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.rotate(this.angle);
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(this.radius / 2, -6, 5, 0, Math.PI * 2);
        ctx.arc(this.radius / 2, 6, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar
        if (this.health < this.maxHealth) {
            const hpWidth = 50;
            const hpPct = this.health / this.maxHealth;
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(this.x - hpWidth / 2 - 1, this.y - this.radius - 11, hpWidth + 2, 8);
            ctx.fillStyle = '#c41e3a';
            ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, hpWidth, 6);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, hpWidth * hpPct, 6);
        }

        // Name
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BLOATER', this.x, this.y - this.radius - 20);
    }
}

// Spitter Zombie
export class ZombieSpitter extends Enemy {
    constructor(x, y) {
        super(x, y, ENEMY_TYPES.zombie_spitter);
        this.attackRate = 2500;
        this.xpValue = 60;
    }

    attack(game) {
        // Ranged acid attack
        const spread = (Math.random() - 0.5) * 0.3;
        game.addProjectile(this.x, this.y, this.angle + spread, 'Spitter', {
            damage: this.damage,
            speed: 0.5,
            life: 400,
            color: '#27ae60'
        });
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const bob = Math.sin(Date.now() / 200) * 0.06;
        ctx.scale(1 + bob, 1 - bob);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dripping effect
        ctx.fillStyle = '#1abc9c';
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(this.radius + 10, -3);
        ctx.lineTo(this.radius + 15, 0);
        ctx.lineTo(this.radius + 10, 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Health bar
        if (this.health < this.maxHealth) {
            const hpWidth = 30;
            const hpPct = this.health / this.maxHealth;
            ctx.fillStyle = '#1abc9c';
            ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, hpWidth * hpPct, 4);
        }
    }
}

// Boss
export class Boss extends Enemy {
    constructor(x, y, bossType = 'killa') {
        super(x, y, ENEMY_TYPES[bossType]);
        this.radius = 25;
        this.attackRate = 800;
        this.xpValue = 500;
        this.phase = 1;
    }

    update(deltaTime, game) {
        super.update(deltaTime, game);

        // Phase change at 50% health
        if (this.health <= this.maxHealth / 2 && this.phase === 1) {
            this.phase = 2;
            this.speed *= 1.3;
            this.attackRate *= 0.7;
        }
    }

    attack(game) {
        // Burst fire
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (!this.active) return;
                const spread = (Math.random() - 0.5) * 0.2;
                game.addProjectile(this.x, this.y, this.angle + spread, this.name, {
                    damage: this.damage,
                    speed: 1.2,
                    life: 600,
                    color: '#9b59b6'
                });
            }, i * 100);
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Imposing figure
        const pulse = Math.sin(Date.now() / 200) * 0.05;
        ctx.scale(1 + pulse, 1 + pulse);

        // Aura
        ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6c3483';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Helmet
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 5, -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        // Gun
        ctx.rotate(this.angle);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.radius, -5, 50, 10);

        ctx.restore();

        // Health bar (bigger)
        const hpWidth = 60;
        const hpPct = this.health / this.maxHealth;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.x - hpWidth / 2 - 1, this.y - this.radius - 16, hpWidth + 2, 10);
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 15, hpWidth, 8);
        ctx.fillStyle = this.phase === 1 ? '#9b59b6' : '#e74c3c';
        ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 15, hpWidth * hpPct, 8);

        // Boss name
        ctx.fillStyle = '#9b59b6';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KILLA', this.x, this.y - this.radius - 25);
    }
}
