import { GameObject } from './objects.js';

export class Building extends GameObject {
    constructor(x, y, type) {
        super(x, y, type);
        this.isBuilding = true;
        this.solid = true;
    }
}

export class Wall extends Building {
    constructor(x, y) {
        super(x, y, 'wall');
        this.width = 50;
        this.height = 50;
        this.radius = 25;
        this.health = 300;
        this.maxHealth = 300;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Concrete wall
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Darker edges
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, 5);
        ctx.fillRect(-this.width / 2, this.height / 2 - 5, this.width, 5);
        ctx.fillRect(-this.width / 2, -this.height / 2, 5, this.height);
        ctx.fillRect(this.width / 2 - 5, -this.height / 2, 5, this.height);

        // Damage cracks
        if (this.health < this.maxHealth * 0.5) {
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, -15);
            ctx.lineTo(5, 10);
            ctx.lineTo(-5, 15);
            ctx.stroke();
        }

        ctx.restore();
    }
}

export class Stash extends Building {
    constructor(x, y) {
        super(x, y, 'stash');
        this.width = 80;
        this.height = 50;
        this.radius = 40;
        this.health = 1000;
        this.maxHealth = 1000;
        this.interactable = true;
        this.solid = false;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Container body
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-40, -25, 80, 50);

        // Lid
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-42, -28, 84, 10);

        // Lock
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-5, -5, 10, 15);
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('STASH', 0, 35);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText('[F] Open', 0, 48);

        ctx.restore();
    }
}

export class Workbench extends Building {
    constructor(x, y) {
        super(x, y, 'workbench');
        this.width = 80;
        this.height = 50;
        this.radius = 40;
        this.health = 500;
        this.maxHealth = 500;
        this.interactable = true;
        this.solid = false;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Table
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-40, -20, 80, 40);

        // Legs
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-38, 20, 8, 15);
        ctx.fillRect(30, 20, 8, 15);

        // Tools
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-30, -15, 20, 5); // Wrench
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(5, -15, 15, 5); // Screwdriver handle
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(20, -15, 10, 3); // Screwdriver

        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WORKBENCH', 0, 50);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#3498db';
        ctx.fillText('[F] Craft', 0, 62);

        ctx.restore();
    }
}

export class MedStation extends Building {
    constructor(x, y) {
        super(x, y, 'medstation');
        this.width = 60;
        this.height = 60;
        this.radius = 30;
        this.health = 500;
        this.maxHealth = 500;
        this.interactable = true;
        this.solid = false;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Cabinet
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(-30, -30, 60, 60);

        // Red cross
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-5, -20, 10, 40);
        ctx.fillRect(-20, -5, 40, 10);

        // Door lines
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 30);
        ctx.stroke();

        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MED STATION', 0, 45);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#27ae60';
        ctx.fillText('[F] Craft', 0, 57);

        ctx.restore();
    }
}

export class Portal extends Building {
    constructor(x, y, destination) {
        super(x, y, 'portal');
        this.destination = destination;
        this.width = 80;
        this.height = 100;
        this.radius = 50;
        this.health = 99999;
        this.maxHealth = 99999;
        this.interactable = true;
        this.solid = false;
        this.pulsePhase = 0;
    }

    update(deltaTime) {
        this.pulsePhase += deltaTime * 0.003;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        const pulse = Math.sin(this.pulsePhase) * 0.15 + 0.85;

        // Door frame
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-45, -55, 90, 110);

        // Inner glow
        ctx.fillStyle = this.destination === 'mapselect'
            ? `rgba(231, 76, 60, ${0.3 * pulse})`
            : `rgba(46, 204, 113, ${0.3 * pulse})`;
        ctx.fillRect(-40, -50, 80, 100);

        // Swirling effect
        ctx.strokeStyle = this.destination === 'mapselect' ? '#e74c3c' : '#2ecc71';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 20 + i * 10, this.pulsePhase + i, this.pulsePhase + i + Math.PI);
            ctx.stroke();
        }

        // Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.destination === 'mapselect' ? 'TO RAID' : 'EXIT', 0, 5);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText('[F] Enter', 0, 65);

        ctx.restore();
    }
}
