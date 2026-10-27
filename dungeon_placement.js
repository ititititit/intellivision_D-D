"use strict";

/* =========================================================
   DUNGEON PLACEMENT

   Responsible for:
       Selecting player starting position
       Placing dungeon-specific items
       Placing item guardians
       Placing two additional random monsters
       Placing the exit ladder

   All objects and monsters are stored in dungeon-level
   arrays using world tile coordinates.

   Room positions are used only for initial placement.

   Dependencies:
       dungeon_generator.js

   Public functions:
       populateDungeon(roomGrid, dungeonType,
                       roomWidth, roomHeight, seed)

   Returns:
       {
           type,
           rooms,
           objects,
           monsters,
           player
       }
========================================================= */

const DUNGEON_CONTENT = {

    blue: {
        items: [
            { type: "boat", guardian: "demon" }
        ],
        randomMonsters: [
            "dragon", "demon", "bat", "spider", "blob"
        ]
    },

    red: {
        items: [
            { type: "axe", guardian: "snake" }
        ],
        randomMonsters: [
            "snake", "rat", "bat", "spider", "blob"
        ]
    },

    purple: {
        items: [
            { type: "key", guardian: "dragon" }
        ],
        randomMonsters: [
            "dragon", "demon", "bat", "spider", "blob"
        ]
    },

    white: {
        items: [
            { type: "crownLeft", guardian: "wingedDragon" },
            { type: "crownRight", guardian: "wingedDragon" }
        ],
        randomMonsters: [
            "snake", "bat", "spider", "blob"
        ]
    }
};


/* =========================================================
   POPULATE DUNGEON

   roomGrid:
       Grid returned by generateDungeonRooms()

   dungeonType:
       blue, red, purple, white

   roomWidth / roomHeight:
       Room dimensions in world tiles

   seed:
       Random seed for repeatable placement

   Rooms are assumed to occupy a regular grid with
   their top-left corners at:
       roomX * roomWidth
       roomY * roomHeight
========================================================= */

function populateDungeon(
    roomGrid,
    dungeonType,
    roomWidth,
    roomHeight,
    seed = 1
) {

    const definition = DUNGEON_CONTENT[dungeonType];

    if (!definition) {
        throw new Error(
            "Unknown dungeon type: " + dungeonType
        );
    }

    if (!Array.isArray(roomGrid) ||
        !roomGrid.length ||
        !Array.isArray(roomGrid[0]) ||
        !roomGrid[0].length) {
        throw new Error("Invalid dungeon room grid");
    }

    if (!Number.isInteger(roomWidth) ||
        !Number.isInteger(roomHeight) ||
        roomWidth < 3 ||
        roomHeight < 3) {
        throw new Error("Invalid room dimensions");
    }

    const gridHeight = roomGrid.length;
    const gridWidth = roomGrid[0].length;

    for (const row of roomGrid) {
        if (!Array.isArray(row) ||
            row.length !== gridWidth) {
            throw new Error("Non-rectangular room grid");
        }
    }

    /* -----------------------------------------------------
       SEEDED RANDOM GENERATOR
    ----------------------------------------------------- */

    let state = seed >>> 0;

    function random() {

        state = (state + 0x6D2B79F5) >>> 0;

        let t = state;

        t = Math.imul(t ^ (t >>> 15), t | 1);

        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function randomIndex(length) {
        return Math.floor(random() * length);
    }

    function choose(array) {

        if (!array.length)
            throw new Error("No eligible placement locations");

        return array[randomIndex(array.length)];
    }

    /* -----------------------------------------------------
       ROOM COORDINATE HELPERS
    ----------------------------------------------------- */

    function roomCenter(roomX, roomY) {

        return {
            x: roomX * roomWidth +
               Math.floor(roomWidth / 2),

            y: roomY * roomHeight +
               Math.floor(roomHeight / 2)
        };
    }

    /* -----------------------------------------------------
       BUILD ROOM LOCATION POOL

       Rooms are not owners of objects or monsters.

       These records are temporary placement candidates.
    ----------------------------------------------------- */

    const availableRooms = [];

    for (let y = 0; y < gridHeight; y++) {

        for (let x = 0; x < gridWidth; x++) {

            availableRooms.push({ x, y });
        }
    }

    function takeRoom(candidates) {

        const eligible = candidates.filter(candidate =>
            availableRooms.some(room =>
                room.x === candidate.x &&
                room.y === candidate.y
            )
        );

        const selected = choose(eligible);

        const index = availableRooms.findIndex(room =>
            room.x === selected.x &&
            room.y === selected.y
        );

        availableRooms.splice(index, 1);

        return selected;
    }

    /* -----------------------------------------------------
       OUTPUT DUNGEON RECORD

       Objects and monsters are independent of rooms.
    ----------------------------------------------------- */

    const dungeon = {

        type: dungeonType,

        rooms: roomGrid,

        objects: [],

        monsters: [],

        player: null
    };

    let nextObjectID = 1;
    let nextMonsterID = 1;

    /* -----------------------------------------------------
       PLACE PLAYER

       Random room along LEFT edge.
       Player begins at room center.
    ----------------------------------------------------- */

    const leftRooms = [];

    for (let y = 0; y < gridHeight; y++) {
        leftRooms.push({ x: 0, y });
    }

    const playerRoom = takeRoom(leftRooms);
    const playerPosition = roomCenter(
        playerRoom.x,
        playerRoom.y
    );

    dungeon.player = {
        x: playerPosition.x,
        y: playerPosition.y
    };

    /* -----------------------------------------------------
       PLACE EXIT LADDER

       Random room along RIGHT edge.
       Ladder is placed at room center.
    ----------------------------------------------------- */

    const rightRooms = [];

    for (let y = 0; y < gridHeight; y++) {
        rightRooms.push({
            x: gridWidth - 1,
            y
        });
    }

    const exitRoom = takeRoom(rightRooms);
    const exitPosition = roomCenter(
        exitRoom.x,
        exitRoom.y
    );

    dungeon.objects.push({

        id: nextObjectID++,

        type: dungeonType === "white" ? "throne" : "ladder",
        color: dungeonType === "white" ? null : "green",

        x: exitPosition.x,
        y: exitPosition.y
    });

	/* -----------------------------------------------------
	   PLACE EXIT GUARDIAN
	
	   Every green exit ladder has one guarding monster.
	   Guardian starts one tile north of ladder.
	----------------------------------------------------- */
	
	const exitGuardTypes = {
		blue:   ["demon", "dragon"],
		red:    ["snake", "rat"],
		purple: ["dragon", "demon"],
		white:  ["wingedDragon"]
	};
	
	const exitGuardian = choose(exitGuardTypes[dungeonType]);
	
	dungeon.monsters.push({
		id: nextMonsterID++,
		type: exitGuardian,
		x: exitPosition.x,
		y: exitPosition.y - 1,
		direction: 0,
		guarding: dungeon.objects[dungeon.objects.length - 1].id,
		state: "sleeping"
	});

    /* -----------------------------------------------------
       PLACE REQUIRED ITEMS AND GUARDIANS

       Item:
           Center of selected room

       Guardian:
           One tile NORTH of item

       Each item and guardian occupy the same room,
       but are independent dungeon entities.
    ----------------------------------------------------- */

    for (const itemDefinition of definition.items) {

        const room = takeRoom(availableRooms);
        const center = roomCenter(room.x, room.y);

        const objectID = nextObjectID++;

        dungeon.objects.push({

            id: objectID,

            type: itemDefinition.type,

            x: center.x,
            y: center.y
        });

        dungeon.monsters.push({

            id: nextMonsterID++,

            type: itemDefinition.guardian,

            x: center.x,
            y: center.y - 1,
			direction: 0,
			
            guarding: objectID,

            state: "sleeping"
        });
    }

    /* -----------------------------------------------------
       PLACE TWO ADDITIONAL MONSTERS

       Monster type is selected from the dungeon's
       permitted random monster list.

       Each starts one tile north of the center of
       a randomly selected available room.
    ----------------------------------------------------- */

	const guaranteedMonster = {
		red: "rat",
		blue: "demon",
		purple: "demon",
		white: null
	}[dungeonType];


	for (let i = 0; i < 2; i++) {
	
		const room = takeRoom(availableRooms);
		const center = roomCenter(room.x, room.y);
	
		const monsterType =
			i === 0 && guaranteedMonster
				? guaranteedMonster
				: choose(definition.randomMonsters);

        const alwaysAwake = [
            "bat",
            "spider",
            "blob"
        ].includes(monsterType);

        dungeon.monsters.push({

            id: nextMonsterID++,

            type: monsterType,

            x: center.x,
            y: center.y - 1,
			direction: 0,

            guarding: null,

            state: alwaysAwake ? "awake" : "sleeping"
        });
    }

    /* =====================================================
       PLACE MONSTER CLUES AND LANDMARKS

       Skulls:
           Random locations in Cloudy Mountain.

       Rat tracks:
           Indicate a sleeping rat in an adjoining room.

       Demon tracks:
           Indicate a sleeping demon in an adjoining room.

       Clues are stored as ordinary dungeon objects.
    ===================================================== */

    const DX = [0, 1, 0, -1];
    const DY = [-1, 0, 1, 0];

    /* -----------------------------------------------------
       FIND CONNECTED ADJOINING ROOMS

       Generator orientations have already been translated
       into clockwise room rotations.

       Original rooms have WEST blocked.
    ----------------------------------------------------- */

    function getConnectedNeighbors(roomX, roomY) {

        const neighbors = [];

        const current = roomGrid[roomY][roomX];

        const blockedHere =
            (current.orientation + 3) % 4;

        for (let d = 0; d < 4; d++) {

            const nx = roomX + DX[d];
            const ny = roomY + DY[d];

            if (nx < 0 || ny < 0 ||
                nx >= gridWidth || ny >= gridHeight)
                continue;

            const neighbor = roomGrid[ny][nx];

            const blockedThere =
                (neighbor.orientation + 3) % 4;

            if (blockedHere === d)
                continue;

            if (blockedThere === ((d + 2) % 4))
                continue;

            neighbors.push({ x: nx, y: ny });
        }

        return neighbors;
    }

    /* -----------------------------------------------------
       FIND ROOM CONTAINING WORLD POSITION
    ----------------------------------------------------- */

    function getRoomAt(worldX, worldY) {

        return {
            x: Math.floor(worldX / roomWidth),
            y: Math.floor(worldY / roomHeight)
        };
    }

    /* -----------------------------------------------------
       PLACE SKULLS

       Winged dragons leave skulls throughout
       Cloudy Mountain.

       Skulls are landmarks, not monster guardians.
    ----------------------------------------------------- */

    if (dungeonType === "white") {

        const skullCount = Math.min(
            4,
            Math.max(1, Math.floor(gridWidth * gridHeight / 8))
        );

        for (let i = 0; i < skullCount; i++) {

            const room = {
                x: randomIndex(gridWidth),
                y: randomIndex(gridHeight)
            };

            const center = roomCenter(room.x, room.y);

            dungeon.objects.push({
                id: nextObjectID++,
                type: "skull",
                x: center.x,
                y: center.y
            });
        }
    }

    /* -----------------------------------------------------
       PLACE RAT AND DEMON TRACKS

       Each sleeping rat or demon can leave tracks
       in one connected adjoining room.
    ----------------------------------------------------- */

    for (const monster of dungeon.monsters) {

        let trackType = null;

        if (monster.type === "rat")
            trackType = "ratTracks";

        if (monster.type === "demon")
            trackType = "demonTracks";

        if (!trackType)
            continue;

        const monsterRoom = getRoomAt(
            monster.x,
            monster.y
        );

        const neighbors = getConnectedNeighbors(
            monsterRoom.x,
            monsterRoom.y
        );

        if (!neighbors.length)
            continue;

        const trackRoom = choose(neighbors);

        const center = roomCenter(
            trackRoom.x,
            trackRoom.y
        );

        dungeon.objects.push({
            id: nextObjectID++,
            type: trackType,
            x: center.x,
            y: center.y,
            sourceMonsterID: monster.id
        });
    }

    /* =====================================================
       PLACE ARROWS

       Randomly place 1 or 2 arrow pickups per dungeon.

       Rules:
           - Center of room
           - Room must contain no existing objects
           - Room must contain no monsters
           - Exclude player starting room
           - Each arrow pickup occupies a separate room
    ===================================================== */

    const arrowCount = 1 + randomIndex(5);

    const emptyRooms = availableRooms.filter(room => {

        const center = roomCenter(room.x, room.y);

        // No existing objects in room
        const hasObject = dungeon.objects.some(obj =>
            getRoomAt(obj.x, obj.y).x === room.x &&
            getRoomAt(obj.x, obj.y).y === room.y
        );

        // No monsters in room
        const hasMonster = dungeon.monsters.some(monster =>
            getRoomAt(monster.x, monster.y).x === room.x &&
            getRoomAt(monster.x, monster.y).y === room.y
        );

        return !hasObject && !hasMonster;
    });

    for (let i = 0; i < Math.min(arrowCount, emptyRooms.length); i++) {

        const index = randomIndex(emptyRooms.length);

        const room = emptyRooms.splice(index, 1)[0];

        const center = roomCenter(room.x, room.y);

        dungeon.objects.push({
            id: nextObjectID++,
            type: "quiver",
            x: center.x,
            y: center.y
        });
    }

    return dungeon;
}