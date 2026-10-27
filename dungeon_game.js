
"use strict";

/* =========================================================
   DUNGEON GAME

   Main game initialization and update loop.

   Responsible for:
       Initializing the game
       Starting animation updates
       Scheduling monster sounds
       Connecting the game modules

   Dependencies:
       sound.js
       dungeon_definitions.js
       dungeon_world.js
       dungeon_camera.js
       dungeon_render.js
       dungeon_inventory.js
       dungeon_player.js
       dungeon_audio.js
       dungeon_input.js

   Public functions:
       initializeGame()
       updateGame()

   State:
       animationFrame
========================================================= */


/* =========================================================
   GAME STATE
========================================================= */

let animationFrame = 0;


/* =========================================================
   PLAYER MOVEMENT ANIMATION

   Logical movement occurs immediately.

   Rendering catches up over RENDER_STEPS increments.

   Additional movement input is ignored until the
   animation finishes.
========================================================= */

const MOVEMENT_INTERVAL = 25;

let movementLocked = false;


/* =========================================================
   REQUEST PLAYER MOVEMENT
========================================================= */

function requestPlayerMovement(dx, dy) {

    if (movementLocked) {
        return false;
    }

    // Remember original player and camera positions.
    const oldPlayerX = player.x;
    const oldPlayerY = player.y;

    const oldCameraX = cameraX;
    const oldCameraY = cameraY;

    // Lock input before moving.
    movementLocked = true;

    // Existing player logic handles collision,
    // logical position, pickups and sounds.
    const moved = movePlayer(dx, dy);

    if (!moved) {
        movementLocked = false;
        return false;
    }

    updateDungeonVisibility();

    // Camera has already moved to its new logical position.
    const cameraDeltaX = cameraX - oldCameraX;
    const cameraDeltaY = cameraY - oldCameraY;

    // Start rendering at the old player position.
    renderOffsetX = oldPlayerX - player.x;
    renderOffsetY = oldPlayerY - player.y;

    // Start rendering at the old camera position.
    cameraOffsetX = -cameraDeltaX;
    cameraOffsetY = -cameraDeltaY;

    drawGame();

    let step = 0;

    const timer = setInterval(function() {

        step++;

        const remaining = 1 - step / RENDER_STEPS;

        renderOffsetX = -dx * remaining;
        renderOffsetY = -dy * remaining;

        cameraOffsetX = -cameraDeltaX * remaining;
        cameraOffsetY = -cameraDeltaY * remaining;

        drawGame();

        if (step >= RENDER_STEPS) {

            clearInterval(timer);

            renderOffsetX = 0;
            renderOffsetY = 0;

            cameraOffsetX = 0;
            cameraOffsetY = 0;

            movementLocked = false;
        }

    }, MOVEMENT_INTERVAL);

    return true;
}

function isMonsterVisible(monster) {

    const x = monster[0] + (monster.offset_x || 0);
    const y = monster[1] + (monster.offset_y || 0);

    const screenX = x - (cameraX + cameraOffsetX);
    const screenY = y - (cameraY + cameraOffsetY);

    return (
        screenX > -1 &&
        screenY > -1 &&
        screenX < VIEW_W &&
        screenY < VIEW_H
    );
}

/* =========================================================
   UPDATE MONSTERS

   Runs independently of player movement.

   Each monster either:
       Continues its current movement
       Or determines its next action
========================================================= */

function updateMonsters() {

    const now = performance.now();

    for (const monster of DUNGEON_OBJECTS) {

        // Process monsters and projectiles
        if (
            !isMonsterObject(monster) &&
            monster.projectileType === undefined
        ) {
            continue;
        }

        // Monster must be in a discovered room
        // and on screen to see the player.
        // Hearing works independently.
        const isVisible =
            isMonsterObject(monster) &&
            isDungeonTileVisible(monster[0], monster[1]) &&
            isMonsterVisible(monster);

        updateMonsterMovement(
            monster,
            player,
            isVisible,
            now
        );
    }

    // Remove dead monsters
    for (let i = DUNGEON_OBJECTS.length - 1; i >= 0; i--) {

        const monster = DUNGEON_OBJECTS[i];

        if (monster.state === "dead") {
            DUNGEON_OBJECTS.splice(i, 1);
        }
    }

    // Remove expired projectiles
    cleanupProjectiles();

    drawGame();
}

function isGameOver() {
    return player.dead || player.won;
}

/* =========================================================
   UPDATE GAME

   Advances the animation frame and redraws the scene.

   Player movement is handled separately by the
   input and player modules.
========================================================= */

function updateGame() {

    animationFrame = (animationFrame + 1) & 1;

    drawGame();
}


/* =========================================================
   INITIALIZE GAME

   Called once after all modules have loaded.

   Initializes:
       Keyboard input
       Audio system
       Camera position
       Animation timer
       Monster sound timer
       Initial rendering
========================================================= */

const GAME_MODE = {
    OVERWORLD: 0,
    DUNGEON: 1
};

let gameMode = GAME_MODE.OVERWORLD;

let overworldPlayer = {
    x: 0,
    y: Math.floor(VIEW_H / 2)
};

let activeDungeon = null;


/* =========================================================
   INITIALIZE GAME
========================================================= */

function initializeGame() {

	OVERWORLD_MAP = generateOverworld();
    
    // Initialize keyboard controls
    initializeInput();

    // Initialize sound engine
    initAudio();

    // Position camera on player
    if (gameMode === GAME_MODE.DUNGEON) {
        centerCameraOn(player.x, player.y);
    }

    // -------------------------------------
    // GAME UPDATE
    // -------------------------------------

    setInterval(() => {

        updateGame();

    }, 350);

    // -------------------------------------
    // MONSTER MOVEMENT
    // -------------------------------------

    setInterval(() => {

        if (gameMode === GAME_MODE.DUNGEON && !isGameOver()) {
            updateMonsters();
        }

    }, MOVEMENT_INTERVAL);

    // -------------------------------------
    // MONSTER SOUNDS
    // -------------------------------------

    setInterval(() => {

        if (gameMode === GAME_MODE.DUNGEON && !isGameOver()) {
            updateMonsterSounds();
            playSleepingMonsterSound();
        }

    }, 2000);

    // -------------------------------------
    // INITIAL DRAW
    // -------------------------------------

    drawGame();
}

/* =========================================================
   START GAME
========================================================= */

initializeGame();
