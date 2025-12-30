export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20; // Size of the player
        this.speed = 0.2; // Pixels per millisecond

        // Resources
        this.resources = {
            wood: 0,
            stone: 0,
            food: 0,
            gold: 0
        };

        // Stats
        this.hp = 100;
        this.maxHp = 100;
        this.level = 1;
        this.xp = 0;
        this.nextLevelXp = 100;

        this.angle = 0; // Facing direction

        // Combat
        this.attackCooldown = 0;
        this.attackSpeed = 500; // ms
        this.damage = 10;
        this.weaponAngle = 0;
        this.isAttacking = false;
        this.weaponType = 'melee'; // 'melee' or 'gun'
        this.switchCooldown = 0;
        this.mountType = null;
    }

    update(deltaTime, input, canAttack = true) {
        // Switch Weapon
        if (this.switchCooldown > 0) this.switchCooldown -= deltaTime;
        if (input.isKeyDown('KeyQ') && this.switchCooldown <= 0) {
            this.weaponType = this.weaponType === 'melee' ? 'gun' : 'melee';
            this.switchCooldown = 300;
        }
        // Attack Cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Attack Input
        if (canAttack && input.mouse.down && this.attackCooldown <= 0) {
            this.startAttack();
        }

        // Animate Attack
        if (this.isAttacking) {
            this.weaponAngle += 0.2 * deltaTime; // Swing speed
            if (this.weaponAngle > Math.PI / 2) {
                this.isAttacking = false;
                this.weaponAngle = 0;
            }
        }

        // Movement
        let dx = 0;
        let dy = 0;

        if (input.isKeyDown('KeyW')) dy -= 1;
        if (input.isKeyDown('KeyS')) dy += 1;
        if (input.isKeyDown('KeyA')) dx -= 1;
        if (input.isKeyDown('KeyD')) dx += 1;

        // Normalize vector
        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            this.x += dx * this.speed * deltaTime;
            this.y += dy * this.speed * deltaTime;
        }

        // Calculate facing angle based on mouse position relative to screen center (since camera centers on player)
        // Camera centers player at (screenWidth/2, screenHeight/2)
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;

        const mouseX = input.mouse.x;
        const mouseY = input.mouse.y;

        this.angle = Math.atan2(mouseY - screenCenterY, mouseX - screenCenterX);
    }

    startAttack() {
        this.isAttacking = true;
        this.justAttacked = true; // Signal to Game
        this.attackCooldown = this.attackSpeed;
        this.weaponAngle = -Math.PI / 4; // Start swing back
        return true; // Did attack
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw Mount if exists
        if (this.mountType === 'horse') {
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            ctx.ellipse(-10, 0, 35, 15, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(15, 0, 10, 0, Math.PI*2);
            ctx.fill();
        }

        // Draw Player Body (Simple Circle for now, maybe add "hands")
        ctx.fillStyle = '#f1c40f'; // Yellowish "skin" tone
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw "Hands" holding a weapon/tool
        ctx.fillStyle = '#e67e22'; // Hands
        // Right hand (weapon side)
        ctx.beginPath();
        ctx.arc(this.radius, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Left hand
        ctx.beginPath();
        ctx.arc(this.radius, -10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw Weapon (Sword/Tool or Gun) attached to right hand
        ctx.save();
        ctx.translate(this.radius, 10); // Pivot at hand
        ctx.rotate(this.weaponAngle);

        if (this.weaponType === 'gun') {
             // Draw Gun
             ctx.fillStyle = '#2c3e50';
             ctx.fillRect(0, -5, 20, 10); // Handle
             ctx.fillStyle = '#7f8c8d';
             ctx.fillRect(10, -5, 30, 6); // Barrel
        } else {
             // Draw Sword
             ctx.fillStyle = '#95a5a6';
             ctx.fillRect(0, -5, 35, 10);
        }
        ctx.restore();

        ctx.restore();

        // Draw Name/Level above
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Lvl ${this.level}`, this.x, this.y - this.radius - 10);

        // Health Bar
        const hpWidth = 40;
        const hpHeight = 5;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - hpWidth/2, this.y - this.radius - 20, hpWidth, hpHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - hpWidth/2, this.y - this.radius - 20, hpWidth * (this.hp / this.maxHp), hpHeight);
    }
}
