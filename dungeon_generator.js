
"use strict";

const TEST_ROOM_PLACEMENT = false;

/* =========================================================
   DUNGEON GENERATOR

   Public functions:
       generateDungeonRooms(width, height, seed)
       validateDungeon(grid)
       regenerateDungeon(seed, color)

   Generated room structure:
       {
           room: 0..7,
           orientation: 0..3
       }

   Stored orientation is clockwise room rotation:
       0 =   0 degrees (WEST blocked)
       1 =  90 degrees (NORTH blocked)
       2 = 180 degrees (EAST blocked)
       3 = 270 degrees (SOUTH blocked)

   The internal solver uses blocked directions:
       0 = NORTH
       1 = EAST
       2 = SOUTH
       3 = WEST

   Generation rules:
       - Each room shape has one intrinsic blocked side
       - All interior doors and walls align
       - All rooms are reachable
       - Dungeon boundaries do not wrap
       - Blocked sides may face outside the dungeon
       - Identical seeds produce identical layouts

   Dependencies:
       Generation and validation:
           None

       Regeneration:
           Dungeon definitions and state
           Dungeon placement and object type mapping
           Player state
           Camera functions
           Monster behavior initialization
           Dungeon visibility initialization
           Rendering functions
========================================================= */

function generateDungeonRooms(width, height, seed, content = {}) {

    /* -----------------------------------------------------
       VALIDATE DIMENSIONS AND ROOM SELECTION
    ----------------------------------------------------- */

    width = Math.floor(width);
    height = Math.floor(height);

    if (
        !Number.isSafeInteger(width) ||
        !Number.isSafeInteger(height) ||
        width < 1 ||
        height < 1 ||
        !Number.isSafeInteger(width * height)
    ) {
        throw new Error("Invalid dungeon dimensions");
    }

    const totalRooms = width * height;

    const roomIDs = content.rooms ?? [0, 1, 2, 3, 4, 5, 6, 7];
    const specialRules = content.specialRooms ?? [];

    function validateRoomIDs(ids, label) {
        if (
            !Array.isArray(ids) ||
            ids.length === 0 ||
            ids.some(id =>
                !Number.isInteger(id) ||
                id < 0 ||
                id > 15
            )
        ) {
            throw new Error(
                label + " must contain room IDs from 0 through 15"
            );
        }
    }

    validateRoomIDs(roomIDs, "rooms");

    if (!Array.isArray(specialRules)) {
        throw new Error("specialRooms must be an array");
    }

    let specialCount = 0;

    for (const rule of specialRules) {

        if (!rule) {
            throw new Error("Invalid special room rule");
        }

        validateRoomIDs(rule.choices, "special room choices");

        if (
            !Number.isSafeInteger(rule.count) ||
            rule.count < 0
        ) {
            throw new Error(
                "Special room count must be nonnegative"
            );
        }

        if (rule.count > totalRooms - specialCount) {
            throw new Error(
                "Not enough dungeon positions for required special rooms"
            );
        }

        specialCount += rule.count;
    }

    /* -----------------------------------------------------
       CHECK ORDINARY ROOM CAPACITY

       Each placement uses a separate ordinary room:
           Player
           Exit and its guardian
           Each required item and its guardian
           Two additional monsters
    ----------------------------------------------------- */

    const requiredOrdinaryRooms =
        1 +
        1 +
        (content.items?.length ?? 0) +
        2;

    if (totalRooms - specialCount < requiredOrdinaryRooms) {
        throw new Error(
            "Dungeon needs at least " +
            requiredOrdinaryRooms +
            " ordinary rooms for player, exit, items, and monsters"
        );
    }

    const DX = [0, 1, 0, -1];
    const DY = [-1, 0, 1, 0];

    /* -----------------------------------------------------
       SEEDED RANDOM NUMBER GENERATOR
    ----------------------------------------------------- */

    let state = seed >>> 0;

    function random() {
        state = (state + 0x6D2B79F5) >>> 0;

        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));

            [array[i], array[j]] =
                [array[j], array[i]];
        }

        return array;
    }

    function inside(x, y) {
        return x >= 0 &&
               y >= 0 &&
               x < width &&
               y < height;
    }

    /* -----------------------------------------------------
       ORIENTATION GRID

       Solver values identify the blocked direction:
           0 = NORTH
           1 = EAST
           2 = SOUTH
           3 = WEST
    ----------------------------------------------------- */

    const orientations = Array.from(
        { length: height },
        () => Array(width).fill(-1)
    );

    /* -----------------------------------------------------
       CHECK ORIENTATION AGAINST ASSIGNED NEIGHBORS
    ----------------------------------------------------- */

    function validOrientation(x, y, dir) {

        for (let d = 0; d < 4; d++) {

            const nx = x + DX[d];
            const ny = y + DY[d];

            if (!inside(nx, ny))
                continue;

            const other = orientations[ny][nx];

            if (other === -1)
                continue;

            const blockedHere = dir === d;
            const blockedThere =
                other === ((d + 2) % 4);

            if (blockedHere !== blockedThere)
                return false;
        }

        return true;
    }

    /* -----------------------------------------------------
       CHECK THAT ALL ROOMS ARE REACHABLE

       Checks room connections, not internal trap states.
    ----------------------------------------------------- */

    function isConnected() {

        const visited = Array.from(
            { length: height },
            () => Array(width).fill(false)
        );

        const queue = [[0, 0]];
        visited[0][0] = true;

        let count = 0;

        for (let i = 0; i < queue.length; i++) {

            const [x, y] = queue[i];
            count++;

            for (let d = 0; d < 4; d++) {

                if (orientations[y][x] === d)
                    continue;

                const nx = x + DX[d];
                const ny = y + DY[d];

                if (
                    !inside(nx, ny) ||
                    visited[ny][nx]
                ) {
                    continue;
                }

                if (
                    orientations[ny][nx] ===
                    ((d + 2) % 4)
                ) {
                    continue;
                }

                visited[ny][nx] = true;
                queue.push([nx, ny]);
            }
        }

        return count === totalRooms;
    }

    /* -----------------------------------------------------
       RECURSIVE BACKTRACKING SOLVER
    ----------------------------------------------------- */

    function solve(index) {

        if (index === totalRooms)
            return isConnected();

        const x = index % width;
        const y = Math.floor(index / width);

        const directions = shuffle([0, 1, 2, 3]);

        for (const dir of directions) {

            if (!validOrientation(x, y, dir))
                continue;

            orientations[y][x] = dir;

            if (solve(index + 1))
                return true;

            orientations[y][x] = -1;
        }

        return false;
    }

    if (!solve(0)) {
        throw new Error(
            "No valid connected dungeon layout found"
        );
    }

    /* -----------------------------------------------------
       ASSIGN ORDINARY ROOM TEMPLATES

       Convert blocked directions to clockwise rotations.
       Templates must have WEST blocked before rotation.
    ----------------------------------------------------- */

    const grid = orientations.map(row =>
        row.map(orientation => ({
            room: roomIDs[
                Math.floor(random() * roomIDs.length)
            ],
            orientation: (orientation + 1) % 4
        }))
    );

    /* -----------------------------------------------------
       PLACE REQUIRED SPECIAL ROOMS

       Reserve distinct ordinary positions on the left
       and right edges for player and exit placement.

       Preserve solver-assigned orientations.
    ----------------------------------------------------- */

    if (specialCount > 0) {

        const leftPositions = Array.from(
            { length: height },
            (_, y) => y * width
        );

		const playerPosition = TEST_ROOM_PLACEMENT
			? (height - 1) * width
			: leftPositions[
				Math.floor(random() * leftPositions.length)
			];

        const rightPositions = Array.from(
            { length: height },
            (_, y) => y * width + width - 1
        ).filter(index => index !== playerPosition);

        if (!rightPositions.length) {
            throw new Error(
                "Dungeon needs distinct ordinary rooms " +
                "for the player and exit"
            );
        }

        const exitPosition = rightPositions[
            Math.floor(random() * rightPositions.length)
        ];

		const positions = TEST_ROOM_PLACEMENT
			? leftPositions.filter(index =>
				index !== playerPosition &&
				index !== exitPosition
			)
			: shuffle(
				Array.from(
					{ length: totalRooms },
					(_, index) => index
				).filter(index =>
					index !== playerPosition &&
					index !== exitPosition
				)
			);
		
		if (positions.length < specialCount) {
			throw new Error(
				"Not enough left-edge rooms for test placement."
			);
		}

        let nextPosition = 0;

        for (const rule of specialRules) {
            for (let i = 0; i < rule.count; i++) {

                const index = positions[nextPosition++];
                const x = index % width;
                const y = Math.floor(index / width);

                grid[y][x].room = rule.choices[
                    Math.floor(random() * rule.choices.length)
                ];

                grid[y][x].special = true;
            }
        }
    }

    return grid;
}

/* =========================================================
   VALIDATE DUNGEON

   Checks:
       1. Rectangular, nonempty grid
       2. Valid room IDs (0..15)
       3. Valid clockwise orientations (0..3)
       4. Matching interior boundaries
       5. Room connectivity

   Assumes every template has WEST blocked before rotation.

   Checks room connections, not internal trap states.
========================================================= */

function validateDungeon(grid) {

    if (
        !Array.isArray(grid) ||
        grid.length === 0 ||
        !Array.isArray(grid[0]) ||
        grid[0].length === 0
    ) {
        throw new Error("Invalid dungeon grid");
    }

    const height = grid.length;
    const width = grid[0].length;

    for (const row of grid) {
        if (!Array.isArray(row) || row.length !== width) {
            throw new Error("Non-rectangular dungeon grid");
        }
    }

    const DX = [0, 1, 0, -1];
    const DY = [-1, 0, 1, 0];

    const invalidRooms = [];
    let mismatches = 0;

    function inside(x, y) {
        return x >= 0 &&
               y >= 0 &&
               x < width &&
               y < height;
    }

    function isValidRoom(room) {
        return room !== null &&
               typeof room === "object" &&
               Number.isInteger(room.room) &&
               room.room >= 0 &&
               room.room <= 15 &&
               Number.isInteger(room.orientation) &&
               room.orientation >= 0 &&
               room.orientation <= 3;
    }

    function blockedDirection(room) {
        return (room.orientation + 3) % 4;
    }

    /* -----------------------------------------------------
       VALIDATE ROOM RECORDS
    ----------------------------------------------------- */

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!isValidRoom(grid[y][x])) {
                invalidRooms.push({ x, y });
            }
        }
    }

    /* -----------------------------------------------------
       CHECK INTERIOR BOUNDARIES

       Inspect EAST and SOUTH so each shared boundary
       is counted once. Invalid records are reported above.
    ----------------------------------------------------- */

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            const room = grid[y][x];

            if (!isValidRoom(room))
                continue;

            for (const d of [1, 2]) {

                const nx = x + DX[d];
                const ny = y + DY[d];

                if (!inside(nx, ny))
                    continue;

                const other = grid[ny][nx];

                if (!isValidRoom(other))
                    continue;

                const blockedHere =
                    blockedDirection(room) === d;

                const blockedThere =
                    blockedDirection(other) === ((d + 2) % 4);

                if (blockedHere !== blockedThere)
                    mismatches++;
            }
        }
    }

    /* -----------------------------------------------------
       CHECK CONNECTIVITY

       Only valid rooms connected by matching open doors
       can be visited.
    ----------------------------------------------------- */

    const visited = Array.from(
        { length: height },
        () => Array(width).fill(false)
    );

    const queue = [];

    if (isValidRoom(grid[0][0])) {
        queue.push([0, 0]);
        visited[0][0] = true;
    }

    let reachableRooms = 0;

    for (let i = 0; i < queue.length; i++) {

        const [x, y] = queue[i];
        const room = grid[y][x];

        reachableRooms++;

        for (let d = 0; d < 4; d++) {

            if (blockedDirection(room) === d)
                continue;

            const nx = x + DX[d];
            const ny = y + DY[d];

            if (!inside(nx, ny) || visited[ny][nx])
                continue;

            const other = grid[ny][nx];

            if (
                !isValidRoom(other) ||
                blockedDirection(other) === ((d + 2) % 4)
            ) {
                continue;
            }

            visited[ny][nx] = true;
            queue.push([nx, ny]);
        }
    }

    const totalRooms = width * height;
    const connected = reachableRooms === totalRooms;

    return {
        valid:
            invalidRooms.length === 0 &&
            mismatches === 0 &&
            connected,

        invalidRooms,
        mismatches,
        connected,
        reachableRooms,
        totalRooms
    };
}

/* =========================================================
   REGENERATE DUNGEON

   Generates a new dungeon without reloading
   the HTML page.

   seed  = dungeon random seed
   color = dungeon type
========================================================= */

function regenerateDungeon(seed, color) {

    RoomExtensions.clearRoomExtensions();

    // -------------------------------------
    // UPDATE DUNGEON SEED
    // -------------------------------------

    DUNGEON_SEED = seed;

    // -------------------------------------
    // GENERATE DUNGEON ROOMS
    // -------------------------------------

	DUNGEON_ROOMS = generateDungeonRooms(
		DUNGEON_W,
		DUNGEON_H,
		DUNGEON_SEED,
		DUNGEON_CONTENT[String(color).toLowerCase()]
	);

    // -------------------------------------
    // BUILD DUNGEON MAP
    // -------------------------------------

    DUNGEON = DUNGEON_ROOMS.map(row =>
        row.map(cell =>
            R(cell.room, cell.orientation)
        )
    );

    // -------------------------------------
    // POPULATE DUNGEON
    // -------------------------------------

    DUNGEON_PLACEMENT = populateDungeon(
        DUNGEON_ROOMS,
        color,
        ROOM_BLOCKS,
        ROOM_BLOCKS,
        DUNGEON_SEED,
        player.inventory
    );

    // -------------------------------------
    // REBUILD DUNGEON OBJECTS
    // -------------------------------------

    DUNGEON_OBJECTS.length = 0;

    for (const entity of [
        ...DUNGEON_PLACEMENT.objects,
        ...DUNGEON_PLACEMENT.monsters
    ]) {

        const objectType =
            PLACEMENT_OBJECT_TYPES[entity.type];

        if (objectType === undefined)
            continue;

        DUNGEON_OBJECTS.push([
            entity.x,
            entity.y,
            objectType
        ]);
    }

    // -------------------------------------
    // POSITION PLAYER
    // -------------------------------------

    player.x = DUNGEON_PLACEMENT.player.x;
    player.y = DUNGEON_PLACEMENT.player.y;
	// Reset player movement offsets and direction.
	player.offset_x = 0;
	player.offset_y = 0;
	player.direction = 0;
	
    // -------------------------------------
    // CENTER CAMERA
    // -------------------------------------

    centerCameraOn(player.x, player.y);

    // -------------------------------------
    // INITIALIZE SPECIAL ROOM EXTENSIONS
    // -------------------------------------

    for (let roomY = 0; roomY < DUNGEON_ROOMS.length; roomY++) {
        for (
            let roomX = 0;
            roomX < DUNGEON_ROOMS[roomY].length;
            roomX++
        ) {
            const room = DUNGEON_ROOMS[roomY][roomX];
            const extension = ROOM_EXTENSIONS[room.room];

            if (!extension)
                continue;

            RoomExtensions.initializeRoomExtensions(
                room,
                extension,
                roomX * ROOM_BLOCKS,
                roomY * ROOM_BLOCKS
            );
        }
    }

	// Initialize monster behavior and dungeon visibility.
    initializeMonsterBehavior();
    initializeDungeonVisibility();

    // -------------------------------------
    // REDRAW
    // -------------------------------------

    drawGame();
}
