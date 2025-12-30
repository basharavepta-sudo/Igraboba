export class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.solid = false;
        this.interactable = false;
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
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(-width / 2 - 1, y - 1, width + 2, height + 2);
            ctx.fillStyle = 'red';
            ctx.fillRect(-width / 2, y, width, height);
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(-width / 2, y, width * (this.health / this.maxHealth), height);
        }
    }
}

export class Tree extends GameObject {
    constructor(x, y) {
        super(x, y, 'tree');
        this.radius = 25;
        this.health = 50;
        this.maxHealth = 50;
        this.solid = true;
        this.resourceType = 'wood';
        this.resourceAmount = 5;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(5, 5, 25, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Foliage
        ctx.fillStyle = '#2d5a27';
        ctx.beginPath();
        ctx.arc(0, -15, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3d7a37';
        ctx.beginPath();
        ctx.arc(-8, -12, 15, 0, Math.PI * 2);
        ctx.arc(8, -12, 15, 0, Math.PI * 2);
        ctx.fill();

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}

export class Stone extends GameObject {
    constructor(x, y) {
        super(x, y, 'stone');
        this.radius = 20;
        this.health = 80;
        this.maxHealth = 80;
        this.solid = true;
        this.resourceType = 'metal';
        this.resourceAmount = 3;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(3, 3, 22, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main rock
        ctx.fillStyle = '#5d6d7e';
        ctx.beginPath();
        ctx.moveTo(-18, 5);
        ctx.lineTo(-15, -10);
        ctx.lineTo(0, -15);
        ctx.lineTo(15, -8);
        ctx.lineTo(18, 5);
        ctx.lineTo(10, 12);
        ctx.lineTo(-10, 12);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(0, -12);
        ctx.lineTo(8, -6);
        ctx.lineTo(0, -2);
        ctx.closePath();
        ctx.fill();

        this.drawHealthBar(ctx);
        ctx.restore();
    }
}

export class LootCrate extends GameObject {
    constructor(x, y, lootType = 'supply_crate') {
        super(x, y, 'loot_crate');
        this.radius = 20;
        this.lootType = lootType;
        this.interactable = true;
        this.loot = null;
        this.customLoot = null;

        // Visual based on type
        this.colors = {
            weapon_crate: { primary: '#c0392b', secondary: '#e74c3c', icon: 'W' },
            medical_crate: { primary: '#27ae60', secondary: '#2ecc71', icon: '+' },
            supply_crate: { primary: '#8B4513', secondary: '#a0522d', icon: 'S' },
            tool_crate: { primary: '#3498db', secondary: '#5dade2', icon: 'T' },
            safe: { primary: '#2c3e50', secondary: '#34495e', icon: '$' },
            dead_scav: { primary: '#5d6d7e', secondary: '#7f8c8d', icon: 'X' }
        };
    }

    draw(ctx) {
        if (!this.active) return;

        const style = this.colors[this.lootType] || this.colors.supply_crate;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.lootType === 'dead_scav') {
            // Dead body
            ctx.fillStyle = style.primary;
            ctx.beginPath();
            ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e8d4b8';
            ctx.beginPath();
            ctx.arc(-15, -5, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Crate
            ctx.fillStyle = style.primary;
            ctx.fillRect(-20, -15, 40, 30);

            // Lid
            ctx.fillStyle = style.secondary;
            ctx.fillRect(-22, -18, 44, 8);

            // Icon
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(style.icon, 0, 5);

            // Glow effect for valuable
            if (this.lootType === 'safe') {
                ctx.strokeStyle = 'rgba(241, 196, 15, 0.5)';
                ctx.lineWidth = 2;
                ctx.strokeRect(-22, -18, 44, 36);
            }
        }

        // Interaction hint
        ctx.fillStyle = '#f1c40f';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('[F] Loot', 0, 25);

        ctx.restore();
    }
}

export class Extract extends GameObject {
    constructor(x, y, name) {
        super(x, y, 'extract');
        this.name = name;
        this.radius = 60;
        this.interactable = true;
        this.pulsePhase = 0;
    }

    update(deltaTime) {
        this.pulsePhase += deltaTime * 0.003;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing circle
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;

        // Outer glow
        ctx.fillStyle = `rgba(46, 204, 113, ${0.2 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 20, 0, Math.PI * 2);
        ctx.fill();

        // Main circle
        ctx.fillStyle = `rgba(46, 204, 113, ${0.4 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner dashed circle
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EXTRACT', 0, -5);
        ctx.font = '12px Arial';
        ctx.fillText(this.name, 0, 12);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText('[F] to extract', 0, 30);

        ctx.restore();
    }
}
