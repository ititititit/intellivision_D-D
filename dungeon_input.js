
"use strict";

/* =========================================================
   DUNGEON INPUT

   Handles keyboard input and translates keys into
   player movement.

   Dependencies:
       dungeon_player.js

   Public functions:
       handleGameKey(event)
       initializeInput()
========================================================= */


/* =========================================================
   HANDLE GAME KEY

       Q   W   E
       A   S   D
       Z   X   C

   Q = Northwest     W = North      E = Northeast
   A = West          S = Use        D = East
   Z = Southwest     X = South      C = Southeast

   Arrow keys also support cardinal movement.
========================================================= */

function handleGameKey(event) {

    if (isGameOver()) {
        event.preventDefault();
        return;
    }

    let dx = 0;
    let dy = 0;

	// -------------------------------------
	// OVERWORLD INPUT
	// -------------------------------------
	if (event.key.toLowerCase() === "h") {
		showHelp();
		return;
	}
	
	if (gameMode === GAME_MODE.OVERWORLD) {
	
		let dx = 0;
		let dy = 0;
	
		switch (event.key.toLowerCase()) {
			// -------------------------------------
			// PLAYER MOVEMENT
			// -------------------------------------
	
			case "q":
				dx = -1;
				dy = -1;
				break;
	
			case "w":
				dy = -1;
				break;
	
			case "e":
				dx = 1;
				dy = -1;
				break;
	
			case "a":
				dx = -1;
				break;
	
			case "d":
				dx = 1;
				break;
	
			case "z":
				dx = -1;
				dy = 1;
				break;
	
			case "x":
				dy = 1;
				break;
	
			case "c":
				dx = 1;
				dy = 1;
				break;
	
			default:
				return;
		}
	
		event.preventDefault();
	
		if (event.repeat)
			return;
	
		moveOverworldPlayer(dx, dy);
	
		return;
	}

    switch (event.key.toLowerCase()) {


        // -------------------------------------
        // FIRE ARROWS
        // -------------------------------------

        case "arrowup":
        case "arrowright":
        case "arrowdown":
        case "arrowleft": {

            event.preventDefault();

            if (event.repeat)
                return;

            // Must have bow equipped
            if (player.mode !== PLAYER_MODE.BOW)
                return;

            // Must have arrows available
            if (player.inventory.arrow <= 0)
                return;

            const direction = {
                arrowup: 0,
                arrowright: 2,
                arrowdown: 4,
                arrowleft: 6
            }[event.key.toLowerCase()];

            // Create projectile
            const created = createProjectile(
                "FIRE_ARROW",
                player.x,
                player.y,
                direction
            );

            // Consume arrow only if created
			if (created) {
				player.inventory.arrow--;
				drawGame();
			}

            return;
        }

        // -------------------------------------
        // PLAYER MOVEMENT
        // -------------------------------------

        case "q":
            dx = -1;
            dy = -1;
            break;

        case "w":
            dy = -1;
            break;

        case "e":
            dx = 1;
            dy = -1;
            break;

        case "a":
            dx = -1;
            break;

        case "s":
            event.preventDefault();
            // Reserved for using current tile
            return;

        case "d":
            dx = 1;
            break;

        case "z":
            dx = -1;
            dy = 1;
            break;

        case "x":
            dy = 1;
            break;

        case "c":
            dx = 1;
            dy = 1;
            break;

        default:
            return;
    }

	event.preventDefault();
	
	if (dx === 0 && dy === 0)
    return;
	
	if (dx !== 0) {
		const facing = dx < 0 ? 1 : 0;
	
		if (facing !== player.facing) {
			player.facing = facing;
		}
	}
	
	requestPlayerMovement(dx, dy);
}

/* =========================================================
   INITIALIZE INPUT

   Registers the keyboard event handler.

   Called once from initializeGame().
========================================================= */

function initializeInput() {

    document.addEventListener(
        "keydown",
        handleGameKey
    );
}
