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

function populateDungeon(
    roomGrid,
    dungeonType,
    roomWidth,
    roomHeight,
    seed = 1,
    inventory = {}
) {

    const definition = DUNGEON_CONTENT[dungeonType];

    if (!definition) {
        throw new Error(
            "Unknown dungeon type: " + dungeonType
        );
    }

    if (
        !Array.isArray(roomGrid) ||
        !roomGrid.length ||
        !Array.isArray(roomGrid[0]) ||
        !roomGrid[0].length
    ) {
        throw new Error("Invalid dungeon room grid");
    }

    if (
        !Number.isInteger(roomWidth) ||
        !Number.isInteger(roomHeight) ||
        roomWidth < 3 ||
        roomHeight < 3
    ) {
        throw new Error("Invalid room dimensions");
    }

    const gridHeight = roomGrid.length;
    const gridWidth = roomGrid[0].length;

    for (const row of roomGrid) {
        if (
            !Array.isArray(row) ||
            row.length !== gridWidth
        ) {
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

        if (!array.length) {
            throw new Error("No eligible placement locations");
        }

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

    function getRoomAt(worldX, worldY) {
        return {
            x: Math.floor(worldX / roomWidth),
            y: Math.floor(worldY / roomHeight)
        };
    }

    /* -----------------------------------------------------
       BUILD ORDINARY ROOM LOCATION POOLS

       Special rooms supply their own contents through
       room extensions.

       ordinaryRooms retains all ordinary locations.
       availableRooms removes rooms as they are assigned.
    ----------------------------------------------------- */

    const ordinaryRooms = [];

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {

            if (roomGrid[y][x].special)
                continue;

            ordinaryRooms.push({ x, y });
        }
    }

    const availableRooms = [...ordinaryRooms];

    const requiredOrdinaryRooms =
        2 + definition.items.length + 2;

    if (availableRooms.length < requiredOrdinaryRooms) {
        throw new Error(
            "Not enough ordinary rooms for dungeon placement"
        );
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
    ----------------------------------------------------- */

    const dungeon = {
        type: dungeonType,
        rooms: roomGrid,
        objects: [],
        monsters: [],
        treasures: [],
		player: null
    };

    let nextObjectID = 1;
    let nextMonsterID = 1;

    /* -----------------------------------------------------
       PLACE PLAYER

       Random ordinary room along LEFT edge.
    ----------------------------------------------------- */

    const leftRooms = ordinaryRooms.filter(room =>
        room.x === 0
    );

	const playerRoom = takeRoom(
		TEST_ROOM_PLACEMENT
			? leftRooms.filter(room => room.y === gridHeight - 1)
			: leftRooms
	);

    const playerPosition = roomCenter(
        playerRoom.x,
        playerRoom.y
    );

    dungeon.player = {
        x: playerPosition.x,
        y: playerPosition.y
    };

    /* -----------------------------------------------------
       PLACE EXIT

       Random remaining ordinary room along RIGHT edge.
    ----------------------------------------------------- */

    const rightRooms = ordinaryRooms.filter(room =>
        room.x === gridWidth - 1
    );

    const exitRoom = takeRoom(rightRooms);

    const exitPosition = roomCenter(
        exitRoom.x,
        exitRoom.y
    );

    const exitObjectID = nextObjectID++;

    dungeon.objects.push({
        id: exitObjectID,
        type: definition.exit.type,
        color: definition.exit.color,
        x: exitPosition.x,
        y: exitPosition.y
    });

    /* -----------------------------------------------------
       PLACE EXIT GUARDIAN
    ----------------------------------------------------- */

    const exitGuardian = choose(definition.exit.guardians);

    dungeon.monsters.push({
        id: nextMonsterID++,
        type: exitGuardian,
        x: exitPosition.x,
        y: exitPosition.y - 1,
        direction: 0,
        guarding: exitObjectID,
        state: "sleeping"
    });

    /* -----------------------------------------------------
       PLACE REQUIRED ITEMS AND GUARDIANS
    ----------------------------------------------------- */

    for (const itemDefinition of definition.items) {

        const room = takeRoom(availableRooms);
        const center = roomCenter(room.x, room.y);

        const objectID = nextObjectID++;

		const isTreasure = [
			"boat", "axe", "key", "armor", "snakeCharmer",
			"crownLeft", "crownRight"
		].includes(itemDefinition.type);

        const alreadyOwned =
            isTreasure &&
            inventory[itemDefinition.type] === true;

        const type = alreadyOwned
            ? "quiver"
            : itemDefinition.type;

        dungeon.objects.push({
            id: objectID,
            type,
            x: center.x,
            y: center.y
        });

        if (isTreasure && !alreadyOwned) {
            dungeon.treasures.push({
                id: objectID,
                type,
                x: center.x,
                y: center.y
            });
        }

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
    ----------------------------------------------------- */

    const guaranteedMonster = definition.guaranteedMonster;

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

    /* -----------------------------------------------------
       FIND CONNECTED ADJOINING ROOMS

       Original room templates have WEST blocked.
    ----------------------------------------------------- */

    const DX = [0, 1, 0, -1];
    const DY = [-1, 0, 1, 0];

    function getConnectedNeighbors(roomX, roomY) {

        const neighbors = [];
        const current = roomGrid[roomY][roomX];

        const blockedHere =
            (current.orientation + 3) % 4;

        for (let d = 0; d < 4; d++) {

            const nx = roomX + DX[d];
            const ny = roomY + DY[d];

            if (
                nx < 0 ||
                ny < 0 ||
                nx >= gridWidth ||
                ny >= gridHeight
            ) {
                continue;
            }

            const neighbor = roomGrid[ny][nx];

            const blockedThere =
                (neighbor.orientation + 3) % 4;

            if (
                blockedHere === d ||
                blockedThere === ((d + 2) % 4)
            ) {
                continue;
            }

            neighbors.push({ x: nx, y: ny });
        }

        return neighbors;
    }

    /* -----------------------------------------------------
       PLACE SKULLS

       Ordinary rooms only.
       Skulls may share rooms with other entities.
    ----------------------------------------------------- */

    if (dungeonType === "white") {

        const skullCount = Math.min(
            4,
            Math.max(1, Math.floor(gridWidth * gridHeight / 8))
        );

        for (let i = 0; i < skullCount; i++) {

            const room = choose(ordinaryRooms);
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

       Tracks can appear in connected ordinary rooms only.
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
        ).filter(room =>
            !roomGrid[room.y][room.x].special
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

    /* -----------------------------------------------------
       PLACE QUIVERS

       Attempt to place 1–5 pickups.
       Use separate empty ordinary rooms.
       Player room is already excluded from availableRooms.
    ----------------------------------------------------- */

    const arrowCount = 3 + randomIndex(2);

    const emptyRooms = availableRooms.filter(room => {

        const hasObject = dungeon.objects.some(object => {
            const location = getRoomAt(object.x, object.y);

            return location.x === room.x &&
                   location.y === room.y;
        });

        const hasMonster = dungeon.monsters.some(monster => {
            const location = getRoomAt(monster.x, monster.y);

            return location.x === room.x &&
                   location.y === room.y;
        });

        return !hasObject && !hasMonster;
    });

    const pickupCount = Math.min(
        arrowCount,
        emptyRooms.length
    );

    for (let i = 0; i < pickupCount; i++) {

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