
"use strict";

/* =========================================================
   DUNGEON PLAYER

   Responsible for:
       Player state
       Player movement
       Terrain collision
       Inventory collection
       Weapon equipment

   Dependencies:
       dungeon_definitions.js
       dungeon_world.js
       dungeon_camera.js
       dungeon_render.js
       sound.js

   Public functions:
       movePlayer(dx, dy)
       canPlayerMoveTo(x, y)
       checkPlayerPickup()
       equipPlayerWeapon(mode)

   State:
       player
========================================================= */


/* =========================================================
   PLAYER STATE

   Coordinates are in world blocks.

   Inventory values indicate whether an item has
   been collected.
========================================================= */

const player = {

    x: DUNGEON_PLACEMENT.player.x,
    y: DUNGEON_PLACEMENT.player.y,

    won: false,
    dead: false,
	health: 10,

    direction: N,
    facing: 0,
    mode: PLAYER_MODE.BOW,

	inventory: {
		axe: false,
		boat: false,
		key: false,
		crown: 0,
		sword: false,
		compass: false,
		armor: false,
		snakeCharmer: false,
		bow: true,
		arrow: 9
	}
};


/* =========================================================
   TERRAIN COLOR UNDER THE PLAYER'S CENTER
========================================================= */

function getPlayerTerrainColor(x, y) {

    if (
        x < 0 ||
        y < 0 ||
        x >= WORLD_W ||
        y >= WORLD_H
    ) {
        return null;
    }

    const { block, orientation } =
        decodeBlock(getWorldBlock(x, y));

    const sprite = SPRITES[BLOCK_SPRITES[block]];

    if (!sprite)
        return null;

    const size = Math.sqrt(sprite.length);

    if (!Number.isInteger(size) || size < 1)
        return null;

    const center = Math.floor(size / 2);
    const last = size - 1;

    let sx = center;
    let sy = center;

    // Find the source pixel for the rotated tile.
    switch (orientation & 3) {

        case E:
            sx = center;
            sy = last - center;
            break;

        case S:
            sx = last - center;
            sy = last - center;
            break;

        case W:
            sx = last - center;
            sy = center;
            break;
    }

    return sprite[sy * size + sx];
}


/* =========================================================
   CHECK PLAYER TERRAIN DEATH

   Returns true if the player is dead.
========================================================= */

function checkPlayerPitDeath() {

    if (
        player.won ||
        gameMode !== GAME_MODE.DUNGEON
    ) {
        return false;
    }

    if (player.dead)
        return true;

    const { block } =
        decodeBlock(getWorldBlock(player.x, player.y));

    const spriteIndex = BLOCK_SPRITES[block];

    if (
        !is_pit.has(spriteIndex) &&
        !is_wall.has(spriteIndex) &&
        !is_water.has(spriteIndex)
    ) {
        return false;
    }

    player.health = 0;
    player.dead = true;

    playSound(SOUND.DEATH, 1);

    return true;
}

/* =========================================================
   CAN PLAYER MOVE TO

   Returns true if the target world block is walkable.

   Currently only block type 1 is walkable.

   Diagonal corner blocks are not walkable.
========================================================= */

function canPlayerMoveTo(x, y) {

    if (
        x < 0 ||
        y < 0 ||
        x >= WORLD_W ||
        y >= WORLD_H
    ) {
        return false;
    }

    const { block } = decodeBlock(getWorldBlock(x, y));
    const spriteIndex = BLOCK_SPRITES[block];

    if (!SPRITES[spriteIndex])
        return false;

    return (
        !is_wall.has(spriteIndex) &&
        !is_water.has(spriteIndex)
    );
}


/* =========================================================
   EQUIP PLAYER WEAPON

   Changes the player's animation mode.

   Does not modify inventory.

   mode:
       PLAYER_MODE.NORMAL
       PLAYER_MODE.BOW
       PLAYER_MODE.SWORD
========================================================= */

function equipPlayerWeapon(mode) {

    player.mode = mode;
}


/* =========================================================
   CHECK PLAYER PICKUP

   Checks objects occupying the player's current block.

   Collectible objects are removed from the dungeon
   after being added to inventory.

   Monsters and decorative objects are ignored.
========================================================= */

function checkPlayerPickup() {

    for (let i = DUNGEON_OBJECTS.length - 1; i >= 0; i--) {

        const obj = DUNGEON_OBJECTS[i];

        if (
            obj.projectileType !== undefined ||
            obj[0] !== player.x ||
            obj[1] !== player.y
        ) {
            continue;
        }

        switch (obj[2]) {

            case OBJECT.SWORD:
                player.inventory.sword = true;
                equipPlayerWeapon(PLAYER_MODE.SWORD);
                break;

            case OBJECT.BOW:
                player.inventory.bow = true;
                equipPlayerWeapon(PLAYER_MODE.BOW);
                break;

            case OBJECT.QUIVER:
                if (player.inventory.arrow >= 9)
                    continue;

                player.inventory.arrow = Math.min(
                    9,
                    player.inventory.arrow + 3
                );
                break;

            case OBJECT.KEY:
                player.inventory.key = true;
                break;

            case OBJECT.AXE:
                player.inventory.axe = true;
                break;

            case OBJECT.CROWN:
                if (player.inventory.crown >= 2)
                    continue;

                player.inventory.crown++;
                break;

            case OBJECT.BOAT:
                player.inventory.boat = true;
                break;

            case OBJECT.COMPASS:
                player.inventory.compass = true;
                break;

            case OBJECT.ARMOR:
                player.inventory.armor = true;
                break;

            case OBJECT.SNAKE_CHARMER:
                player.inventory.snakeCharmer = true;
                break;

			case OBJECT.THRONE:
				if (player.inventory.crown >= 2) {
					player.won = true;
					playSound(SOUND.VICTORY, 1);
					return;
				}
				continue;
			
			case OBJECT.LADDER:
				exitDungeon();
				return;

            default:
                continue;
        }

        DUNGEON_OBJECTS.splice(i, 1);
        playSound(SOUND.PICKUP);
    }
}

/* =========================================================
   MOVE PLAYER

   Attempts to move the player by dx, dy world blocks.

   On successful movement:
       1. Update player position
       2. Center camera
       3. Play footstep
       4. Check for item pickup
       5. Redraw game

   Returns true if movement succeeded.
========================================================= */

function movePlayer(dx, dy) {

    if (
        gameMode !== GAME_MODE.DUNGEON ||
        player.dead ||
        player.won
    ) {
        return false;
    }

    // Check whether terrain changed beneath the player.
    if (checkPlayerPitDeath()) {
        drawGame();
        return false;
    }

    if (dx === 0 && dy === 0)
        return false;

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (!canPlayerMoveTo(nx, ny)) {
        drawGame();
        return false;
    }

    // Update direction only after movement is accepted.
    if (dx > 0)
        player.direction = E;
    else if (dx < 0)
        player.direction = W;
    else if (dy > 0)
        player.direction = S;
    else
        player.direction = N;

    const oldX = player.x;
    const oldY = player.y;

    player.x = nx;
    player.y = ny;

    centerCameraOn(player.x, player.y);

    // Entering an existing pit kills before triggers or pickups.
    if (checkPlayerPitDeath()) {
        drawGame();
        return true;
    }

    RoomExtensions.onRoomPlayerStep(
        player.x,
        player.y,
        oldX,
        oldY,
        { player }
    );

    // A stepping trigger may turn this square into a pit.
    if (checkPlayerPitDeath()) {
        drawGame();
        return true;
    }

    playSound(SOUND.STEP, 1);

    checkPlayerPickup();
    drawGame();

    return true;
}

/* =========================================================
   CHECK OVERWORLD DUNGEON ENTRY

   Detects when the player enters a colored mountain.

   Each mountain generates a dungeon using:
       Mountain coordinates -> seed
       Mountain color       -> dungeon type
========================================================= */

function checkOverworldDungeonEntry(oldX, oldY) {

    if (gameMode !== GAME_MODE.OVERWORLD)
        return;

    const x = overworldPlayer.x;
    const y = overworldPlayer.y;

    // -------------------------------------
    // CHECK FOR ACTUAL MOVEMENT
    // -------------------------------------

    if (x === oldX && y === oldY)
        return;

    // -------------------------------------
    // FIND DUNGEON MOUNTAIN
    // -------------------------------------

    const mountain = OVERWORLD_DUNGEONS.find(
        d => d[0] === x && d[1] === y
    );

    if (!mountain)
        return;

    // -------------------------------------
    // GET DUNGEON COLOR
    // -------------------------------------

    const [mountainX, mountainY, color] = mountain;

    // -------------------------------------
    // GENERATE REPEATABLE DUNGEON SEED
    // -------------------------------------

    const seed = (
        Math.imul(mountainX + 1, 73856093) ^
        Math.imul(mountainY + 1, 19349663)
    ) >>> 0;

    // -------------------------------------
    // REMEMBER ACTIVE DUNGEON
    // -------------------------------------

    activeDungeon = {
        x: mountainX,
        y: mountainY,
        color: color,
        seed: seed
    };

    // -------------------------------------
    // SWITCH TO DUNGEON MODE
    // -------------------------------------

    gameMode = GAME_MODE.DUNGEON;

    // -------------------------------------
    // GENERATE DUNGEON
    // -------------------------------------

    // Temporary test: red mountains open the trap dungeon.
    const dungeonType = color.toLowerCase();
    regenerateDungeon(seed, dungeonType);

}

/* =========================================================
   EXIT DUNGEON

   Return player to the overworld mountain
   from which the dungeon was entered.
========================================================= */

function exitDungeon() {

    if (gameMode !== GAME_MODE.DUNGEON)
        return;

    // -------------------------------------
    // RESTORE OVERWORLD POSITION
    // -------------------------------------

    if (activeDungeon) {

        overworldPlayer.x = activeDungeon.x;
        overworldPlayer.y = activeDungeon.y;
    }

    // -------------------------------------
    // SWITCH TO OVERWORLD
    // -------------------------------------

    gameMode = GAME_MODE.OVERWORLD;

    // -------------------------------------
    // REDRAW
    // -------------------------------------

    drawGame();
}

/* =========================================================
   OVERWORLD PLAYER MOVEMENT

   Checks map boundaries and terrain requirements:
       Forests = axe
       Rivers  = boat
       Walls and doors = key
       Mountains = registered dungeon entrance
========================================================= */

function moveOverworldPlayer(dx, dy) {

    if (gameMode !== GAME_MODE.OVERWORLD || isGameOver())
        return;

    const oldX = overworldPlayer.x;
    const oldY = overworldPlayer.y;

    const newX = oldX + dx;
    const newY = oldY + dy;

    // -------------------------------------
    // MAP BOUNDARIES
    // -------------------------------------

    if (
        newX < 0 ||
        newY < 0 ||
        newX >= VIEW_W ||
        newY >= VIEW_H
    ) {
        return;
    }

    // -------------------------------------
    // TERRAIN REQUIREMENTS
    // -------------------------------------

    const tile = cell(newX, newY);

    switch (tile.sprite) {

        case SPRITE.FOREST_1:
        case SPRITE.FOREST_2:
        case SPRITE.FOREST_ISOLATED:
        case SPRITE.FOREST_END:
        case SPRITE.FOREST_STRAIGHT:
        case SPRITE.FOREST_CORNER:
        case SPRITE.FOREST_THREE_WAY:
        case SPRITE.FOREST_INTERIOR:
            if (!player.inventory.axe)
                return;
            break;

        case SPRITE.MOUNTAIN_1:
        case SPRITE.MOUNTAIN_2: {
            const mountain = OVERWORLD_DUNGEONS.find(
                d => d[0] === newX && d[1] === newY
            );

            if (!mountain)
                return;
            break;
        }

        case SPRITE.RIVER_1:
        case SPRITE.RIVER_2:
        case SPRITE.RIVER_3:
            if (!player.inventory.boat)
                return;
            break;

        case SPRITE.WALL_HORIZONTAL:
        case SPRITE.WALL_VERTICAL:
        	return;
        	break;
        	
        case SPRITE.WALL_HORIZONTAL_DOOR:
        case SPRITE.WALL_VERTICAL_DOOR:
            if (!player.inventory.key)
                return;
            break;
    }

    // -------------------------------------
    // UPDATE PLAYER POSITION
    // -------------------------------------

    overworldPlayer.x = newX;
    overworldPlayer.y = newY;
	if (dx !== 0)
    	overworldPlayer.facing = dx < 0 ? 1 : 0;
    
    // -------------------------------------
    // CHECK DUNGEON ENTRANCE
    // -------------------------------------

    checkOverworldDungeonEntry(oldX, oldY);

    // -------------------------------------
    // REDRAW
    // -------------------------------------

    drawGame();
}