import { InputHandler } from './input.js';
import { Player } from './player.js';
import { Tree, Stone, LootCrate, Extract } from './objects.js';
import { Wall, Workbench, MedStation, Stash, Portal } from './buildings.js';
import { Scav, PMC, Zombie, ZombieFast, ZombieTank, ZombieSpitter, Boss } from './units.js';
import { FloatingText, MuzzleFlash, BloodSplatter } from './effects.js';
import { Projectile } from './projectiles.js';
import { MAP_CONFIGS, ITEMS, WEAPONS, LOOT_TABLES, CRAFTING_RECIPES } from './data.js';
import { randomInt, checkCircleCollision, distance } from './utils.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.lastTime = 0;

        this.input = new InputHandler();

        // Current Map
        this.currentMap = 'hideout';
        this.mapConfig = MAP_CONFIGS.hideout;
        this.worldWidth = this.mapConfig.width;
        this.worldHeight = this.mapConfig.height;

        // Player
        this.player = new Player(this.worldWidth / 2, this.worldHeight / 2);

        // Game Objects
        this.gameObjects = [];
        this.effects = [];
        this.projectiles = [];
        this.enemies = [];

        // Game State
        this.inRaid = false;
        this.raidTime = 0;
        this.raidKills = 0;
        this.raidStartTime = 0;
        this.killedBy = null;

        // Stash/Bank
        this.stash = [];
        this.stashSize = 100;
        this.resources = { wood: 50, metal: 20, parts: 5, medical: 3, food: 10, roubles: 50000 };

        // Hideout Levels
        this.hideoutLevels = {
            stash: 1,
            workbench: 1,
            medstation: 1,
            generator: 0,
            walls: 1
        };

        // Camera
        this.camera = {
            x: this.player.x - this.width / 2,
            y: this.player.y - this.height / 2
        };

        // UI State
        this.inventoryOpen = false;
        this.mapSelectionOpen = false;
        this.craftPanelOpen = false;
        this.lootPanelOpen = false;
        this.currentLoot = null;

        // Timers
        this.zombieSpawnTimer = 0;
        this.statusDecayTimer = 0;

        this.running = false;
        this.setupUI();
        this.loadMap('hideout');
    }

    setupUI() {
        const startBtn = document.getElementById('start-btn');
        const respawnBtn = document.getElementById('respawn-btn');
        const continueBtn = document.getElementById('continue-btn');

        startBtn.addEventListener('click', () => {
            this.running = true;
            document.getElementById('start-screen').style.display = 'none';
        });

        respawnBtn.addEventListener('click', () => {
            document.getElementById('death-screen').style.display = 'none';
            this.respawn();
        });

        continueBtn.addEventListener('click', () => {
            document.getElementById('extract-screen').style.display = 'none';
        });

        // Map Selection
        document.querySelectorAll('.map-card').forEach(card => {
            card.addEventListener('click', () => {
                const mapId = card.dataset.map;
                this.startRaid(mapId);
            });
        });

        // Craft Tabs
        document.querySelectorAll('.craft-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.craft-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderCraftContent(tab.dataset.tab);
            });
        });
    }

    loadMap(mapId) {
        this.currentMap = mapId;
        this.mapConfig = MAP_CONFIGS[mapId];
        this.worldWidth = this.mapConfig.width;
        this.worldHeight = this.mapConfig.height;

        // Clear objects
        this.gameObjects = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];

        // Set player position
        if (mapId === 'hideout') {
            this.player.x = this.worldWidth / 2;
            this.player.y = this.worldHeight / 2;
            this.inRaid = false;
            this.loadHideout();
        } else {
            this.inRaid = true;
            this.loadRaidMap();
        }

        this.updateLocationUI();
    }

    loadHideout() {
        const cx = this.worldWidth / 2;
        const cy = this.worldHeight / 2;

        // Create hideout structures
        this.gameObjects.push(new Stash(cx + 150, cy - 100));
        this.gameObjects.push(new Workbench(cx - 150, cy - 100));
        this.gameObjects.push(new MedStation(cx, cy - 150));
        this.gameObjects.push(new Portal(cx, cy + 150, 'mapselect'));

        // Walls based on level
        const wallDef = this.hideoutLevels.walls;
        if (wallDef >= 1) {
            for (let i = -3; i <= 3; i++) {
                if (Math.abs(i) > 1) {
                    this.gameObjects.push(new Wall(cx + i * 60, cy - 250));
                    this.gameObjects.push(new Wall(cx + i * 60, cy + 250));
                }
                this.gameObjects.push(new Wall(cx - 250, cy + i * 60));
                this.gameObjects.push(new Wall(cx + 250, cy + i * 60));
            }
        }

        // Some decoration trees
        for (let i = 0; i < 20; i++) {
            const x = randomInt(100, this.worldWidth - 100);
            const y = randomInt(100, this.worldHeight - 100);
            const distToCenter = distance(x, y, cx, cy);
            if (distToCenter > 350) {
                this.gameObjects.push(new Tree(x, y));
            }
        }

        this.addFloatingText(cx, cy - 80, 'HIDEOUT', 'cyan');
    }

    loadRaidMap() {
        const config = this.mapConfig;

        // Set raid time
        this.raidTime = config.raidTime;
        this.raidStartTime = Date.now();
        this.raidKills = 0;

        // Spawn player at random edge
        this.player.x = 200;
        this.player.y = 200;

        // Create extraction points
        config.extracts.forEach(ext => {
            this.gameObjects.push(new Extract(ext.x, ext.y, ext.name));
        });

        // Spawn trees (for Woods and other maps)
        const treeCount = config.treeCount || 50;
        for (let i = 0; i < treeCount; i++) {
            this.gameObjects.push(new Tree(
                randomInt(100, this.worldWidth - 100),
                randomInt(100, this.worldHeight - 100)
            ));
        }

        // Spawn rocks
        for (let i = 0; i < 30; i++) {
            this.gameObjects.push(new Stone(
                randomInt(100, this.worldWidth - 100),
                randomInt(100, this.worldHeight - 100)
            ));
        }

        // Spawn loot crates
        const lootTypes = ['weapon_crate', 'medical_crate', 'supply_crate', 'tool_crate', 'safe'];
        for (let i = 0; i < (config.lootSpots || 20); i++) {
            const type = lootTypes[randomInt(0, lootTypes.length - 1)];
            this.gameObjects.push(new LootCrate(
                randomInt(200, this.worldWidth - 200),
                randomInt(200, this.worldHeight - 200),
                type
            ));
        }

        // Spawn enemies
        this.spawnEnemies(config.enemies);

        // Create structures
        config.structures.forEach(struct => {
            this.createStructure(struct);
        });

        this.addFloatingText(this.player.x, this.player.y - 50, `RAID: ${config.name}`, 'red');
    }

    spawnEnemies(enemyConfig) {
        for (const [type, count] of Object.entries(enemyConfig || {})) {
            for (let i = 0; i < count; i++) {
                const x = randomInt(300, this.worldWidth - 300);
                const y = randomInt(300, this.worldHeight - 300);

                let enemy;
                switch (type) {
                    case 'scav':
                        enemy = new Scav(x, y, false);
                        break;
                    case 'scav_armed':
                        enemy = new Scav(x, y, true);
                        break;
                    case 'pmc_usec':
                        enemy = new PMC(x, y, 'usec');
                        break;
                    case 'pmc_bear':
                        enemy = new PMC(x, y, 'bear');
                        break;
                    case 'zombie':
                        enemy = new Zombie(x, y);
                        break;
                    case 'zombie_fast':
                        enemy = new ZombieFast(x, y);
                        break;
                    case 'zombie_tank':
                        enemy = new ZombieTank(x, y);
                        break;
                    case 'zombie_spitter':
                        enemy = new ZombieSpitter(x, y);
                        break;
                    case 'killa':
                        enemy = new Boss(x, y, 'killa');
                        break;
                    default:
                        continue;
                }
                this.enemies.push(enemy);
            }
        }
    }

    createStructure(struct) {
        switch (struct.type) {
            case 'building':
            case 'warehouse':
            case 'mall':
                // Create walls around the building
                const cols = Math.floor(struct.w / 50);
                const rows = Math.floor(struct.h / 50);
                for (let i = 0; i < cols; i++) {
                    if (i !== Math.floor(cols / 2)) { // Leave door
                        this.gameObjects.push(new Wall(struct.x - struct.w / 2 + i * 50 + 25, struct.y - struct.h / 2));
                        this.gameObjects.push(new Wall(struct.x - struct.w / 2 + i * 50 + 25, struct.y + struct.h / 2));
                    }
                }
                for (let i = 1; i < rows; i++) {
                    this.gameObjects.push(new Wall(struct.x - struct.w / 2, struct.y - struct.h / 2 + i * 50));
                    this.gameObjects.push(new Wall(struct.x + struct.w / 2, struct.y - struct.h / 2 + i * 50));
                }
                // Add loot inside
                for (let i = 0; i < 3; i++) {
                    this.gameObjects.push(new LootCrate(
                        struct.x + randomInt(-100, 100),
                        struct.y + randomInt(-50, 50),
                        'safe'
                    ));
                }
                break;
            case 'wall':
                for (let i = 0; i < struct.w / 50; i++) {
                    this.gameObjects.push(new Wall(struct.x + i * 50, struct.y));
                }
                break;
        }
    }

    startRaid(mapId) {
        this.toggleMapSelection();
        // Save current backpack to raid inventory
        this.loadMap(mapId);
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

        // Check for panel toggles
        this.handleUIInput();

        // Don't update game while panels are open
        if (this.inventoryOpen || this.mapSelectionOpen || this.craftPanelOpen || this.lootPanelOpen) {
            return;
        }

        // Update player
        if (this.player && this.player.alive) {
            this.player.update(deltaTime, this.input);

            // Handle attacks
            if (this.player.justAttacked) {
                this.handlePlayerAttack();
                this.player.justAttacked = false;
            }

            // Handle reload
            if (this.input.isKeyDown('KeyR')) {
                this.player.reload();
            }

            // Handle medkit use
            if (this.input.isKeyDown('KeyE') && this.player.medkitCooldown <= 0) {
                this.useMedkit();
            }

            // Boundary collision
            this.player.x = Math.max(30, Math.min(this.worldWidth - 30, this.player.x));
            this.player.y = Math.max(30, Math.min(this.worldHeight - 30, this.player.y));

            // Object collision
            for (const obj of this.gameObjects) {
                if (!obj.active || !obj.solid) continue;
                if (checkCircleCollision(this.player, obj)) {
                    this.resolveCollision(this.player, obj);
                }
            }

            // Camera follow
            this.camera.x = this.player.x - this.width / 2;
            this.camera.y = this.player.y - this.height / 2;
        }

        // Update game objects
        this.gameObjects.forEach(obj => obj.update(deltaTime, this));
        this.gameObjects = this.gameObjects.filter(obj => obj.active);

        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                enemy.update(deltaTime, this);
            }
        });
        this.enemies = this.enemies.filter(e => e.active);

        // Update projectiles
        this.updateProjectiles(deltaTime);

        // Update effects
        this.effects.forEach(e => e.update(deltaTime));
        this.effects = this.effects.filter(e => e.active);

        // Handle interactions
        this.handleInteraction();

        // Raid timer
        if (this.inRaid) {
            this.raidTime -= deltaTime;
            if (this.raidTime <= 0) {
                this.playerDeath('Time ran out');
            }
            this.updateRaidTimerUI();
        }

        // Rare zombie spawn in hideout
        if (!this.inRaid && this.mapConfig.rareZombieSpawn) {
            this.zombieSpawnTimer += deltaTime;
            if (this.zombieSpawnTimer > 10000) { // Check every 10 seconds
                this.zombieSpawnTimer = 0;
                if (Math.random() < this.mapConfig.rareZombieChance * 10) { // Adjust for 10s interval
                    this.spawnRareZombie();
                }
            }
        }

        // Status decay (energy, hydration)
        this.statusDecayTimer += deltaTime;
        if (this.statusDecayTimer > 5000) { // Every 5 seconds
            this.statusDecayTimer = 0;
            if (this.inRaid) {
                this.player.energy = Math.max(0, this.player.energy - 0.5);
                this.player.hydration = Math.max(0, this.player.hydration - 0.3);

                if (this.player.energy <= 0 || this.player.hydration <= 0) {
                    this.player.hp -= 1;
                }
            }
        }

        // Check player death
        if (this.player.hp <= 0 && this.player.alive) {
            this.playerDeath(this.killedBy || 'Unknown');
        }

        this.updateUI();
    }

    handleUIInput() {
        // Tab for inventory
        if (this.input.isKeyDown('Tab')) {
            this.input.keys.delete('Tab');
            if (!this.mapSelectionOpen && !this.craftPanelOpen) {
                this.toggleInventory();
            }
        }

        // Escape to close panels
        if (this.input.isKeyDown('Escape')) {
            this.input.keys.delete('Escape');
            this.closeAllPanels();
        }
    }

    handlePlayerAttack() {
        const weapon = this.player.currentWeapon;

        if (weapon.type === 'melee') {
            this.handleMeleeAttack();
        } else {
            this.handleGunAttack();
        }
    }

    handleMeleeAttack() {
        const range = 60;
        const weapon = this.player.currentWeapon;

        // Check enemies
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            const dist = distance(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < range + enemy.radius) {
                const angleToEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
                let angleDiff = angleToEnemy - this.player.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                if (Math.abs(angleDiff) < Math.PI / 3) {
                    this.damageEnemy(enemy, weapon.damage);
                }
            }
        });

        // Check breakable objects
        this.gameObjects.forEach(obj => {
            if (!obj.active || !obj.health) return;
            const dist = distance(this.player.x, this.player.y, obj.x, obj.y);
            if (dist < range + obj.radius) {
                obj.health -= weapon.damage;
                this.addFloatingText(obj.x, obj.y - 20, `-${weapon.damage}`, 'white');
                if (obj.health <= 0) {
                    this.handleObjectDeath(obj);
                }
            }
        });
    }

    handleGunAttack() {
        const weapon = this.player.currentWeapon;

        if (weapon.type === 'shotgun') {
            for (let i = 0; i < weapon.pellets; i++) {
                const spread = (Math.random() - 0.5) * weapon.spread;
                this.addProjectile(
                    this.player.x + Math.cos(this.player.angle) * 30,
                    this.player.y + Math.sin(this.player.angle) * 30,
                    this.player.angle + spread,
                    'player',
                    {
                        damage: weapon.damage,
                        speed: weapon.bulletSpeed,
                        life: weapon.range / weapon.bulletSpeed,
                        color: weapon.color
                    }
                );
            }
        } else {
            const spread = (Math.random() - 0.5) * (1 - weapon.accuracy) * 0.2;
            this.addProjectile(
                this.player.x + Math.cos(this.player.angle) * 30,
                this.player.y + Math.sin(this.player.angle) * 30,
                this.player.angle + spread,
                'player',
                {
                    damage: weapon.damage,
                    speed: weapon.bulletSpeed,
                    life: weapon.range / weapon.bulletSpeed,
                    color: weapon.color
                }
            );
        }

        // Muzzle flash
        this.effects.push(new MuzzleFlash(
            this.player.x + Math.cos(this.player.angle) * 35,
            this.player.y + Math.sin(this.player.angle) * 35
        ));
    }

    updateProjectiles(deltaTime) {
        this.projectiles.forEach(p => {
            p.update(deltaTime);
            if (!p.active) return;

            if (p.owner === 'player') {
                // Hit enemies
                for (const enemy of this.enemies) {
                    if (!enemy.active) continue;
                    if (checkCircleCollision(p, enemy)) {
                        p.active = false;
                        this.damageEnemy(enemy, p.damage);
                        break;
                    }
                }
                // Hit objects
                for (const obj of this.gameObjects) {
                    if (!obj.active || !obj.solid) continue;
                    if (checkCircleCollision(p, obj)) {
                        p.active = false;
                        if (obj.health !== undefined) {
                            obj.health -= p.damage;
                            if (obj.health <= 0) {
                                this.handleObjectDeath(obj);
                            }
                        }
                        break;
                    }
                }
            } else {
                // Enemy projectile - hit player
                if (checkCircleCollision(p, this.player)) {
                    p.active = false;
                    this.damagePlayer(p.damage, p.owner);
                }
            }
        });
        this.projectiles = this.projectiles.filter(p => p.active);
    }

    damageEnemy(enemy, damage) {
        enemy.health -= damage;
        this.addFloatingText(enemy.x, enemy.y - 30, `-${damage}`, '#ff6666');
        this.effects.push(new BloodSplatter(enemy.x, enemy.y));

        if (enemy.health <= 0) {
            enemy.active = false;
            this.raidKills++;
            this.player.xp += enemy.xpValue || 50;
            this.addKillFeed(`You killed ${enemy.name}`, true);

            // Drop loot
            if (enemy.lootTable) {
                this.spawnEnemyLoot(enemy);
            }
        } else {
            // Alert enemy
            enemy.alerted = true;
            enemy.target = this.player;
        }
    }

    damagePlayer(damage, source) {
        // Apply armor reduction
        let finalDamage = damage;
        if (this.player.armor) {
            const reduction = this.player.armor.armorValue / 100;
            finalDamage = Math.floor(damage * (1 - reduction));
            this.player.armor.durability -= damage * 0.1;
            if (this.player.armor.durability <= 0) {
                this.player.armor = null;
            }
        }

        this.player.hp -= finalDamage;
        this.killedBy = source;
        this.addFloatingText(this.player.x, this.player.y - 40, `-${finalDamage}`, 'red');
        this.effects.push(new BloodSplatter(this.player.x, this.player.y));

        // Screen shake effect (simple)
        this.camera.x += (Math.random() - 0.5) * 10;
        this.camera.y += (Math.random() - 0.5) * 10;
    }

    spawnEnemyLoot(enemy) {
        const loot = [];
        enemy.lootTable.forEach(itemId => {
            if (Math.random() < 0.5) {
                const item = ITEMS[itemId];
                if (item) {
                    loot.push({ ...item, count: item.type === 'currency' ? randomInt(100, 1000) : 1 });
                }
            }
        });

        if (loot.length > 0) {
            const crate = new LootCrate(enemy.x, enemy.y, 'dead_scav');
            crate.customLoot = loot;
            this.gameObjects.push(crate);
        }
    }

    handleInteraction() {
        if (!this.input.isKeyDown('KeyF') || this.player.interactCooldown > 0) return;
        this.player.interactCooldown = 300;

        // Find nearest interactable
        let nearest = null;
        let nearestDist = 80;

        for (const obj of this.gameObjects) {
            if (!obj.active || !obj.interactable) continue;
            const dist = distance(this.player.x, this.player.y, obj.x, obj.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = obj;
            }
        }

        if (nearest) {
            this.interact(nearest);
        }
    }

    interact(obj) {
        switch (obj.type) {
            case 'portal':
                if (obj.destination === 'mapselect') {
                    this.toggleMapSelection();
                }
                break;
            case 'extract':
                if (this.inRaid) {
                    this.extract();
                }
                break;
            case 'stash':
                this.toggleInventory();
                break;
            case 'workbench':
            case 'medstation':
                this.toggleCraftPanel();
                break;
            case 'loot_crate':
                this.openLootPanel(obj);
                break;
        }
    }

    openLootPanel(crate) {
        this.currentLoot = crate;
        this.lootPanelOpen = true;
        document.getElementById('loot-panel').classList.remove('hidden');

        // Generate loot
        const lootItems = crate.customLoot || this.generateLoot(crate.lootType);
        crate.loot = lootItems;

        this.renderLootItems(lootItems);
    }

    generateLoot(tableId) {
        const table = LOOT_TABLES[tableId];
        if (!table) return [];

        const loot = [];

        // Guaranteed items
        table.guaranteed.forEach(itemId => {
            const item = ITEMS[itemId];
            if (item) {
                loot.push({ ...item, count: 1 });
            }
        });

        // Random items
        table.random.forEach(entry => {
            if (Math.random() < entry.chance) {
                const item = ITEMS[entry.item];
                if (item) {
                    let count = 1;
                    if (Array.isArray(entry.count)) {
                        count = randomInt(entry.count[0], entry.count[1]);
                    } else {
                        count = entry.count;
                    }
                    loot.push({ ...item, count });
                }
            }
        });

        return loot;
    }

    renderLootItems(items) {
        const container = document.getElementById('loot-items');
        container.innerHTML = '';

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `loot-item rarity-${item.rarity}`;
            div.innerHTML = `
                <div class="loot-item-icon" style="color: ${item.color}">${item.icon}</div>
                <div class="loot-item-name">${item.name}${item.count > 1 ? ` x${item.count}` : ''}</div>
            `;
            div.onclick = () => this.takeLootItem(index);
            container.appendChild(div);
        });
    }

    takeLootItem(index) {
        if (!this.currentLoot || !this.currentLoot.loot) return;

        const item = this.currentLoot.loot[index];
        if (this.addToBackpack(item)) {
            this.currentLoot.loot.splice(index, 1);
            this.renderLootItems(this.currentLoot.loot);

            if (this.currentLoot.loot.length === 0) {
                this.currentLoot.active = false;
                this.closeLootPanel();
            }
        }
    }

    takeAllLoot() {
        if (!this.currentLoot || !this.currentLoot.loot) return;

        const remaining = [];
        this.currentLoot.loot.forEach(item => {
            if (!this.addToBackpack(item)) {
                remaining.push(item);
            }
        });

        this.currentLoot.loot = remaining;
        if (remaining.length === 0) {
            this.currentLoot.active = false;
            this.closeLootPanel();
        } else {
            this.renderLootItems(remaining);
        }
    }

    closeLootPanel() {
        this.lootPanelOpen = false;
        this.currentLoot = null;
        document.getElementById('loot-panel').classList.add('hidden');
    }

    addToBackpack(item) {
        if (this.player.backpack.length >= this.player.backpackSize) {
            this.addFloatingText(this.player.x, this.player.y - 40, 'Backpack full!', 'red');
            return false;
        }

        // Check weight
        const newWeight = this.player.currentWeight + (item.weight * item.count);
        if (newWeight > this.player.maxWeight) {
            this.addFloatingText(this.player.x, this.player.y - 40, 'Too heavy!', 'red');
            return false;
        }

        // Stack if possible
        const existing = this.player.backpack.find(i => i.id === item.id && i.type !== 'weapon');
        if (existing) {
            existing.count += item.count;
        } else {
            this.player.backpack.push({ ...item });
        }

        this.player.currentWeight = newWeight;
        return true;
    }

    useMedkit() {
        const medkit = this.player.backpack.find(item =>
            item.type === 'medical' && item.healAmount
        );

        if (medkit && this.player.hp < this.player.maxHp) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + medkit.healAmount);
            medkit.count--;
            if (medkit.count <= 0) {
                const idx = this.player.backpack.indexOf(medkit);
                this.player.backpack.splice(idx, 1);
            }
            this.player.medkitCooldown = 2000;
            this.addFloatingText(this.player.x, this.player.y - 40, `+${medkit.healAmount} HP`, 'green');
        }
    }

    extract() {
        // Transfer backpack to stash
        this.player.backpack.forEach(item => {
            // Convert to resources if applicable
            if (item.type === 'resource') {
                switch (item.id) {
                    case 'wood': this.resources.wood += item.count; break;
                    case 'metal': this.resources.metal += item.count; break;
                    case 'parts': this.resources.parts += item.count; break;
                    case 'electronics': this.resources.parts += item.count * 2; break;
                    case 'fuel': this.resources.food += item.count * 2; break;
                }
            } else if (item.id === 'roubles') {
                this.resources.roubles += item.count;
            } else {
                this.stash.push(item);
            }
        });

        // Show extract screen
        const timeSurvived = Date.now() - this.raidStartTime;
        const xpGained = this.raidKills * 100 + Math.floor(timeSurvived / 1000);

        document.getElementById('raid-time').textContent = this.formatTime(timeSurvived);
        document.getElementById('raid-kills').textContent = this.raidKills;
        document.getElementById('raid-xp').textContent = `+${xpGained}`;

        // Render loot summary
        const summary = document.getElementById('loot-summary');
        summary.innerHTML = '';
        this.player.backpack.forEach(item => {
            const div = document.createElement('div');
            div.className = 'loot-summary-item';
            div.textContent = `${item.name}${item.count > 1 ? ` x${item.count}` : ''}`;
            summary.appendChild(div);
        });

        document.getElementById('extract-screen').style.display = 'flex';

        // Clear backpack and return to hideout
        this.player.backpack = [];
        this.player.currentWeight = 0;
        this.player.xp += xpGained;
        this.loadMap('hideout');
    }

    playerDeath(cause) {
        this.player.alive = false;

        document.getElementById('killed-by').textContent = cause;
        document.getElementById('time-survived').textContent = this.formatTime(Date.now() - this.raidStartTime);
        document.getElementById('loot-lost').textContent = `${this.player.backpack.length} items`;

        document.getElementById('death-screen').style.display = 'flex';
        this.addKillFeed(`You were killed by ${cause}`, false);
    }

    respawn() {
        this.player.alive = true;
        this.player.hp = this.player.maxHp;
        this.player.energy = 100;
        this.player.hydration = 100;
        this.player.backpack = [];
        this.player.currentWeight = 0;
        this.killedBy = null;

        this.loadMap('hideout');
    }

    spawnRareZombie() {
        // Spawn zombie at edge of hideout
        const angle = Math.random() * Math.PI * 2;
        const dist = 400;
        const x = this.worldWidth / 2 + Math.cos(angle) * dist;
        const y = this.worldHeight / 2 + Math.sin(angle) * dist;

        const zombie = new Zombie(x, y);
        this.enemies.push(zombie);

        this.addFloatingText(x, y - 30, 'INTRUDER!', 'red');
        this.addKillFeed('A zombie has breached the perimeter!', false);
    }

    handleObjectDeath(obj) {
        obj.active = false;

        // Give resources
        if (obj.resourceType) {
            const resource = obj.resourceType;
            const amount = obj.resourceAmount || 1;

            if (this.inRaid) {
                // Add to backpack
                const item = ITEMS[resource];
                if (item) {
                    this.addToBackpack({ ...item, count: amount });
                }
            } else {
                // Add to resources directly
                if (this.resources[resource] !== undefined) {
                    this.resources[resource] += amount;
                }
            }

            this.addFloatingText(obj.x, obj.y - 30, `+${amount} ${resource}`, 'lime');
        }
    }

    resolveCollision(entity, obj) {
        const dx = entity.x - obj.x;
        const dy = entity.y - obj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const overlap = (entity.radius + obj.radius) - dist;

        if (overlap > 0 && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            entity.x += nx * overlap;
            entity.y += ny * overlap;
        }
    }

    // UI Methods
    toggleInventory() {
        this.inventoryOpen = !this.inventoryOpen;
        const panel = document.getElementById('inventory-panel');
        if (this.inventoryOpen) {
            panel.classList.remove('hidden');
            this.renderInventory();
        } else {
            panel.classList.add('hidden');
        }
    }

    toggleMapSelection() {
        this.mapSelectionOpen = !this.mapSelectionOpen;
        const panel = document.getElementById('map-selection');
        if (this.mapSelectionOpen) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }

    toggleCraftPanel() {
        this.craftPanelOpen = !this.craftPanelOpen;
        const panel = document.getElementById('craft-panel');
        if (this.craftPanelOpen) {
            panel.classList.remove('hidden');
            this.renderCraftContent('workbench');
        } else {
            panel.classList.add('hidden');
        }
    }

    closeAllPanels() {
        this.inventoryOpen = false;
        this.mapSelectionOpen = false;
        this.craftPanelOpen = false;
        this.lootPanelOpen = false;

        document.getElementById('inventory-panel').classList.add('hidden');
        document.getElementById('map-selection').classList.add('hidden');
        document.getElementById('craft-panel').classList.add('hidden');
        document.getElementById('loot-panel').classList.add('hidden');
    }

    renderInventory() {
        // Render backpack
        const backpackGrid = document.getElementById('backpack-grid');
        backpackGrid.innerHTML = '';
        document.getElementById('backpack-space').textContent = `${this.player.backpack.length}/${this.player.backpackSize}`;

        for (let i = 0; i < this.player.backpackSize; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';

            if (this.player.backpack[i]) {
                const item = this.player.backpack[i];
                slot.innerHTML = `<span style="color: ${item.color}">${item.icon}</span>`;
                if (item.count > 1) {
                    slot.innerHTML += `<span class="item-count">${item.count}</span>`;
                }
                slot.classList.add(`rarity-${item.rarity}`);
            }

            backpackGrid.appendChild(slot);
        }

        // Render stash
        const stashGrid = document.getElementById('stash-grid');
        stashGrid.innerHTML = '';
        document.getElementById('stash-space').textContent = `${this.stash.length}/${this.stashSize}`;

        for (let i = 0; i < Math.min(this.stashSize, 50); i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';

            if (this.stash[i]) {
                const item = this.stash[i];
                slot.innerHTML = `<span style="color: ${item.color}">${item.icon}</span>`;
                if (item.count > 1) {
                    slot.innerHTML += `<span class="item-count">${item.count}</span>`;
                }
                slot.classList.add(`rarity-${item.rarity}`);
            }

            stashGrid.appendChild(slot);
        }
    }

    renderCraftContent(tab) {
        const content = document.getElementById('craft-content');
        const recipes = CRAFTING_RECIPES[tab] || [];

        content.innerHTML = '';

        recipes.forEach(recipe => {
            const canCraft = this.canCraft(recipe);

            const div = document.createElement('div');
            div.className = 'craft-item';
            div.innerHTML = `
                <div class="craft-info">
                    <h4>${recipe.name}</h4>
                    <div class="craft-requirements">
                        ${Object.entries(recipe.requirements).map(([res, amount]) =>
                `<span style="color: ${this.resources[res] >= amount ? '#2ecc71' : '#e74c3c'}">${res}: ${amount}</span>`
            ).join(' | ')}
                    </div>
                </div>
                <button class="craft-btn" ${!canCraft ? 'disabled' : ''}>CRAFT</button>
            `;

            div.querySelector('.craft-btn').onclick = () => this.craft(recipe);
            content.appendChild(div);
        });

        // Update resources display
        document.getElementById('res-wood').textContent = this.resources.wood;
        document.getElementById('res-metal').textContent = this.resources.metal;
        document.getElementById('res-parts').textContent = this.resources.parts;
        document.getElementById('res-medical').textContent = this.resources.medical;
        document.getElementById('res-food').textContent = this.resources.food;
        document.getElementById('res-roubles').textContent = this.resources.roubles;
    }

    canCraft(recipe) {
        for (const [res, amount] of Object.entries(recipe.requirements)) {
            if ((this.resources[res] || 0) < amount) return false;
        }
        return true;
    }

    craft(recipe) {
        if (!this.canCraft(recipe)) return;

        // Deduct resources
        for (const [res, amount] of Object.entries(recipe.requirements)) {
            this.resources[res] -= amount;
        }

        // Add item to stash
        const item = ITEMS[recipe.output.item];
        if (item) {
            for (let i = 0; i < recipe.output.count; i++) {
                this.stash.push({ ...item, count: 1 });
            }
        }

        this.addFloatingText(this.player.x, this.player.y - 40, `Crafted ${recipe.name}!`, 'green');
        this.renderCraftContent(document.querySelector('.craft-tab.active').dataset.tab);
    }

    updateUI() {
        // HP
        const hpPct = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('hp-bar').style.width = `${hpPct}%`;
        document.getElementById('hp-text').textContent = `${Math.floor(this.player.hp)}/${this.player.maxHp}`;

        // Energy
        document.getElementById('energy-bar').style.width = `${this.player.energy}%`;
        document.getElementById('energy-text').textContent = `${Math.floor(this.player.energy)}/100`;

        // Hydration
        document.getElementById('hydration-bar').style.width = `${this.player.hydration}%`;
        document.getElementById('hydration-text').textContent = `${Math.floor(this.player.hydration)}/100`;

        // Armor
        document.getElementById('armor-value').textContent = this.player.armor ? this.player.armor.armorValue : 0;

        // Weight
        document.getElementById('weight-value').textContent = `${this.player.currentWeight.toFixed(1)}/${this.player.maxWeight}`;

        // Weapon
        const weapon = this.player.currentWeapon;
        document.getElementById('weapon-name').textContent = weapon.name;
        document.getElementById('ammo-count').textContent = weapon.type === 'melee' ? '--' : `${this.player.currentMag}/${weapon.magSize}`;

        // Low HP warning
        document.body.classList.toggle('low-hp', hpPct < 25);
    }

    updateLocationUI() {
        document.getElementById('location-name').textContent = this.mapConfig.name.toUpperCase();

        if (this.inRaid) {
            document.getElementById('raid-timer').style.display = 'block';
        } else {
            document.getElementById('raid-timer').style.display = 'none';
        }
    }

    updateRaidTimerUI() {
        const timer = document.getElementById('raid-timer');
        timer.textContent = this.formatTime(this.raidTime);

        if (this.raidTime < 5 * 60 * 1000) {
            timer.style.color = '#ff0000';
        }
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    addFloatingText(x, y, text, color) {
        this.effects.push(new FloatingText(x, y, text, color));
    }

    addProjectile(x, y, angle, owner, stats) {
        this.projectiles.push(new Projectile(x, y, angle, owner, stats));
    }

    addKillFeed(message, isPlayerKill) {
        const feed = document.getElementById('kill-feed');
        const entry = document.createElement('div');
        entry.className = `kill-entry ${isPlayerKill ? 'player-kill' : ''}`;
        entry.textContent = message;
        feed.appendChild(entry);

        // Remove after 5 seconds
        setTimeout(() => {
            entry.remove();
        }, 5000);

        // Limit to 5 entries
        while (feed.children.length > 5) {
            feed.removeChild(feed.firstChild);
        }
    }

    // Drawing
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Background
        this.ctx.fillStyle = this.mapConfig.bgColor || '#4CA64C';
        this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

        // Grid
        this.drawGrid();

        // Draw game objects
        this.gameObjects.forEach(obj => obj.draw(this.ctx));

        // Draw enemies
        this.enemies.forEach(enemy => {
            if (enemy.active) enemy.draw(this.ctx);
        });

        // Draw projectiles
        this.projectiles.forEach(p => p.draw(this.ctx));

        // Draw effects
        this.effects.forEach(e => e.draw(this.ctx));

        // Draw player
        if (this.player && this.player.alive) {
            this.player.draw(this.ctx);
        }

        this.ctx.restore();

        // Draw minimap
        this.drawMiniMap();
    }

    drawGrid() {
        const gridSize = 100;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const endX = startX + this.width + gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endY = startY + this.height + gridSize;

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
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

    drawMiniMap() {
        const canvas = document.getElementById('miniMapCanvas');
        const ctx = canvas.getContext('2d');
        const scale = 200 / Math.max(this.worldWidth, this.worldHeight);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, 200, 200);

        // Draw objects
        this.gameObjects.forEach(obj => {
            if (obj.type === 'extract') {
                ctx.fillStyle = '#00ff00';
            } else if (obj.solid) {
                ctx.fillStyle = '#666';
            } else {
                ctx.fillStyle = '#333';
            }
            ctx.beginPath();
            ctx.arc(obj.x * scale, obj.y * scale, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw enemies
        this.enemies.forEach(enemy => {
            ctx.fillStyle = enemy.type === 'zombie' ? '#2d5a27' : '#c0392b';
            ctx.beginPath();
            ctx.arc(enemy.x * scale, enemy.y * scale, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw player
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(this.player.x * scale, this.player.y * scale, 4, 0, Math.PI * 2);
        ctx.fill();

        // Player direction
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.player.x * scale, this.player.y * scale);
        ctx.lineTo(
            this.player.x * scale + Math.cos(this.player.angle) * 10,
            this.player.y * scale + Math.sin(this.player.angle) * 10
        );
        ctx.stroke();
    }
}
