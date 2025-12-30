import { InputHandler } from './input.js';
import { Player } from './player.js';
import { Tree, Stone, FoodCrate, MysteryCrate } from './objects.js';
import { Wall, StoneWall, Tower, GoldMine, Windmill, Portal, Stash } from './buildings.js';
import { Peasant, Guard, Wolf, Bear, Horse, Bandit } from './units.js';
import { FloatingText } from './effects.js';
import { Projectile } from './projectiles.js';
import { randomInt, checkCircleCollision } from './utils.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.lastTime = 0;

        this.input = new InputHandler();

        // World Bounds
        this.worldWidth = 4000;
        this.worldHeight = 4000;

        // Initialize player in the middle of a theoretical map
        this.player = new Player(this.worldWidth / 2, this.worldHeight / 2);

        // Objects
        this.gameObjects = [];
        this.effects = [];
        this.projectiles = [];

        this.inRaid = false;
        this.homeState = null;
        this.loadHome();

        // Building State
        this.buildMode = null; // 'Wall', 'StoneWall', etc.
        this.selectedBuildingClass = null;

        // Unit Spawn Cooldown
        this.spawnCooldown = 0;

        // Leaderboard (Fake)
        this.fakePlayers = [
            { name: 'Alpha', score: 500 },
            { name: 'Beta', score: 300 },
            { name: 'Gamma', score: 100 },
            { name: 'Delta', score: 50 }
        ];
        this.leaderboardTimer = 0;

        // Camera offset
        this.camera = {
            x: this.player.x - this.width / 2,
            y: this.player.y - this.height / 2
        };

        this.running = false;
        this.setupUI();
    }

    setupUI() {
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');

        startBtn.addEventListener('click', () => {
            this.running = true;
            startScreen.style.display = 'none';
        });

        restartBtn.addEventListener('click', () => {
            location.reload();
        });
    }

    loadHome() {
        this.inRaid = false;
        this.projectiles = [];
        this.player.x = this.worldWidth / 2;
        this.player.y = this.worldHeight / 2;

        if (this.homeState) {
            this.gameObjects = this.homeState;
            this.addFloatingText(this.player.x, this.player.y - 100, "WELCOME BACK", "cyan");
        } else {
            this.gameObjects = [];
            // Center
            const cx = this.worldWidth / 2;
            const cy = this.worldHeight / 2;

            // Ruined House (Walls)
            this.gameObjects.push(new Wall(cx - 60, cy - 60));
            this.gameObjects.push(new Wall(cx - 20, cy - 60));
            this.gameObjects.push(new Wall(cx + 60, cy - 60)); // Gap
            this.gameObjects.push(new Wall(cx + 60, cy - 20));
            this.gameObjects.push(new Wall(cx + 60, cy + 20));
            this.gameObjects.push(new Wall(cx - 60, cy + 20));
            this.gameObjects.push(new Wall(cx - 60, cy - 20));

            // Stash
            this.gameObjects.push(new Stash(cx + 100, cy));

            // Portal to Raid
            this.gameObjects.push(new Portal(cx - 200, cy, 'raid'));

            // Decoration
            for (let i=0; i<20; i++) this.gameObjects.push(new Tree(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));

            this.addFloatingText(cx, cy - 100, "HOME SWEET HOME", "cyan");
        }
    }

    loadRaid() {
        // Save Home State
        this.homeState = this.gameObjects;

        this.inRaid = true;
        this.gameObjects = [];
        this.projectiles = [];
        this.player.x = 200;
        this.player.y = 200;

        // Extraction Point
        this.gameObjects.push(new Portal(this.worldWidth - 200, this.worldHeight - 200, 'home'));

        // Resources
        for (let i = 0; i < 100; i++) this.gameObjects.push(new Tree(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        for (let i = 0; i < 50; i++) this.gameObjects.push(new Stone(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        for (let i = 0; i < 30; i++) this.gameObjects.push(new FoodCrate(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));

        // Enemies
        for (let i = 0; i < 10; i++) this.gameObjects.push(new Wolf(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        for (let i = 0; i < 5; i++) this.gameObjects.push(new Bear(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        for (let i = 0; i < 5; i++) this.gameObjects.push(new Bandit(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        for (let i = 0; i < 5; i++) this.gameObjects.push(new MysteryCrate(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));

        this.addFloatingText(this.player.x, this.player.y - 100, "RAID STARTED. FIND EXTRACT!", "red");
    }

    start() {
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    update(deltaTime) {
        if (!this.running) return;

        // Update game state
        if (this.player) {
            this.player.update(deltaTime, this.input, !this.buildMode);

            // Handle Attacks
            if (this.player.justAttacked) {
                const weapon = this.player.currentWeapon;
                if (weapon.type === 'melee') {
                    this.handlePlayerAttack();
                } else {
                    // Gun logic
                    const stats = {
                        damage: weapon.damage,
                        speed: weapon.speed,
                        life: weapon.range / weapon.speed, // Range approx
                        color: weapon.color
                    };

                    if (weapon.name === 'Shotgun') {
                        // Spread
                        for (let i = 0; i < weapon.count; i++) {
                            const spread = (Math.random() - 0.5) * weapon.spread;
                            this.addProjectile(this.player.x, this.player.y, this.player.angle + spread, 'player', stats);
                        }
                    } else {
                        // Single shot
                        let spread = 0;
                        if (weapon.name === 'AK-47') spread = (Math.random() - 0.5) * 0.1;
                        this.addProjectile(this.player.x, this.player.y, this.player.angle + spread, 'player', stats);
                    }
                }
                this.player.justAttacked = false;
            }

            this.handleBuildingInput();

            // Wall/Map Boundary Collision
            this.player.x = Math.max(0, Math.min(this.worldWidth, this.player.x));
            this.player.y = Math.max(0, Math.min(this.worldHeight, this.player.y));

            // Object Collision (Simple)
            for (const obj of this.gameObjects) {
                if (!obj.active) continue;
                if (checkCircleCollision(this.player, obj)) {
                    // Resolve collision by pushing back
                    const dx = this.player.x - obj.x;
                    const dy = this.player.y - obj.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const overlap = (this.player.radius + obj.radius) - dist;

                    if (overlap > 0) {
                        const nx = dx / dist;
                        const ny = dy / dist;
                        this.player.x += nx * overlap;
                        this.player.y += ny * overlap;
                    }
                }
            }

            // Center camera on player
            this.camera.x = this.player.x - this.width / 2;
            this.camera.y = this.player.y - this.height / 2;
        }

        // Update Objects
        this.gameObjects.forEach(obj => {
            obj.update(deltaTime, this);
            // Handle Gold Mine Production
            if (obj instanceof GoldMine && obj.productionTimer >= obj.productionRate) {
                obj.productionTimer = 0;
                this.player.resources.gold += 1;
                this.addFloatingText(obj.x, obj.y - 40, "+1 Gold", "gold");
                this.updateUI();
            }
            if (obj instanceof Windmill && obj.productionTimer >= obj.productionRate) {
                obj.productionTimer = 0;
                this.player.resources.food += 5;
                this.addFloatingText(obj.x, obj.y - 40, "+5 Food", "orange");
                this.updateUI();
            }
        });

        // Update Effects
        this.effects.forEach(e => e.update(deltaTime));
        this.effects = this.effects.filter(e => e.active);

        // Update Projectiles
        this.updateProjectiles(deltaTime);

        // Handle Unit Spawning
        this.handleUnitInput();
        this.handleInteraction();

        // Update Leaderboard & Spawning
        this.leaderboardTimer += deltaTime;
        if (this.leaderboardTimer > 1000) {
            this.leaderboardTimer = 0;
            this.fakePlayers.forEach(p => p.score += randomInt(0, 20)); // Slow increment
            this.updateLeaderboardUI();

            // Regen Resources (Only in Raid)
            if (this.inRaid) {
                const trees = this.gameObjects.filter(o => o instanceof Tree).length;
                if (trees < 100) this.gameObjects.push(new Tree(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));

                const stones = this.gameObjects.filter(o => o instanceof Stone).length;
                if (stones < 50) this.gameObjects.push(new Stone(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));

                // Respawn Enemies
                if (Math.random() < 0.2) {
                     this.gameObjects.push(new Wolf(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
                }
            }
        }

        // Clean up inactive objects
        this.gameObjects = this.gameObjects.filter(obj => obj.active);

        // Death Logic (Tarkov Style)
        if (this.player.hp <= 0) {
            this.player.hp = this.player.maxHp;

            if (this.inRaid) {
                // Lost items
                this.player.resources = { wood:0, stone:0, food:0, gold:0 };
                this.updateUI();
                alert("You died in raid! Lost all carried loot."); // Simple feedback
                this.loadHome();
            } else {
                this.player.x = this.worldWidth / 2;
                this.player.y = this.worldHeight / 2;
            }
        }
    }

    updateProjectiles(deltaTime) {
        this.projectiles.forEach(p => {
            p.update(deltaTime);
            if (!p.active) return;

            // Collision
            if (p.owner === 'player') {
                for (const obj of this.gameObjects) {
                    if (!obj.active) continue;
                    if (obj.team === 'player') continue; // Don't hit friends

                    if (checkCircleCollision(p, obj)) {
                        p.active = false;
                        obj.health -= p.damage;
                        this.addFloatingText(obj.x, obj.y - 20, `-${p.damage}`, 'yellow');
                        if (obj.health <= 0) {
                            this.handleObjectDeath(obj);
                        }
                        break;
                    }
                }
            } else { // enemy
                 if (checkCircleCollision(p, this.player)) {
                     p.active = false;
                     this.player.hp -= p.damage;
                     this.addFloatingText(this.player.x, this.player.y - 30, `-${p.damage}`, 'red');
                 }
                 for (const obj of this.gameObjects) {
                     if (!obj.active) continue;
                     if (obj.team === 'player' && checkCircleCollision(p, obj)) {
                         p.active = false;
                         obj.health -= p.damage;
                         this.addFloatingText(obj.x, obj.y - 20, `-${p.damage}`, 'red');
                         if (obj.health <= 0) {
                             obj.active = false;
                         }
                         break;
                     }
                 }
            }
        });
        this.projectiles = this.projectiles.filter(p => p.active);
    }

    handlePlayerAttack() {
        const attackRange = 80; // Player radius (20) + Obj radius (approx 20-30) + Weapon (30)

        this.gameObjects.forEach(obj => {
            if (!obj.active) return;

            const dx = obj.x - this.player.x;
            const dy = obj.y - this.player.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < attackRange + obj.radius) {
                // Check angle (simple dot product or angle difference)
                // Vector to object
                const angleToObj = Math.atan2(dy, dx);
                // Difference from player facing angle
                let angleDiff = angleToObj - this.player.angle;
                // Normalize to -PI to PI
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                if (Math.abs(angleDiff) < Math.PI / 3) { // 60 degree cone
                    // Hit!
                    obj.health -= this.player.damage;
                    this.addFloatingText(obj.x, obj.y - 30, `-${this.player.damage}`, 'white');

                    if (obj.health <= 0) {
                        this.handleObjectDeath(obj);
                    }
                }
            }
        });
    }

    updateUI() {
        document.getElementById('wood-count').innerText = `${this.player.resources.wood} (${this.player.bank.wood})`;
        document.getElementById('stone-count').innerText = `${this.player.resources.stone} (${this.player.bank.stone})`;
        document.getElementById('food-count').innerText = `${this.player.resources.food} (${this.player.bank.food})`;
        document.getElementById('gold-count').innerText = `${this.player.resources.gold} (${this.player.bank.gold})`;
        document.getElementById('level-count').innerText = this.player.level;
        document.getElementById('weapon-name').innerText = this.player.currentWeapon.name;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw Background
        this.ctx.fillStyle = '#4CA64C'; // Grass green
        this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

        // Draw World Grid
        this.drawGrid();

        // Draw Objects
        this.gameObjects.forEach(obj => obj.draw(this.ctx));

        // Draw Effects
        this.effects.forEach(e => e.draw(this.ctx));

        // Draw Projectiles
        this.projectiles.forEach(p => p.draw(this.ctx));

        this.drawBuildingPreview();

        // Draw Player
        if (this.player) {
            this.player.draw(this.ctx);
        }

        this.ctx.restore();
    }

    drawGrid() {
        const gridSize = 100;
        // Calculate start and end indices based on camera position to cull off-screen grid
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const endX = startX + this.width + gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endY = startY + this.height + gridSize;

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }

        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }

        this.ctx.stroke();
    }

    handleBuildingInput() {
        if (this.input.isKeyDown('Digit1')) this.setBuildMode(Wall);
        if (this.input.isKeyDown('Digit2')) this.setBuildMode(StoneWall);
        if (this.input.isKeyDown('Digit3')) this.setBuildMode(Tower);
        if (this.input.isKeyDown('Digit4')) this.setBuildMode(GoldMine);
        if (this.input.isKeyDown('Digit7')) this.setBuildMode(Windmill);

        if (this.input.mouse.rightDown) {
            this.buildMode = null;
            this.selectedBuildingClass = null;
        }

        if (this.buildMode && this.input.mouse.down) {
            this.attemptBuild();
        }
    }

    handleInteraction() {
        if (this.input.isKeyDown('KeyF') && this.player.switchCooldown <= 0) {
             this.player.switchCooldown = 500;
             if (this.player.mountType) {
                 // Dismount
                 this.player.mountType = null;
                 this.player.speed = 0.2;
                 this.gameObjects.push(new Horse(this.player.x, this.player.y));
                 this.addFloatingText(this.player.x, this.player.y - 40, "Dismounted", "white");
             } else {
                 // Try Interact (Mount, Portal, Stash)
                 for (const obj of this.gameObjects) {
                     if (!obj.active) continue;

                     // Portal
                     if (obj instanceof Portal && checkCircleCollision(this.player, obj)) {
                         if (obj.destination === 'raid') {
                             this.loadRaid();
                         } else {
                             this.addFloatingText(this.player.x, this.player.y, "EXTRACTED! +LOOT", "lime");
                             this.loadHome();
                         }
                         break;
                     }

                     // Stash
                     if (obj instanceof Stash && checkCircleCollision(this.player, obj)) {
                         let deposited = false;
                         for (const res in this.player.resources) {
                             const amount = this.player.resources[res];
                             if (amount > 0) {
                                 this.player.bank[res] += amount;
                                 this.player.resources[res] = 0;
                                 deposited = true;
                             }
                         }
                         if (deposited) {
                             this.addFloatingText(this.player.x, this.player.y - 40, "All items deposited!", "gold");
                             this.updateUI();
                         } else {
                             this.addFloatingText(this.player.x, this.player.y - 40, "Inventory Empty", "white");
                         }
                         break;
                     }

                     // Mount
                     if (obj instanceof Horse && checkCircleCollision(this.player, obj)) {
                         obj.active = false;
                         this.player.mountType = 'horse';
                         this.player.speed = 0.4;
                         this.addFloatingText(this.player.x, this.player.y - 40, "Mounted!", "white");
                         break;
                     }
                 }
             }
        }
    }

    handleUnitInput() {
        if (this.spawnCooldown > 0) {
            this.spawnCooldown -= 16; // Approx 1 frame at 60fps
            return;
        }

        if (this.input.isKeyDown('Digit5')) {
            // Spawn Peasant
            if (this.player.resources.food >= 50) {
                this.player.resources.food -= 50;
                this.gameObjects.push(new Peasant(this.player.x + randomInt(-50, 50), this.player.y + randomInt(-50, 50)));
                this.spawnCooldown = 500; // 0.5s cooldown
                this.updateUI();
            }
        }

        if (this.input.isKeyDown('Digit6')) {
            // Spawn Guard
            if (this.player.resources.food >= 50 && this.player.resources.gold >= 50) {
                this.player.resources.food -= 50;
                this.player.resources.gold -= 50;
                this.gameObjects.push(new Guard(this.player.x + randomInt(-50, 50), this.player.y + randomInt(-50, 50)));
                this.spawnCooldown = 500;
                this.updateUI();
            }
        }
    }

    setBuildMode(ClassRef) {
        this.buildMode = true;
        this.selectedBuildingClass = ClassRef;
        // Reset mouse down to prevent instant placement if clicking UI (future proofing)
        // this.input.mouse.down = false;
    }

    attemptBuild() {
        if (!this.selectedBuildingClass) return;

        // Get Mouse World Position
        const mx = this.input.mouse.x + this.camera.x;
        const my = this.input.mouse.y + this.camera.y;

        // Grid Snap (40x40 roughly)
        const snap = 40;
        const x = Math.floor(mx / snap) * snap + snap/2;
        const y = Math.floor(my / snap) * snap + snap/2;

        // Create temporary instance to check cost/collision
        const temp = new this.selectedBuildingClass(x, y);

        // Check Cost
        if (this.player.resources.wood < temp.cost.wood ||
            this.player.resources.stone < temp.cost.stone ||
            this.player.resources.food < temp.cost.food ||
            this.player.resources.gold < temp.cost.gold) {
            // Not enough resources
            return;
        }

        // Check Collision with other objects
        let valid = true;
        for (const obj of this.gameObjects) {
            if (!obj.active) continue;
            const dx = x - obj.x;
            const dy = y - obj.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < temp.radius + obj.radius) {
                valid = false;
                break;
            }
        }

        // Check Collision with Player
        const dx = x - this.player.x;
        const dy = y - this.player.y;
        const pDist = Math.sqrt(dx*dx + dy*dy);
        if (pDist < temp.radius + this.player.radius) valid = false;

        if (valid) {
            // Pay Cost
            this.player.resources.wood -= temp.cost.wood;
            this.player.resources.stone -= temp.cost.stone;
            this.player.resources.food -= temp.cost.food;
            this.player.resources.gold -= temp.cost.gold;

            // Place
            this.gameObjects.push(temp);
            this.updateUI();

            // Reset click to prevent spam (optional) or just rely on cooldown?
            // For now, fast building is fun.
        }
    }

    drawBuildingPreview() {
        if (!this.buildMode || !this.selectedBuildingClass) return;

        const mx = this.input.mouse.x + this.camera.x;
        const my = this.input.mouse.y + this.camera.y;
        const snap = 40;
        const x = Math.floor(mx / snap) * snap + snap/2;
        const y = Math.floor(my / snap) * snap + snap/2;

        this.ctx.globalAlpha = 0.5;

        // We can't easily call draw() on class without instance.
        // Quick hack: create a dummy instance or static draw?
        // Let's create a lightweight dummy or just draw a rect.

        // Better: Instantiate once and update position?
        // For MVP, new instance per frame is fine for preview (JS is fast).
        const temp = new this.selectedBuildingClass(x, y);
        temp.draw(this.ctx);

        this.ctx.globalAlpha = 1.0;

        // Draw Range if tower
        if (temp.range) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, temp.range, 0, Math.PI*2);
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.stroke();
        }
    }

    addFloatingText(x, y, text, color) {
        this.effects.push(new FloatingText(x, y, text, color));
    }

    addProjectile(x, y, angle, owner, stats) {
        this.projectiles.push(new Projectile(x, y, angle, owner, stats));
    }

    handleObjectDeath(obj) {
        obj.active = false;

        if (obj.resourceType && obj.resourceAmount) {
            this.player.resources[obj.resourceType] += obj.resourceAmount;
            this.addFloatingText(this.player.x, this.player.y - 50, `+${obj.resourceAmount} ${obj.resourceType}`, 'lime');
        }

        this.player.xp += 10;

        // Check Level Up
        if (this.player.xp >= this.player.nextLevelXp) {
            this.player.level++;
            this.player.xp -= this.player.nextLevelXp;
            this.player.nextLevelXp *= 1.5;
            this.player.maxHp += 20;
            this.player.hp = this.player.maxHp;
            this.player.damage += 5;
            this.addFloatingText(this.player.x, this.player.y - 60, "LEVEL UP!", "cyan");
        }

        this.updateUI();
    }

    updateLeaderboardUI() {
        // Calculate Player Score (e.g., Gold + XP)
        const playerScore = this.player.resources.gold * 10 + this.player.xp + (this.player.level * 100);

        // Combine
        const all = [...this.fakePlayers, { name: 'You', score: playerScore, isMe: true }];

        // Sort
        all.sort((a, b) => b.score - a.score);

        // Render
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';

        all.slice(0, 5).forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${p.name}</span> <span>${Math.floor(p.score)}</span>`;
            if (p.isMe) li.className = 'me';
            list.appendChild(li);
        });
    }
}
