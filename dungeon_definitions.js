
/* =========================================================
   DUNGEON DEFINITIONS

   Data only: enums, palettes, blocks, sprites, rooms,
   dungeon layout, object definitions and display constants.

   Load AFTER sound.js and BEFORE the main game script.
   This is a classic script, not an ES module.
========================================================= */

"use strict";

/* =========================================================
   DUNGEON CONTENT DEFINITIONS

   Defines:
       Exit object and eligible exit guardians
       Required items and their guardians
       Guaranteed first additional monster
       Eligible random monsters

   A null guaranteedMonster means both additional
   monsters are selected randomly.
========================================================= */

const DUNGEON_CONTENT = {

    blue: {
    	rooms: [0, 1, 2, 3, 4, 5, 6, 7],
    
        exit: {
            type: "ladder",
            color: "green",
            guardians: ["demon", "dragon"]
        },
        items: [
            { type: "boat", guardian: "demon" }
        ],
        guaranteedMonster: "demon",
        randomMonsters: [
            "dragon", "demon", "bat", "spider", "blob"
        ]
    },

    red: {
    	rooms: [0, 1, 2, 3, 4, 5, 6, 7],
    	
        exit: {
            type: "ladder",
            color: "green",
            guardians: ["snake", "rat"]
        },
        items: [
            { type: "axe", guardian: "snake" }
        ],
        guaranteedMonster: "rat",
        randomMonsters: [
            "snake", "rat", "bat", "spider", "blob"
        ]
    },

    purple: {
        rooms: [0, 1, 2, 3, 4, 5, 6, 7],
    
        exit: {
            type: "ladder",
            color: "green",
            guardians: ["dragon", "demon"]
        },
        items: [
            { type: "key", guardian: "dragon" }
        ],
        guaranteedMonster: "demon",
        randomMonsters: [
            "dragon", "demon", "bat", "spider", "blob"
        ]
    },

    white: {
        rooms: [0, 1, 2, 3, 4, 5, 6, 7],
        	
        exit: {
            type: "throne",
            color: null,
            guardians: ["wingedDragon"]
        },
        items: [
            { type: "crownLeft", guardian: "wingedDragon" },
            { type: "crownRight", guardian: "wingedDragon" }
        ],
        guaranteedMonster: null,
        randomMonsters: [
            "snake", "bat", "spider", "blob"
        ]
    },
    
    trap: {
        rooms: [0, 1, 2, 3, 4, 5, 6, 7],

        specialRooms: [
            { choices: [14], count: 1 }, // Jeff's Honest Door
            { choices: [11], count: 1 }, // The Breathing Path
            { choices: [12], count: 1 }  // The Ricochet Vault
        ],

        exit: {
            type: "ladder",
            color: "green",
            guardians: ["snake", "rat"]
        },

        items: [],

        guaranteedMonster: "snake",

        randomMonsters: [
            "snake", "rat", "bat", "spider"
        ]
    },

    water: {
        rooms: [0, 1, 2, 3, 4, 5, 6, 7],

        specialRooms: [
            { choices: [15], count: 1 }, // Calvin's Island
            { choices: [10], count: 1 }, // Island Shrine
            { choices: [9], count: 1 }   // The Hidden Compass
        ],

        exit: {
            type: "ladder",
            color: "green",
            guardians: ["crab"]
        },

        items: [],

        guaranteedMonster: "crab",

        randomMonsters: [
            "crab", "snake", "bat", "blob"
        ]
    },

    armor: {
        rooms: [0, 1, 2, 3, 4, 5, 6, 7],

        specialRooms: [
            { choices: [8], count: 1 } // James's Armory
        ],

        exit: {
            type: "ladder",
            color: "green",
            guardians: ["medusa"]
        },

        items: [],

        guaranteedMonster: "demon",

        randomMonsters: [
            "demon", "dragon", "bat", "bear"
        ]
    }
};

const OVERWORLD_DUNGEONS = [
    [4,  2, "RED"],
    [7,  9, "BLUE"],
    [11, 3, "GREEN"],
    [14, 8, "YELLOW"],
    [17, 2, "PURPLE"]
];


/* =========================================================
   1. ORIENTATION
========================================================= */

const N = 0;
const E = 1;
const S = 2;
const W = 3;

/* =========================================================
   13. OBJECT TYPES
========================================================= */

const OBJECT = {
    LADDER: 0,
    BOW: 1,
    QUIVER: 2,
    SWORD: 3,
    KEY: 4,
    CROWN: 5,
    BOAT: 6,
    SNAKE: 7,
    DEMON: 8,
    BAT: 9,
    DRAGON: 10,

    SKULL_1: 11,
    SKULL_2: 12,
    SKULL_HORNS: 13,
    BONES: 14,

    CABIN: 15,

    MOUNTAIN_1: 16,
    MOUNTAIN_2: 17,

    RIVER_1: 18,
    RIVER_2: 19,

    AXE: 20,
    FOREST: 21,

    RAT: 22,
    SPIDER: 23,
    BLOB: 24,
    WINGED_DRAGON: 25,

    ARROW: 26,
    RAT_TRACKS: 27,
    DEMON_TRACKS: 28,
    THRONE: 29,

    JEFF_CHOINSKI: 30,
    CALVIN: 31,
    JAMES_DUBAY: 32,

    // Statues
    STATUE_KNIGHT: 33,
    STATUE_PRIESTESS: 34,
    STATUE_BEAST: 35,

    // Treasure
    GEM: 36,
    CHEST: 37,

    // Animated objects and characters
    SKELETON: 38,
    PRIESTESS: 39,
    FLOATING_EYE: 40,
    FOUNTAIN: 41,
    CRAB: 42,
    GHOST: 43,

    // Potions and scroll
    POTION_HEALTH: 44,
    POTION_MAGIC: 45,
    POTION_ANTIDOTE: 46,
    POTION_PROTECTION: 47,
    SCROLL: 48,

    // Additional creatures and characters
    MEDUSA: 49,
    BEAR: 50,
    TALKING_DOOR: 51,
    
    COMPASS: 52,
    ARMOR: 53,
    SNAKE_CHARMER: 54,
    PALM_TREE: 55
};

/* =========================================================
   10. DUNGEON ENCODING
========================================================= */

function R(room, orientation = N) {
    return (
        (room & 15) |
        ((orientation & 3) << 4)
    );
}


/* =========================================================
   11. DUNGEON MAP
========================================================= */

const DUNGEON_W = 12;
const DUNGEON_H = 4;

/* =========================================================
   12. WORLD AND VIEW CONSTANTS
========================================================= */

const BLOCK_PIXELS = 16;
const ROOM_BLOCKS = 9;

const WORLD_W = DUNGEON_W * ROOM_BLOCKS;
const WORLD_H = DUNGEON_H * ROOM_BLOCKS;

const VIEW_W = 20;
const VIEW_H = 12;

const TYPE = {
    GRASS: 0,
    MOUNTAIN: 1,
    FOREST: 2,
    RIVER: 3,
    WALL: 4,
    BLUE_MOUNTAIN: 5,
    PURPLE_MOUNTAIN: 6,
    RED_MOUNTAIN: 7
};

const MOUNTAIN_COLORS = {
    [TYPE.BLUE_MOUNTAIN]: "#245bdb",
    [TYPE.PURPLE_MOUNTAIN]: "#171b1a",
    [TYPE.RED_MOUNTAIN]: "#dc422d"
};

const PALETTES = {
    BROWN: "#8a7020"
};

let OVERWORLD_MAP = [];

/* =========================================================
   14. OBJECT DEFINITIONS

   [sprite frame 1, sprite frame 2]
   -1 means not animated.
========================================================= */

const OBJECT_DEFS = [
    [SPRITE.LADDER,   -1], // 0
    [SPRITE.BOW,      -1], // 1
    [SPRITE.QUIVER,   -1], // 2
    [SPRITE.SWORD,    -1], // 3
    [SPRITE.KEY,      -1], // 4
    [SPRITE.CROWN,    -1], // 5
    [SPRITE.BOAT,     -1], // 6

    [SPRITE.SNAKE_1,  SPRITE.SNAKE_2],  // 7
    [SPRITE.DEMON_1,  SPRITE.DEMON_2],  // 8
    [SPRITE.BAT_1,    SPRITE.BAT_2],    // 9
    [SPRITE.DRAGON_1, SPRITE.DRAGON_2], // 10

    [SPRITE.SKULL_1,     -1], // 11
    [SPRITE.SKULL_2,     -1], // 12
    [SPRITE.SKULL_HORNS, -1], // 13
    [SPRITE.BONES,       -1], // 14

    [SPRITE.CABIN, -1], // 15

    [SPRITE.MOUNTAIN_1, -1], // 16
    [SPRITE.MOUNTAIN_2, -1], // 17

    [SPRITE.RIVER_1, -1], // 18
    [SPRITE.RIVER_2, -1], // 19

    [SPRITE.AXE,    -1], // 20
    [SPRITE.FOREST, -1], // 21

    [SPRITE.RAT_1,           SPRITE.RAT_2],           // 22
    [SPRITE.SPIDER_1,        SPRITE.SPIDER_2],        // 23
    [SPRITE.BLOB_1,          SPRITE.BLOB_2],          // 24
    [SPRITE.WINGED_DRAGON_1, SPRITE.WINGED_DRAGON_2], // 25

    [SPRITE.ARROW,        -1], // 26
    [SPRITE.RAT_TRACKS,   -1], // 27
    [SPRITE.DEMON_TRACKS, -1], // 28
    [SPRITE.THRONE,       -1], // 29

    [SPRITE.JEFF_CHOINSKI_1, SPRITE.JEFF_CHOINSKI_2], // 30
    [SPRITE.CALVIN_1,        SPRITE.CALVIN_2],        // 31
    [SPRITE.JAMES_DUBAY_1,   SPRITE.JAMES_DUBAY_2],   // 32

    // Statues
    [SPRITE.STATUE_KNIGHT,    -1], // 33
    [SPRITE.STATUE_PRIESTESS, -1], // 34
    [SPRITE.STATUE_BEAST,     -1], // 35

    // Treasure
    [SPRITE.GEM,   -1], // 36
    [SPRITE.CHEST, -1], // 37

    // Animated objects and characters
    [SPRITE.SKELETON_1,     SPRITE.SKELETON_2],     // 38
    [SPRITE.PRIESTESS_1,    SPRITE.PRIESTESS_2],    // 39
    [SPRITE.FLOATING_EYE_1, SPRITE.FLOATING_EYE_2], // 40
    [SPRITE.FOUNTAIN_ALT_1, SPRITE.FOUNTAIN_ALT_2], // 41
    [SPRITE.CRAB_1,         SPRITE.CRAB_2],         // 42
    [SPRITE.GHOST_1,        SPRITE.GHOST_2],        // 43

    // Potions and scroll
    [SPRITE.POTION_HEALTH,     -1], // 44
    [SPRITE.POTION_MAGIC,      -1], // 45
    [SPRITE.POTION_ANTIDOTE,   -1], // 46
    [SPRITE.POTION_PROTECTION, -1], // 47
    [SPRITE.SCROLL,            -1], // 48

    // Additional animated creatures and characters
    [SPRITE.MEDUSA_1,      SPRITE.MEDUSA_2],      // 49
    [SPRITE.BEAR_1,        SPRITE.BEAR_2],        // 50
    [SPRITE.TALKING_DOOR_1, SPRITE.TALKING_DOOR_2], // 51
    
    [SPRITE.COMPASS, -1], // 52
    [SPRITE.ARMOR,   -1], // 53
    [SPRITE.SNAKE_CHARMER, -1], // 54
    [SPRITE.PALM_TREE,     -1]  // 55
];


/* =========================================================
   16. PLAYER MODES AND ANIMATIONS
========================================================= */

const PLAYER_MODE = {
    NORMAL: 0,
    BOW: 1,
    SWORD: 2
};

const PLAYER_ANIMATIONS = [
    ANIMATION.PLAYER,
    ANIMATION.PLAYER_BOW,
    ANIMATION.PLAYER_SWORD
];


/* =========================================================
   17. INVENTORY ICON DEFINITIONS
========================================================= */

const INVENTORY_ICONS = [
    ["axe",   SPRITE.AXE],
    ["boat",  SPRITE.BOAT],
    ["key",   SPRITE.KEY],
    ["crown", SPRITE.CROWN],
    ["arrow", SPRITE.QUIVER],
    ["sword", SPRITE.SWORD],
    ["bow",   SPRITE.BOW],
    ["compass",   SPRITE.COMPASS],
    ["armor",   SPRITE.ARMOR],
    ["snakeCharmer", SPRITE.SNAKE_CHARMER]
];


/* =========================================================
   18. MONSTER SOUND DEFINITIONS

   Requires SOUND from sound.js.
========================================================= */

const MONSTER_SOUNDS = {
    [OBJECT.BAT]:           SOUND.BAT,
    [OBJECT.SNAKE]:         SOUND.SNAKE,
    [OBJECT.DEMON]:         SOUND.DEMON,
    [OBJECT.DRAGON]:        SOUND.DRAGON,
    [OBJECT.RAT]:           SOUND.RAT,
    [OBJECT.SPIDER]:        SOUND.SPIDER,
    [OBJECT.BLOB]:          SOUND.BLOB,
    [OBJECT.WINGED_DRAGON]: SOUND.WINGED_DRAGON,
    [OBJECT.BEAR]: SOUND.BEAR
};

const MONSTER_SOUND_RANGE = 10;


/* =========================================================
   PLACEMENT TYPE TO GAME OBJECT MAPPING
========================================================= */

const PLACEMENT_OBJECT_TYPES = {

    // Equipment and items
    ladder: OBJECT.LADDER,
    axe: OBJECT.AXE,
    bow: OBJECT.BOW,
    quiver: OBJECT.QUIVER,
    sword: OBJECT.SWORD,
    key: OBJECT.KEY,
    crownLeft: OBJECT.CROWN,
    crownRight: OBJECT.CROWN,
    boat: OBJECT.BOAT,
    arrow: OBJECT.ARROW,

    // Monsters
    snake: OBJECT.SNAKE,
    demon: OBJECT.DEMON,
    bat: OBJECT.BAT,
    dragon: OBJECT.DRAGON,
    rat: OBJECT.RAT,
    spider: OBJECT.SPIDER,
    blob: OBJECT.BLOB,
    wingedDragon: OBJECT.WINGED_DRAGON,
    
    // Additional animated monsters
    skeleton: OBJECT.SKELETON,
    floatingEye: OBJECT.FLOATING_EYE,
    crab: OBJECT.CRAB,
    ghost: OBJECT.GHOST,
    medusa: OBJECT.MEDUSA,
    bear: OBJECT.BEAR,

    // Animated characters
    priestess: OBJECT.PRIESTESS,
    talkingDoor: OBJECT.TALKING_DOOR,
    jeffChoinski: OBJECT.JEFF_CHOINSKI,
    jamesDubay: OBJECT.JAMES_DUBAY,
    calvin: OBJECT.CALVIN,
    
    // Clues and landmarks
    skull: OBJECT.SKULL_1,
    ratTracks: OBJECT.RAT_TRACKS,
    demonTracks: OBJECT.DEMON_TRACKS,
    throne: OBJECT.THRONE,
    compass: OBJECT.COMPASS,
    armor: OBJECT.ARMOR,
    snakeCharmer: OBJECT.SNAKE_CHARMER,
    palmTree: OBJECT.PALM_TREE
};

/* =========================================================
   TERRAIN CLASSIFICATION GROUPS

   These sets contain sprite indices, not block IDs.
========================================================= */

const is_pit = new Set();
const is_wall = new Set();
const is_water = new Set();


/* =========================================================
   CLASSIFY TERRAIN SPRITES — RUN ONCE
========================================================= */

function classifyTerrainSprites() {

    function getColors(spriteIndex) {

        const sprite = SPRITES[spriteIndex];

        if (!sprite)
            throw new Error("Missing terrain sprite: " + spriteIndex);

        return new Set(sprite);
    }

    const wallColors = getColors(SPRITE.BLOCK_WALL);
    const floorColors = getColors(SPRITE.BLOCK_FLOOR);
    const waterColors = getColors(SPRITE.BLOCK_WATER);
    const pitColor = 18;

    is_pit.clear();
    is_wall.clear();
    is_water.clear();

    const terrainSprites =
        new Set(Object.values(BLOCK_SPRITES));

    for (const spriteIndex of terrainSprites) {

        const sprite = SPRITES[spriteIndex];

        if (!sprite)
            continue;

        let wall = 0;
        let floor = 0;
        let pit = 0;
        let water = 0;

        for (const color of sprite) {

            if (color === pitColor)
                pit++;
            else if (waterColors.has(color))
                water++;
            else if (wallColors.has(color))
                wall++;
            else if (floorColors.has(color))
                floor++;
        }

        // Pit wins ties with wall or floor.
        if (
            pit > 0 &&
            pit >= wall &&
            pit >= floor &&
            pit >= water
        ) {
            is_pit.add(spriteIndex);
        }

        // Water wins ties with wall or floor.
        else if (
            water > 0 &&
            water >= wall &&
            water >= floor &&
            water >= pit
        ) {
            is_water.add(spriteIndex);
        }

        // Wall wins ties with floor.
        else if (
            wall > 0 &&
            wall >= floor &&
            wall >= pit &&
            wall >= water
        ) {
            is_wall.add(spriteIndex);
        }

        // Otherwise, the sprite is walkable floor.
    }
    
    console.log(
        "is_pit = new Set(" +
        JSON.stringify([...is_pit].sort((a, b) => a - b)) +
        ");"
    );

    console.log(
        "is_wall = new Set(" +
        JSON.stringify([...is_wall].sort((a, b) => a - b)) +
        ");"
    );

    console.log(
        "is_water = new Set(" +
        JSON.stringify([...is_water].sort((a, b) => a - b)) +
        ");"
    );
}


// Classify all terrain frames once at startup.
//classifyTerrainSprites();
is_pit.clear();
is_wall.clear();
is_water.clear();

[24,25,29,30,33,34,37,38,39,40,45,48,49]
    .forEach(id => is_pit.add(id));

[0,2,3,4,5,8,9,11,12,13,17,18,19,20,21,23,26,27,28,31,32,35,36,41,42,43,44]
    .forEach(id => is_wall.add(id));

[50,51,53,54,56,57,59,60]
    .forEach(id => is_water.add(id));