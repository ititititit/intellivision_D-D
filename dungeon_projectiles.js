
"use strict";

/* =========================================================
   DUNGEON PROJECTILES

   Projectile creation and behavior.

   Projectiles are stored in DUNGEON_OBJECTS and use
   the existing monster movement system.

   Supports:
       Multiple projectile types
       Configurable speed and range
       Optional wall bouncing
       Per-type active limits
       Automatic expiration

   Movement priority:
       1. Examine current square
       2. Apply special square behavior if defined
       3. Examine next square
       4. Reverse direction if next square is solid
       5. Otherwise continue forward

   Dependencies:
       dungeon_world.js
       dungeon_definitions.js
       DUNGEON_OBJECTS

   Public functions:
       createProjectile(type, x, y, direction)
       removeProjectile(projectile)
       determineNextProjectileAction(projectile)
       determineProjectileMovement(...)
       canProjectileMoveTo(x, y)
       cleanupProjectiles()

   Public data:
       PROJECTILE_BEHAVIOR
       PROJECTILE_DIRECTIONS
========================================================= */


/* =========================================================
   PROJECTILE DEFINITIONS
========================================================= */

const PROJECTILE_BEHAVIOR = {

    FIRE_ARROW: {
        speed: 1 / 2,
        range: 10,
        bounce: true,
        maxActive: 1
    }

};


/* =========================================================
   PROJECTILE DIRECTIONS

       7   0   1
       6   X   2
       5   4   3

   Directions are clockwise from north.
========================================================= */

const PROJECTILE_DIRECTIONS = [

    [ 0, -1],  // 0 North
    [ 1, -1],  // 1 Northeast
    [ 1,  0],  // 2 East
    [ 1,  1],  // 3 Southeast
    [ 0,  1],  // 4 South
    [-1,  1],  // 5 Southwest
    [-1,  0],  // 6 West
    [-1, -1]   // 7 Northwest

];


/* =========================================================
   GET PROJECTILE BLOCK

   Returns decoded block at world position.
   Returns null when outside world bounds.
========================================================= */

function getProjectileBlock(x, y) {

    if (
        x < 0 ||
        y < 0 ||
        x >= WORLD_W ||
        y >= WORLD_H
    ) {
        return null;
    }

    return decodeBlock(getWorldBlock(x, y));
}


/* =========================================================
   SOLID WALL TEST

   Currently block 1 is open terrain.
   All other blocks are treated as solid.

   This can be expanded when additional terrain
   behavior is introduced.
========================================================= */

function isProjectileSolidWall(block) {

    if (block === null)
        return true;

    switch (block.block) {

        case 1:  // Normal open floor
        case 2:  // Directional deflector
            return false;

        default:
            return true;
    }
}


/* =========================================================
   VALIDATE PROJECTILE DESTINATION
========================================================= */

function canProjectileMoveTo(x, y) {

    const block = getProjectileBlock(x, y);

    return !isProjectileSolidWall(block);
}


/* =========================================================
   CREATE PROJECTILE

   type:
       Key in PROJECTILE_BEHAVIOR.

   x, y:
       Starting world position.

   direction:
       Integer from 0 to 7.

   Returns:
       Projectile object or null.
========================================================= */

function createProjectile(type, x, y, direction) {

    const settings = PROJECTILE_BEHAVIOR[type];

    if (!settings)
        return null;

    if (
        !Number.isInteger(direction) ||
        direction < 0 ||
        direction > 7
    ) {
        return null;
    }

    // -----------------------------------------
    // CHECK ACTIVE LIMIT
    // -----------------------------------------

    let activeCount = 0;

    for (const object of DUNGEON_OBJECTS) {

        if (
            object.projectileType === type &&
            !object.remove
        ) {
            activeCount++;
        }
    }

    if (activeCount >= settings.maxActive)
        return null;

    // -----------------------------------------
    // CREATE PROJECTILE
    // -----------------------------------------

    const projectile = {

        0: x,
        1: y,

        projectileType: type,

        direction: direction,

        offset_x: 0,
        offset_y: 0,

        speed: settings.speed,

        maxDistance: settings.range,
        distance: 0,

        bounce: settings.bounce,

        remove: false
    };

    DUNGEON_OBJECTS.push(projectile);
    console.log("Projectile created:", projectile);

    return projectile;
}


/* =========================================================
   REMOVE PROJECTILE

   Marks projectile for removal.
   Actual removal occurs during cleanup.
========================================================= */

function removeProjectile(projectile) {

    projectile.remove = true;
}


/* =========================================================
   REVERSE PROJECTILE DIRECTION

   Rotate direction by 180 degrees.
========================================================= */

function reverseProjectileDirection(projectile) {

    projectile.direction =
        (projectile.direction + 4) % 8;
}


/* =========================================================
   DETERMINE NEXT PROJECTILE ACTION

   Called by updateMonsterMovement() when the
   projectile has completed its previous movement.

   Returns:
       { x, y } - next logical square
       null     - no movement

   Does not update position or offsets.
========================================================= */

function determineNextProjectileAction(projectile) {

    if (projectile.remove)
        return null;

    // -----------------------------------------
    // CHECK MAXIMUM RANGE
    // -----------------------------------------

    if (projectile.distance >= projectile.maxDistance) {

        removeProjectile(projectile);
        return null;
    }

    const x = projectile[0];
    const y = projectile[1];

    const [dx, dy] =
        PROJECTILE_DIRECTIONS[projectile.direction];

    const nextX = x + dx;
    const nextY = y + dy;

    // -----------------------------------------
    // READ CURRENT AND NEXT SQUARE
    // -----------------------------------------

    const currentBlock =
        getProjectileBlock(x, y);

    const nextBlock =
        getProjectileBlock(nextX, nextY);

    // -----------------------------------------
    // DETERMINE MOVEMENT
    // -----------------------------------------

console.log(
    "Projectile:",
    projectile[0],
    projectile[1],
    "Direction:", projectile.direction,
    "Current:", currentBlock?.block,
    currentBlock?.orientation,
    "Next:", nextBlock?.block,
    nextBlock?.orientation
);

    return determineProjectileMovement(
        projectile,
        currentBlock,
        nextBlock,
        nextX,
        nextY
    );
}


/* =========================================================
   DETERMINE PROJECTILE MOVEMENT

   Priority:
       1. Current square behavior
       2. Next square collision
       3. Normal forward movement

   Returns:
       { x, y } or null
========================================================= */

function reflectProjectile(projectile, flipX, flipY) {

    let [dx, dy] =
        PROJECTILE_DIRECTIONS[projectile.direction];

    if (flipX)
        dx = -dx;

    if (flipY)
        dy = -dy;

    projectile.direction =
        PROJECTILE_DIRECTIONS.findIndex(
            d => d[0] === dx && d[1] === dy
        );
}

function determineProjectileMovement(
    projectile,
    currentBlock,
    nextBlock,
    nextX,
    nextY
) {

    // -----------------------------------------
    // CURRENT SQUARE TAKES PRIORITY
    // -----------------------------------------

    if (currentBlock === null) {

        removeProjectile(projectile);
        return null;
    }

    switch (currentBlock.block) {

        case 2:

			// Diagonal projectiles always reverse
			if (projectile.direction % 2 === 1) {
		
				reverseProjectileDirection(projectile);
		
				break;
			}

            switch (currentBlock.orientation) {

                case N:
                    if (projectile.direction === 0)
                        projectile.direction = 2;
                    else if (projectile.direction === 6)
                        projectile.direction = 4;
                    break;

                case E:
                    if (projectile.direction === 2)
                        projectile.direction = 4;
                    else if (projectile.direction === 0)
                        projectile.direction = 6;
                    break;

                case W:
                    if (projectile.direction === 6)
                        projectile.direction = 0;
                    else if (projectile.direction === 4)
                        projectile.direction = 2;
                    break;

                case S:
                    if (projectile.direction === 4)
                        projectile.direction = 6;
                    else if (projectile.direction === 2)
                        projectile.direction = 0;
                    break;
            }

            break;

        default:
            break;
    }

    // -----------------------------------------
    // RECALCULATE NEXT SQUARE
    // USING CURRENT DIRECTION
    // -----------------------------------------

    const [dx, dy] =
        PROJECTILE_DIRECTIONS[projectile.direction];

    nextX = projectile[0] + dx;
    nextY = projectile[1] + dy;

    nextBlock = getProjectileBlock(nextX, nextY);

    // -----------------------------------------
    // CHECK NEXT SQUARE
    // -----------------------------------------
	if (isProjectileSolidWall(nextBlock)) {
	
		if (!projectile.bounce) {
	
			removeProjectile(projectile);
			return null;
		}
	
		reverseProjectileDirection(projectile);
	
		// Count the bounce against the projectile's range.
		projectile.distance++;
	
		return null;
	}

    // -----------------------------------------
    // CONTINUE FORWARD
    // -----------------------------------------

    projectile.distance++;

    return {
        x: nextX,
        y: nextY
    };
}


/* =========================================================
   CLEANUP PROJECTILES

   Remove expired projectiles from DUNGEON_OBJECTS.

   Call after the object movement update loop.
========================================================= */

function cleanupProjectiles() {

    for (
        let i = DUNGEON_OBJECTS.length - 1;
        i >= 0;
        i--
    ) {

        const object = DUNGEON_OBJECTS[i];

        if (
            object.projectileType !== undefined &&
            object.remove
        ) {
            DUNGEON_OBJECTS.splice(i, 1);
        }
    }
}

/* =========================================================
   CHECK PROJECTILE COLLISIONS

   Tests a projectile against all monsters.

   Returns the monster that was hit, or null.
========================================================= */

function checkProjectileMonsterCollision(projectile) {

    if (projectile.remove)
        return null;

    for (const monster of DUNGEON_OBJECTS) {

		if (!isMonsterObject(monster) || monster.state === "dead")
			continue;

        if (entitiesCollide(projectile, monster, 4)) {
            return monster;
        }
    }

    return null;
}
