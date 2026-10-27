
"use strict";

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


/* =========================================================
   GENERATE DUNGEON ROOMS

   Creates a rectangular grid of randomly selected room
   shapes and orientations.

   Uses seeded backtracking to find a valid arrangement.

   Returns:
       grid[y][x]

   Throws an error if no valid arrangement is found.
========================================================= */

function generateDungeonRooms(width, height, seed) {

    width = Math.floor(width);
    height = Math.floor(height);

    if (!Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < 1 || height < 1) {
        throw new Error("Invalid dungeon dimensions");
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
    ----------------------------------------------------- */

    const orientations = Array.from(
        { length: height },
        () => Array(width).fill(-1)
    );

    /* -----------------------------------------------------
       CHECK ORIENTATION AGAINST ASSIGNED NEIGHBORS

       A shared boundary must be either:
           Door / Door
           Wall / Wall
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

       Breadth-first traversal through matching doors.
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

                if (!inside(nx, ny) ||
                    visited[ny][nx])
                    continue;

                if (orientations[ny][nx] ===
                    ((d + 2) % 4))
                    continue;

                visited[ny][nx] = true;
                queue.push([nx, ny]);
            }
        }

        return count === width * height;
    }

    /* -----------------------------------------------------
       RECURSIVE BACKTRACKING SOLVER

       Assigns orientations one room at a time.

       Only accepts complete layouts that are connected.
    ----------------------------------------------------- */

    function solve(index) {

        if (index === width * height)
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

    /* -----------------------------------------------------
       GENERATE VALID ORIENTATIONS
    ----------------------------------------------------- */

    if (!solve(0)) {
        throw new Error(
            "No valid connected dungeon layout found"
        );
    }

    /* -----------------------------------------------------
       ASSIGN ROOM SHAPES

       Room IDs 0 through 7 are selected randomly.

       Solver blocked directions are converted to
       clockwise room rotations for storage.
    ----------------------------------------------------- */
    return orientations.map(row =>
        row.map(orientation => ({
            room: Math.floor(random() * 8),
            orientation: (orientation + 1) % 4
        }))
    );
}


/* =========================================================
   VALIDATE DUNGEON

   Checks:
       1. Rectangular, nonempty grid
       2. Valid room IDs (0..7)
       3. Valid orientations (0..3)
       4. Matching interior boundaries
       5. Room connectivity

   Assumes each room shape has one intrinsic blocked side.

   Currently interprets orientation as the blocked
   direction, rather than the stored room rotation.

   Returns:
       {
           valid,
           invalidRooms,
           mismatches,
           connected,
           reachableRooms,
           totalRooms
       }
========================================================= */

function validateDungeon(grid) {

    if (!Array.isArray(grid) ||
        grid.length === 0 ||
        !Array.isArray(grid[0]) ||
        grid[0].length === 0) {
        throw new Error("Invalid dungeon grid");
    }

    const height = grid.length;
    const width = grid[0].length;

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

    /* -----------------------------------------------------
       VALIDATE ROOM DATA AND INTERIOR BOUNDARIES
    ----------------------------------------------------- */

    for (let y = 0; y < height; y++) {

        if (!Array.isArray(grid[y]) ||
            grid[y].length !== width) {
            throw new Error("Non-rectangular dungeon grid");
        }

        for (let x = 0; x < width; x++) {

            const room = grid[y][x];

            if (!room ||
                !Number.isInteger(room.room) ||
                room.room < 0 ||
                room.room > 7 ||
                !Number.isInteger(room.orientation) ||
                room.orientation < 0 ||
                room.orientation > 3) {

                invalidRooms.push({ x, y });
                continue;
            }

            // Only inspect EAST and SOUTH to count
            // each shared boundary exactly once.

            for (const d of [1, 2]) {

                const nx = x + DX[d];
                const ny = y + DY[d];

                if (!inside(nx, ny))
                    continue;

                const other = grid[ny][nx];

                if (!other ||
                    !Number.isInteger(other.orientation) ||
                    other.orientation < 0 ||
                    other.orientation > 3) {
                    mismatches++;
                    continue;
                }

                const blockedHere =
                    room.orientation === d;

                const blockedThere =
                    other.orientation === ((d + 2) % 4);

                if (blockedHere !== blockedThere)
                    mismatches++;
            }
        }
    }

    /* -----------------------------------------------------
       CHECK CONNECTIVITY
    ----------------------------------------------------- */

    const visited = Array.from(
        { length: height },
        () => Array(width).fill(false)
    );

    const queue = [[0, 0]];
    visited[0][0] = true;

    let reachableRooms = 0;

    for (let i = 0; i < queue.length; i++) {

        const [x, y] = queue[i];
        reachableRooms++;

        const room = grid[y][x];

        if (!room ||
            !Number.isInteger(room.orientation) ||
            room.orientation < 0 ||
            room.orientation > 3)
            continue;

        for (let d = 0; d < 4; d++) {

            if (room.orientation === d)
                continue;

            const nx = x + DX[d];
            const ny = y + DY[d];

            if (!inside(nx, ny) ||
                visited[ny][nx])
                continue;

            const other = grid[ny][nx];

            if (!other ||
                !Number.isInteger(other.orientation) ||
                other.orientation < 0 ||
                other.orientation > 3 ||
                other.orientation === ((d + 2) % 4))
                continue;

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
        DUNGEON_SEED
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
        DUNGEON_SEED
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

	// Initialize monster behavior and dungeon visibility.
    initializeMonsterBehavior();
    initializeDungeonVisibility();

    // -------------------------------------
    // REDRAW
    // -------------------------------------

    drawGame();
}
