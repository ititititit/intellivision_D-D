
"use strict";

/* =========================================================
   DUNGEON VISIBILITY

   Reveals complete 9x9 dungeon rooms when the player
   approaches within 2 tiles of their boundaries.

   Rules:
       - Initially only the player's room is visible.
       - Nearby rooms are revealed instantly.
       - Discovered rooms remain visible permanently.
       - Discovery resets when entering a new dungeon.
       - Hidden rooms are not drawn by the renderer.

   Dependencies:
       DUNGEON_ROOMS
       player

   Public functions:
       initializeDungeonVisibility()
       updateDungeonVisibility()
       isDungeonRoomVisible(roomX, roomY)
       isDungeonTileVisible(x, y)
========================================================= */

const DUNGEON_ROOM_SIZE = 9;
const DUNGEON_REVEAL_DISTANCE = 2;

let DUNGEON_DISCOVERED = [];


/* =========================================================
   INITIALIZE DUNGEON VISIBILITY

   Called when entering or regenerating a dungeon.

   Initially reveals only the room containing the player.
========================================================= */

function initializeDungeonVisibility() {

    const height = DUNGEON_ROOMS.length;
    const width = DUNGEON_ROOMS[0].length;

    DUNGEON_DISCOVERED = Array.from(
        { length: height },
        () => Array(width).fill(false)
    );

    const roomX = Math.floor(
        player.x / DUNGEON_ROOM_SIZE
    );

    const roomY = Math.floor(
        player.y / DUNGEON_ROOM_SIZE
    );

    if (
        roomX >= 0 &&
        roomY >= 0 &&
        roomX < width &&
        roomY < height
    ) {
        DUNGEON_DISCOVERED[roomY][roomX] = true;
    }
}


/* =========================================================
   UPDATE DUNGEON VISIBILITY

   Reveals any room within 2 tiles of the player.

   Distance is measured to the nearest tile within the
   room's rectangular boundary.

   Does not hide previously discovered rooms.
========================================================= */

function updateDungeonVisibility() {

    if (!DUNGEON_DISCOVERED.length)
        return;

    const height = DUNGEON_DISCOVERED.length;
    const width = DUNGEON_DISCOVERED[0].length;

    for (let roomY = 0; roomY < height; roomY++) {
        for (let roomX = 0; roomX < width; roomX++) {

            if (DUNGEON_DISCOVERED[roomY][roomX])
                continue;

            const left = roomX * DUNGEON_ROOM_SIZE;
            const top = roomY * DUNGEON_ROOM_SIZE;

            const right = left + DUNGEON_ROOM_SIZE - 1;
            const bottom = top + DUNGEON_ROOM_SIZE - 1;

            const dx = Math.max(
                left - player.x,
                0,
                player.x - right
            );

            const dy = Math.max(
                top - player.y,
                0,
                player.y - bottom
            );

            // Chebyshev distance includes diagonals.
            const distance = Math.max(dx, dy);

            if (distance <= DUNGEON_REVEAL_DISTANCE) {
                DUNGEON_DISCOVERED[roomY][roomX] = true;
            }
        }
    }
}


/* =========================================================
   IS DUNGEON ROOM VISIBLE

   Returns true if a room has been discovered.
========================================================= */

function isDungeonRoomVisible(roomX, roomY) {

    if (
        roomY < 0 ||
        roomY >= DUNGEON_DISCOVERED.length
    ) {
        return false;
    }

    const row = DUNGEON_DISCOVERED[roomY];

    if (
        roomX < 0 ||
        roomX >= row.length
    ) {
        return false;
    }

    return row[roomX];
}


/* =========================================================
   IS DUNGEON TILE VISIBLE

   Converts a dungeon tile coordinate into a room
   coordinate and checks whether that room is visible.

   Used by the dungeon renderer.
========================================================= */

function isDungeonTileVisible(x, y) {

    const roomX = Math.floor(
        x / DUNGEON_ROOM_SIZE
    );

    const roomY = Math.floor(
        y / DUNGEON_ROOM_SIZE
    );

    return isDungeonRoomVisible(roomX, roomY);
}
