import { WEAPONS } from './data.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 0.18;

        // State
        this.alive = true;
        this.angle = 0;

        // Stats
        this.hp = 100;
        this.maxHp = 100;
        this.energy = 100;
        this.hydration = 100;
        this.level = 1;
        this.xp = 0;
        this.nextLevelXp = 1000;

        // Equipment
        this.armor = null;
        this.helmet = null;

        // Weapons
        this.weapons = [
            { ...WEAPONS.pm },
            { ...WEAPONS.knife }
        ];
        this.weaponIndex = 0;
        this.currentMag = this.weapons[0].magSize;
        this.reserveAmmo = { '9mm': 32, '5.45': 0, '7.62': 0, '12g': 0 };

        // Inventory
        this.backpack = [];
        this.backpackSize = 20;
        this.currentWeight = 0;
        this.maxWeight = 50;

        // Combat
        this.attackCooldown = 0;
        this.reloading = false;
        this.reloadTimer = 0;
        this.weaponAngle = 0;
        this.isAttacking = false;
        this.justAttacked = false;

        // Cooldowns
        this.switchCooldown = 0;
        this.interactCooldown = 0;
        this.medkitCooldown = 0;
    }

    get currentWeapon() {
        return this.weapons[this.weaponIndex];
    }

    update(deltaTime, input) {
        // Update cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.switchCooldown > 0) this.switchCooldown -= deltaTime;
        if (this.interactCooldown > 0) this.interactCooldown -= deltaTime;
        if (this.medkitCooldown > 0) this.medkitCooldown -= deltaTime;

        // Reloading
        if (this.reloading) {
            this.reloadTimer -= deltaTime;
            if (this.reloadTimer <= 0) {
                this.finishReload();
            }
        }

        // Weapon switch
        if (input.isKeyDown('KeyQ') && this.switchCooldown <= 0 && !this.reloading) {
            this.weaponIndex = (this.weaponIndex + 1) % this.weapons.length;
            this.switchCooldown = 300;
            this.currentMag = this.weapons[this.weaponIndex].magSize || 0;
        }

        // Number key weapon switch
        for (let i = 1; i <= 2; i++) {
            if (input.isKeyDown(`Digit${i}`) && this.switchCooldown <= 0 && !this.reloading) {
                if (this.weapons[i - 1]) {
                    this.weaponIndex = i - 1;
                    this.switchCooldown = 300;
                    this.currentMag = this.weapons[this.weaponIndex].magSize || 0;
                }
            }
        }

        // Attack
        if (input.mouse.down && this.attackCooldown <= 0 && !this.reloading) {
            this.tryAttack();
        }

        // Movement
        let dx = 0;
        let dy = 0;

        if (input.isKeyDown('KeyW')) dy -= 1;
        if (input.isKeyDown('KeyS')) dy += 1;
        if (input.isKeyDown('KeyA')) dx -= 1;
        if (input.isKeyDown('KeyD')) dx += 1;

        // Sprint
        let currentSpeed = this.speed;
        if (input.isKeyDown('ShiftLeft') && this.energy > 0) {
            currentSpeed *= 1.5;
            this.energy = Math.max(0, this.energy - 0.05);
        }

        // Weight penalty
        const weightRatio = this.currentWeight / this.maxWeight;
        if (weightRatio > 0.8) {
            currentSpeed *= 0.7;
        } else if (weightRatio > 0.5) {
            currentSpeed *= 0.85;
        }

        // Armor penalty
        if (this.armor && this.armor.speedPenalty) {
            currentSpeed *= (1 - this.armor.speedPenalty);
        }

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            this.x += dx * currentSpeed * deltaTime;
            this.y += dy * currentSpeed * deltaTime;
        }

        // Facing angle (mouse position)
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        this.angle = Math.atan2(input.mouse.y - screenCenterY, input.mouse.x - screenCenterX);

        // Attack animation
        if (this.isAttacking) {
            this.weaponAngle += 0.2 * deltaTime;
            if (this.weaponAngle > Math.PI / 2) {
                this.isAttacking = false;
                this.weaponAngle = 0;
            }
        }
    }

    tryAttack() {
        const weapon = this.currentWeapon;

        if (weapon.type === 'melee') {
            this.isAttacking = true;
            this.justAttacked = true;
            this.attackCooldown = weapon.attackRate;
            this.weaponAngle = -Math.PI / 4;
        } else {
            // Gun
            if (this.currentMag > 0) {
                this.currentMag--;
                this.justAttacked = true;
                this.attackCooldown = weapon.fireRate;
            } else {
                // Auto reload
                this.reload();
            }
        }
    }

    reload() {
        const weapon = this.currentWeapon;
        if (!weapon.magSize || this.reloading) return;
        if (this.currentMag >= weapon.magSize) return;

        const caliber = weapon.caliber;
        if (!this.reserveAmmo[caliber] || this.reserveAmmo[caliber] <= 0) return;

        this.reloading = true;
        this.reloadTimer = weapon.reloadTime;
    }

    finishReload() {
        const weapon = this.currentWeapon;
        const caliber = weapon.caliber;
        const needed = weapon.magSize - this.currentMag;
        const available = Math.min(needed, this.reserveAmmo[caliber]);

        this.currentMag += available;
        this.reserveAmmo[caliber] -= available;
        this.reloading = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw body (tactical look)
        ctx.fillStyle = '#2c3e50';
        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 3;

        // Body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vest/Armor indicator
        if (this.armor) {
            ctx.fillStyle = '#34495e';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius - 5, -Math.PI / 2, Math.PI / 2);
            ctx.fill();
        }

        // Hands
        ctx.fillStyle = '#e8d4b8';
        ctx.beginPath();
        ctx.arc(this.radius, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.radius, -8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Weapon
        ctx.save();
        ctx.translate(this.radius, 8);
        ctx.rotate(this.weaponAngle);

        const weapon = this.currentWeapon;
        if (weapon.type === 'melee') {
            // Knife
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(5, -3, 25, 6);
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(0, -4, 8, 8);
        } else {
            // Gun
            const length = weapon.length || 30;
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, -4, 15, 8); // Handle
            ctx.fillStyle = weapon.color || '#34495e';
            ctx.fillRect(10, -3, length, 6); // Barrel

            // Muzzle
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(10 + length - 5, -4, 5, 8);
        }
        ctx.restore();

        ctx.restore();

        // Name and level
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`PMC Lv.${this.level}`, this.x, this.y - this.radius - 25);

        // Health bar
        const hpWidth = 40;
        const hpHeight = 5;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.x - hpWidth / 2 - 1, this.y - this.radius - 21, hpWidth + 2, hpHeight + 2);
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 20, hpWidth, hpHeight);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 20, hpWidth * (this.hp / this.maxHp), hpHeight);

        // Reload indicator
        if (this.reloading) {
            const progress = 1 - (this.reloadTimer / this.currentWeapon.reloadTime);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.x - 20, this.y + this.radius + 5, 40, 6);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x - 20, this.y + this.radius + 5, 40 * progress, 6);
        }
    }
}
