
"use strict";

/* =========================================================
   DUNGEON CAMERA

   Manages the visible region of the dungeon.

   Camera coordinates are measured in world blocks,
   not pixels.

   Dependencies:
       dungeon_definitions.js

   Public functions:
       clampCamera()
       centerCameraOn(x, y)
========================================================= */


/* =========================================================
   CAMERA STATE
========================================================= */

let cameraX = 0;
let cameraY = 0;


/* =========================================================
   CLAMP CAMERA

   Prevents the camera from moving outside the dungeon.
========================================================= */

function clampCamera() {

    cameraX = Math.max(
        0,
        Math.min(WORLD_W - VIEW_W, cameraX)
    );

    cameraY = Math.max(
        0,
        Math.min(WORLD_H - VIEW_H, cameraY)
    );
}


/* =========================================================
   CENTER CAMERA ON POSITION

   Centers the viewport around a world coordinate.

   x, y = world block coordinates
========================================================= */

function centerCameraOn(x, y) {

    cameraX = x - Math.floor(VIEW_W / 2);
    cameraY = y - Math.floor(VIEW_H / 2);

    clampCamera();
}
