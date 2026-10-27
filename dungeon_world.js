"use strict";

/* =========================================================
   DUNGEON WORLD

   Decodes room/block values, rotates coordinates,
   and retrieves blocks from the dungeon world.
========================================================= */


/* =========================================================
   DECODE VALUES
========================================================= */

// Bits 0–5: block ID; bits 6–7: orientation.
function decodeBlock(value) {

    return {
        block: value & 63,
        orientation: (value >> 6) & 3
    };
}

// Bits 0–3: room ID; bits 4–5: orientation.
function decodeRoom(value) {

    return {
        room: value & 15,
        orientation: (value >> 4) & 3
    };
}


/* =========================================================
   ROTATE PIXEL COORDINATE CLOCKWISE
========================================================= */

function rotateXY(x, y, orientation) {

    const last = BLOCK_PIXELS - 1;

    switch (orientation) {

        case E:
            return { x: last - y, y: x };

        case S:
            return { x: last - x, y: last - y };

        case W:
            return { x: y, y: last - x };

        default:
            return { x, y };
    }
}


/* =========================================================
   GET BLOCK PIXEL

   Reverse-map a displayed pixel to its source pixel.
========================================================= */

function getBlockPixel(blockID, orientation, x, y) {

    const last = BLOCK_PIXELS - 1;

    let sx = x;
    let sy = y;

    switch (orientation) {

        case E:
            sx = y;
            sy = last - x;
            break;

        case S:
            sx = last - x;
            sy = last - y;
            break;

        case W:
            sx = last - y;
            sy = x;
            break;
    }

    return BLOCKS[blockID][sy * BLOCK_PIXELS + sx];
}


/* =========================================================
   GET WORLD BLOCK

   Resolves room rotation and block rotation.
   Returns an encoded block value.
========================================================= */

function getWorldBlock(wx, wy) {

    if (
        wx < 0 ||
        wy < 0 ||
        wx >= WORLD_W ||
        wy >= WORLD_H
    ) {
        return 0;
    }

    const roomX = Math.floor(wx / ROOM_BLOCKS);
    const roomY = Math.floor(wy / ROOM_BLOCKS);

    const {
        room: roomID,
        orientation: roomOrientation
    } = decodeRoom(DUNGEON[roomY][roomX]);

    const localX = wx % ROOM_BLOCKS;
    const localY = wy % ROOM_BLOCKS;
    const last = ROOM_BLOCKS - 1;

    let sx = localX;
    let sy = localY;

    // Reverse-map world coordinates into the room.
    switch (roomOrientation) {

        case E:
            sx = localY;
            sy = last - localX;
            break;

        case S:
            sx = last - localX;
            sy = last - localY;
            break;

        case W:
            sx = last - localY;
            sy = localX;
            break;
    }

    const blockValue =
        ROOMS[roomID][sy * ROOM_BLOCKS + sx];

    const {
        block,
        orientation: blockOrientation
    } = decodeBlock(blockValue);

    const orientation =
        (blockOrientation + roomOrientation) & 3;

    return block | (orientation << 6);
}