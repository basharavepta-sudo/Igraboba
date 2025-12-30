// Game Data - Items, Weapons, Enemies, Maps

export const ITEMS = {
    // Medical
    salewa: { id: 'salewa', name: 'Salewa', type: 'medical', icon: '+', color: '#ff4444', healAmount: 50, weight: 0.5, rarity: 'uncommon', value: 15000 },
    ifak: { id: 'ifak', name: 'IFAK', type: 'medical', icon: '+', color: '#ff6666', healAmount: 30, weight: 0.3, rarity: 'common', value: 8000 },
    car_medkit: { id: 'car_medkit', name: 'Car Medkit', type: 'medical', icon: '+', color: '#ff8888', healAmount: 20, weight: 0.2, rarity: 'common', value: 3000 },
    grizzly: { id: 'grizzly', name: 'Grizzly', type: 'medical', icon: '+', color: '#00ff00', healAmount: 100, weight: 1.0, rarity: 'rare', value: 30000 },

    // Food & Water
    water: { id: 'water', name: 'Water Bottle', type: 'consumable', icon: 'W', color: '#3498db', hydration: 50, weight: 0.3, rarity: 'common', value: 1000 },
    juice: { id: 'juice', name: 'Juice Box', type: 'consumable', icon: 'J', color: '#e74c3c', hydration: 30, energy: 10, weight: 0.2, rarity: 'common', value: 1500 },
    mre: { id: 'mre', name: 'MRE', type: 'consumable', icon: 'M', color: '#8B4513', energy: 60, weight: 0.5, rarity: 'uncommon', value: 5000 },
    crackers: { id: 'crackers', name: 'Crackers', type: 'consumable', icon: 'C', color: '#f1c40f', energy: 20, weight: 0.1, rarity: 'common', value: 800 },

    // Resources
    wood: { id: 'wood', name: 'Wood', type: 'resource', icon: '#', color: '#8B4513', weight: 0.5, rarity: 'common', value: 500 },
    metal: { id: 'metal', name: 'Metal Scrap', type: 'resource', icon: 'M', color: '#71797E', weight: 0.3, rarity: 'common', value: 800 },
    parts: { id: 'parts', name: 'Weapon Parts', type: 'resource', icon: 'P', color: '#4a9eff', weight: 0.2, rarity: 'uncommon', value: 3000 },
    electronics: { id: 'electronics', name: 'Electronics', type: 'resource', icon: 'E', color: '#00ff88', weight: 0.1, rarity: 'rare', value: 8000 },
    fuel: { id: 'fuel', name: 'Fuel', type: 'resource', icon: 'F', color: '#ff6600', weight: 0.8, rarity: 'uncommon', value: 5000 },

    // Ammo
    ammo_9mm: { id: 'ammo_9mm', name: '9x19mm', type: 'ammo', icon: '.', color: '#f1c40f', caliber: '9mm', weight: 0.01, rarity: 'common', value: 50 },
    ammo_545: { id: 'ammo_545', name: '5.45x39mm', type: 'ammo', icon: '.', color: '#e67e22', caliber: '5.45', weight: 0.01, rarity: 'common', value: 80 },
    ammo_762: { id: 'ammo_762', name: '7.62x39mm', type: 'ammo', icon: '.', color: '#c0392b', caliber: '7.62', weight: 0.015, rarity: 'uncommon', value: 100 },
    ammo_12g: { id: 'ammo_12g', name: '12/70 Buckshot', type: 'ammo', icon: 'O', color: '#e74c3c', caliber: '12g', weight: 0.02, rarity: 'common', value: 60 },

    // Valuables
    roubles: { id: 'roubles', name: 'Roubles', type: 'currency', icon: 'R', color: '#c5a000', weight: 0, rarity: 'common', value: 1 },
    bitcoin: { id: 'bitcoin', name: 'Bitcoin', type: 'valuable', icon: 'B', color: '#f7931a', weight: 0.1, rarity: 'legendary', value: 500000 },
    gold_chain: { id: 'gold_chain', name: 'Gold Chain', type: 'valuable', icon: 'G', color: '#f1c40f', weight: 0.1, rarity: 'rare', value: 50000 },
    rolex: { id: 'rolex', name: 'Rolex Watch', type: 'valuable', icon: 'R', color: '#f1c40f', weight: 0.1, rarity: 'epic', value: 150000 },

    // Keys
    dorm_key: { id: 'dorm_key', name: 'Dorm Room Key', type: 'key', icon: 'K', color: '#9b59b6', weight: 0.01, rarity: 'rare', value: 30000 },
    factory_key: { id: 'factory_key', name: 'Factory Key', type: 'key', icon: 'K', color: '#3498db', weight: 0.01, rarity: 'epic', value: 100000 }
};

export const WEAPONS = {
    pm: {
        id: 'pm',
        name: 'PM Pistol',
        type: 'pistol',
        damage: 25,
        fireRate: 300,
        magSize: 8,
        reloadTime: 2000,
        range: 300,
        accuracy: 0.9,
        recoil: 0.05,
        bulletSpeed: 0.8,
        caliber: '9mm',
        weight: 0.7,
        rarity: 'common',
        value: 8000,
        color: '#2c3e50'
    },
    tt: {
        id: 'tt',
        name: 'TT Pistol',
        type: 'pistol',
        damage: 35,
        fireRate: 250,
        magSize: 8,
        reloadTime: 2200,
        range: 350,
        accuracy: 0.85,
        recoil: 0.08,
        bulletSpeed: 0.9,
        caliber: '7.62',
        weight: 0.85,
        rarity: 'common',
        value: 12000,
        color: '#34495e'
    },
    ak74: {
        id: 'ak74',
        name: 'AK-74',
        type: 'rifle',
        damage: 40,
        fireRate: 100,
        magSize: 30,
        reloadTime: 3000,
        range: 600,
        accuracy: 0.8,
        recoil: 0.12,
        bulletSpeed: 1.2,
        caliber: '5.45',
        weight: 3.5,
        rarity: 'uncommon',
        value: 35000,
        color: '#8e44ad'
    },
    akm: {
        id: 'akm',
        name: 'AKM',
        type: 'rifle',
        damage: 50,
        fireRate: 120,
        magSize: 30,
        reloadTime: 3200,
        range: 550,
        accuracy: 0.75,
        recoil: 0.15,
        bulletSpeed: 1.1,
        caliber: '7.62',
        weight: 3.8,
        rarity: 'uncommon',
        value: 40000,
        color: '#d35400'
    },
    mp133: {
        id: 'mp133',
        name: 'MP-133 Shotgun',
        type: 'shotgun',
        damage: 20,
        pellets: 8,
        fireRate: 600,
        magSize: 6,
        reloadTime: 4000,
        range: 150,
        accuracy: 0.6,
        spread: 0.3,
        recoil: 0.2,
        bulletSpeed: 0.6,
        caliber: '12g',
        weight: 3.2,
        rarity: 'common',
        value: 20000,
        color: '#c0392b'
    },
    sks: {
        id: 'sks',
        name: 'SKS',
        type: 'rifle',
        damage: 55,
        fireRate: 200,
        magSize: 10,
        reloadTime: 2800,
        range: 700,
        accuracy: 0.88,
        recoil: 0.1,
        bulletSpeed: 1.3,
        caliber: '7.62',
        weight: 3.9,
        rarity: 'uncommon',
        value: 30000,
        color: '#27ae60'
    },
    mp5: {
        id: 'mp5',
        name: 'MP5',
        type: 'smg',
        damage: 28,
        fireRate: 70,
        magSize: 30,
        reloadTime: 2500,
        range: 400,
        accuracy: 0.85,
        recoil: 0.08,
        bulletSpeed: 0.9,
        caliber: '9mm',
        weight: 2.5,
        rarity: 'rare',
        value: 60000,
        color: '#1abc9c'
    },
    knife: {
        id: 'knife',
        name: 'Combat Knife',
        type: 'melee',
        damage: 35,
        attackRate: 400,
        range: 50,
        weight: 0.3,
        rarity: 'common',
        value: 5000,
        color: '#95a5a6'
    }
};

export const ARMOR = {
    paca: {
        id: 'paca',
        name: 'PACA Armor',
        type: 'armor',
        class: 2,
        durability: 50,
        maxDurability: 50,
        armorValue: 15,
        speedPenalty: 0.05,
        weight: 3.0,
        rarity: 'common',
        value: 25000,
        color: '#2c3e50'
    },
    kirasa: {
        id: 'kirasa',
        name: 'Kirasa Armor',
        type: 'armor',
        class: 3,
        durability: 80,
        maxDurability: 80,
        armorValue: 25,
        speedPenalty: 0.1,
        weight: 8.0,
        rarity: 'uncommon',
        value: 80000,
        color: '#34495e'
    },
    zhuk: {
        id: 'zhuk',
        name: 'Zhuk-6a',
        type: 'armor',
        class: 6,
        durability: 100,
        maxDurability: 100,
        armorValue: 45,
        speedPenalty: 0.2,
        weight: 12.0,
        rarity: 'legendary',
        value: 350000,
        color: '#27ae60'
    },
    ssh68: {
        id: 'ssh68',
        name: 'SSH-68 Helmet',
        type: 'helmet',
        class: 3,
        durability: 40,
        maxDurability: 40,
        armorValue: 10,
        weight: 1.5,
        rarity: 'common',
        value: 15000,
        color: '#7f8c8d'
    },
    altyn: {
        id: 'altyn',
        name: 'Altyn Helmet',
        type: 'helmet',
        class: 5,
        durability: 80,
        maxDurability: 80,
        armorValue: 30,
        weight: 4.0,
        rarity: 'epic',
        value: 200000,
        color: '#2ecc71'
    }
};

export const ENEMY_TYPES = {
    // Scavs
    scav: {
        id: 'scav',
        name: 'Scav',
        type: 'human',
        health: 80,
        damage: 15,
        speed: 0.08,
        attackRange: 300,
        sightRange: 400,
        accuracy: 0.5,
        color: '#7f8c8d',
        lootTable: ['roubles', 'ammo_9mm', 'car_medkit', 'crackers']
    },
    scav_armed: {
        id: 'scav_armed',
        name: 'Armed Scav',
        type: 'human',
        health: 100,
        damage: 25,
        speed: 0.09,
        attackRange: 400,
        sightRange: 500,
        accuracy: 0.6,
        color: '#95a5a6',
        lootTable: ['roubles', 'ammo_545', 'ifak', 'metal', 'parts']
    },

    // PMC
    pmc_usec: {
        id: 'pmc_usec',
        name: 'USEC Operator',
        type: 'human',
        health: 150,
        damage: 40,
        speed: 0.1,
        attackRange: 500,
        sightRange: 600,
        accuracy: 0.75,
        color: '#3498db',
        lootTable: ['roubles', 'ammo_545', 'salewa', 'parts', 'electronics']
    },
    pmc_bear: {
        id: 'pmc_bear',
        name: 'BEAR Operative',
        type: 'human',
        health: 160,
        damage: 45,
        speed: 0.1,
        attackRange: 450,
        sightRange: 550,
        accuracy: 0.7,
        color: '#e74c3c',
        lootTable: ['roubles', 'ammo_762', 'salewa', 'parts', 'gold_chain']
    },

    // Zombies
    zombie: {
        id: 'zombie',
        name: 'Infected',
        type: 'zombie',
        health: 60,
        damage: 20,
        speed: 0.06,
        attackRange: 40,
        sightRange: 300,
        accuracy: 1.0, // melee
        color: '#2d5a27',
        lootTable: ['roubles', 'car_medkit']
    },
    zombie_fast: {
        id: 'zombie_fast',
        name: 'Runner',
        type: 'zombie',
        health: 40,
        damage: 15,
        speed: 0.15,
        attackRange: 40,
        sightRange: 400,
        accuracy: 1.0,
        color: '#1e8449',
        lootTable: ['roubles', 'crackers']
    },
    zombie_tank: {
        id: 'zombie_tank',
        name: 'Bloater',
        type: 'zombie',
        health: 250,
        damage: 50,
        speed: 0.03,
        attackRange: 60,
        sightRange: 250,
        accuracy: 1.0,
        color: '#145a32',
        lootTable: ['roubles', 'salewa', 'mre', 'parts']
    },
    zombie_spitter: {
        id: 'zombie_spitter',
        name: 'Spitter',
        type: 'zombie',
        health: 50,
        damage: 25,
        speed: 0.05,
        attackRange: 200,
        sightRange: 350,
        accuracy: 0.6,
        isRanged: true,
        color: '#27ae60',
        lootTable: ['roubles', 'water', 'ifak']
    },

    // Boss
    killa: {
        id: 'killa',
        name: 'Killa',
        type: 'boss',
        health: 500,
        damage: 60,
        speed: 0.12,
        attackRange: 500,
        sightRange: 700,
        accuracy: 0.85,
        color: '#9b59b6',
        lootTable: ['roubles', 'bitcoin', 'rolex', 'electronics', 'salewa']
    }
};

export const MAP_CONFIGS = {
    hideout: {
        id: 'hideout',
        name: 'Hideout',
        width: 2000,
        height: 2000,
        bgColor: '#2a2a2a',
        isRaid: false,
        spawnEnemies: false,
        rareZombieSpawn: true, // Very rare zombie spawn
        rareZombieChance: 0.001, // 0.1% per tick
        structures: [
            { type: 'stash', x: 1000, y: 900 },
            { type: 'workbench', x: 800, y: 1000 },
            { type: 'medstation', x: 1200, y: 1000 },
            { type: 'portal', x: 1000, y: 1200, destination: 'mapselect' }
        ]
    },
    customs: {
        id: 'customs',
        name: 'Customs',
        width: 4000,
        height: 3000,
        bgColor: '#4a4a3a',
        isRaid: true,
        raidTime: 45 * 60 * 1000, // 45 minutes
        enemies: {
            scav: 15,
            scav_armed: 8,
            pmc_usec: 3,
            pmc_bear: 2,
            zombie: 10,
            zombie_fast: 5
        },
        extracts: [
            { x: 3800, y: 2800, name: 'Crossroads' },
            { x: 200, y: 200, name: 'Old Gas Station' }
        ],
        lootSpots: 30,
        structures: [
            { type: 'building', x: 1000, y: 500, w: 300, h: 200 },
            { type: 'building', x: 2500, y: 1500, w: 400, h: 300 },
            { type: 'warehouse', x: 1800, y: 800, w: 500, h: 250 }
        ]
    },
    factory: {
        id: 'factory',
        name: 'Factory',
        width: 2000,
        height: 2000,
        bgColor: '#3a3a3a',
        isRaid: true,
        raidTime: 20 * 60 * 1000, // 20 minutes
        enemies: {
            scav: 8,
            scav_armed: 6,
            pmc_usec: 4,
            pmc_bear: 4,
            zombie: 20,
            zombie_fast: 10,
            zombie_tank: 2
        },
        extracts: [
            { x: 1800, y: 1800, name: 'Gate 3' },
            { x: 200, y: 1800, name: 'Cellars' }
        ],
        lootSpots: 20,
        structures: [
            { type: 'wall', x: 500, y: 500, w: 1000, h: 20 },
            { type: 'wall', x: 500, y: 1500, w: 1000, h: 20 },
            { type: 'wall', x: 500, y: 500, w: 20, h: 1000 },
            { type: 'wall', x: 1500, y: 500, w: 20, h: 1000 }
        ]
    },
    woods: {
        id: 'woods',
        name: 'Woods',
        width: 5000,
        height: 5000,
        bgColor: '#2d4a2d',
        isRaid: true,
        raidTime: 50 * 60 * 1000, // 50 minutes
        enemies: {
            scav: 8,
            scav_armed: 4,
            zombie: 15,
            zombie_fast: 8
        },
        extracts: [
            { x: 4800, y: 4800, name: 'Outskirts' },
            { x: 200, y: 200, name: 'UN Roadblock' }
        ],
        lootSpots: 25,
        treeCount: 200,
        structures: []
    },
    interchange: {
        id: 'interchange',
        name: 'Interchange',
        width: 4000,
        height: 4000,
        bgColor: '#4a4a4a',
        isRaid: true,
        raidTime: 45 * 60 * 1000,
        enemies: {
            scav: 12,
            scav_armed: 10,
            pmc_usec: 5,
            pmc_bear: 5,
            zombie: 25,
            zombie_fast: 15,
            zombie_tank: 3,
            zombie_spitter: 5,
            killa: 1
        },
        extracts: [
            { x: 3800, y: 2000, name: 'Emercom' },
            { x: 200, y: 2000, name: 'Railway' }
        ],
        lootSpots: 50,
        structures: [
            { type: 'mall', x: 2000, y: 2000, w: 1500, h: 1200 }
        ]
    }
};

export const CRAFTING_RECIPES = {
    workbench: [
        { id: 'craft_ammo_9mm', name: '9x19mm x30', output: { item: 'ammo_9mm', count: 30 }, requirements: { metal: 5, parts: 1 }, time: 30000 },
        { id: 'craft_ammo_545', name: '5.45x39mm x30', output: { item: 'ammo_545', count: 30 }, requirements: { metal: 8, parts: 2 }, time: 45000 },
        { id: 'craft_parts', name: 'Weapon Parts', output: { item: 'parts', count: 1 }, requirements: { metal: 10 }, time: 60000 }
    ],
    medstation: [
        { id: 'craft_ifak', name: 'IFAK', output: { item: 'ifak', count: 1 }, requirements: { medical: 3 }, time: 45000 },
        { id: 'craft_salewa', name: 'Salewa', output: { item: 'salewa', count: 1 }, requirements: { medical: 5, parts: 1 }, time: 90000 }
    ],
    nutrition: [
        { id: 'craft_water', name: 'Purified Water', output: { item: 'water', count: 1 }, requirements: { fuel: 1 }, time: 30000 },
        { id: 'craft_mre', name: 'MRE', output: { item: 'mre', count: 1 }, requirements: { food: 5 }, time: 60000 }
    ]
};

export const HIDEOUT_UPGRADES = {
    stash: [
        { level: 1, slots: 100, requirements: {} },
        { level: 2, slots: 200, requirements: { wood: 50, metal: 30 } },
        { level: 3, slots: 400, requirements: { wood: 100, metal: 60, parts: 10 } }
    ],
    workbench: [
        { level: 1, recipes: 1, requirements: { wood: 20, metal: 10 } },
        { level: 2, recipes: 2, requirements: { wood: 40, metal: 30, parts: 5 } },
        { level: 3, recipes: 3, requirements: { wood: 80, metal: 60, parts: 15, electronics: 3 } }
    ],
    medstation: [
        { level: 1, recipes: 1, requirements: { wood: 15, parts: 3 } },
        { level: 2, recipes: 2, requirements: { wood: 30, parts: 8, electronics: 2 } }
    ],
    generator: [
        { level: 1, fuelConsumption: 1, requirements: { metal: 20, parts: 5 } },
        { level: 2, fuelConsumption: 0.5, requirements: { metal: 50, parts: 15, electronics: 5 } }
    ],
    walls: [
        { level: 1, defense: 10, requirements: { wood: 30 } },
        { level: 2, defense: 25, requirements: { wood: 50, metal: 20 } },
        { level: 3, defense: 50, requirements: { metal: 50, parts: 10 } }
    ]
};

// Loot tables for containers
export const LOOT_TABLES = {
    weapon_crate: {
        guaranteed: [],
        random: [
            { item: 'pm', chance: 0.3, count: 1 },
            { item: 'sks', chance: 0.15, count: 1 },
            { item: 'ak74', chance: 0.1, count: 1 },
            { item: 'mp5', chance: 0.05, count: 1 },
            { item: 'ammo_9mm', chance: 0.5, count: [10, 30] },
            { item: 'ammo_545', chance: 0.4, count: [10, 30] },
            { item: 'ammo_762', chance: 0.3, count: [10, 20] }
        ]
    },
    medical_crate: {
        guaranteed: ['car_medkit'],
        random: [
            { item: 'ifak', chance: 0.4, count: 1 },
            { item: 'salewa', chance: 0.2, count: 1 },
            { item: 'grizzly', chance: 0.05, count: 1 }
        ]
    },
    supply_crate: {
        guaranteed: [],
        random: [
            { item: 'crackers', chance: 0.5, count: [1, 3] },
            { item: 'water', chance: 0.4, count: [1, 2] },
            { item: 'mre', chance: 0.2, count: 1 },
            { item: 'juice', chance: 0.3, count: [1, 2] }
        ]
    },
    tool_crate: {
        guaranteed: [],
        random: [
            { item: 'metal', chance: 0.6, count: [2, 5] },
            { item: 'parts', chance: 0.3, count: [1, 2] },
            { item: 'electronics', chance: 0.1, count: 1 },
            { item: 'fuel', chance: 0.2, count: 1 }
        ]
    },
    safe: {
        guaranteed: ['roubles'],
        random: [
            { item: 'roubles', chance: 1.0, count: [5000, 30000] },
            { item: 'gold_chain', chance: 0.2, count: 1 },
            { item: 'rolex', chance: 0.05, count: 1 },
            { item: 'bitcoin', chance: 0.01, count: 1 },
            { item: 'dorm_key', chance: 0.1, count: 1 }
        ]
    },
    dead_scav: {
        guaranteed: [],
        random: [
            { item: 'roubles', chance: 0.8, count: [500, 5000] },
            { item: 'ammo_9mm', chance: 0.4, count: [5, 15] },
            { item: 'car_medkit', chance: 0.3, count: 1 },
            { item: 'crackers', chance: 0.4, count: 1 }
        ]
    }
};
