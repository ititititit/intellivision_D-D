"use strict";

/* =========================================================
   DUNGEON ENTITY COLLISION

   Generic collision detection for:
       Players
       Monsters
       Projectiles

   Supports logical positions and movement offsets.

   Public functions:
       getEntityPosition(entity)
       entitiesCollide(a, b)
========================================================= */


/* =========================================================
   GET ENTITY POSITION

   Supports:
       Player:     { x, y, offset_x, offset_y }
       Monster:    [x, y, objectID]
       Projectile: { 0:x, 1:y, offset_x, offset_y }

   Returns actual world position.
========================================================= */

function getEntityPosition(entity) {

    const x = entity.x ?? entity[0];
    const y = entity.y ?? entity[1];

    return {
        x: x + (entity.offset_x ?? 0),
        y: y + (entity.offset_y ?? 0)
    };
}


/* =========================================================
   ENTITIES COLLIDE

   Each entity occupies a 1 x 1 square.

   Returns true if the squares overlap.
   Touching edges alone is not a collision.
========================================================= */

/* =========================================================
   ENTITIES COLLIDE

   Each entity occupies a 1 x 1 tile (8 x 8 pixels).

   marginPixels expands the first entity's collision box
   on every side. Default is 0.

   Touching edges alone is not a collision.
========================================================= */

function entitiesCollide(a, b, marginPixels = 0) {

    const posA = getEntityPosition(a);
    const posB = getEntityPosition(b);

    // Convert pixels to tile units.
    const margin = marginPixels / 8;

    return (
        Math.abs(posA.x - posB.x) < 1 + margin &&
        Math.abs(posA.y - posB.y) < 1 + margin
    );
}