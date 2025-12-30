import { InputHandler } from './input.js';
import { Player } from './player.js';
import { Tree, Stone, FoodCrate } from './objects.js';
import { Wall, StoneWall, Tower, GoldMine, Windmill } from './buildings.js';
import { Peasant, Guard, Wolf, Bear } from './units.js';
import { FloatingText } from './effects.js';
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
        this.generateWorld();

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

    generateWorld() {
        // Add Trees
        for (let i = 0; i < 100; i++) {
            this.gameObjects.push(new Tree(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        }
        // Add Stones
        for (let i = 0; i < 50; i++) {
            this.gameObjects.push(new Stone(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        }
        // Add Food
        for (let i = 0; i < 30; i++) {
            this.gameObjects.push(new FoodCrate(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        }
        // Add Wolves
        for (let i = 0; i < 10; i++) {
            this.gameObjects.push(new Wolf(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        }
        // Add Bears
        for (let i = 0; i < 5; i++) {
            this.gameObjects.push(new Bear(randomInt(0, this.worldWidth), randomInt(0, this.worldHeight)));
        }
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
                this.handlePlayerAttack();
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

        // Handle Unit Spawning
        this.handleUnitInput();

        // Update Leaderboard
        this.leaderboardTimer += deltaTime;
        if (this.leaderboardTimer > 1000) {
            this.leaderboardTimer = 0;
            this.fakePlayers.forEach(p => p.score += randomInt(0, 20)); // Slow increment
            this.updateLeaderboardUI();
        }

        // Clean up inactive objects
        this.gameObjects = this.gameObjects.filter(obj => obj.active);

        // Game Over Check
        if (this.player.hp <= 0) {
            this.running = false;
            document.getElementById('game-over-screen').style.display = 'flex';
        }
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
                        obj.active = false;

                        if (obj.resourceType && obj.resourceAmount) {
                            this.player.resources[obj.resourceType] += obj.resourceAmount;
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
                        }

                        this.updateUI();
                    }
                }
            }
        });
    }

    updateUI() {
        document.getElementById('wood-count').innerText = this.player.resources.wood;
        document.getElementById('stone-count').innerText = this.player.resources.stone;
        document.getElementById('food-count').innerText = this.player.resources.food;
        document.getElementById('gold-count').innerText = this.player.resources.gold;
        document.getElementById('level-count').innerText = this.player.level;
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
