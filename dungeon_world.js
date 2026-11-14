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

   Reads per-room tile changes first.
   Otherwise resolves the original room and block rotation.
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

    const localX = wx % ROOM_BLOCKS;
    const localY = wy % ROOM_BLOCKS;
    const localIndex = localY * ROOM_BLOCKS + localX;

    const roomInstance = DUNGEON_ROOMS[roomY][roomX];

    // Changes are stored in world-facing room coordinates.
    const changedValue = roomInstance.tileChanges?.[localIndex];

    if (changedValue !== undefined)
        return changedValue;

    const {
        room: roomID,
        orientation: roomOrientation
    } = decodeRoom(DUNGEON[roomY][roomX]);

    const last = ROOM_BLOCKS - 1;

    let sx = localX;
    let sy = localY;

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

/* =========================================================
   SET WORLD BLOCK

   Stores an encoded numeric block value for this room only.
   Coordinates and block orientation are world-facing.
========================================================= */

function setWorldBlock(wx, wy, value) {

    if (
        !Number.isInteger(wx) ||
        !Number.isInteger(wy) ||
        wx < 0 ||
        wy < 0 ||
        wx >= WORLD_W ||
        wy >= WORLD_H
    ) {
        throw new Error("Invalid dungeon tile position");
    }

    const roomX = Math.floor(wx / ROOM_BLOCKS);
    const roomY = Math.floor(wy / ROOM_BLOCKS);

    const localX = wx % ROOM_BLOCKS;
    const localY = wy % ROOM_BLOCKS;
    const localIndex = localY * ROOM_BLOCKS + localX;

    const roomInstance = DUNGEON_ROOMS[roomY][roomX];

    roomInstance.tileChanges ??= [];

    roomInstance.tileChanges[localIndex] = value;
}

function addDungeonObject(x, y, objectType, rotation = N) {
    if (!Number.isInteger(objectType) || !OBJECT_DEFS[objectType]) {
        throw new Error("Unknown object type: " + objectType);
    }

    const object = [x, y, objectType];
    object.rotation = rotation;

    DUNGEON_OBJECTS.push(object);

    return object;
}

/* =========================================================
   ADD DUNGEON OBJECT

   Coordinates are world tile coordinates.
========================================================= */

function addDungeonObject(x, y, objectType, rotation = N) {

    if (
        !Number.isInteger(x) ||
        !Number.isInteger(y) ||
        x < 0 ||
        y < 0 ||
        x >= WORLD_W ||
        y >= WORLD_H
    ) {
        throw new Error("Invalid dungeon object position");
    }

    if (
        !Number.isInteger(objectType) ||
        !OBJECT_DEFS[objectType]
    ) {
        throw new Error("Unknown object type: " + objectType);
    }

    if (!Number.isInteger(rotation)) {
        throw new Error("Invalid dungeon object rotation");
    }

    const object = [x, y, objectType];

    object.rotation = ((rotation % 4) + 4) % 4;

    DUNGEON_OBJECTS.push(object);

    return object;
}

/* =========================================================
   ADD DUNGEON MONSTER

   Creates and initializes one monster.
   Coordinates are world tile coordinates.
========================================================= */

function addDungeonMonster(
    x,
    y,
    objectType,
    rotation = N,
    options = {}
) {

    const candidate = [x, y, objectType];

    candidate.behavior = options.behavior;

    if (!isMonsterObject(candidate)) {
        throw new Error(
            "Not a monster object type: " + objectType
        );
    }

    // Find dialogue data before creating the monster.
    let character = null;

    if (options.characterID !== undefined) {

        const definition = CharacterModel.PRESETS.find(
            entry => entry.id === options.characterID
        );

        if (!definition) {
            throw new Error(
                "Unknown character ID: " + options.characterID
            );
        }

        character = new CharacterModel.Character({
            ...definition,
            name: options.name ?? definition.name
        });
    }

    const monster = addDungeonObject(
        x,
        y,
        objectType,
        rotation
    );

    monster.name = options.name ?? character?.config.name;
    monster.behavior = options.behavior;
    monster.characterID = options.characterID;
    monster.character = character;

    initializeMonsterBehavior([monster]);

    return monster;
}

/* =========================================================
   CONNECT ROOM EXTENSIONS TO THE GAME
========================================================= */

/* =========================================================
   CONNECT ROOM EXTENSIONS TO THE GAME
========================================================= */

RoomExtensions.configureRoomExtensions({

    encodeBlock(blockID, rotation) {
        return blockID | ((rotation & 3) << 6);
    },

    writeTile: setWorldBlock,

    depositObject(target) {
        return addDungeonObject(
            target.x,
            target.y,
            target.value,
            target.rotation
        );
    },

    depositMonster(target) {
        return addDungeonMonster(
            target.x,
            target.y,
            target.value,
            target.rotation,
            target
        );
    }

});