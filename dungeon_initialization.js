"use strict";

/* =========================================================
   INITIAL DUNGEON
========================================================= */

let DUNGEON_SEED = GAME_SEED;

const INITIAL_DUNGEON_TYPE =
    String(GAME_DUNGEON_COLOR).toLowerCase();

const INITIAL_DUNGEON_CONTENT =
    DUNGEON_CONTENT[INITIAL_DUNGEON_TYPE];

if (!INITIAL_DUNGEON_CONTENT) {
    throw new Error(
        "Unknown dungeon type: " + GAME_DUNGEON_COLOR
    );
}

let DUNGEON_ROOMS = generateDungeonRooms(
    DUNGEON_W,
    DUNGEON_H,
    DUNGEON_SEED,
    INITIAL_DUNGEON_CONTENT
);

let DUNGEON = DUNGEON_ROOMS.map(row =>
    row.map(cell =>
        R(cell.room, cell.orientation)
    )
);

/* =========================================================
   INITIAL PLACEMENTS
========================================================= */

let DUNGEON_PLACEMENT = populateDungeon(
    DUNGEON_ROOMS,
    INITIAL_DUNGEON_TYPE,
    ROOM_BLOCKS,
    ROOM_BLOCKS,
    DUNGEON_SEED
);

/* =========================================================
   CONVERT PLACEMENTS TO GAME OBJECT FORMAT
========================================================= */

const DUNGEON_OBJECTS = [];

for (const entity of [
    ...DUNGEON_PLACEMENT.objects,
    ...DUNGEON_PLACEMENT.monsters
]) {
    const objectType =
        PLACEMENT_OBJECT_TYPES[entity.type];

    if (objectType === undefined) {
        console.warn(
            "Unmapped dungeon object:",
            entity.type
        );
        continue;
    }

    DUNGEON_OBJECTS.push([
        entity.x,
        entity.y,
        objectType
    ]);
}